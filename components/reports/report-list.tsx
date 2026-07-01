import type { Report } from "@/lib/types";
import { ReportCard } from "@/components/reports/report-card";

export function ReportList({
  reports,
  onManage,
}: {
  reports: Report[];
  onManage: (reportId: string) => void;
}) {
  if (reports.length === 0) {
    return <p className="text-sm text-slate-500">No reports match the current filters.</p>;
  }

  return (
    <div className="space-y-2">
      {reports.map((report) => (
        <ReportCard key={report.id} report={report} onManage={onManage} />
      ))}
    </div>
  );
}
