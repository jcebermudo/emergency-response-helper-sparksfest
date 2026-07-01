import { initializeApp, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

// Initialise once; subsequent imports reuse the same app instance.
if (!getApps().length) {
  initializeApp();
}

export const db   = getFirestore(getApp());
export const auth = getAuth(getApp());
