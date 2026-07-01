/**
 * Firebase Admin SDK singleton for use in Next.js API routes (server-side only).
 * Never import this from client components.
 */
import { initializeApp, getApps, applicationDefault, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

let app: App;
if (!getApps().length) {
  app = initializeApp({
    // When deployed on Cloud Run / App Engine the default credentials are picked
    // up automatically.  For local dev, set GOOGLE_APPLICATION_CREDENTIALS to
    // a service-account JSON key file path.
    credential: applicationDefault(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
} else {
  app = getApps()[0];
}

export const db   = getFirestore(app);
export const auth = getAuth(app);
