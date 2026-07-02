/**
 * Base URL for server-side self-fetches (a Server Action calling this app's
 * own /api/* routes). Defaulting to "http://localhost:3000" breaks on any
 * serverless host — there's nothing listening on that address in the
 * deployed function, so the fetch fails with ECONNREFUSED and crashes the
 * whole request.
 *
 * Priority: explicit NEXT_PUBLIC_BASE_URL override > VERCEL_URL (set
 * automatically by Vercel on every deployment, no configuration needed,
 * but has no protocol prefix) > localhost for local dev.
 */
export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
