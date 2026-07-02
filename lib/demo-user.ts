/**
 * Fake per-device "login" for the demo — Firebase Auth is blocked (see
 * lib/demo-mode.ts), so identity is derived from which localhost port the
 * app is running on. This lets two browser tabs on :3000 and :3001 stand in
 * for two different people/devices without any real auth flow.
 */
const PORT_DEMO_NAMES: Record<string, string> = {
  "3000": "Juan Dela Cruz",
  "3001": "Maria Ruiza Reyes",
};

const DEFAULT_DEMO_NAME = "Responder";

export function getDemoUserName(): string {
  if (typeof window === "undefined") return DEFAULT_DEMO_NAME;
  return PORT_DEMO_NAMES[window.location.port] ?? DEFAULT_DEMO_NAME;
}
