"""
Polling des matchs terminés (FT) — Option A.
Toutes les N secondes (POLLING_INTERVAL_SECONDS) : récupérer les matchs du jour,
vérifier status, si FT et pas encore traité → récupérer stats et marquer comme traité.
À appeler via GET /internal/poll-finished-fixtures (cron ou script).
"""
from datetime import date
from typing import Any

from app.services.api_football import (
    _use_api,
    get_fixtures_by_date,
    get_fixture_by_id,
    get_fixture_statistics,
)


def _processed_file_path() -> str:
    import os
    return os.path.join(os.path.dirname(__file__), "..", "..", "data", "processed_fixtures.json")


def _load_processed_ids() -> set[int]:
    """Charge la liste des fixture_id déjà traités (fichier local)."""
    path = _processed_file_path()
    if not os.path.exists(path):
        return set()
    try:
        import json
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return set(data.get("processed_ids") or [])
    except Exception:
        return set()


def _save_processed(processed_ids: set[int]) -> None:
    import os
    import json
    path = _processed_file_path()
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump({"processed_ids": list(processed_ids)}, f, indent=0)


def run_poll_finished_fixtures() -> dict[str, Any]:
    """
    Une itération du polling : matchs du jour, si FT et non traité → stats + mark.
    Retourne { "processed": int, "checked": int, "errors": list }.
    """
    result: dict[str, Any] = {"processed": 0, "checked": 0, "errors": []}
    if not _use_api():
        return result

    today = date.today().isoformat()
    try:
        fixtures = get_fixtures_by_date(today)
    except Exception as e:
        result["errors"].append(f"get_fixtures_by_date: {e}")
        return result

    processed_ids = _load_processed_ids()
    result["checked"] = len(fixtures)

    for item in fixtures:
        fixture = item.get("fixture") or {}
        fid = fixture.get("id")
        if fid is None:
            continue
        status = fixture.get("status")
        status_short = (status.get("short") if isinstance(status, dict) else None) or str(status or "")
        if status_short != "FT":
            continue
        if fid in processed_ids:
            continue

        try:
            # 1) Résultat officiel
            res = get_fixture_by_id(fid)
            if not res or (res.get("status_short") or "").strip() != "FT":
                continue
            f_home_id = res.get("home_team_id")
            f_away_id = res.get("away_team_id")
            if f_home_id is None or f_away_id is None:
                continue
            # 2) Stats du match
            stats = get_fixture_statistics(fid, f_home_id, f_away_id)
            # 3) Marquer comme traité (on pourrait persister stats pour plus tard)
            processed_ids.add(fid)
            result["processed"] += 1
        except Exception as e:
            result["errors"].append(f"fixture {fid}: {e}")

    try:
        _save_processed(processed_ids)
    except Exception as e:
        result["errors"].append(f"save: {e}")

    return result
