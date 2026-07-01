"use server";

import { revalidatePath } from "next/cache";
import { claimReport, getReports, updateReportStatus } from "@/lib/data/reports";
import type { Report, ReportStatus } from "@/lib/types";

export interface ActionResult {
  status: "success" | "error";
  message?: string;
  report?: Report;
}

export async function claimReportAction(
  reportId: string,
  responderName: string
): Promise<ActionResult> {
  if (!responderName.trim()) {
    return { status: "error", message: "Enter your name before claiming a report." };
  }
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
  responderName: string
): Promise<ActionResult> {
  if (!responderName.trim()) {
    return { status: "error", message: "Enter your name before updating a report." };
  }
  try {
    const report = await updateReportStatus(reportId, status, responderName.trim());
    revalidatePath("/dashboard");
    return { status: "success", report };
  } catch (err) {
    return { status: "error", message: (err as Error).message };
  }
}

// Used by dashboard-client's polling effect — a STAND-IN for a Firebase
// onSnapshot listener. Replace this Server Action call with a real-time
// subscription when wiring up Firebase; the fetch/merge logic in
// dashboard-client.tsx should map directly onto a snapshot callback.
export async function refetchReportsAction(): Promise<Report[]> {
  return getReports();
}
