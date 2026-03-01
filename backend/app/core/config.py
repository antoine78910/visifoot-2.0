# backend/app/core/config.py
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    supabase_url: str = ""
    supabase_key: str = ""
    openai_api_key: str = ""
    free_analyses_per_day: int = 1
    max_score_goals: int = 8  # grille Poisson 0..8
    # API-Football (https://www.api-football.com/documentation-v3)
    api_football_key: str = ""
    api_football_base_url: str = "https://v3.football.api-sports.io"
    admin_api_key: str = ""  # Si défini, requiert X-Admin-Key pour /admin/*
    # Polling matchs terminés (FT) : intervalle en secondes (10 = test, 3600 = 1h)
    polling_interval_seconds: int = 10
    # NewsAPI.org (optionnel) — actualités pour le quick summary style Visifoot
    news_api_key: str = ""
    # DataFast — attribution des revenus (Payment API)
    datafast_api_key: str = ""
    # Whop — secret du webhook pour vérifier la signature (ws_...)
    whop_webhook_secret: str = ""

    class Config:
        # .env.local override .env (secrets locaux sans les commiter)
        env_file = [".env", ".env.local"]
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    return Settings()
