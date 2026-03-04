# URLs Whop API appelées par le backend

Toutes ces routes sont **compatibles Company API Key** (pas de route `/me` ni de routes user-scoped OAuth).

## me.py (plan, sync, annulation)

| Méthode | URL exacte |
|--------|------------|
| GET | `https://api.whop.com/api/v1/members?company_id={company_id}&first=100` |
| GET | `https://api.whop.com/api/v1/memberships?company_id={company_id}&statuses=active&user_ids={user_id}&first=50` |
| POST | `https://api.whop.com/api/v1/memberships/{membership_id}/cancel` |

Aucune route v2 ni v5 `/company/*` n’est appelée (elles nécessitent une App API Key et renvoient 401 avec une Company API Key).

## webhooks.py (récupération payment)

| Méthode | URL exacte |
|--------|------------|
| GET | `https://api.whop.com/api/v1/payments/{payment_id}` |
| GET | `https://api.whop.com/api/v5/company/payments/{payment_id}` (fallback) |

La v1 est essayée en premier pour les Company API Keys.
