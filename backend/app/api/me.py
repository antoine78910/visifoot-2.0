# backend/app/api/me.py
"""Endpoint /me : plan, usage, limite d'analyses ; POST /me/cancel-subscription pour annuler via Whop (at_period_end).

Whop API URLs appelées (Company API Key uniquement — pas de /me ni de routes v5/v2 /company/*) :
  - GET  https://api.whop.com/api/v1/members?company_id=...&first=100
  - GET  https://api.whop.com/api/v1/memberships?company_id=...&statuses=active&user_ids=...&first=50
  - POST https://api.whop.com/api/v1/memberships/{membership_id}/cancel
"""
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

CANCELLATION_MODE = "at_period_end"  # User keeps access until end of paid period (tuto Whop)

# Whop plan_id → our plan name (same as webhooks)
WHOP_PLAN_TO_APP = {
    "plan_xncEV4h0yc3F1": "starter",
    "plan_OPBroVFLkZFuG": "pro",
    "plan_a9qUhL4i9mz6B": "lifetime",
    "plan_SosIjQXUrG5Pb": "starter",
    "plan_pVoGBCVIzFw4M": "pro",
    "plan_m9Bcvjqy3xudw": "lifetime",
    "plan_WmP3L9eEPlEJb": "starter",
    "plan_ASd2bXI29nfKR": "pro",
    "plan_FXHgaDOloK9Q1": "lifetime",
}


def _mask_user_id(user_id: str) -> str:
    """Pour les logs : affiche les 8 premiers caractères max."""
    if not user_id:
        return "anonymous"
    return (user_id[:8] + "...") if len(user_id) > 8 else user_id


@router.get("/me")
async def me(x_user_id: str | None = Header(None, alias="X-User-Id")):
    """
    Retourne le plan, l'usage du jour et la limite pour l'utilisateur.
    X-User-Id optionnel (id Supabase). Si absent, renvoie free avec limite 1.
    À chaque appel, si l'utilisateur est identifié et Whop configuré, on resynchronise
    le plan depuis Whop pour éviter d'afficher "free" à tort.
    """
    user_id = (x_user_id or "").strip()
    admin = get_supabase_admin() if user_id else None
    settings = get_settings()
    whop_key = (settings.whop_api_key or "").strip()
    company_id = (settings.whop_company_id or "").strip()

    # Resync plan from Whop when user is logged in and Whop is configured
    if user_id and admin and whop_key and company_id:
        email = _get_user_email_from_supabase(admin, user_id)
        if email:
            logger.info("me: syncing plan from Whop for user_id=%s email=%s***", _mask_user_id(user_id), (email or "")[:4])
            whop_plan, membership_id, _ = await _whop_get_plan_for_email(email, whop_key, company_id)
            if whop_plan and membership_id:
                plan_from_db, _, __, _ = get_plan_and_usage(user_id)
                if whop_plan != plan_from_db:
                    try:
                        admin.table("profiles").upsert(
                            {"id": user_id, "plan": whop_plan, "whop_membership_id": membership_id, "subscription_ends_at": None},
                            on_conflict="id",
                        ).execute()
                        logger.info(
                            "me: synced plan from Whop user_id=%s plan=%s (was %s)",
                            _mask_user_id(user_id),
                            whop_plan,
                            plan_from_db,
                        )
                    except Exception as e:
                        logger.warning("me: failed to update plan from Whop for user_id=%s: %s", _mask_user_id(user_id), e)

    plan, used, last, subscription_ends_at = get_plan_and_usage(user_id)
    today = datetime.now(timezone.utc).date()
    used = reset_if_new_day(used, last, today)
    limit, full_analysis = get_analysis_limit(plan)
    allowed, _msg, next_full, _ = can_analyze(user_id)

    logger.info(
        "me: user_id=%s plan=%s full_analysis=%s can_analyze=%s",
        _mask_user_id(user_id),
        plan,
        next_full,
        allowed,
    )
    return {
        "plan": plan,
        "analyses_used_today": used,
        "analyses_limit": limit,  # null = illimité
        "full_analysis": next_full,
        "can_analyze": allowed,
        "subscription_ends_at": subscription_ends_at,
    }


def _get_user_email_from_supabase(admin, user_id: str) -> str | None:
    """Récupère l'email de l'utilisateur depuis Supabase Auth (service role)."""
    if not admin or not user_id:
        return None
    try:
        r = admin.auth.admin.get_user_by_id(user_id)
        if getattr(r, "user", None) and getattr(r.user, "email", None):
            return (r.user.email or "").strip() or None
    except Exception as e:
        logger.debug("Could not get user email from Supabase auth: %s", e)
    return None


async def _whop_cancel_membership(membership_id: str, whop_key: str) -> tuple[bool, str | None]:
    """
    Annule un membership Whop (at_period_end). Retourne (succès, period_end_iso ou None).
    Après annulation, récupère renewal_period_end via GET membership pour l'afficher à l'utilisateur.
    """
    import httpx
    url = f"https://api.whop.com/api/v1/memberships/{membership_id}/cancel"
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                url,
                headers={"Authorization": f"Bearer {whop_key}"},
                json={"cancellation_mode": CANCELLATION_MODE},
                timeout=15.0,
            )
        if resp.status_code >= 400:
            logger.warning("Whop cancel membership %s: %s %s", membership_id, resp.status_code, resp.text)
            return (False, None)
        # Récupérer la date de fin de période (renewal_period_end) pour l'affichage
        period_end: str | None = None
        try:
            async with httpx.AsyncClient() as get_client:
                get_resp = await get_client.get(
                    f"https://api.whop.com/api/v1/memberships/{membership_id}",
                    headers={"Authorization": f"Bearer {whop_key}"},
                    timeout=10.0,
                )
            if get_resp.status_code < 400:
                data = get_resp.json()
                m = data.get("data") if isinstance(data.get("data"), dict) else data
                if isinstance(m, dict):
                    raw = m.get("renewal_period_end") or m.get("renewal_period_end_at")
                    if isinstance(raw, (int, float)):
                        period_end = datetime.fromtimestamp(int(raw), tz=timezone.utc).isoformat()
                    elif isinstance(raw, str) and raw.strip():
                        period_end = raw.strip()
        except Exception as e:
            logger.debug("Whop get membership for period_end: %s", e)
        return (True, period_end)
    except httpx.HTTPError as e:
        logger.exception("Whop cancel request failed: %s", e)
    return (False, None)


async def _whop_find_and_cancel_by_email(email: str, whop_key: str, company_id: str) -> tuple[bool, str | None]:
    """
    Trouve le membre Whop par email, puis son membership actif, et l'annule (at_period_end).
    Retourne (succès, period_end_iso ou None).
    """
    if not email or not whop_key or not company_id:
        return (False, None)
    result = await _whop_get_plan_for_email(email, whop_key, company_id)
    plan, membership_id, api_error = result
    if api_error or not membership_id:
        return (False, None)
    return await _whop_cancel_membership(membership_id, whop_key)


def _extract_members_list(data: dict, base: str) -> list:
    """Extrait la liste des membres depuis la réponse Whop (v1, v5 ou v2)."""
    raw = data.get("data") or data.get("members") or []
    if isinstance(raw, list):
        return raw
    if isinstance(raw, dict) and "data" in raw:
        d = raw.get("data")
        return d if isinstance(d, list) else []
    return []


async def _whop_get_plan_for_email(email: str, whop_key: str, company_id: str) -> tuple[str | None, str | None, str | None]:
    """
    Trouve le membre Whop par email et son membership actif.
    Retourne (app_plan, membership_id, api_error).
    api_error = "whop_unauthorized" (401) ou "whop_forbidden" (403) si l'API Whop refuse la requête.
    """
    if not email or not whop_key or not company_id:
        return (None, None, None)
    import httpx
    headers = {"Authorization": f"Bearer {whop_key}"}
    email_lower = email.strip().lower()
    member_id = None
    user_id_for_memberships: str | None = None  # v1 list memberships filters by user_ids
    api_error: str | None = None
    # Company API keys must use v1 only; v5/v2 /company/* routes are for App API keys (401 otherwise)
    # https://docs.whop.com/developer/api/getting-started
    endpoints: list[tuple[str, str, dict]] = [
        ("https://api.whop.com/api/v1", "/members", {"company_id": company_id, "first": 100}),
    ]
    for base, path, base_params in endpoints:
        page = 1
        after_cursor: str | None = None
        while page <= 5:
            try:
                params = dict(base_params)
                if "page" in params:
                    params["page"] = page
                if after_cursor and "first" in params:
                    params["after"] = after_cursor
                async with httpx.AsyncClient() as client:
                    r = await client.get(
                        f"{base}{path}",
                        params=params,
                        headers=headers,
                        timeout=15.0,
                    )
                if r.status_code == 401:
                    try:
                        body = (r.text or "")[:500]
                        logger.warning(
                            "Whop API: 401 (use Company API key with member:basic:read, member:email:read, member:phone:read). Response: %s",
                            body or "(empty)",
                        )
                    except Exception:
                        logger.warning("Whop API: 401 Unauthorized (check WHOP_API_KEY)")
                    api_error = "whop_unauthorized"
                    break
                if r.status_code == 403:
                    logger.warning("Whop API: 403 Forbidden (check company_id or API scope)")
                    api_error = "whop_forbidden"
                    break
                if r.status_code >= 400:
                    break
                data = r.json()
                members = _extract_members_list(data, base)
                if not members and page == 1:
                    logger.info("Whop: company members list empty (company_id=%s)", company_id[:12] + "...")
                for m in members:
                    if not isinstance(m, dict):
                        continue
                    u = m.get("user") or m.get("user_id")
                    if isinstance(u, dict):
                        em = (u.get("email") or "").strip().lower()
                    else:
                        em = (m.get("email") or "").strip().lower()
                    if em == email_lower:
                        member_id = m.get("id") or m.get("member_id")
                        u_obj = m.get("user")
                        user_id_for_memberships = (u_obj.get("id") if isinstance(u_obj, dict) else None) or m.get("user_id")
                        break
                if member_id:
                    break
                # Cursor-based (v1): use next page cursor if present
                if "first" in params:
                    next_cursor = (data.get("has_next_page") and data.get("end_cursor")) or data.get("next_cursor")
                    if next_cursor and len(members) >= 100:
                        after_cursor = next_cursor
                        page += 1
                        continue
                # Page-based: stop if less than full page
                if len(members) < 100:
                    break
                page += 1
            except Exception as e:
                logger.warning("Whop list members %s%s page %s: %s", base, path, page, e)
                break
        if member_id or api_error:
            break
    if api_error:
        return (None, None, api_error)
    if not member_id:
        logger.info("Whop: no member found for email %s (v1 members)", email_lower[:3] + "***")
        return (None, None, None)

    membership_id = None
    plan_id = None
    # Company API keys: v1 only; v1 list memberships uses statuses[] and user_ids[] (not member_id)
    for base, path in [
        ("https://api.whop.com/api/v1", "/memberships"),
    ]:
        try:
            params: dict = {"company_id": company_id, "first": 50}
            if user_id_for_memberships:
                params["user_ids"] = [user_id_for_memberships]
            params["statuses"] = ["active"]
            async with httpx.AsyncClient() as client:
                r = await client.get(
                    f"{base}{path}",
                    params=params,
                    headers=headers,
                    timeout=15.0,
                )
            if r.status_code >= 400:
                continue
            data = r.json()
            list_ms = data.get("data") if isinstance(data.get("data"), list) else data.get("memberships") or []
            if not isinstance(list_ms, list):
                list_ms = []
            for ms in list_ms:
                if isinstance(ms, dict) and (ms.get("status") or "").lower() == "active":
                    membership_id = ms.get("id") or ms.get("membership_id")
                    plan_id = ms.get("plan_id") or (ms.get("plan") or {}).get("id") if isinstance(ms.get("plan"), dict) else None
                    break
            if not membership_id and list_ms and isinstance(list_ms[0], dict):
                ms = list_ms[0]
                membership_id = ms.get("id") or ms.get("membership_id")
                plan_id = ms.get("plan_id") or (ms.get("plan") or {}).get("id") if isinstance(ms.get("plan"), dict) else None
            if membership_id:
                break
        except Exception as e:
            logger.debug("Whop list memberships %s: %s", base, e)
    if not membership_id:
        return (None, None, None)
    app_plan = WHOP_PLAN_TO_APP.get((plan_id or "").strip()) if plan_id else "starter"
    return (app_plan or "starter", membership_id, None)


@router.post("/me/sync-plan")
async def sync_plan(x_user_id: str | None = Header(None, alias="X-User-Id")):
    """
    Resynchronise le plan depuis Whop (par email). Si un abonnement actif est trouvé,
    met à jour profiles.plan et whop_membership_id. Utile si l'utilisateur est affiché en free par erreur.
    """
    user_id = (x_user_id or "").strip()
    if not user_id:
        raise HTTPException(status_code=401, detail="X-User-Id required")
    admin = get_supabase_admin()
    if not admin:
        raise HTTPException(status_code=503, detail="Supabase not configured")
    settings = get_settings()
    whop_key = (settings.whop_api_key or "").strip()
    company_id = (settings.whop_company_id or "").strip()
    if not whop_key or not company_id:
        raise HTTPException(status_code=503, detail="Whop not configured (API key + company ID)")
    email = _get_user_email_from_supabase(admin, user_id)
    if not email:
        return {"ok": False, "plan": "free", "updated": False, "reason": "no_email"}
    app_plan, membership_id, whop_error = await _whop_get_plan_for_email(email, whop_key, company_id)
    if whop_error:
        return {"ok": False, "plan": "free", "updated": False, "reason": "whop_api_error"}
    if not app_plan or not membership_id:
        return {"ok": True, "plan": "free", "updated": False, "reason": "no_active_membership"}
    try:
        admin.table("profiles").upsert(
                            {"id": user_id, "plan": app_plan, "whop_membership_id": membership_id, "subscription_ends_at": None},
                            on_conflict="id",
                        ).execute()
        logger.info("Sync plan: user %s updated to %s (membership_id=%s)", user_id, app_plan, membership_id[:12] + "...")
        return {"ok": True, "plan": app_plan, "updated": True}
    except Exception as e:
        logger.exception("Sync plan: %s", e)
        raise HTTPException(status_code=500, detail="Failed to update profile")


@router.post("/me/cancel-subscription")
async def cancel_subscription(x_user_id: str | None = Header(None, alias="X-User-Id")):
    """
    Annule l'abonnement Whop (at_period_end: l'utilisateur garde l'accès jusqu'à la fin de la période)
    et repasse le plan en free dans notre DB.
    Si whop_membership_id est présent → annule ce membership. Sinon, tente par email (Whop company members).
    """
    user_id = (x_user_id or "").strip()
    if not user_id:
        raise HTTPException(status_code=401, detail="X-User-Id required")

    admin = get_supabase_admin()
    if not admin:
        raise HTTPException(status_code=503, detail="Supabase not configured")

    try:
        r = admin.table("profiles").select("plan, whop_membership_id, subscription_ends_at").eq("id", user_id).execute()
    except Exception as e:
        msg = str(e).lower()
        code = getattr(e, "code", None) or (e.args[0].get("code") if e.args and isinstance(e.args[0], dict) else None)
        if code == "42703" or "whop_membership_id" in msg or "does not exist" in msg:
            raise HTTPException(
                status_code=503,
                detail="Database migration required: run 004_profiles_whop_membership_id.sql in Supabase SQL Editor.",
            )
        raise

    if not r.data or len(r.data) == 0:
        raise HTTPException(status_code=404, detail="Profile not found")
    row = r.data[0]
    membership_id = (row.get("whop_membership_id") or "").strip()

    settings = get_settings()
    whop_key = (settings.whop_api_key or "").strip()
    company_id = (settings.whop_company_id or "").strip()
    cancelled_via_whop = False

    period_end_iso: str | None = None
    if membership_id and whop_key:
        cancelled_via_whop, period_end_iso = await _whop_cancel_membership(membership_id, whop_key)
        if cancelled_via_whop:
            logger.info("Cancel subscription: user %s cancelled via Whop API (membership_id)", user_id)
    elif not membership_id and whop_key and company_id:
        email = _get_user_email_from_supabase(admin, user_id)
        if email:
            cancelled_via_whop, period_end_iso = await _whop_find_and_cancel_by_email(email, whop_key, company_id)
            if cancelled_via_whop:
                logger.info("Cancel subscription: user %s cancelled via Whop API (by email)", user_id)

    current_plan = (row.get("plan") or "free").strip() or "free"
    # Annulation réussie : on stocke la date de fin (at_period_end), on ne passe PAS le plan en free tout de suite
    if cancelled_via_whop:
        admin.table("profiles").update(
            {"subscription_ends_at": period_end_iso}
        ).eq("id", user_id).execute()
        logger.info("Cancel subscription: user %s subscription_ends_at=%s (plan unchanged: %s)", user_id, period_end_iso, current_plan)
        return {"ok": True, "plan": current_plan, "cancelled_via_whop": True, "subscription_ends_at": period_end_iso}
    logger.info("Cancel subscription: user %s — Whop cancel not done, plan unchanged", user_id)
    return {"ok": True, "plan": current_plan, "cancelled_via_whop": False}
