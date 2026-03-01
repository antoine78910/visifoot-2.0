"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Lock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const ACCENT = "#00ffe8";

export function UnlockFullAnalysisModal({
  open,
  onClose,
  onUnlockClick,
  matchLabel,
  matchCountdown,
}: {
  open: boolean;
  onClose: () => void;
  onUnlockClick: () => void;
  matchLabel?: string;
  matchCountdown?: string;
}) {
  const { t } = useLanguage();

  useEffect(() => {
    if (!open) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEscape);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const modal = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="relative w-full max-w-md rounded-2xl bg-[#14141c] border border-white/10 shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="unlock-modal-title"
      >
        {/* Green success banner */}
        <div
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white"
          style={{ background: `linear-gradient(135deg, ${ACCENT}40 0%, #22c55e50 100%)`, borderBottom: `1px solid ${ACCENT}30` }}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span>{t("unlockModal1.banner")}</span>
          <span className="text-lg" aria-hidden>🔥</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 pt-5">
          <h2 id="unlock-modal-title" className="text-xl font-bold text-white pr-8">
            {t("unlockModal1.title")}
          </h2>
          <p className="flex items-center gap-1.5 text-sm text-zinc-400 mt-1">
            <span aria-hidden>👥</span>
            {t("unlockModal1.socialProof")}
          </p>

          {/* What you'll unlock */}
          <div className="mt-6 rounded-xl bg-[#1c1c28] border border-white/5 p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 mb-3">
              {t("unlockModal1.whatYouUnlock")}
            </p>
            <ul className="space-y-2.5">
              {[
                { key: "unlockModal1.featureProbableScore", icon: "🎯" },
                { key: "unlockModal1.featureDetailedProb", icon: "📊" },
                { key: "unlockModal1.featureScenarios", icon: "✨" },
                { key: "unlockModal1.featureFullAnalysis", icon: "📄" },
                { key: "unlockModal1.featureBookmaker", icon: "💡" },
              ].map(({ key, icon }) => (
                <li key={key} className="flex items-center gap-3 text-sm text-zinc-300">
                  <Lock className="w-4 h-4 flex-shrink-0 text-zinc-500" aria-hidden />
                  <span>{t(key)}</span>
                  <span className="ml-auto text-base opacity-80" aria-hidden>{icon}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Match countdown block */}
          {(matchLabel || matchCountdown) && (
            <div className="mt-4 rounded-xl bg-amber-900/40 border border-amber-600/40 p-4 flex items-center gap-3">
              <span className="text-2xl" aria-hidden>⏰</span>
              <div>
                <p className="text-white font-medium text-sm">
                  {matchLabel ?? "Match"} {t("unlockModal1.matchStartsIn")}
                </p>
                <p className="text-amber-200 font-semibold text-sm mt-0.5">
                  {matchCountdown ?? "—"}
                </p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onUnlockClick}
            className="mt-6 w-full py-3.5 px-4 rounded-xl font-semibold text-[#0d0d12] transition flex items-center justify-center gap-2"
            style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, #22c55e 100%)` }}
          >
            <span aria-hidden>🏆</span>
            {t("unlockModal1.cta")}
          </button>
          <p className="text-center text-xs text-zinc-500 mt-3">
            {t("unlockModal1.instantAccess")}
          </p>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modal, document.body) : null;
}
