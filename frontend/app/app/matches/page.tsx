"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { MatchInput } from "@/components/MatchInput";
import { useLanguage } from "@/contexts/LanguageContext";
import { getDatafastVisitorId } from "@/lib/whopCheckout";
import { getUserFromStorage, setUserInStorage, type PlanId } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function MatchesContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const home = searchParams.get("home") ?? "";
  const away = searchParams.get("away") ?? "";
  const syncAttemptedRef = useRef(false);

  useEffect(() => {
    if (syncAttemptedRef.current) return;
    const paymentId = searchParams.get("payment_id") || searchParams.get("receipt_id");
    const checkoutStatus = (searchParams.get("checkout_status") || searchParams.get("status") || "").toLowerCase();
    const isSuccess = checkoutStatus === "success" || checkoutStatus === "paid";
    if (!paymentId || !isSuccess || !API_URL || API_URL === "undefined") return;

    syncAttemptedRef.current = true;
    const uid = getUserFromStorage()?.id;
    (async () => {
      try {
        await fetch(`${API_URL}/webhooks/whop/sync-payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payment_id: paymentId,
            datafast_visitor_id: getDatafastVisitorId(),
          }),
        });

        // Refresh local plan from /me right after sync, so UI updates without waiting.
        if (uid) {
          const r = await fetch(`${API_URL}/me`, {
            headers: { "X-User-Id": uid },
          });
          const data = r.ok ? await r.json() : null;
          if (data?.plan) {
            const u = getUserFromStorage();
            if (u && u.id === uid) {
              setUserInStorage({ ...u, plan: data.plan as PlanId });
            }
          }
        }
      } catch {
        // Ignore transient network issues; webhook retry/manual sync still possible.
      } finally {
        // Clean payment params to avoid resync on each refresh.
        try {
          const url = new URL(window.location.href);
          [
            "receipt_id",
            "payment_id",
            "checkout_status",
            "status",
            "state_id",
          ].forEach((k) => url.searchParams.delete(k));
          window.history.replaceState({}, "", `${url.pathname}${url.search}`);
        } catch {
          // ignore URL cleanup issues
        }
      }
    })();
  }, [searchParams]);

  return (
    <div className="p-4 sm:p-8 w-full flex flex-col items-center">
      <div className="w-full max-w-xl mx-auto">
        <h1 className="text-2xl font-bold text-white text-center">{t("matches.title")}</h1>
        <p className="text-zinc-500 mt-1 text-center">{t("matches.subtitle")}</p>
        <p className="text-[#00ffe8] text-xs sm:text-sm mt-1 max-w-2xl mx-auto text-center whitespace-nowrap overflow-hidden text-ellipsis">
          Our AI is connected to football news and crosses millions of data points for each prediction.
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
    <Suspense fallback={<div className="p-8 text-zinc-400 text-center">Loading...</div>}>
      <MatchesContent />
    </Suspense>
  );
}
