"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { BGPattern } from "@/components/BGPattern";
import { getUserFromStorage, clearAuthCookie, clearUserFromStorage, type UserInfo, type PlanId } from "@/lib/auth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Lang } from "@/lib/translations";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const navKeys: { path: string; key: string; icon: typeof BarChartIcon; soon?: boolean }[] = [
  { path: "/matches", key: "nav.matches", icon: BarChartIcon },
  { path: "/competitions", key: "nav.competitions", icon: TrophyIcon, soon: true },
  { path: "/history", key: "nav.history", icon: HistoryIcon },
];

function BarChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </svg>
  );
}

function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

function HistoryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function CreditCardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M20 21a8 8 0 0 0-16 0" />
    </svg>
  );
}

function SupportIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function LogOutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

const LANG_OPTIONS: { code: Lang; labelKey: string; flag: string }[] = [
  { code: "fr", labelKey: "lang.fr", flag: "FR" },
  { code: "en", labelKey: "lang.en", flag: "GB" },
  { code: "es", labelKey: "lang.es", flag: "ES" },
];

const PLAN_KEYS: Record<PlanId, string> = {
  free: "nav.free",
  starter: "nav.starter",
  pro: "nav.pro",
  lifetime: "nav.lifetime",
};

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export function AppLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { t, lang, setLang } = useLanguage();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [analysesUsed, setAnalysesUsed] = useState(0);
  const [analysesLimit, setAnalysesLimit] = useState<number | null>(null);
  const [langOpen, setLangOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setUser(getUserFromStorage());
  }, []);

  useEffect(() => {
    const uid = user?.id;
    if (!API_URL || API_URL === "undefined") return;
    const ac = new AbortController();
    const headers: Record<string, string> = {};
    if (uid) headers["X-User-Id"] = uid;
    (async () => {
      try {
        const r = await fetch(`${API_URL}/me`, { headers, signal: ac.signal });
        const data = r.ok ? (await r.json()) : null;
        if (data && typeof data === "object") {
          setAnalysesUsed(Number(data.analyses_used_today) || 0);
          setAnalysesLimit(data.analyses_limit ?? 1);
        }
      } catch {
        // Ignore: network error, abort, or invalid JSON (e.g. Failed to fetch when changing language / backend unreachable)
      }
    })();
    return () => ac.abort();
  }, [user?.id]);

  const handleSignOut = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    clearAuthCookie();
    clearUserFromStorage();
    window.location.href = "/";
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-app-gradient text-zinc-200 flex flex-col md:flex-row relative">
      <BGPattern variant="grid" mask="fade-edges" size={24} fill="rgba(0,255,232,0.07)" className="fixed inset-0" />
      {/* Mobile header: logo + hamburger */}
      <header className="md:hidden flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-dark-border bg-dark-card/80 backdrop-blur-md sticky top-0 z-30">
        <Link href="/" className="flex items-center">
          <img src="/logo.png" alt="DEEPFOOT" className="h-12 w-auto object-contain" />
        </Link>
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition"
          aria-label="Open menu"
        >
          <MenuIcon className="w-6 h-6" />
        </button>
      </header>

      {/* Sidebar: overlay on mobile, static on md+ */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          aria-hidden
          onClick={closeSidebar}
        />
      )}
      <aside
        className={`
          w-64 flex-shrink-0 flex flex-col
          fixed md:static inset-y-0 left-0 z-50 md:z-auto
          h-full md:h-screen
          transform transition-transform duration-200 ease-out
          md:translate-x-0 md:sticky md:top-0
          overflow-y-auto border-r border-dark-border bg-dark-card/50
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        <div className="px-5 pt-4 pb-3 flex items-center justify-between md:justify-center">
          <Link href="/" className="flex items-center justify-center" onClick={closeSidebar}>
            <img
              src="/logo.png"
              alt="DEEPFOOT"
              className="h-14 w-auto object-contain max-w-full"
            />
          </Link>
          <button
            type="button"
            onClick={closeSidebar}
            className="md:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
            aria-label="Close menu"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <nav className="px-4 flex-1">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider px-3 mb-2">Analysis</p>
          <ul className="space-y-0.5">
            {navKeys.map(({ path, key, icon: Icon, soon }) => {
              const href = path === "/" ? "/" : path;
              const label = t(key);
              const active =
                !soon &&
                (pathname === href || pathname === `/app${path}` || (path !== "/" && (pathname?.startsWith(href) || pathname?.startsWith(`/app${path}`))));
              if (soon) {
                return (
                  <li key={path}>
                    <span
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-500 cursor-not-allowed border border-transparent"
                      aria-disabled
                    >
                      <Icon className="flex-shrink-0 opacity-60" />
                      <span className="flex-1">{label}</span>
                      <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-400">
                        {t("nav.soon")}
                      </span>
                    </span>
                  </li>
                );
              }
              return (
                <li key={path}>
                  <Link
                    href={href}
                    onClick={closeSidebar}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                      active
                        ? "bg-[#00ffe8]/15 border border-[#00ffe8]/70 text-[#00ffe8] shadow-[0_0_10px_2px_rgba(0,255,232,0.2)]"
                        : "border border-transparent text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                    }`}
                  >
                    <Icon className="flex-shrink-0" />
                    {label}
                  </Link>
                </li>
              );
            })}
            <li>
              <Link
                href="/pricing"
                onClick={closeSidebar}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm border transition-all duration-200 ${
                  pathname === "/pricing" || pathname === "/app/pricing" || pathname?.startsWith("/app/pricing")
                    ? "border-amber-500/70 bg-amber-500/15 text-amber-400 shadow-[0_0_10px_2px_rgba(245,158,11,0.2)]"
                    : "border-amber-500/50 bg-[#15171c]/80 text-zinc-200 hover:bg-zinc-800/50 hover:border-amber-500/70"
                }`}
              >
                <CreditCardIcon className="flex-shrink-0" />
                <span className="flex-1">{t("nav.pricing")}</span>
                <span className="text-xs font-medium uppercase tracking-wider px-2 py-1 rounded-md bg-amber-900/70 text-amber-200">
                  {t("nav.upgrade")}
                </span>
              </Link>
            </li>
          </ul>

          <div className="mt-6 px-3">
            <p className="flex items-center gap-2 text-xs text-zinc-500 mb-1">
              <BarChartIcon className="w-4 h-4" />
              {t("nav.todayAnalyses")}
            </p>
            <p className={`text-lg font-bold ${analysesLimit === 0 || (analysesLimit == null && (user?.plan ?? "free") === "free") ? "text-red-400" : "text-white"}`}>
              {(user?.plan ?? "free") === "free" ? "0/0" : `${analysesUsed}/${analysesLimit == null ? "∞" : analysesLimit}`}
            </p>
            <div className="h-1.5 bg-zinc-800 rounded-full mt-1 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${analysesLimit === 0 || (analysesLimit == null && (user?.plan ?? "free") === "free") ? "bg-red-500" : "bg-accent-green"}`}
                style={{ width: `${analysesLimit === 0 ? 100 : analysesLimit != null && analysesLimit > 0 ? Math.min(100, (analysesUsed / analysesLimit) * 100) : (user?.plan ?? "free") === "free" ? 100 : 0}%` }}
              />
            </div>
            {(analysesLimit === 0 || ((user?.plan ?? "free") === "free" && analysesLimit == null)) && (
              <p className="text-xs text-zinc-400 mt-2">
                {t("nav.limitReached")} •{" "}
                <Link href="/pricing" className="text-[#00ffe8] hover:underline">
                  {t("nav.upgradeForMore")}
                </Link>
              </p>
            )}
          </div>
        </nav>

        <div className="p-4 pt-6 mt-4 border-t border-dark-border flex flex-col flex-1 min-h-0">
          <div className="mt-auto space-y-1">
            <Link
              href="/account"
              onClick={closeSidebar}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                pathname === "/account" || pathname === "/app/account" || pathname?.startsWith("/app/account")
                  ? "bg-[#00ffe8]/15 border border-[#00ffe8]/70 text-[#00ffe8] shadow-[0_0_10px_2px_rgba(0,255,232,0.2)]"
                  : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 border border-transparent"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0">
                <UserIcon className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">
                  {user?.displayName ?? user?.email ?? "—"}
                </p>
                <p className="text-xs text-zinc-500">
                  {user?.plan ? t(PLAN_KEYS[user.plan]) : t("nav.free")}
                </p>
              </div>
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200 text-left"
            >
              <LogOutIcon className="flex-shrink-0" />
              {t("nav.signOut")}
            </button>
            <a
              href="mailto:app@deepfoot.io"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
            >
              <SupportIcon className="flex-shrink-0" />
              {t("nav.support")}
            </a>
            <div className="relative pt-2">
            <button
              type="button"
              onClick={() => setLangOpen((o) => !o)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm border text-left transition-all duration-200 ${
                langOpen
                  ? "bg-[#00ffe8]/15 border-[#00ffe8]/70 text-[#00ffe8] shadow-[0_0_10px_2px_rgba(0,255,232,0.2)]"
                  : "border-transparent text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
              }`}
            >
              <GlobeIcon className="flex-shrink-0" />
              <span className="flex-1">
                {LANG_OPTIONS.find((o) => o.code === lang)?.flag ?? "GB"} {t(`lang.${lang}`)}
              </span>
            </button>
            {langOpen && (
              <>
                <div className="absolute left-0 right-0 bottom-full z-20 mb-0.5 rounded-xl bg-[#1c1c28] border border-white/10 shadow-xl overflow-hidden">
                  {LANG_OPTIONS.map((opt) => (
                    <button
                      key={opt.code}
                      type="button"
                      onClick={() => {
                        setLang(opt.code);
                        setLangOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left ${
                        opt.code === lang ? "bg-[#00ffe8]/15 text-[#00ffe8] shadow-[0_0_10px_2px_rgba(0,255,232,0.25)]" : "text-zinc-300 hover:bg-zinc-800/50"
                      }`}
                    >
                      {opt.flag} {t(opt.labelKey)}
                    </button>
                  ))}
                </div>
                <div className="fixed inset-0 z-10" aria-hidden onClick={() => setLangOpen(false)} />
              </>
            )}
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto min-w-0 px-4 md:px-0 py-4 md:py-0">
        {children}
      </main>
    </div>
  );
}
