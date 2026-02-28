import { redirect } from "next/navigation";

export default function AppAnalyseRedirectPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams || {})) {
    if (v == null) continue;
    if (Array.isArray(v)) {
      for (const vv of v) qs.append(k, vv);
    } else {
      qs.set(k, v);
    }
  }
  const s = qs.toString();
  redirect(s ? `/app/matches?${s}` : "/app/matches");
}

