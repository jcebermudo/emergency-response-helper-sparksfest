import type { PredictedAreaInsight } from "@/lib/types";
import { needTypeLabels } from "@/lib/ui/urgency-colors";

export function PredictedAreasPanel({ insights }: { insights: PredictedAreaInsight[] }) {
  return (
    <ol className="space-y-2">
      {insights.map((insight, index) => (
        <li
          key={insight.area}
          className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-3"
        >
          <div>
            <p className="font-medium text-slate-900">
              {index + 1}. {insight.area}
            </p>
            <p className="text-sm text-slate-500">
              Likely need: {needTypeLabels[insight.dominantNeedType]} &middot; {insight.sampleSize}{" "}
              historical reports
            </p>
          </div>
          <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-semibold text-red-700">
            {insight.score.toFixed(1)}
          </span>
        </li>
      ))}
    </ol>
  );
}
