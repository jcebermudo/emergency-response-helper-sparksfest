import type { PredictedAreaInsight } from "@/lib/types";
import { needTypeLabels } from "@/lib/ui/urgency-colors";

function scoreColor(score: number): string {
  if (score >= 15) return "bg-red-100 text-red-700 border-red-200";
  if (score >= 10) return "bg-orange-100 text-orange-700 border-orange-200";
  if (score >= 5)  return "bg-yellow-100 text-yellow-700 border-yellow-200";
  return "bg-blue-100 text-blue-700 border-blue-200";
}

const NEED_ICON: Record<string, string> = {
  food: "🍚",
  medical: "🏥",
  evacuation: "🚨",
  other: "📦",
};

export function PredictedAreasPanel({ insights }: { insights: PredictedAreaInsight[] }) {
  return (
    <ol className="space-y-2">
      {insights.map((insight, index) => (
        <li
          key={insight.area}
          className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3"
        >
          <span className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
            {index + 1}
          </span>

          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-900 truncate">{insight.area}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {NEED_ICON[insight.dominantNeedType] ?? "📦"}{" "}
              {needTypeLabels[insight.dominantNeedType]} &middot;{" "}
              {insight.sampleSize} incidents
            </p>
          </div>

          <span
            className={`shrink-0 rounded-full border px-2.5 py-1 text-sm font-bold ${scoreColor(insight.score)}`}
          >
            {insight.score.toFixed(1)}
          </span>
        </li>
      ))}
    </ol>
  );
}
