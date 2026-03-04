"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Lock, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const ACCENT = "#00ffe8";

const BULLET_ITEMS: { key: "unlockModal1.featureProbableScore" | "unlockModal1.featureDetailedProb" | "unlockModal1.featureScenarios" | "unlockModal1.featureFullAnalysis" | "unlockModal1.featureBookmaker"; emoji: string }[] = [
  { key: "unlockModal1.featureProbableScore", emoji: "🎯" },
  { key: "unlockModal1.featureDetailedProb", emoji: "📊" },
  { key: "unlockModal1.featureScenarios", emoji: "🔮" },
  { key: "unlockModal1.featureFullAnalysis", emoji: "📝" },
  { key: "unlockModal1.featureBookmaker", emoji: "💡" },
];

const STAGGER_DELAY_MS = 200;
const ANIMATION_DURATION_MS = 450;

/** Countdown: (heure de départ du match en UTC) - (now UTC) → "3j 8h" ou "2h" ou "45min" */
function countdownTo(matchStartUtc: Date): string {
  const nowUtc = new Date();
  const ms = matchStartUtc.getTime() - nowUtc.getTime();
  if (ms <= 0) return "—";
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}j`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 && days === 0) parts.push(`${minutes}min`);
  return parts.join(" ") || "—";
}

const MONTHS_EN = "january|february|march|april|may|june|july|august|september|october|november|december";
const MONTH_RE = new RegExp(`\\d{1,2}\\s+(${MONTHS_EN})\\s+\\d{4}\\s+at\\s+\\d{1,2}:\\d{2}`, "i");

/** Parse une chaîne date/heure en Date UTC (heure de départ du match - now UTC = countdown). */
function parseMatchDateUtc(raw: string): Date | null {
  if (!raw || typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s) return null;
  let toParse: string;
  if (s.includes("T")) {
    toParse = !s.endsWith("Z") && !/[+-]\d{2}:?\d{2}$/.test(s) ? s + "Z" : s;
  } else if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(s)) {
    toParse = s.replace(/\s+/, "T") + "Z";
  } else if (MONTH_RE.test(s)) {
    const m = s.match(/^(\d{1,2})\s+(\w+)\s+(\d{4})\s+at\s+(\d{1,2}):(\d{2})$/i);
    if (m) {
      const [, day, month, year, h, min] = m;
      toParse = `${month} ${day}, ${year} ${h.padStart(2, "0")}:${min.padStart(2, "0")}:00 UTC`;
    } else {
      return null;
    }
  } else {
    return null;
  }
  const d = new Date(toParse);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function UnlockFullAnalysisModal({
  open,
  onClose,
  onUnlockClick,
  matchLabel,
  matchCountdown,
  matchDate,
}: {
  open: boolean;
  onClose: () => void;
  onUnlockClick: () => void;
  matchLabel?: string;
  /** Ex: "3j 16h" (optionnel) */
  matchCountdown?: string;
  /** Date/heure du match (ex: "15 Mar 2025, 20:00" ou chaîne brute) */
  matchDate?: string | null;
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
      setTimeout(() => setVisibleCount((c) => Math.max(c, i + 1)), (i + 1) * STAGGER_DELAY_MS)
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
    <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className="relative w-full max-w-sm rounded-2xl bg-[#1A1B22] border border-white/10 shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="unlock-modal-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2 right-2 p-1.5 rounded-lg text-white/90 hover:text-white hover:bg-white/10 transition z-10"
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-4 pt-4">
          {/* Bulle type toast */}
          <div className="flex justify-center">
            <div
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium"
              style={{
                background: "rgba(13, 77, 77, 0.85)",
                border: "1px solid rgba(0, 255, 232, 0.35)",
                color: "#7ee7d9",
                boxShadow: "0 0 20px -4px rgba(0, 255, 232, 0.2)",
              }}
            >
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "#7ee7d9" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <span>{t("unlockModal1.banner")}</span>
            <span className="text-sm" aria-hidden>🔥</span>
            </div>
          </div>

          <h2 id="unlock-modal-title" className="text-lg font-bold text-white text-center mt-3 pr-7">
            {t("unlockModal1.title")}
          </h2>
          <p className="flex items-center justify-center gap-1 text-xs mt-1 text-zinc-400">
            <span aria-hidden>👥</span>
            {t("unlockModal1.socialProof")}
          </p>

          {/* What you'll unlock — bullets compacts */}
          <div className="mt-3 rounded-lg p-3 border border-white/5 bg-[#2C2D35]/80">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">
              {t("unlockModal1.whatYouUnlock")}
            </p>
            <ul className="space-y-0">
              {BULLET_ITEMS.map(({ key, emoji }, index) => (
                <li
                  key={key}
                  className="flex items-center gap-2 py-1.5 text-xs text-white transition-all ease-out border-b border-white/5 last:border-0 last:pb-0"
                  style={{
                    transitionDuration: `${ANIMATION_DURATION_MS}ms`,
                    opacity: index < visibleCount ? 1 : 0,
                    transform: index < visibleCount ? "translateY(0)" : "translateY(8px)",
                  }}
                >
                  <Lock
                    className="w-3.5 h-3.5 flex-shrink-0"
                    strokeWidth={2}
                    style={{ color: ACCENT }}
                    aria-hidden
                  />
                  <span className="text-base flex-shrink-0" aria-hidden>{emoji}</span>
                  <span className="flex-1 min-w-0">{t(key)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Match start block — "Paris SG vs Monaco starts in" puis "2h" / "3j 8h" (temps restant uniquement) */}
          {(matchLabel || matchDate || matchCountdown) && (
            <div className="mt-3 rounded-lg px-3 py-2.5 flex items-center gap-2 bg-[#381F1A] border border-amber-500/30 shadow-[0_0_20px_-5px_rgba(245,158,11,0.2)]">
              <Clock className="w-4 h-4 flex-shrink-0 text-amber-400" strokeWidth={2} aria-hidden />
              <div className="min-w-0 flex-1">
                {matchLabel && (
                  <p className="text-white text-xs font-medium truncate">
                    {matchLabel} {t("unlockModal1.matchStartsIn")}
                  </p>
                )}
                {(matchCountdown || matchDate) && (
                  <p className="text-amber-200 font-semibold text-xs mt-0.5">
                    {matchCountdown ?? (matchDate ? (() => {
                      const d = parseMatchDateUtc(matchDate);
                      return d ? countdownTo(d) : "—";
                    })() : null)}
                  </p>
                )}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onUnlockClick}
            className="mt-4 w-full py-2.5 px-3 rounded-xl font-semibold text-sm text-[#0d0d12] transition-all duration-300 flex items-center justify-center gap-1.5 bg-[#00ffe8] hover:bg-[#00ffe8]/95 hover:shadow-[0_0_18px_4px_rgba(0,255,232,0.45)]"
          >
            <span aria-hidden>🏆</span>
            {t("unlockModal1.cta")}
          </button>
          <p className="text-center text-[10px] mt-2 text-zinc-500">
            {t("unlockModal1.instantAccess")}
          </p>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modal, document.body) : null;
}
