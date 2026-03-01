# Flux d’analyse d’un match – étapes et endpoints

Ce document décrit **toutes les étapes** et **tous les appels** (internes + API externes) effectués lors d’une analyse de match, pour évaluer la qualité des données et comprendre pourquoi l’analyse peut être rapide.

---

## 1. Côté frontend (déclenchement)

| Étape | Fichier | Action |
|-------|---------|--------|
| 1 | `MatchInput.tsx` | L’utilisateur soumet le formulaire (équipes domicile / extérieur, optionnellement IDs si choix autocomplete). |
| 2 | `MatchInput.tsx` | **POST** `{API_URL}/predict/stream` avec body : `home_team`, `away_team`, `home_team_id?`, `away_team_id?`, `use_api_predictions`, `language`. Header `X-User-Id` si connecté. |
| 3 | Réponse | Flux NDJSON : événements `progress` (step, percent) puis `result` (data) ou `error`. |

**Backend** : l’endpoint utilisé est **POST /predict/stream** (ou POST /predict sans stream). Ci-dessous tout est décrit côté backend.

---

## 2. Côté backend – ordre des opérations

### 2.1 Vérification plan (subscription)

| Étape | Fichier | Appel | Données |
|-------|---------|--------|--------|
| A | `api/predict.py` | `can_analyze(user_id)` | Lit plan + usage (Supabase `profiles`) et décide si l’analyse est autorisée et si elle est `full_analysis` ou non. |
| B | Si autorisé | `load_match_context(...)` puis calculs puis `consume_analysis(user_id)` en fin | Voir ci‑dessous. |

Aucun appel HTTP externe ici (sauf Supabase si configuré).

---

## 3. Chargement du contexte match – `load_match_context`

Source : `services/data_loader.py` → si clé API Football configurée, utilise **`_load_match_context_api_football`**.

### 3.1 Résolution des équipes (IDs)

| # | Progress | Fonction | Endpoint API-Football | Paramètres | Données récupérées |
|---|----------|----------|------------------------|------------|--------------------|
| 1 | 5% | `resolve_team_name_to_id(home_team)` | (cache) ou **GET /teams** | `league`, `season` (par ligue, si cache vide) | Cache équipes pour matcher le nom → ID. Si `home_team_id` / `away_team_id` fournis dans la requête, cette résolution est **sautée**. |
| 2 | 5% | `resolve_team_name_to_id(away_team)` | Idem | Idem | Idem. |

Si les IDs sont déjà fournis (autocomplete), **aucun appel** pour la résolution.

### 3.2 Infos équipes + prochain match (fixture_id, ligue, date, lieu)

| # | Progress | Fonction | Endpoint API-Football | Données récupérées |
|---|----------|----------|------------------------|--------------------|
| 3 | 15% | `get_team_by_id(home_id)` | **GET /teams** | `id`, `name`, `logo`, `stadium` (venue) – en parallèle avec away. |
| 4 | 15% | `get_team_by_id(away_id)` | **GET /teams** | Idem. |
| 5 | 15% | `get_team_upcoming_fixtures(home_id, 15)` | **GET /fixtures** | `team`, `next=15` → prochains matchs domicile ; on cherche un fixture où les deux équipes sont exactement home vs away pour obtenir `fixture_id`, `league`, `match_date`, `venue`. |

### 3.3 Forme des équipes (derniers matchs)

| # | Progress | Fonction | Endpoint API-Football | Données récupérées |
|---|----------|----------|------------------------|--------------------|
| 6 | 28% | `get_team_fixtures(home_id, season, 10)` | **GET /fixtures** | `team`, `season`, `status=FT` – derniers 10 matchs terminés (buts pour/contre, forme W/D/L). |
| 7 | 28% | `get_team_fixtures(away_id, season, 10)` | **GET /fixtures** | Idem (exécutés en parallèle). |

À partir de ces fixtures on dérive : `home_goals_for`, `home_goals_against`, `away_goals_for`, `away_goals_against`, `home_form`, `away_form`, puis `lambda_home`, `lambda_away` (pour le modèle Poisson).

### 3.4 Head-to-head (H2H) multi-saisons

| # | Progress | Fonction | Endpoint API-Football | Données récupérées |
|---|----------|----------|------------------------|--------------------|
| 8 | 52% | `get_fixtures_headtohead_multi_season(home_id, away_id, 5, 5)` | **GET /fixtures** (plusieurs fois) | Pour chaque saison (5 dernières) et chaque équipe : `team`, `season`, `status=FT`. Fusion des matchs communs pour avoir tout le H2H sur 5 saisons. |
| 9 | - | `get_h2h_from_fixtures(...)` | (calcul local) | (home_wins, draws, away_wins). |
| 10 | - | `get_weighted_h2h_home_pct(...)` | (calcul local) | Pourcentage pondéré domicile (poids par ancienneté de saison). |

Nombre d’appels réels dans `get_fixtures_headtohead_multi_season` : jusqu’à **5 saisons × 2 équipes = 10 × GET /fixtures** (team + season + status=FT).

### 3.5 Ligue commune (si pas trouvée via prochain match)

| # | Progress | Fonction | Endpoint API-Football | Données récupérées |
|---|----------|----------|------------------------|--------------------|
| 11 | 58% | `guess_common_league_name(home_id, away_id)` (si `league is None`) | **GET /leagues** | `team=home_id`, `season` puis `team=away_id`, `season` → intersection des ligues pour afficher un nom de compétition. |

### 3.6 Match terminé (dernier H2H) – score + stats

Si **aucun** `fixture_id` de prochain match n’a été trouvé mais qu’on a des H2H :

| # | Progress | Fonction | Endpoint API-Football | Données récupérées |
|---|----------|----------|------------------------|--------------------|
| 12 | - | `get_fixture_by_id(last_fid)` | **GET /fixtures** | `id=fixture_id` → statut (FT), score (goals_home, goals_away). |
| 13 | - | `get_fixture_statistics(fixture_id, home_id, away_id)` (si FT) | **GET /fixtures/statistics** | `fixture=id` → statistiques détaillées du match (possession, tirs, etc.) pour les deux équipes. |

---

## 4. Calcul des probabilités (après contexte)

| Progress | Fichier | Source des données | Endpoint externe |
|----------|---------|-------------------|-------------------|
| 62% | `api/predict.py` | **Mode 1** : si `use_api_predictions` et `fixture_id` présent → **Mode 2** : sinon modèle Poisson local | Voir ci‑dessous. |

### 4.1 Mode « API Predictions » (option activée + fixture_id)

| # | Fonction | Endpoint API-Football | Données récupérées |
|---|----------|------------------------|--------------------|
| 14 | `api_get_predictions(ctx["fixture_id"])` | **GET /predictions** | `fixture=fixture_id` → prédictions 1X2, advice, under/over, last_5 goals (xG dérivés), etc. Utilisé pour remplir `_out_from_api_predictions` (prob_home/draw/away, xG, over/under, double chance, pas de BTTS ni scores exacts détaillés côté API). |

Aucun modèle Poisson dans ce mode pour les probas 1X2 / xG affichés.

### 4.2 Mode « Poisson local » (défaut ou pas de fixture_id)

| # | Fichier | Appel | Endpoint externe |
|---|---------|--------|-------------------|
| - | `ml/poisson.py` | `predict_all(ctx["lambda_home"], ctx["lambda_away"])` | **Aucun.** Calcul local (grille Poisson, 1X2, over/under, BTTS, scores exacts, distributions). |

Les `lambda_home` / `lambda_away` viennent du contexte (form + buts pour/contre) déjà chargé.

---

## 5. Résumé et scénarios IA (OpenAI)

| Progress | Fichier | Fonction | Endpoint externe | Données |
|----------|---------|----------|-------------------|--------|
| 75% | `api/predict.py` | `build_prompt_context(...)` | Aucun | Contexte texte (équipes, xG, 1X2, forme, ligue, lieu). |
| 75% | `services/news_fetcher.py` | `fetch_football_news(home, away, league)` | **GET https://newsapi.org/v2/everything** | Jusqu’à 2 requêtes (une par équipe), optionnel si `NEWS_API_KEY` non configuré. Articles récents (football) pour enrichir le prompt. |
| 75% | `services/openai_summary.py` | `generate_ai_analysis(prompt_ctx, ...)` | **OpenAI API** (1 appel) | **POST** chat completions (modèle `gpt-4o-mini`) – un seul appel JSON structuré qui renvoie : `quick_summary`, `scenario_1`, `scenario_2`, `scenario_3`, `scenario_4`, `key_forces_home`, `key_forces_away`. |

---

## 6. Assemblage et retour

| Progress | Fichier | Action |
|----------|---------|--------|
| 100% | `api/predict.py` | `_build_response(ctx, out, ai)` → fusion contexte + probabilités + champs IA. Ajout de `full_analysis` selon le plan. Puis `consume_analysis(user_id)` (Supabase) si user connecté. |

Réponse renvoyée au front (stream ou JSON) : tous les champs nécessaires à l’affichage (résumé, scénarios, 1X2, xG, over/under, etc.).

---

## 7. Récapitulatif des endpoints externes par analyse

### API-Football (base : `https://v3.football.api-sports.io`)

| Endpoint | Méthode | Quand / combien de fois |
|----------|--------|-------------------------|
| `/teams?id={id}` | GET | 2 (infos domicile + extérieur), ou 0 si résolution par cache. |
| `/teams?league=&season=` | GET | Un par ligue si cache vide (résolution noms → IDs). |
| `/fixtures?team=&next=15` | GET | 1 (prochains matchs équipe domicile). |
| `/fixtures?team=&season=&status=FT` | GET | 2 (forme domicile + extérieur) + jusqu’à 10 pour H2H multi-saisons. |
| `/fixtures?id=` | GET | 0 ou 1 (résultat dernier H2H si pas de prochain match). |
| `/fixtures/statistics?fixture=` | GET | 0 ou 1 (stats du dernier H2H si match terminé). |
| `/leagues?team=&season=` | GET | 0 ou 2 (ligue commune si pas déjà trouvée). |
| `/predictions?fixture=` | GET | 0 ou 1 (si option « API predictions » activée et fixture_id trouvé). |

Ordre de grandeur : **environ 6 à 20+ appels API-Football** selon présence d’IDs, cache, H2H multi-saisons et option predictions.

### NewsAPI (optionnel)

| URL | Méthode | Quand |
|-----|--------|-------|
| `https://newsapi.org/v2/everything` | GET | 0 à 2 (une par équipe si clé configurée). |

### OpenAI (optionnel)

| API | Quand |
|-----|-------|
| Chat Completions (gpt-4o-mini) | 1 appel si `OPENAI_API_KEY` configuré, sinon champs IA vides ou fallback texte. |

### Supabase (optionnel)

- Lecture `profiles` (plan, usage) pour `can_analyze` et éventuellement pour afficher infos user.
- Écriture `profiles` (analyses_used_today, last_analysis_date) dans `consume_analysis` en fin d’analyse.

---

## 8. Pourquoi l’analyse peut être rapide

1. **Parallélisation** : `get_team_by_id` (2), `get_team_fixtures` (2) sont lancés en parallèle (ThreadPoolExecutor).
2. **Un seul appel OpenAI** : tout le texte IA (résumé + 4 scénarios + key forces) en une requête structurée.
3. **Modèle Poisson local** : pas d’appel réseau pour les probas si on n’utilise pas l’option « API predictions ».
4. **Option « API predictions »** : un seul GET /predictions remplace tout le calcul Poisson quand un `fixture_id` est disponible (match à venir trouvé).
5. **Cache équipes** : si les IDs sont fournis (autocomplete) ou le cache déjà rempli, on évite les GET /teams par ligue.
6. **Timeouts courts** : API-Football 15 s, News 8 s – pas d’attente longue.
7. **News optionnel** : pas de blocage si pas de clé ou erreur.

---

## 9. Qualité des données

- **Contexte** : form et buts réels (fixtures FT), H2H multi-saisons pondéré, xG dérivés des dernières performances ou de l’API predictions.
- **1X2 / xG** : soit API-Football Predictions (données maison api-sports), soit modèle Poisson (lambda dérivés des buts réels).
- **BTTS / scores exacts / over-under détaillé** : complets uniquement en mode Poisson ; en mode API predictions ces champs sont dégradés (50/50, listes vides) car l’API ne les fournit pas.
- **IA** : qualité dépendante du contexte (xG, 1X2, forme, ligue, lieu) et optionnellement des news ; un seul appel limite la latence mais aussi la profondeur si le modèle est petit (gpt-4o-mini).

Pour améliorer la qualité ou la richesse sans trop ralentir : plus de données (cotes bookmakers, stats avancées), ou un modèle IA plus puissant / plus de tokens, au prix de plus d’appels ou d’un temps de réponse plus long.
