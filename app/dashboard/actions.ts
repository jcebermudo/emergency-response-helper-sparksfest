"use server";

/**
 * app/dashboard/actions.ts
 *
 * Server Actions consumed by the dashboard.
 * Each action tries the real Firestore API routes when an ID token is supplied;
 * falls back to the in-memory mock store when no token is present (demo mode).
 */

import { revalidatePath } from "next/cache";
import { claimReport, getReports, updateReportStatus } from "@/lib/data/reports";
import { getBaseUrl } from "@/lib/base-url";
import { DEMO_MODE } from "@/lib/demo-mode";
import type { Report, ReportStatus } from "@/lib/types";

export interface ActionResult {
  status: "success" | "error";
  message?: string;
  report?: Report;
}

const BASE_URL = getBaseUrl();
// Same gate as dashboard-client.tsx's onSnapshot: true when this deploy
// should behave like a real, Firebase-backed production app.
const HAS_FIREBASE_CONFIG = Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
const IS_LIVE_FIREBASE = !DEMO_MODE && HAS_FIREBASE_CONFIG;

async function apiPost<T>(
  path: string,
  idToken: string,
  body?: unknown
): Promise<{ ok: boolean; data: T }> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
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
    const { ok, data } = await apiPost<{ error?: string }>(
      `/api/tasks/${reportId}/claim`,
      idToken!
    );
    if (!ok) {
      return { status: "error", message: (data as { error?: string }).error ?? "Could not claim task." };
    }
    revalidatePath("/dashboard");
    return { status: "success" };
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
    const { ok, data } = await apiPost<{ error?: string }>(
      `/api/tasks/${reportId}/resolve`,
      idToken!
    );
    if (!ok) {
      return { status: "error", message: (data as { error?: string }).error ?? "Could not resolve task." };
    }
    revalidatePath("/dashboard");
    return { status: "success" };
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
