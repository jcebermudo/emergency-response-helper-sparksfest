/**
 * Firebase Admin SDK singleton for use in Next.js API routes (server-side only).
 * Never import this from client components.
 *
 * Credential resolution order:
 *  1. FIREBASE_SERVICE_ACCOUNT env var — base64-encoded service-account JSON.
 *     Generate with:
 *       base64 -i path/to/serviceAccount.json | tr -d '\n'
 *     Then paste the result into .env.local as FIREBASE_SERVICE_ACCOUNT=<value>
 *     (and into your hosting platform's env vars for a real deploy — .env.local
 *     is gitignored and never gets deployed automatically).
 *  2. Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS or
 *     GCP-hosted metadata server when deployed on Cloud Run / App Engine).
 *
 * Initialization is deferred to first use (not top-level) and any failure is
 * turned into a throw-on-access proxy instead of a crash at import time — a
 * misconfigured deploy should 503 the specific request that needed Firestore,
 * not take down every route that happens to import this module.
 */
import {
  initializeApp,
  getApps,
  applicationDefault,
  cert,
  App,
} from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getAuth, Auth } from "firebase-admin/auth";

function buildCredential() {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (b64) {
    const json = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
    return cert(json);
  }
  return applicationDefault();
}

let app: App | undefined;
let initError: Error | undefined;

function getAdminApp(): App {
  if (app) return app;
  if (initError) throw initError;
  try {
    app = getApps().length
      ? getApps()[0]
      : initializeApp({
          credential: buildCredential(),
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        });
    return app;
  } catch (err) {
    initError = err instanceof Error ? err : new Error(String(err));
    throw initError;
  }
}

/** Throws (with a message isCredentialError recognizes) the moment any
 *  method is actually called, instead of at module load. */
function throwingProxy<T extends object>(): T {
  return new Proxy({} as T, {
    get() {
      getAdminApp(); // re-throws the real init error
      throw new Error("Firebase Admin SDK is unavailable (missing credential)");
    },
  });
}

function safeGetFirestore(): Firestore {
  try {
    return getFirestore(getAdminApp());
  } catch {
    return throwingProxy<Firestore>();
  }
}

function safeGetAuth(): Auth {
  try {
    return getAuth(getAdminApp());
  } catch {
    return throwingProxy<Auth>();
  }
}

export const db   = safeGetFirestore();
export const auth = safeGetAuth();

/**
 * Returns true when the error is a GCP "no credentials"/misconfiguration
 * failure so API routes can return a clean 503 instead of a raw 500.
 */
export function isCredentialError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("Could not load the default credentials") ||
         msg.includes("GOOGLE_APPLICATION_CREDENTIALS") ||
         msg.includes("Unable to detect a Project Id") ||
         msg.includes("credential");
}
