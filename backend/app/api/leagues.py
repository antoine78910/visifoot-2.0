# Leagues list with logos for LP scroller (API-Football media URL pattern).
from fastapi import APIRouter

router = APIRouter(prefix="/leagues", tags=["leagues"])

# Main leagues to show on landing page (subset of app.core.leagues.LEAGUES).
# Logo URL pattern: https://media.api-sports.io/football/leagues/{id}.png
MAIN_LEAGUE_IDS = [
    39,   # Premier League
    140,  # La Liga
    61,   # Ligue 1
    135,  # Serie A
    78,   # Bundesliga
    2,    # UEFA Champions League
    3,    # UEFA Europa League
    88,   # Eredivisie
    94,   # Primeira Liga
    307,  # Saudi Pro League
    40,   # Championship
    144,  # Jupiler Pro League
    203,  # Süper Lig
]


@router.get("")
def list_leagues_with_logos():
    """
    Returns main leagues with logo URLs for the landing page scroller.
    Logos are served from API-Football media CDN.
    """
    from app.core.leagues import LEAGUES

    league_by_id = {L["id"]: L["name"] for L in LEAGUES}
    base_url = "https://media.api-sports.io/football/leagues"
    return {
        "leagues": [
            {
                "id": lid,
                "name": league_by_id.get(lid, "League"),
                "logo": f"{base_url}/{lid}.png",
            }
            for lid in MAIN_LEAGUE_IDS
            if lid in league_by_id
        ]
    }
