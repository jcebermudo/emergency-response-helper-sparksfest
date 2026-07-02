"use client";

import { useEffect } from "react";
import type { Report } from "@/lib/types";
import { needTypeLabels } from "@/lib/ui/urgency-colors";
import { DEMO_MODE } from "@/lib/demo-mode";

const AUTO_DISMISS_MS = 8000;
const FALLBACK_REPORTER_NAME = "A community member";

// In DEMO_MODE, reportedBy already holds a friendly display name. In
// production, reportedBy is a Firebase uid — never show that raw, only the
// server-resolved reportedByName (see app/api/tasks/route.ts) or a fallback.
function reporterLabel(report: Report): string {
  if (DEMO_MODE) return report.reportedBy || FALLBACK_REPORTER_NAME;
  return report.reportedByName || FALLBACK_REPORTER_NAME;
}

export function NotificationToast({
  report,
  onDismiss,
  onView,
}: {
  report: Report;
  onDismiss: (id: string) => void;
  onView: (id: string) => void;
}) {
  // onDismiss/id are referentially stable across re-renders (see
  // notification-provider.tsx), so this timer is set once per toast, not
  // reset every time a sibling toast arrives.
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(report.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [report.id, onDismiss]);

  return (
    <div className="w-80 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">New need reported</p>
        <button
          onClick={() => onDismiss(report.id)}
          className="text-slate-400 hover:text-slate-700"
        >
          ✕
        </button>
      </div>
      <p className="mt-1 text-xs text-slate-600">
        <span className="font-medium text-slate-800">{reporterLabel(report)}</span> reported{" "}
        {needTypeLabels[report.type]}
        {report.area ? ` in ${report.area}` : ""}.
      </p>
      <button
        onClick={() => onView(report.id)}
        className="mt-2 rounded-md bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-700"
      >
        View on dashboard
      </button>
    </div>
  );
}
