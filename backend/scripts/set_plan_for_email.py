"""
One-off: set profiles.plan for a user by email (e.g. after a Whop payment
that wasn't synced by webhook). No need to repay.

Usage (from backend/):
  python scripts/set_plan_for_email.py <email> <plan>
  plan = starter | pro | lifetime

Requires in .env.local: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
"""
import os
import sys

# Load backend .env
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(backend_dir)
from dotenv import load_dotenv
load_dotenv(".env")
load_dotenv(".env.local")

def main():
    if len(sys.argv) != 3:
        print("Usage: python scripts/set_plan_for_email.py <email> <plan>")
        print("  plan = starter | pro | lifetime")
        sys.exit(1)
    email = sys.argv[1].strip()
    plan = (sys.argv[2] or "").strip().lower()
    if plan not in ("starter", "pro", "lifetime"):
        print("Invalid plan. Use: starter | pro | lifetime")
        sys.exit(1)
    url = (os.getenv("SUPABASE_URL") or "").strip()
    role_key = (os.getenv("SUPABASE_SERVICE_ROLE_KEY") or "").strip()
    if not url or not role_key:
        print("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local")
        sys.exit(1)
    from supabase import create_client
    admin = create_client(url, role_key)
    r = admin.auth.admin.list_users(page=1, per_page=1000)
    users = getattr(r, "users", []) if not isinstance(r, list) else r
    user_id = None
    for u in users:
        em = getattr(u, "email", None) or (u.get("email") if isinstance(u, dict) else None)
        if em and str(em).lower().strip() == email.lower().strip():
            user_id = getattr(u, "id", None) or (u.get("id") if isinstance(u, dict) else None)
            break
    if not user_id:
        print(f"No Supabase user found for email: {email[:8]}...")
        sys.exit(1)
    admin.table("profiles").upsert(
        {"id": user_id, "plan": plan},
        on_conflict="id",
    ).execute()
    print(f"Updated profiles.plan = {plan} for user {user_id} ({email})")

if __name__ == "__main__":
    main()
