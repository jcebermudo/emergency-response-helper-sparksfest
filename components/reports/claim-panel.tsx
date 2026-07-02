"use client";

/**
 * ClaimPanel — full-screen modal for managing a single report.
 *
 * One of two ways to claim/advance a report — the other is the popup
 * anchored to its pin on the dashboard map (components/map/report-marker.tsx).
 * Both share their claim/advance logic via lib/use-report-actions.
 */

import type { Report } from "@/lib/types";
import { StatusPill, UrgencyBadge } from "@/components/layout/status-badge";
import { needTypeLabels } from "@/lib/ui/urgency-colors";
import { useReportActions } from "@/lib/use-report-actions";

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
  const { pending, error, next, handleClaim, handleAdvance } = useReportActions(
    report,
    responderName,
    onUpdated
  );

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
