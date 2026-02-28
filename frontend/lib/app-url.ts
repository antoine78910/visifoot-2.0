/**
 * When NEXT_PUBLIC_APP_ORIGIN is set (e.g. https://app.deepfoot.ai), all app links use it.
 * Otherwise we use relative /app paths for same-origin.
 */
function getAppOrigin(): string | null {
  if (typeof process === "undefined") return null;
  const origin = process.env.NEXT_PUBLIC_APP_ORIGIN;
  return origin && origin.startsWith("http") ? origin.replace(/\/$/, "") : null;
}

export function getAppHref(path: string = ""): string {
  const origin = getAppOrigin();
  const p = path.startsWith("/") ? path : `/${path}`;
  return origin ? `${origin}${p}` : `/app${p === "/" ? "" : p}`;
}

/** Public analyse page lives at /analyse (and on app origin at /analyse as well). */
export function getAnalyseHref(): string {
  const origin = getAppOrigin();
  if (origin) return `${origin}/analyse`;

  // Local dev convenience: from http://localhost:3000, send users to http://app.localhost:3000/analyse
  // so middleware can route them to sign-in/signup on the app host.
  if (typeof window !== "undefined") {
    const { protocol, hostname, port } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      const p = port ? `:${port}` : "";
      return `${protocol}//app.localhost${p}/analyse`;
    }
  }
  return "/analyse";
}

export const APP_HREF = getAppHref("/");

/** App root URL (for redirect after sign-in). In dev on localhost, use app subdomain. */
export function getAppRootUrl(): string {
  const origin = getAppOrigin();
  if (origin) return `${origin}/`;
  if (typeof window !== "undefined") {
    const { protocol, hostname, port } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      const p = port ? `:${port}` : "";
      return `${protocol}//app.${hostname}${p}/`;
    }
  }
  return "/app";
}

/** OAuth callback URL: always use app origin so after Google login we land on the app. */
export function getAppAuthCallbackUrl(): string {
  const origin = getAppOrigin();
  if (origin) return `${origin}/auth/callback`;
  if (typeof window !== "undefined") {
    const { protocol, hostname, port } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      const p = port ? `:${port}` : "";
      return `${protocol}//app.${hostname}${p}/auth/callback`;
    }
  }
  return "/app/auth/callback";
}
// Sign-in is a public (non /app) route on the same origin.
export const SIGN_IN_HREF = "/sign-in";
export const ANALYSE_HREF = getAnalyseHref();
export const MATCHES_HREF = getAppHref("/matches");
