"use client";

import { useState, useTransition } from "react";
import type { Report, ReportStatus } from "@/lib/types";
import { StatusPill, UrgencyBadge } from "@/components/layout/status-badge";
import { needTypeLabels } from "@/lib/ui/urgency-colors";
import { claimReportAction, updateStatusAction } from "@/app/dashboard/actions";

const NEXT_STATUS: Partial<Record<ReportStatus, ReportStatus>> = {
  claimed: "in_progress",
  in_progress: "resolved",
};

export function ClaimPanel({
  report,
  responderName,
  onClose,
  onUpdated,
}: {
  report: Report;
  responderName: string;
  onClose: () => void;
  onUpdated: (report: Report) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClaim() {
    setError(null);
    startTransition(async () => {
      const result = await claimReportAction(report.id, responderName);
      if (result.status === "error") {
        setError(result.message ?? "Could not claim this report.");
      } else if (result.report) {
        onUpdated(result.report);
      }
    });
  }

  function handleAdvance() {
    const next = NEXT_STATUS[report.status];
    if (!next) return;
    setError(null);
    startTransition(async () => {
      const result = await updateStatusAction(report.id, next, responderName);
      if (result.status === "error") {
        setError(result.message ?? "Could not update this report.");
      } else if (result.report) {
        onUpdated(result.report);
      }
    });
  }

  const next = NEXT_STATUS[report.status];

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {needTypeLabels[report.type]} &mdash; {report.area}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>

        <div className="mt-2 flex gap-1.5">
          <UrgencyBadge urgency={report.urgency} />
          <StatusPill status={report.status} />
        </div>

        <p className="mt-3 text-sm text-slate-700">{report.description}</p>
        {report.contactInfo && (
          <p className="mt-1 text-xs text-slate-500">Contact: {report.contactInfo}</p>
        )}
        {report.claimedBy && (
          <p className="mt-1 text-xs text-slate-500">Claimed by: {report.claimedBy}</p>
        )}

        {!responderName.trim() && (
          <p className="mt-3 text-sm text-amber-600">
            Enter your responder name above before claiming or updating reports.
          </p>
        )}

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-4 flex gap-2">
          {report.status === "open" && (
            <button
              onClick={handleClaim}
              disabled={pending || !responderName.trim()}
              className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {pending ? "Claiming..." : "Claim this report"}
            </button>
          )}
          {next && (
            <button
              onClick={handleAdvance}
              disabled={pending || !responderName.trim()}
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {pending ? "Updating..." : `Mark as ${next.replace("_", " ")}`}
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
