# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import predict, teams, competitions, leagues, webhooks, internal, me as me_router

app = FastAPI(
    title="Visifoot 2.0 API",
    description="API de prédiction de matchs de football (1X2, Over/Under, BTTS, score exact)",
    version="0.1.0",
)
app.add_middleware(
    CORSMiddleware,
    # Local dev + Vercel preview/prod + production domain.
    # Note: CORSMiddleware does not support wildcard entries in allow_origins (like https://*.vercel.app).
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://app.localhost:3000",
        "http://app.127.0.0.1:3000",
        "https://deepfoot.io",
        "https://www.deepfoot.io",
        "https://app.deepfoot.io",
    ],
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(predict.router)
app.include_router(teams.router)
app.include_router(leagues.router)
app.include_router(webhooks.router)
app.include_router(competitions.router)
app.include_router(internal.router)
app.include_router(me_router.router)


@app.get("/")
def root():
    return {"ok": True}


@app.get("/health")
def health():
    return {"status": "ok"}
