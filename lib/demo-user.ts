/**
 * Fake per-device "login" for the demo — Firebase Auth is blocked (see
 * lib/demo-mode.ts), so identity is derived from which localhost port the
 * app is running on. This lets two browser tabs on :3000 and :3001 stand in
 * for two different people/devices without any real auth flow.
 *
 * Dev-only: `next dev` inlines NODE_ENV=development into the client bundle,
 * so this whole scheme (and the port numbers, which are meaningless once
 * deployed) is compiled out of production builds.
 */
const PORT_DEMO_NAMES: Record<string, string> = {
  "3000": "Juan Dela Cruz",
  "3001": "Maria Ruiza Reyes",
};

// Dev fallback for a port with no assigned name (e.g. a third tab). Empty
// in production, so the field behaves exactly as it did pre-fake-login:
// blank until the user types a name.
const DEV_FALLBACK_NAME = "Responder";

export function getDemoUserName(): string {
  if (process.env.NODE_ENV !== "development") return "";
  if (typeof window === "undefined") return "";
  return PORT_DEMO_NAMES[window.location.port] ?? DEV_FALLBACK_NAME;
}
