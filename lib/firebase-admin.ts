/**
 * Firebase Admin SDK singleton for use in Next.js API routes (server-side only).
 * Never import this from client components.
 *
 * Credential resolution order:
 *  1. FIREBASE_SERVICE_ACCOUNT env var — base64-encoded service-account JSON.
 *     Generate with:
 *       base64 -i path/to/serviceAccount.json | tr -d '\n'
 *     Then paste the result into .env.local as FIREBASE_SERVICE_ACCOUNT=<value>
 *  2. Application Default Credentials (GOOGLE_APPLICATION_CREDENTIALS or
 *     GCP-hosted metadata server when deployed on Cloud Run / App Engine).
 */
import {
  initializeApp,
  getApps,
  applicationDefault,
  cert,
  App,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

function buildCredential() {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (b64) {
    const json = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
    return cert(json);
  }
  return applicationDefault();
}

let app: App;
if (!getApps().length) {
  app = initializeApp({
    credential: buildCredential(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
} else {
  app = getApps()[0];
}

export const db   = getFirestore(app);
export const auth = getAuth(app);

/**
 * Returns true when the error is a GCP "no credentials" failure so API routes
 * can return a clean 503 instead of letting it become an unhandled rejection.
 */
export function isCredentialError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("Could not load the default credentials") ||
         msg.includes("GOOGLE_APPLICATION_CREDENTIALS") ||
         msg.includes("credential");
}
