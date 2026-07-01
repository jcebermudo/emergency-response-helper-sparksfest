import type { Report } from "@/lib/types";
import { StatusPill, UrgencyBadge } from "@/components/layout/status-badge";
import { needTypeLabels } from "@/lib/ui/urgency-colors";

export function ReportCard({
  report,
  onManage,
}: {
  report: Report;
  onManage: (reportId: string) => void;
}) {
  return (
    <button
      onClick={() => onManage(report.id)}
      className="w-full rounded-lg border border-slate-200 bg-white p-3 text-left hover:border-slate-400"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-slate-900">{needTypeLabels[report.type]}</span>
        <div className="flex gap-1.5">
          <UrgencyBadge urgency={report.urgency} />
          <StatusPill status={report.status} />
        </div>
      </div>
      <p className="mt-1 text-sm text-slate-600">{report.area}</p>
      <p className="mt-1 line-clamp-2 text-sm text-slate-500">{report.description}</p>
      {report.claimedBy && (
        <p className="mt-1 text-xs text-slate-400">Claimed by {report.claimedBy}</p>
      )}
    </button>
  );
}
