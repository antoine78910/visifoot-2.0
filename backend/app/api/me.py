# backend/app/api/me.py
"""Endpoint /me : plan, usage, limite d'analyses ; POST /me/cancel-subscription pour annuler via Whop."""
import logging
from fastapi import APIRouter, Header, HTTPException

from app.services.subscription import (
    get_plan_and_usage,
    get_analysis_limit,
    reset_if_new_day,
    can_analyze,
)
from app.core.supabase_client import get_supabase_admin
from app.core.config import get_settings
from datetime import date, datetime, timezone

router = APIRouter(tags=["me"])
logger = logging.getLogger(__name__)


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


@router.post("/me/cancel-subscription")
async def cancel_subscription(x_user_id: str | None = Header(None, alias="X-User-Id")):
    """
    Annule l'abonnement Whop de l'utilisateur (immédiat) et repasse le plan en free.
    Nécessite X-User-Id. Le profil doit avoir whop_membership_id (rempli au paiement / sync).
    """
    user_id = (x_user_id or "").strip()
    if not user_id:
        raise HTTPException(status_code=401, detail="X-User-Id required")

    admin = get_supabase_admin()
    if not admin:
        raise HTTPException(status_code=503, detail="Supabase not configured")

    r = admin.table("profiles").select("whop_membership_id").eq("id", user_id).execute()
    if not r.data or len(r.data) == 0:
        raise HTTPException(status_code=404, detail="Profile not found")
    row = r.data[0]
    membership_id = (row.get("whop_membership_id") or "").strip()
    if not membership_id:
        raise HTTPException(
            status_code=400,
            detail="No Whop membership linked. Cancel from your Whop account or contact support.",
        )

    settings = get_settings()
    whop_key = (settings.whop_api_key or "").strip()
    if not whop_key:
        raise HTTPException(status_code=503, detail="Whop API not configured")

    import httpx
    url = f"https://api.whop.com/api/v1/memberships/{membership_id}/cancel"
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                url,
                headers={"Authorization": f"Bearer {whop_key}"},
                json={"cancellation_mode": "immediate"},
                timeout=15.0,
            )
        if resp.status_code >= 400:
            logger.warning("Whop cancel membership %s: %s %s", membership_id, resp.status_code, resp.text)
            raise HTTPException(status_code=502, detail="Whop could not cancel subscription")
    except httpx.HTTPError as e:
        logger.exception("Whop cancel request failed: %s", e)
        raise HTTPException(status_code=502, detail="Whop request failed")

    admin.table("profiles").upsert(
        {"id": user_id, "plan": "free", "whop_membership_id": None},
        on_conflict="id",
    ).execute()
    logger.info("Cancel subscription: user %s plan set to free after Whop cancel", user_id)
    return {"ok": True, "plan": "free"}
