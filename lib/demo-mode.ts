/**
 * Demo-mode kill switch.
 *
 * Set to true to force the whole app onto the in-memory mock store
 * (lib/data/reports) instead of live Firebase — no Firestore reads/writes,
 * no realtime listeners, no ID tokens forwarded to the API routes.
 *
 * All the Firebase code stays in place; this just short-circuits the call
 * sites that would otherwise reach it. Flip back to false to re-enable.
 */
export const DEMO_MODE = true;
