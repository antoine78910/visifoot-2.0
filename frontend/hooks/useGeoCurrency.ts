"use client";

import { useState, useEffect } from "react";
import {
  getCurrencyFromCountry,
  getCurrencyConfig,
  type CurrencyConfig,
  type PricingCurrency,
} from "@/lib/geoCurrency";

const GEO_API = "https://ipapi.co/json/";

export function useGeoCurrency(): {
  config: CurrencyConfig;
  isLoading: boolean;
  error: boolean;
} {
  const [config, setConfig] = useState<CurrencyConfig>(() => getCurrencyConfig("EUR"));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setError(false);

    (async () => {
      try {
        let res: Response | null = null;
        try {
          res = await fetch(GEO_API);
        } catch {
          res = null;
        }
        if (cancelled) return;
        if (!res?.ok) {
          setError(true);
          setConfig(getCurrencyConfig("EUR"));
          return;
        }
        let data: { country_code?: string } | null = null;
        try {
          data = await res.json();
        } catch {
          setError(true);
          setConfig(getCurrencyConfig("EUR"));
          return;
        }
        if (cancelled) return;
        const country = data?.country_code ?? null;
        const currency = getCurrencyFromCountry(country) as PricingCurrency;
        setConfig(getCurrencyConfig(currency));
      } catch {
        if (!cancelled) {
          setError(true);
          setConfig(getCurrencyConfig("EUR"));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { config, isLoading, error };
}
