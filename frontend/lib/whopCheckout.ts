import type { PricingCurrency } from "@/lib/geoCurrency";

export type WhopPlanId = "starter" | "pro" | "lifetime";

const CHECKOUT_URLS: Record<PricingCurrency, Record<WhopPlanId, string>> = {
  // USD: countries outside UK + Europe
  USD: {
    lifetime: "https://whop.com/checkout/plan_a9qUhL4i9mz6B",
    pro: "https://whop.com/checkout/plan_OPBroVFLkZFuG",
    starter: "https://whop.com/checkout/plan_xncEV4h0yc3F1",
  },
  // GBP: UK
  GBP: {
    lifetime: "https://whop.com/checkout/plan_m9Bcvjqy3xudw",
    pro: "https://whop.com/checkout/plan_pVoGBCVIzFw4M",
    starter: "https://whop.com/checkout/plan_SosIjQXUrG5Pb",
  },
  // EUR: Europe (non-UK)
  EUR: {
    lifetime: "https://whop.com/checkout/plan_FXHgaDOloK9Q1",
    pro: "https://whop.com/checkout/plan_ASd2bXI29nfKR",
    starter: "https://whop.com/checkout/plan_WmP3L9eEPlEJb",
  },
};

export function getWhopCheckoutUrl(plan: WhopPlanId, currency: PricingCurrency): string {
  return CHECKOUT_URLS[currency][plan];
}

