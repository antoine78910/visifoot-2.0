"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppBasePath } from "@/contexts/AppBasePathContext";

export default function CompetitionDetailPage() {
  const { t } = useLanguage();
  const basePath = useAppBasePath();

  return (
    <div className="p-8 w-full flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md mx-auto text-center">
        <div className="rounded-2xl bg-[#14141c] border border-white/10 p-8">
          <p className="text-zinc-500 text-sm font-medium uppercase tracking-wider mb-2">
            {t("competitions.title")}
          </p>
          <h1 className="text-2xl font-bold text-white mb-2">{t("competitions.comingSoon")}</h1>
          <p className="text-zinc-400 text-sm mb-6">{t("competitions.comingSoonDesc")}</p>
          <Link
            href={basePath ? `${basePath}/matches` : "/app/matches"}
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium bg-[#00ffe8]/20 text-[#00ffe8] border border-[#00ffe8]/50 hover:bg-[#00ffe8]/30 transition-colors"
          >
            ← {t("nav.matches")}
          </Link>
        </div>
      </div>
    </div>
  );
}
