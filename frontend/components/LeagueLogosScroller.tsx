"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type League = { id: number; name: string; logo: string };

// Fallback when API is unavailable — same IDs as backend MAIN_LEAGUE_IDS, logo URL pattern API-Football
const FALLBACK_LEAGUES: League[] = [
  { id: 39, name: "Premier League", logo: "https://media.api-sports.io/football/leagues/39.png" },
  { id: 140, name: "La Liga", logo: "https://media.api-sports.io/football/leagues/140.png" },
  { id: 61, name: "Ligue 1", logo: "https://media.api-sports.io/football/leagues/61.png" },
  { id: 135, name: "Serie A", logo: "https://media.api-sports.io/football/leagues/135.png" },
  { id: 78, name: "Bundesliga", logo: "https://media.api-sports.io/football/leagues/78.png" },
  { id: 2, name: "Champions League", logo: "https://media.api-sports.io/football/leagues/2.png" },
  { id: 3, name: "Europa League", logo: "https://media.api-sports.io/football/leagues/3.png" },
  { id: 88, name: "Eredivisie", logo: "https://media.api-sports.io/football/leagues/88.png" },
  { id: 94, name: "Primeira Liga", logo: "https://media.api-sports.io/football/leagues/94.png" },
  { id: 307, name: "Saudi Pro League", logo: "https://media.api-sports.io/football/leagues/307.png" },
  { id: 40, name: "Championship", logo: "https://media.api-sports.io/football/leagues/40.png" },
  { id: 144, name: "Jupiler Pro League", logo: "https://media.api-sports.io/football/leagues/144.png" },
  { id: 203, name: "Süper Lig", logo: "https://media.api-sports.io/football/leagues/203.png" },
];

function LeagueLogo({ league }: { league: League }) {
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 w-14 h-14 sm:w-16 sm:h-16 overflow-hidden transition hover:border-[#00ffe8]/30 hover:bg-white/10"
      title={league.name}
    >
      <img
        src={league.logo}
        alt=""
        className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
        loading="lazy"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    </div>
  );
}

export function LeagueLogosScroller() {
  const { t } = useLanguage();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`${API_URL}/leagues`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data?.leagues) && data.leagues.length > 0) {
          setLeagues(data.leagues);
        } else if (!cancelled) {
          setLeagues(FALLBACK_LEAGUES);
        }
      })
      .catch(() => {
        if (!cancelled) setLeagues(FALLBACK_LEAGUES);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) return null;

  const displayLeagues = leagues.length > 0 ? leagues : FALLBACK_LEAGUES;
  if (displayLeagues.length === 0) return null;

  const duplicated = [...displayLeagues, ...displayLeagues];

  const label = t("landing.leaguesAnalyzed").replace("{count}", String(displayLeagues.length));

  return (
    <section className="w-full mt-12 sm:mt-16" aria-label={label}>
      <p className="text-center text-xs font-medium uppercase tracking-wider text-zinc-500 mb-4">
        {label}
      </p>
      <div className="relative overflow-hidden">
        <div className="flex w-max animate-league-scroll gap-3 sm:gap-4 px-4 py-2">
          {duplicated.map((league, i) => (
            <LeagueLogo key={`${league.id}-${i}`} league={league} />
          ))}
        </div>
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#0a0a0e] to-transparent" aria-hidden />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#0a0a0e] to-transparent" aria-hidden />
      </div>
    </section>
  );
}
