"""
Endpoints internes (cron, polling). Protégés par X-Admin-Key si admin_api_key est défini.
"""
from fastapi import APIRouter, Header, HTTPException

from app.core.config import get_settings
from app.services.fixture_polling import run_poll_finished_fixtures

router = APIRouter(prefix="/internal", tags=["internal"])


def _check_admin(x_admin_key: str | None) -> None:
    key = get_settings().admin_api_key
    if not key:
        return
    if x_admin_key != key:
        raise HTTPException(status_code=403, detail="Invalid or missing X-Admin-Key")


@router.get("/poll-finished-fixtures")
def poll_finished_fixtures(x_admin_key: str | None = Header(None, alias="X-Admin-Key")):
    """
    Une itération du polling Option A : matchs du jour, si status=FT et pas encore traité
    → récupère les stats et marque comme traité.
    À appeler toutes les 10 s (test) puis toutes les 1 h (cron).
    """
    _check_admin(x_admin_key)
    result = run_poll_finished_fixtures()
    return result
