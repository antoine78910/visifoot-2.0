# backend/app/core/leagues.py
"""
Ligues supportées — IDs API-Football (https://www.api-football.com/documentation-v3).
Utilisées pour l'autocomplete et la résolution des noms d'équipes.
"""
from typing import TypedDict


class League(TypedDict):
    id: int
    name: str


# ID = league id API-Football (numérique). Plus il y a de ligues, plus la recherche/suggestion couvre d'équipes.
LEAGUES: list[League] = [
    # Coupes
    {"id": 1, "name": "World Cup"},
    {"id": 2, "name": "UEFA Champions League"},
    {"id": 3, "name": "UEFA Europa League"},
    {"id": 4, "name": "European Championship"},
    # France
    {"id": 61, "name": "Ligue 1"},
    {"id": 62, "name": "Ligue 2"},
    {"id": 63, "name": "National 1"},
    {"id": 67, "name": "National 2 - Group A"},
    {"id": 68, "name": "National 2 - Group B"},
    {"id": 69, "name": "National 2 - Group C"},
    # Espagne
    {"id": 140, "name": "La Liga"},
    {"id": 141, "name": "Segunda División"},
    {"id": 435, "name": "Primera División RFEF - Group 1"},
    {"id": 436, "name": "Primera División RFEF - Group 2"},
    {"id": 875, "name": "Segunda División RFEF - Group 1"},
    {"id": 876, "name": "Segunda División RFEF - Group 2"},
    {"id": 877, "name": "Segunda División RFEF - Group 3"},
    {"id": 878, "name": "Segunda División RFEF - Group 4"},
    {"id": 879, "name": "Segunda División RFEF - Group 5"},
    # Allemagne
    {"id": 78, "name": "Bundesliga"},
    {"id": 79, "name": "2. Bundesliga"},
    {"id": 80, "name": "3. Liga"},
    # Italie
    {"id": 135, "name": "Serie A"},
    {"id": 136, "name": "Serie B"},
    {"id": 138, "name": "Serie C - Girone A"},
    {"id": 942, "name": "Serie C - Girone B"},
    {"id": 943, "name": "Serie C - Girone C"},
    # Angleterre
    {"id": 39, "name": "Premier League"},
    {"id": 40, "name": "Championship"},
    {"id": 41, "name": "League One"},
    {"id": 42, "name": "League Two"},
    {"id": 43, "name": "National League"},
    {"id": 50, "name": "National League - North"},
    {"id": 51, "name": "National League - South"},
    # Belgique
    {"id": 144, "name": "Jupiler Pro League"},
    {"id": 145, "name": "Challenger Pro League"},
    # Pays-Bas
    {"id": 88, "name": "Eredivisie"},
    {"id": 89, "name": "Eerste Divisie"},
    # Portugal
    {"id": 94, "name": "Primeira Liga"},
    {"id": 96, "name": "Liga Portugal 2"},
    # Turquie
    {"id": 203, "name": "Süper Lig"},
    {"id": 204, "name": "1. Lig"},
    # Suisse / Arabie Saoudite
    {"id": 207, "name": "Super League"},
    {"id": 307, "name": "Pro League"},  # Saudi Arabia
    # Autres
    {"id": 71, "name": "Serie A Brasil"},
    {"id": 266, "name": "Botola Pro"},
]
LEAGUE_IDS: list[int] = [L["id"] for L in LEAGUES]

# Pays autorisés pour les suggestions d'équipes : Europe + pays des 27 ligues (ex. Saudi Arabia).
# Exclut Brésil, Argentine, USA, Maroc, etc.
ALLOWED_COUNTRIES_FOR_SUGGESTIONS: frozenset[str] = frozenset({
    "France", "England", "Spain", "Germany", "Italy", "Portugal", "Netherlands", "Belgium",
    "Turkey", "Scotland", "Switzerland", "Austria", "Greece", "Denmark", "Sweden", "Norway",
    "Poland", "Czech Republic", "Croatia", "Serbia", "Ukraine", "Russia",
    "Wales", "Northern Ireland", "Ireland", "Romania", "Bulgaria", "Hungary", "Israel",
    "Saudi Arabia",  # 27 ligues (Pro League)
})

# Saison courante au sens API-Football : année de *début* de la saison (ex: 2025 = 2025-26).
# En Europe la saison commence en août ; avant août on est encore dans la saison N-1.
def current_season() -> int:
    from datetime import datetime
    now = datetime.now()
    if now.month >= 8:
        return now.year
    return now.year - 1


