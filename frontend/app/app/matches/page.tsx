"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { MatchInput } from "@/components/MatchInput";
import { useLanguage } from "@/contexts/LanguageContext";

function MatchesContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const home = searchParams.get("home") ?? "";
  const away = searchParams.get("away") ?? "";

  return (
    <div className="p-4 sm:p-8 w-full flex flex-col items-center">
      <div className="w-full max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-white text-center">{t("matches.title")}</h1>
        <p className="text-zinc-500 mt-1 text-center">{t("matches.subtitle")}</p>
        <p className="text-[#00ffe8] text-xs sm:text-sm mt-1 max-w-2xl mx-auto text-center whitespace-nowrap overflow-hidden text-ellipsis">
          {t("matches.aiSubtitle")}
        </p>
        <div className="mt-8">
          <MatchInput
            initialHome={home}
            initialAway={away}
            useApiPredictions={false}
          />
        </div>
      </div>
    </div>
  );
}

export default function MatchesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-zinc-400 text-center">{/* localized loading text */}{useLanguage().t("matchInput.loading")}</div>}>
      <MatchesContent />
    </Suspense>
  );
}
