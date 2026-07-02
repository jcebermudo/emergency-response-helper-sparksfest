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
import type { Report, ReportStatus } from "@/lib/types";

export interface ActionResult {
  status: "success" | "error";
  message?: string;
  report?: Report;
}

const BASE_URL = getBaseUrl();

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

  if (idToken) {
    const { ok, data } = await apiPost<{ error?: string }>(
      `/api/tasks/${reportId}/claim`,
      idToken
    );
    if (!ok) {
      return { status: "error", message: (data as { error?: string }).error ?? "Could not claim task." };
    }
    revalidatePath("/dashboard");
    return { status: "success" };
  }

  // Mock fallback
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

  // Map frontend statuses to the API's resolved endpoint
  if (idToken && status === "resolved") {
    const { ok, data } = await apiPost<{ error?: string }>(
      `/api/tasks/${reportId}/resolve`,
      idToken
    );
    if (!ok) {
      return { status: "error", message: (data as { error?: string }).error ?? "Could not resolve task." };
    }
    revalidatePath("/dashboard");
    return { status: "success" };
  }

  // Mock fallback (also handles in_progress which has no Firestore endpoint yet)
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
