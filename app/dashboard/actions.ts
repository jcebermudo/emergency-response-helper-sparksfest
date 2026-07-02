"use server";

/**
 * app/dashboard/actions.ts
 *
 * Server Actions consumed by the dashboard.
 * Each action writes directly to Firestore (via lib/server/tasks.ts,
 * in-process, no HTTP self-fetch) when an ID token is supplied and Firebase
 * is configured for this deploy; falls back to the in-memory mock store
 * otherwise (demo mode).
 */

import { revalidatePath } from "next/cache";
import { claimReport, getReports, updateReportStatus } from "@/lib/data/reports";
import { auth, isCredentialError } from "@/lib/firebase-admin";
import { claimTaskForUser, resolveTaskForUser, TaskActionError } from "@/lib/server/tasks";
import { DEMO_MODE } from "@/lib/demo-mode";
import type { Report, ReportStatus } from "@/lib/types";

export interface ActionResult {
  status: "success" | "error";
  message?: string;
  report?: Report;
}

// Same gate as dashboard-client.tsx's onSnapshot: true when this deploy
// should behave like a real, Firebase-backed production app.
const HAS_FIREBASE_CONFIG = Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
const IS_LIVE_FIREBASE = !DEMO_MODE && HAS_FIREBASE_CONFIG;

async function verifyToken(idToken: string): Promise<{ uid: string } | { error: ActionResult }> {
  try {
    const decoded = await auth.verifyIdToken(idToken);
    return { uid: decoded.uid };
  } catch (err) {
    // Logged so the real cause shows up in Vercel's runtime logs — a caught
    // error like this doesn't crash the request, so nothing gets logged
    // unless we do it explicitly.
    console.error("verifyIdToken failed:", err);
    if (isCredentialError(err)) {
      return { error: { status: "error", message: "Server credentials not configured. Set FIREBASE_SERVICE_ACCOUNT." } };
    }
    const detail = err instanceof Error ? err.message : String(err);
    return { error: { status: "error", message: `Your session has expired. Please sign in again. (${detail})` } };
  }
}

export async function claimReportAction(
  reportId: string,
  responderName: string,
  idToken?: string
): Promise<ActionResult> {
  if (!responderName.trim()) {
    return { status: "error", message: "Enter your name before claiming a report." };
  }

  // A missing token in a live Firebase deploy is a real problem (not signed
  // in, or the client failed to fetch one) — surface it instead of silently
  // claiming in the non-persistent mock store, which shows "success" but
  // never actually claims the real report.
  if (IS_LIVE_FIREBASE && !idToken) {
    return { status: "error", message: "You must be signed in to claim a report. Please sign in and try again." };
  }

  if (IS_LIVE_FIREBASE) {
    const verified = await verifyToken(idToken!);
    if ("error" in verified) return verified.error;

    try {
      await claimTaskForUser(verified.uid, reportId);
      revalidatePath("/dashboard");
      return { status: "success" };
    } catch (err) {
      if (err instanceof TaskActionError) {
        return { status: "error", message: err.message };
      }
      if (isCredentialError(err)) {
        return { status: "error", message: "Server credentials not configured. Set FIREBASE_SERVICE_ACCOUNT." };
      }
      throw err;
    }
  }

  // Mock fallback — only reached when Firebase isn't configured for this deploy
  try {
    const report = await claimReport(reportId, responderName.trim());
    revalidatePath("/dashboard");
    return { status: "success", report };
  } catch (err) {
    return { status: "error", message: (err as Error).message };
  }
}

export async function updateStatusAction(
  reportId: string,
  status: ReportStatus,
  responderName: string,
  idToken?: string
): Promise<ActionResult> {
  if (!responderName.trim()) {
    return { status: "error", message: "Enter your name before updating a report." };
  }

  // Only "resolved" has a real Firestore endpoint today — "in_progress"
  // intentionally always uses the mock fallback below, live deploy or not.
  const hasRealEndpoint = status === "resolved";

  if (IS_LIVE_FIREBASE && hasRealEndpoint && !idToken) {
    return { status: "error", message: "You must be signed in to update this report. Please sign in and try again." };
  }

  if (IS_LIVE_FIREBASE && hasRealEndpoint) {
    const verified = await verifyToken(idToken!);
    if ("error" in verified) return verified.error;

    try {
      await resolveTaskForUser(verified.uid, reportId);
      revalidatePath("/dashboard");
      return { status: "success" };
    } catch (err) {
      if (err instanceof TaskActionError) {
        return { status: "error", message: err.message };
      }
      if (isCredentialError(err)) {
        return { status: "error", message: "Server credentials not configured. Set FIREBASE_SERVICE_ACCOUNT." };
      }
      throw err;
    }
  }

  // Mock fallback — Firebase not configured for this deploy, or no real
  // endpoint exists yet for this status transition (e.g. in_progress).
  try {
    const report = await updateReportStatus(reportId, status, responderName.trim());
    revalidatePath("/dashboard");
    return { status: "success", report };
  } catch (err) {
    return { status: "error", message: (err as Error).message };
  }
}

/**
 * Used by the polling fallback in dashboard-client when onSnapshot is not
 * available (no Firebase creds). Replace with onSnapshot when connected.
 */
export async function refetchReportsAction(): Promise<Report[]> {
  return getReports();
}
