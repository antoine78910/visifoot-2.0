#!/usr/bin/env python3
"""
Synchronise les principaux clubs depuis l'API Sportmonks vers Supabase.
Remplit la table teams (slug, name, logo_url, search_terms, country) pour une
suggestion intelligente rapide (alias psg→Paris SG, etc.) sans appeler l'API à chaque frappe.

Prérequis:
  - .env avec API_FOOTBALL_KEY ou SPORTMONKS_API_TOKEN, SUPABASE_URL, SUPABASE_KEY
  - Table teams avec colonnes: slug (text, PK), name, logo_url, search_terms (text), country, last_updated

Usage:
  cd backend && .\\venv\\Scripts\\python.exe scripts/sync_sportmonks_teams_to_supabase.py
"""
import os
import sys
import time
from pathlib import Path
from datetime import datetime, timezone

backend = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend))
os.chdir(backend)

try:
    import pydantic_settings  # noqa: F401
except ImportError:
    print("Active le venv du backend puis relance le script.")
    sys.exit(1)


# Termes de recherche pour les principaux clubs (Ligue 1 + top européens)
MAIN_CLUB_SEARCH_TERMS = [
    "paris",
    "marseille",
    "lyon",
    "lille",
    "monaco",
    "nice",
    "lens",
    "rennes",
    "auxerre",
    "strasbourg",
    "toulouse",
    "montpellier",
    "reims",
    "lorient",
    "nantes",
    "brest",
    "clermont",
    "havre",
    "real madrid",
    "barcelona",
    "atletico madrid",
    "bayern",
    "dortmund",
    "juventus",
    "inter",
    "ac milan",
    "napoli",
    "roma",
    "lazio",
    "arsenal",
    "chelsea",
    "liverpool",
    "manchester united",
    "manchester city",
    "tottenham",
    "newcastle",
    "aston villa",
    "west ham",
    "brighton",
    "benfica",
    "porto",
    "ajax",
    "psv",
    "feyenoord",
    "france",
    "england",
    "spain",
    "germany",
    "italy",
    "brazil",
    "argentina",
    "portugal",
    "belgium",
    "netherlands",
]


def _build_search_terms(name: str, short_code: str = "") -> str:
    """Construit search_terms : nom + short_code + alias (psg, aja, om...)."""
    from app.services.api_football import _normalize_for_search, TEAM_SEARCH_ALIASES
    n = _normalize_for_search((name or "") + " " + (short_code or ""))
    parts = [n] if n else []
    for alias_key, alias_parts in TEAM_SEARCH_ALIASES.items():
        if any(p in n for p in alias_parts):
            parts.append(alias_key)
    return ",".join(parts)


def _team_crest(team: dict) -> str | None:
    """URL du blason depuis un objet team Sportmonks."""
    img = team.get("image_path") or team.get("logo_path")
    if not img:
        return None
    s = str(img).strip()
    if s.startswith("http"):
        return s
    return f"https://cdn.sportmonks.com/images/soccer/teams/{s}" if s else None


def main() -> None:
    from app.core.config import get_settings
    from app.services.sportmonks import _use_sportmonks, teams_search
    from app.core.supabase_client import get_supabase

    settings = get_settings()
    if not _use_sportmonks():
        print("API_FOOTBALL_KEY ou SPORTMONKS_API_TOKEN manquant dans .env")
        sys.exit(1)
    if not (settings.supabase_url and settings.supabase_key):
        print("SUPABASE_URL et SUPABASE_KEY requis.")
        sys.exit(1)

    seen_ids: set[int] = set()
    all_rows: list[dict] = []
    now = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    for i, term in enumerate(MAIN_CLUB_SEARCH_TERMS):
        try:
            raw = teams_search(term, limit=15)
        except Exception as e:
            print(f"  [{term}] Erreur: {e}")
            time.sleep(0.4)
            continue
        added = 0
        for t in raw:
            tid = t.get("id")
            if tid is None:
                continue
            try:
                tid_int = int(tid)
            except (ValueError, TypeError):
                continue
            if tid_int in seen_ids:
                continue
            seen_ids.add(tid_int)
            name = (t.get("name") or "").strip()
            if not name:
                continue
            logo_url = _team_crest(t)
            if not logo_url:
                continue
            short_code = (t.get("short_code") or "").strip()
            search_terms = _build_search_terms(name, short_code)
            all_rows.append({
                "slug": str(tid_int),
                "name": name,
                "logo_url": logo_url,
                "search_terms": search_terms,
                "country": None,
                "last_updated": now,
            })
            added += 1
        print(f"  [{i+1}/{len(MAIN_CLUB_SEARCH_TERMS)}] '{term}': {len(raw)} trouvés, +{added} ajoutés")
        time.sleep(0.35)

    if not all_rows:
        print("Aucune équipe à insérer. Vérifiez le token Sportmonks.")
        sys.exit(1)

    supabase = get_supabase()
    batch_size = 500
    for i in range(0, len(all_rows), batch_size):
        batch = all_rows[i : i + batch_size]
        supabase.table("teams").upsert(batch, on_conflict="slug").execute()
        print(f"Upsert {len(batch)} équipes ({min(i + batch_size, len(all_rows))}/{len(all_rows)})")

    print(f"Terminé: {len(all_rows)} équipes en base. La suggestion intelligente utilisera Supabase.")


if __name__ == "__main__":
    main()
