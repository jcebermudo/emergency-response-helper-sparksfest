/**
 * Demo-mode kill switch.
 *
 * True forces the whole app onto the mock store (lib/data/reports) instead
 * of live Firebase — no Firestore reads/writes, no realtime listeners, no ID
 * tokens forwarded to the API routes. All the Firebase code stays in place;
 * this just short-circuits the call sites that would otherwise reach it.
 *
 * Dev (`next dev`, NODE_ENV=development) is always demo mode — that's what
 * the fake port-based login and file-backed store (lib/demo-user.ts,
 * lib/data/store.ts) are built around, and it keeps local dev from writing
 * to a real Firebase project by accident.
 *
 * Production uses live Firestore whenever a signed-in user is present (see
 * dashboard-client.tsx's onSnapshot gate and lib/use-report-actions.ts'
 * resolveToken) — this requires firestore.rules to be deployed to the
 * configured project and, for the write-side API routes, FIREBASE_SERVICE_ACCOUNT
 * to be set (see lib/firebase-admin.ts). Signed-out visitors still see the
 * mock store, since firestore.rules requires auth to read `tasks` at all.
 */
export const DEMO_MODE = process.env.NODE_ENV === "development";
