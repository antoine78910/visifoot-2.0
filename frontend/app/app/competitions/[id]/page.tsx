"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCompetitionById } from "@/lib/competitions";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type FixtureItem = {
  date: string;
  time: string;
  home_team: string;
  away_team: string;
  home_logo: string | null;
  away_logo: string | null;
  home_goals: number | null;
  away_goals: number | null;
};

export default function CompetitionDetailPage() {
  const { t } = useLanguage();
  const params = useParams();
  const id = params?.id != null ? Number(params.id) : null;
  const comp = id != null ? getCompetitionById(id) : null;
  const [upcoming, setUpcoming] = useState<FixtureItem[]>([]);
  const [loading, setLoading] = useState(!!id);

  useEffect(() => {
    if (id == null || !comp) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`${API_URL}/competitions/${id}/fixtures?status=NS&limit=30`)
      .then((res) => res.json())
      .then((data) => {
        setUpcoming(Array.isArray(data.fixtures) ? data.fixtures : []);
      })
      .catch(() => setUpcoming([]))
      .finally(() => setLoading(false));
  }, [id, comp]);

  if (id == null || comp == null) {
    return (
      <div className="p-8 w-full flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-md mx-auto text-center">
          <p className="text-zinc-500 mb-4">{t("competitions.title")}</p>
          <Link
            href="/matches"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium bg-[#00ffe8]/20 text-[#00ffe8] border border-[#00ffe8]/50"
          >
            ← {t("nav.matches")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 w-full flex flex-col items-center min-h-[60vh]">
      <div className="w-full max-w-2xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-zinc-500 text-sm font-medium uppercase tracking-wider">
              {t("competitions.title")}
            </p>
            <h1 className="text-2xl font-bold text-white">{comp.name}</h1>
            <p className="text-zinc-400 text-sm">{comp.region} · {comp.season}</p>
          </div>
          <Link
            href="/matches"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium bg-[#00ffe8]/20 text-[#00ffe8] border border-[#00ffe8]/50 hover:bg-[#00ffe8]/30 transition-colors shrink-0"
          >
            ← {t("nav.matches")}
          </Link>
        </div>

        <section className="rounded-2xl bg-[#14141c] border border-white/10 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-white mb-3">
            {t("matchInput.upcomingMatches")}
          </h2>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-8 text-zinc-400 text-sm">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24" aria-hidden>
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Loading…</span>
            </div>
          ) : upcoming.length === 0 ? (
            <p className="text-zinc-500 text-sm py-4">{t("matchInput.noUpcoming")}</p>
          ) : (
            <ul className="space-y-2">
              {upcoming.map((f, i) => (
                <li key={i}>
                  <Link
                    href={`/analyse?home=${encodeURIComponent(f.home_team)}&away=${encodeURIComponent(f.away_team)}`}
                    className="rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-left transition hover:bg-white/10 hover:border-[#00ffe8]/30 block"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-24 flex-shrink-0 text-zinc-400 text-sm tabular-nums">
                        {f.date} {f.time ? `· ${f.time}` : ""}
                      </div>
                      <div className="flex items-center justify-center gap-3 flex-1 min-w-0">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {f.home_logo ? (
                            <img src={f.home_logo} alt="" className="w-6 h-6 object-contain flex-shrink-0" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-white/10 flex-shrink-0" />
                          )}
                          <span className="text-white text-sm truncate">{f.home_team}</span>
                        </div>
                        <span className="text-zinc-500 text-xs flex-shrink-0">VS</span>
                        <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                          <span className="text-white text-sm truncate text-right">{f.away_team}</span>
                          {f.away_logo ? (
                            <img src={f.away_logo} alt="" className="w-6 h-6 object-contain flex-shrink-0" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-white/10 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
