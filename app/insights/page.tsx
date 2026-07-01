import { getPredictedInsights } from "@/lib/data/predictions";
import { PredictedAreasPanel } from "@/components/insights/predicted-areas-panel";

export default async function InsightsPage() {
  const insights = await getPredictedInsights();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Predicted High-Need Areas</h1>
      <p className="mt-1 text-sm text-slate-600">
        Ranked by recency-weighted frequency of historical reports. This is a
        mocked heuristic over seeded historical data — replace with a real
        BigQuery ML query once historical flood data is available.
      </p>
      <div className="mt-6">
        <PredictedAreasPanel insights={insights} />
      </div>
    </main>
  );
}
