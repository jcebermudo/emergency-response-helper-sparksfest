import { getPredictedInsights } from "@/lib/data/predictions";
import { PredictedAreasPanel } from "@/components/insights/predicted-areas-panel";
import { InsightsMapWrapper } from "@/components/insights/insights-map-wrapper";

export default async function InsightsPage() {
  const insights = await getPredictedInsights();

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Predicted High-Need Areas</h1>
      <p className="mt-1 text-sm text-slate-600 max-w-xl">
        Ranked by recency-weighted frequency of historical incident reports.
        Areas with more recent and frequent incidents score higher — use this
        to pre-stage supplies before the next storm.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        {/* Map panel */}
        <div className="h-[420px] rounded-lg border border-slate-200 overflow-hidden lg:h-auto lg:min-h-[460px]">
          <InsightsMapWrapper insights={insights} />
        </div>

        {/* Ranked list */}
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Top {insights.length} areas by risk score
          </p>
          <PredictedAreasPanel insights={insights} />

          <p className="mt-4 text-xs text-slate-400 leading-relaxed">
            Score = (incidents in last 30 days × 2) + (all-time incidents × 0.3).
            This is a heuristic over seeded data — replace{" "}
            <code className="font-mono">lib/data/predictions.ts</code> with a
            real BigQuery ML query when historical flood records are available.
          </p>
        </div>
      </div>
    </main>
  );
}
