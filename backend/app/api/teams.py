# backend/app/api/teams.py
from fastapi import APIRouter
from typing import Optional

router = APIRouter(prefix="/teams", tags=["teams"])


@router.get("")
def list_teams(q: Optional[str] = None, limit: int = 80):
    """
    Liste des équipes pour autocomplete (id, name, crest).
    Priorité: Sportmonks (suggestion intelligente + alias) → Supabase → API-Football → démo.
    """
    from app.services.sportmonks import _use_sportmonks, get_teams_for_autocomplete_sportmonks
    from app.services.api_football import (
        get_teams_from_supabase,
        get_teams_from_supabase_direct,
        _use_api,
        get_teams_for_autocomplete,
    )
    from app.core.leagues import LEAGUES

    q_clean = (q or "").strip()
    print(f"[teams] GET /teams q={q_clean!r} limit={limit}")

    # 1) Sportmonks configuré : recherche directe Supabase (rapide) puis cache complet ou API Sportmonks
    use_sm = _use_sportmonks()
    print(f"[teams] _use_sportmonks() = {use_sm}")
    if use_sm:
        # Recherche directe par search_terms = une requête, pas de chargement cache complet
        if q_clean:
            teams_sb = get_teams_from_supabase_direct(q_clean, limit=limit)
            if teams_sb:
                print(f"[teams] Supabase direct -> {len(teams_sb)} teams")
                return {"teams": teams_sb, "leagues": LEAGUES}
        # Sinon cache complet (preload) ou API Sportmonks
        teams_sb = get_teams_from_supabase(q=q, limit=limit, allow_fetch=True)
        sb_count = len(teams_sb) if teams_sb is not None else -1
        print(f"[teams] Supabase cache -> {'ok' if teams_sb else 'None/empty'} (count={sb_count})")
        if teams_sb:
            return {"teams": teams_sb, "leagues": LEAGUES}
        teams_sm = get_teams_for_autocomplete_sportmonks(q=q, limit=limit)
        print(f"[teams] Sportmonks API -> {len(teams_sm)} teams")
        return {"teams": teams_sm, "leagues": LEAGUES}

    print("[teams] Sportmonks inactif -> Supabase / API-Football")
    # 2) Supabase : recherche rapide avec alias + blasons
    teams_sb = get_teams_from_supabase(q=q, limit=limit)
    if teams_sb is not None:
        if teams_sb:
            return {"teams": teams_sb, "leagues": LEAGUES}
        if _use_api():
            teams = get_teams_for_autocomplete(q=q, limit=limit)
            return {"teams": teams, "leagues": LEAGUES}
        return {"teams": teams_sb, "leagues": LEAGUES}

    # 3) Pas de Supabase : fallback API-Football
    if _use_api():
        teams = get_teams_for_autocomplete(q=q, limit=limit)
        return {"teams": teams, "leagues": LEAGUES}

    from app.core.config import get_settings
    s = get_settings()
    if not (s.supabase_url and s.supabase_key):
        demo = ["Lorient", "Auxerre", "Paris SG", "Marseille", "Lyon", "Lille", "Monaco", "Rennes", "Nice", "Lens"]
        if q_clean:
            ql = q_clean.lower()
            demo = [t for t in demo if t.lower().startswith(ql) or any(w.startswith(ql) for w in t.lower().split())][:limit]
        return {"teams": [{"id": None, "name": n, "crest": None} for n in demo], "leagues": []}
    from app.core.supabase_client import get_supabase
    supabase = get_supabase()
    r = supabase.table("teams").select("slug, name, logo_url, country").ilike("name", f"{q_clean}%").limit(limit).execute()
    return {
        "teams": [
            {
                "id": x.get("slug"),
                "name": x.get("name") or x.get("slug"),
                "crest": x.get("logo_url"),
                "country": (x.get("country") or "").strip() or None,
            }
            for x in (r.data or [])
            if x.get("logo_url")
        ],
        "leagues": LEAGUES,
    }


def _resolve_team_id_fast(team_name: str):
    """Résout le nom en ID sans remplir le cache (Supabase d'abord, puis API resolve)."""
    from app.core.config import get_settings
    s = get_settings()
    if s.supabase_url and s.supabase_key and (team_name or "").strip():
        try:
            from app.core.supabase_client import get_supabase
            supabase = get_supabase()
            name = team_name.strip()
            r = supabase.table("teams").select("slug").ilike("search_terms", f"%{name}%").limit(1).execute()
            if r.data and len(r.data) > 0:
                slug = r.data[0].get("slug")
                if slug is not None:
                    try:
                        return int(slug)
                    except (ValueError, TypeError):
                        return None
        except Exception:
            pass
    from app.services.api_football import resolve_team_name_to_id
    return resolve_team_name_to_id(team_name)


def _format_sportmonks_fixture_for_upcoming(f: dict) -> Optional[dict]:
    """Convertit une fixture Sportmonks (avec participants) vers le format attendu par le front."""
    from app.services.sportmonks import _extract_participants, _team_logo
    from datetime import datetime
    starting_at = f.get("starting_at") or ""
    try:
        dt = datetime.fromisoformat(starting_at.replace("Z", "+00:00")) if starting_at else None
    except Exception:
        dt = None
    day = dt.strftime("%d/%m") if dt else ""
    time = dt.strftime("%H:%M") if dt else ""
    league_obj = f.get("league") or {}
    league_name = (league_obj.get("name") or "").strip() or None if isinstance(league_obj, dict) else None
    home_p, away_p = _extract_participants(f)
    home_name = (home_p.get("name") or "").strip() if home_p else ""
    away_name = (away_p.get("name") or "").strip() if away_p else ""
    home_logo = _team_logo(home_p) if home_p else None
    away_logo = _team_logo(away_p) if away_p else None
    return {
        "date": day,
        "time": time,
        "league": {"name": league_name},
        "home": {"name": home_name, "logo": home_logo},
        "away": {"name": away_name, "logo": away_logo},
    }


@router.get("/upcoming")
def upcoming_fixtures(team: Optional[str] = None, team_id: Optional[int] = None, limit: int = 10):
    """Prochains matchs de l'équipe. team_id = Sportmonks ID (autocomplete) ou API-Football selon config."""
    from app.services.sportmonks import _use_sportmonks, team_upcoming_fixtures
    from app.services.api_football import _use_api, get_team_upcoming_fixtures

    tid = team_id
    if tid is None and (team or "").strip():
        tid = _resolve_team_id_fast(team.strip())
    if not tid:
        return {"fixtures": []}

    if _use_sportmonks():
        raw = team_upcoming_fixtures(int(tid), limit=limit)
        fixtures = []
        for f in raw:
            row = _format_sportmonks_fixture_for_upcoming(f)
            if row:
                fixtures.append(row)
        return {"fixtures": fixtures}

    if not _use_api():
        return {"fixtures": []}
    raw = get_team_upcoming_fixtures(int(tid), next_n=limit)
    fixtures = []
    for f in raw:
        fix = f.get("fixture") or {}
        league = f.get("league") or {}
        teams = f.get("teams") or {}
        home = teams.get("home") or {}
        away = teams.get("away") or {}
        date_str = (fix.get("date") or "")[:19]
        from datetime import datetime
        try:
            dt = datetime.fromisoformat(date_str.replace("Z", "+00:00")) if date_str else None
        except Exception:
            dt = None
        day = dt.strftime("%d/%m") if dt else ""
        time = dt.strftime("%H:%M") if dt else ""
        fixtures.append({
            "date": day,
            "time": time,
            "league": {"name": (league.get("name") or "").strip() or None},
            "home": {"name": home.get("name") or "", "logo": home.get("logo") or None},
            "away": {"name": away.get("name") or "", "logo": away.get("logo") or None},
        })
    return {"fixtures": fixtures}
