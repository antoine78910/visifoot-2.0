"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAppBasePath } from "@/contexts/AppBasePathContext";
import { getUserFromStorage } from "@/lib/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { UnsubscribeOfferModal } from "@/components/UnsubscribeOfferModal";
import { getWhopCheckoutUrl } from "@/lib/whopCheckout";
import { useGeoCurrency } from "@/hooks/useGeoCurrency";

function PersonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 0 0-16 0" />
    </svg>
  );
}

function WalletIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
      <path d="M16 14h.01" />
    </svg>
  );
}

function SupportQuestionIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

const PLAN_KEYS: Record<string, string> = {
  free: "nav.free",
  starter: "nav.starter",
  pro: "nav.pro",
  lifetime: "nav.lifetime",
};

export default function AccountPage() {
  const { t } = useLanguage();
  const basePath = useAppBasePath();
  const { config: currencyConfig } = useGeoCurrency();
  const [user, setUser] = useState<ReturnType<typeof getUserFromStorage>>(null);
  const [unsubscribeModalOpen, setUnsubscribeModalOpen] = useState(false);
  const [subscribedSince, setSubscribedSince] = useState<string>("26 February 2026");

  useEffect(() => {
    setUser(getUserFromStorage());
  }, []);

  const handleSignOut = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    if (typeof window !== "undefined") {
      document.cookie = "visifoot_session=; path=/; max-age=0";
      localStorage.removeItem("visifoot_logged_in");
      localStorage.removeItem("visifoot_user");
      window.location.href = "/";
    }
  };

  const handleEnjoyOffer = () => {
    setUnsubscribeModalOpen(false);
    window.location.href = getWhopCheckoutUrl("pro", currencyConfig.currency);
  };

  const handleConfirmCancel = () => {
    setUnsubscribeModalOpen(false);
    // Here you could call an API to cancel subscription, then redirect
  };

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-white">{t("account.title")}</h1>
      <p className="text-zinc-500 mt-1">{t("account.subtitle")}</p>

      {/* Personal information */}
      <div className="mt-8 rounded-2xl bg-dark-card border border-dark-border p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
          <PersonIcon className="text-zinc-400 flex-shrink-0" />
          {t("account.personalInfo")}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-500 mb-1">{t("account.emailAddress")}</label>
            <div className="flex gap-2">
              <input
                type="email"
                readOnly
                value={user?.email ?? ""}
                className="flex-1 rounded-xl bg-dark-input border border-dark-border px-4 py-3 text-white read-only:opacity-90"
              />
              <button
                type="button"
                className="px-4 py-3 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium transition"
              >
                {t("account.edit")}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-zinc-500 mb-1">{t("account.subscribedSince")}</label>
            <div className="rounded-xl bg-dark-input border border-dark-border px-4 py-3 text-white">
              {subscribedSince}
            </div>
          </div>
        </div>
      </div>

      {/* Subscription */}
      <div className="mt-6 rounded-2xl bg-dark-card border border-dark-border p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
          <WalletIcon className="text-zinc-400 flex-shrink-0" />
          {t("account.subscription")}
        </h2>
        <div className="mb-4">
          <p className="text-sm text-zinc-500">{t("account.currentPlan")}</p>
          <p className="text-lg font-bold text-white mt-0.5">
            {user?.plan ? t(PLAN_KEYS[user.plan] ?? "nav.starter") : t("nav.starter")}
          </p>
        </div>
        <div className="mb-6">
          <p className="text-sm text-zinc-500">{t("account.status")}</p>
          <p className="flex items-center gap-2 mt-0.5 text-emerald-400">
            <span>✓</span> {t("account.active")}
          </p>
        </div>

        {/* Go Lifetime card */}
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-5 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 text-white text-2xl">
              ∞
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-white">{t("account.goLifetime")}</h3>
              <p className="text-zinc-400 text-sm mt-0.5">{t("account.lifetimeAccess")}</p>
              <ul className="mt-3 space-y-1.5 text-sm text-zinc-300">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> {t("account.noMonthlyPayments")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> {t("account.unlimitedAnalyses")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> {t("account.allPremiumFeatures")}
                </li>
              </ul>
            </div>
            <p className="text-lg font-bold text-amber-400 flex-shrink-0">⚡ {t("account.priceOnce")}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              window.location.href = getWhopCheckoutUrl("lifetime", currencyConfig.currency);
            }}
            className="mt-4 w-full py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 transition"
          >
            {t("account.upgradeToLifetime")}
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`${basePath}/pricing`}
            className="px-4 py-2.5 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium transition"
          >
            {t("account.seeAllPlans")}
          </Link>
          <button
            type="button"
            onClick={() => setUnsubscribeModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-red-400 hover:text-red-300 text-sm font-medium transition"
          >
            {t("account.unsubscribe")}
          </button>
        </div>
      </div>

      {/* Support */}
      <div className="mt-6 rounded-2xl bg-dark-card border border-dark-border p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white mb-2">
          <SupportQuestionIcon className="text-[#00ffe8] flex-shrink-0" />
          {t("account.support")}
        </h2>
        <p className="text-zinc-500 text-sm mb-4">{t("account.supportDesc")}</p>
        <a
          href="mailto:support@deepfoot.io"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#00ffe8]/60 text-[#00ffe8] hover:bg-[#00ffe8]/10 text-sm font-medium transition"
        >
          <MailIcon />
          {t("account.contactSupport")}
        </a>
      </div>

      {/* Security */}
      <div className="mt-6 rounded-2xl bg-dark-card border border-dark-border p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white mb-2">
          <ShieldIcon className="text-violet-400 flex-shrink-0" />
          {t("account.security")}
        </h2>
        <p className="text-zinc-500 text-sm mb-4">{t("account.connectedVia")}</p>
        <button
          type="button"
          onClick={handleSignOut}
          className="px-4 py-2.5 rounded-xl bg-red-600/90 hover:bg-red-600 text-white text-sm font-medium transition"
        >
          {t("account.signOut")}
        </button>
      </div>

      <UnsubscribeOfferModal
        open={unsubscribeModalOpen}
        onClose={() => setUnsubscribeModalOpen(false)}
        onEnjoyOffer={handleEnjoyOffer}
        onConfirmCancel={handleConfirmCancel}
      />
    </div>
  );
}
