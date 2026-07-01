import type { ReportStatus, UrgencyLevel } from "@/lib/types";
import { statusBadgeClasses, statusLabels, urgencyBadgeClasses } from "@/lib/ui/urgency-colors";

export function UrgencyBadge({ urgency }: { urgency: UrgencyLevel }) {
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${urgencyBadgeClasses[urgency]}`}
    >
      {urgency}
    </span>
  );
}

export function StatusPill({ status }: { status: ReportStatus }) {
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-xs font-medium ${statusBadgeClasses[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
