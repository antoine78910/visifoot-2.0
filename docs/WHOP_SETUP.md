# Configuration Whop (checkout + webhooks)

## URL de redirection après paiement

Pour que Whop redirige vers ton app (et pas vers le groupe Whop) après un paiement réussi :

1. Dans le **dashboard Whop** → **Checkout links** (ou **Pricing** selon la version).
2. Pour **chaque** lien de checkout (Starter, Pro, Lifetime), clique sur **Edit**.
3. Dans les options (souvent **Advanced options**), trouve **« Redirect after checkout »** / **« Success URL »**.
4. Mets l’URL de ton app, par exemple :
   - **Production** : `https://app.deepfoot.io/app` ou `https://app.deepfoot.io/app/pricing`
   - (Tu peux utiliser `/app` pour atterrir sur la page d’accueil de l’app, ou `/app/pricing` pour la page tarifs.)

Une fois enregistré, après un paiement le client sera renvoyé vers cette URL au lieu du groupe Whop.

## Webhook

- **URL** : `https://deepfoot-production.up.railway.app/webhooks/whop`
- **Événement** : `payment.succeeded`
- Variables d’environnement backend : `WHOP_WEBHOOK_SECRET`, `DATAFAST_API_KEY`.

## Mise à jour du plan dans l’app

Quand un paiement Whop réussit, le webhook met à jour le plan dans Supabase (table `profiles`) si :
- le payload Whop contient l’email du membre et l’id du plan ;
- le backend a une clé **Supabase service role** (`SUPABASE_SERVICE_ROLE_KEY` dans `.env` / Railway).

À faire :
1. **Supabase** : appliquer la migration `003_profiles_plan_values.sql` (autoriser les valeurs `starter`, `pro`, `lifetime`).
2. **Backend** : ajouter `SUPABASE_SERVICE_ROLE_KEY` (clé « service_role » dans Supabase → Settings → API). Ne pas l’exposer côté client.
