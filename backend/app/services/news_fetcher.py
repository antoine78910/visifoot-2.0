"""
Récupération des dernières actualités football pour enrichir le quick summary (style Visifoot).
Utilise NewsAPI.org si NEWS_API_KEY est configuré (optionnel).
"""
from datetime import datetime, timezone, timedelta
from typing import Optional
import httpx

from app.core.config import get_settings


def _use_news_api() -> bool:
    return bool((get_settings().news_api_key or "").strip())


def fetch_football_news(
    home_team: str,
    away_team: str,
    league: Optional[str] = None,
    max_articles_per_team: int = 3,
    max_age_days: int = 7,
) -> str:
    """
    Récupère les derniers titres/snippets d'actualité pour les deux équipes.
    Retourne une chaîne à inclure dans le contexte du LLM, ou une chaîne vide si indisponible.
    """
    if not _use_news_api():
        return ""
    key = get_settings().news_api_key.strip()
    base = "https://newsapi.org/v2/everything"
    since = (datetime.now(timezone.utc) - timedelta(days=max_age_days)).strftime("%Y-%m-%d")
    snippets: list[str] = []
    for name in (home_team, away_team):
        if not (name or "").strip():
            continue
        # Éviter termes trop courts (ex. "OM") en les laissant quand même pour Marseille
        q = f'"{name}" football'
        if league and league.strip():
            q += f' "{league.strip()}"'
        lang = "fr" if league and "Ligue 1" in (league or "") else "en"
        try:
            with httpx.Client(timeout=8.0) as client:
                r = client.get(
                    base,
                    params={
                        "q": q[:500],
                        "apiKey": key,
                        "language": lang,
                        "sortBy": "publishedAt",
                        "pageSize": max_articles_per_team,
                        "from": since,
                    },
                )
            if r.status_code != 200:
                continue
            data = r.json()
            articles = data.get("articles") or []
            for a in articles[:max_articles_per_team]:
                title = (a.get("title") or "").strip()
                desc = (a.get("description") or "").strip()
                if title or desc:
                    snippets.append(f"- {title}. {desc}" if desc else f"- {title}")
        except Exception:
            continue
    if not snippets:
        return ""
    return "Latest football news (use if relevant for the summary):\n" + "\n".join(snippets[:8])
