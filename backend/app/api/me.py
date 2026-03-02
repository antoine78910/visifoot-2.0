# backend/app/api/me.py
"""Endpoint /me : plan, usage et limite d'analyses (pour la sidebar app)."""
from fastapi import APIRouter, Header

from app.services.subscription import (
    get_plan_and_usage,
    get_analysis_limit,
    reset_if_new_day,
    can_analyze,
)
from datetime import date, datetime, timezone

router = APIRouter(tags=["me"])


@router.get("/me")
def me(x_user_id: str | None = Header(None, alias="X-User-Id")):
    """
    Retourne le plan, l'usage du jour et la limite pour l'utilisateur.
    X-User-Id optionnel (id Supabase). Si absent, renvoie free avec limite 1.
    """
    user_id = (x_user_id or "").strip()
    plan, used, last = get_plan_and_usage(user_id)
    today = datetime.now(timezone.utc).date()
    used = reset_if_new_day(used, last, today)
    limit, full_analysis = get_analysis_limit(plan)
    allowed, _msg, next_full = can_analyze(user_id)

    return {
        "plan": plan,
        "analyses_used_today": used,
        "analyses_limit": limit,  # null = illimité
        "full_analysis": next_full,
        "can_analyze": allowed,
    }
