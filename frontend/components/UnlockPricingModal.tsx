"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useGeoCurrency } from "@/hooks/useGeoCurrency";
import { formatPrice } from "@/lib/geoCurrency";
import { getWhopCheckoutUrl } from "@/lib/whopCheckout";
import { getUserFromStorage } from "@/lib/auth";

const ACCENT = "#00ffe8";

export function UnlockPricingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLanguage();
  const { config: currencyConfig, isLoading } = useGeoCurrency();
  const user = getUserFromStorage();
  const currentPlan = user?.plan ?? "free";

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
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-[#101217] border border-white/10 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pricing-modal-title"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 p-6 pb-4 bg-[#101217] border-b border-white/5">
          <div>
            <h2 id="pricing-modal-title" className="text-xl sm:text-2xl font-bold text-white">
              {t("unlockModal2.title")}
            </h2>
            <p className="text-sm text-zinc-400 mt-1">{t("unlockModal2.subtitle")}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition flex-shrink-0"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Starter */}
            <div className="rounded-xl bg-[#14141c] border border-zinc-600/60 p-5 flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚡</span>
                <h3 className="text-lg font-bold text-white">{t("pricing.starter")}</h3>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-white">
                  {isLoading ? "—" : formatPrice(currencyConfig, currencyConfig.starterAmount)}
                </span>
                <span className="text-zinc-500 text-sm">{currencyConfig.starterSuffix}</span>
              </div>
              <ul className="mt-4 space-y-2 flex-1 text-sm text-zinc-300">
                <li className="flex items-center gap-2">
                  <span className="text-[#00ffe8]">✓</span> {t("pricing.starterFeature1")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#00ffe8]">✓</span> {t("pricing.starterFeatureReduced")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#00ffe8]">✓</span> {t("pricing.starterFeatureKeyStats")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#00ffe8]">✓</span> {t("pricing.starterFeatureExactProb")}
                </li>
              </ul>
              <button
                type="button"
                onClick={() => {
                  window.location.href = getWhopCheckoutUrl("starter", currencyConfig.currency);
                }}
                disabled={currentPlan === "starter"}
                className="mt-4 w-full py-2.5 px-4 rounded-xl font-semibold text-white text-sm transition disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #2070F7 0%, #3AD9B0 100%)" }}
              >
                {currentPlan === "starter"
                  ? t("pricing.currentPlan")
                  : `${t("pricing.unlockStarter")} - ${formatPrice(currencyConfig, currencyConfig.starterAmount)}${t("pricing.perMonth")}`}
              </button>
            </div>

            {/* Pro - Popular */}
            <div className="relative rounded-xl bg-[#14141c] border-2 flex flex-col p-5" style={{ borderColor: `${ACCENT}70` }}>
              <div
                className="absolute -top-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                style={{ background: `${ACCENT}25`, border: `1px solid ${ACCENT}50` }}
              >
                <span>★</span><span>☆</span> {t("pricing.popular")}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl">👑</span>
                <h3 className="text-lg font-bold text-white">{t("pricing.pro")}</h3>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-white">
                  {isLoading ? "—" : formatPrice(currencyConfig, currencyConfig.proAmount)}
                </span>
                <span className="text-zinc-500 text-sm">{currencyConfig.proSuffix}</span>
              </div>
              <p className="text-zinc-400 text-xs mt-0.5">{t("pricing.proDesc")}</p>
              <ul className="mt-3 space-y-2 flex-1 text-sm text-zinc-300">
                <li className="flex items-center gap-2">
                  <span className="text-[#00ffe8]">✓</span> {t("pricing.featureUnlimited")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#00ffe8]">✓</span> {t("pricing.featureFullAnalysis")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#00ffe8]">✓</span> {t("pricing.featureScenarios")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#00ffe8]">✓</span> Advanced stats + news
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-[#00ffe8]">✓</span>{" "}
                  <span>💬 {t("pricing.featurePersonalAI")} (1 {t("pricing.perDay")})</span>
                </li>
              </ul>
              <button
                type="button"
                onClick={() => {
                  window.location.href = getWhopCheckoutUrl("pro", currencyConfig.currency);
                }}
                disabled={currentPlan === "pro"}
                className="mt-4 w-full py-2.5 px-4 rounded-xl font-semibold text-[#0d0d12] text-sm transition disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${ACCENT} 0%, #6FE7C0 100%)` }}
              >
                {currentPlan === "pro"
                  ? t("pricing.currentPlan")
                  : `${t("pricing.unlockPro")} - ${formatPrice(currencyConfig, currencyConfig.proAmount)}${t("pricing.perMonth")}`}
              </button>
            </div>

            {/* Lifetime */}
            <div className="relative rounded-xl bg-[#14141c] border-2 border-amber-500/60 p-5 flex flex-col">
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-400 text-xs font-medium">
                <span>∞</span> <span>∞</span> {t("pricing.forLife")}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl">∞</span>
                <h3 className="text-lg font-bold text-white">{t("pricing.lifetime")}</h3>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-bold text-amber-400">
                  {isLoading ? "—" : formatPrice(currencyConfig, currencyConfig.lifetimeAmount)}
                </span>
                <span className="text-zinc-500 text-sm">{currencyConfig.lifetimeSuffix}</span>
              </div>
              <p className="text-[#00ffe8] text-xs font-medium mt-1">{currencyConfig.saveText}</p>
              <ul className="mt-3 space-y-2 flex-1 text-sm text-zinc-300">
                <li className="flex items-center gap-2">
                  <span className="text-amber-400">✓</span> {t("pricing.lifetimeUnlimited")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400">✓</span> {t("pricing.featureFullAnalysis")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400">✓</span> {t("pricing.lifetimeNoPayments")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400">✓</span> {t("pricing.lifetimePriority")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-400">✓</span> 💬 {t("pricing.lifetimeUnlimitedAI")}
                </li>
              </ul>
              <button
                type="button"
                onClick={() => {
                  window.location.href = getWhopCheckoutUrl("lifetime", currencyConfig.currency);
                }}
                disabled={currentPlan === "lifetime"}
                className="mt-4 w-full py-2.5 px-4 rounded-xl font-semibold text-white text-sm bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition disabled:opacity-50"
              >
                {currentPlan === "lifetime"
                  ? t("pricing.currentPlan")
                  : `${t("pricing.unlockLifetime")} - ${formatPrice(currencyConfig, currencyConfig.lifetimeAmount)}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modal, document.body) : null;
}
