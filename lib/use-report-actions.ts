"use client";

import { useState, useTransition } from "react";
import type { Report, ReportStatus } from "@/lib/types";
import { claimReportAction, updateStatusAction } from "@/app/dashboard/actions";
import { useAuth } from "@/lib/auth-context";
import { DEMO_MODE } from "@/lib/demo-mode";

const NEXT_STATUS: Partial<Record<ReportStatus, ReportStatus>> = {
  claimed: "in_progress",
  in_progress: "resolved",
};

/**
 * Shared claim/advance-status logic for the two places a report can be
 * claimed from: the centered ClaimPanel modal and the map marker popup.
 */
export function useReportActions(
  report: Report,
  responderName: string,
  onUpdated: (report: Report) => void
) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { user, getToken } = useAuth();

  async function resolveToken(): Promise<string | undefined> {
    // Disabled in DEMO_MODE — always falls back to the mock store (see lib/demo-mode.ts)
    if (DEMO_MODE || !user) return undefined;
    try { return await getToken(); } catch { return undefined; }
  }

  function handleClaim() {
    setError(null);
    startTransition(async () => {
      const token = await resolveToken();
      const result = await claimReportAction(report.id, responderName, token);
      if (result.status === "error") {
        setError(result.message ?? "Could not claim this report.");
      } else if (result.report) {
        onUpdated(result.report);
      } else {
        onUpdated({ ...report, status: "claimed", claimedBy: responderName });
      }
    });
  }

  const next = NEXT_STATUS[report.status];

  function handleAdvance() {
    if (!next) return;
    setError(null);
    startTransition(async () => {
      const token = await resolveToken();
      const result = await updateStatusAction(report.id, next, responderName, token);
      if (result.status === "error") {
        setError(result.message ?? "Could not update this report.");
      } else if (result.report) {
        onUpdated(result.report);
      } else {
        onUpdated({ ...report, status: next });
      }
    });
  }

  return { pending, error, next, handleClaim, handleAdvance };
}
