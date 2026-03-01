"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Lock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const ACCENT = "#00ffe8";

const BULLET_ITEMS = [
  { key: "unlockModal1.featureProbableScore" as const, icon: "🎯" },
  { key: "unlockModal1.featureDetailedProb" as const, icon: "📊" },
  { key: "unlockModal1.featureScenarios" as const, icon: "✨" },
  { key: "unlockModal1.featureFullAnalysis" as const, icon: "📄" },
  { key: "unlockModal1.featureBookmaker" as const, icon: "💡" },
];

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
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (!open) {
      setVisibleCount(0);
      return;
    }
    setVisibleCount(0);
    const delays = BULLET_ITEMS.map((_, i) =>
      setTimeout(() => setVisibleCount((c) => Math.max(c, i + 1)), 120 + i * 100)
    );
    return () => delays.forEach(clearTimeout);
  }, [open]);

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
        className="relative w-full max-w-md rounded-2xl bg-[#14141c] border-2 shadow-2xl overflow-hidden"
        style={{ borderColor: `${ACCENT}40`, boxShadow: `0 0 40px -5px ${ACCENT}20` }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="unlock-modal-title"
      >
        {/* Banner — branding accent */}
        <div
          className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white"
          style={{ background: `linear-gradient(135deg, ${ACCENT}30 0%, ${ACCENT}15 100%)`, borderBottom: `1px solid ${ACCENT}40` }}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: ACCENT }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <span>{t("unlockModal1.banner")}</span>
          <span className="text-lg" aria-hidden>🔥</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-lg transition hover:bg-white/10"
          style={{ color: ACCENT }}
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
          <p className="flex items-center gap-1.5 text-sm mt-1" style={{ color: `${ACCENT}cc` }}>
            <span aria-hidden>👥</span>
            {t("unlockModal1.socialProof")}
          </p>

          {/* What you'll unlock — bullets appear one by one */}
          <div className="mt-6 rounded-xl p-4 border" style={{ backgroundColor: "#1c1c28", borderColor: `${ACCENT}25` }}>
            <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: ACCENT }}>
              {t("unlockModal1.whatYouUnlock")}
            </p>
            <ul className="space-y-2.5">
              {BULLET_ITEMS.map(({ key, icon }, index) => (
                <li
                  key={key}
                  className="flex items-center gap-3 text-sm text-zinc-300 transition-all duration-300 ease-out"
                  style={{
                    opacity: index < visibleCount ? 1 : 0,
                    transform: index < visibleCount ? "translateY(0)" : "translateY(8px)",
                  }}
                >
                  <Lock className="w-4 h-4 flex-shrink-0" style={{ color: index < visibleCount ? ACCENT : "#71717a" }} aria-hidden />
                  <span>{t(key)}</span>
                  <span className="ml-auto text-base opacity-90" aria-hidden>{icon}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Match countdown block — accent branding */}
          {(matchLabel || matchCountdown) && (
            <div className="mt-4 rounded-xl p-4 flex items-center gap-3 border" style={{ backgroundColor: `${ACCENT}12`, borderColor: `${ACCENT}35` }}>
              <span className="text-2xl" aria-hidden>⏰</span>
              <div>
                <p className="text-white font-medium text-sm">
                  {matchLabel ?? "Match"} {t("unlockModal1.matchStartsIn")}
                </p>
                <p className="font-semibold text-sm mt-0.5" style={{ color: ACCENT }}>
                  {matchCountdown ?? "—"}
                </p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onUnlockClick}
            className="mt-6 w-full py-3.5 px-4 rounded-xl font-semibold text-[#0d0d12] transition flex items-center justify-center gap-2 hover:opacity-95"
            style={{
              background: `linear-gradient(135deg, ${ACCENT} 0%, #00ddcc 100%)`,
              boxShadow: `0 0 20px -2px ${ACCENT}50`,
            }}
          >
            <span aria-hidden>🏆</span>
            {t("unlockModal1.cta")}
          </button>
          <p className="text-center text-xs mt-3" style={{ color: `${ACCENT}99` }}>
            {t("unlockModal1.instantAccess")}
          </p>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modal, document.body) : null;
}
