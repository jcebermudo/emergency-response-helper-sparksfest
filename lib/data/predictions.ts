// MOCK: replace with a real BigQuery ML / historical-analytics query later.
// Keep the return shape of getPredictedInsights stable so callers don't change.

import { historicalStore } from "@/lib/data/store";
import type { NeedType, PredictedAreaInsight } from "@/lib/types";

const RECENT_WINDOW_DAYS = 30;
const RECENCY_WEIGHT = 2;
const TOTAL_WEIGHT = 0.3;
const TOP_N = 8;

export async function getPredictedInsights(): Promise<PredictedAreaInsight[]> {
  const now = Date.now();

  const byArea = new Map<
    string,
    { lat: number; lng: number; typeCounts: Map<NeedType, number>; recentCount: number; total: number }
  >();

  for (const record of historicalStore) {
    const entry = byArea.get(record.area) ?? {
      lat: record.lat,
      lng: record.lng,
      typeCounts: new Map<NeedType, number>(),
      recentCount: 0,
      total: 0,
    };

    entry.total += 1;
    entry.typeCounts.set(record.type, (entry.typeCounts.get(record.type) ?? 0) + 1);

    const ageDays = (now - new Date(record.timestamp).getTime()) / 86_400_000;
    if (ageDays <= RECENT_WINDOW_DAYS) {
      entry.recentCount += 1;
    }

    byArea.set(record.area, entry);
  }

  const insights: PredictedAreaInsight[] = [];
  for (const [area, entry] of byArea) {
    const score = entry.recentCount * RECENCY_WEIGHT + entry.total * TOTAL_WEIGHT;
    let dominantNeedType: NeedType = "other";
    let maxCount = -1;
    for (const [type, count] of entry.typeCounts) {
      if (count > maxCount) {
        maxCount = count;
        dominantNeedType = type;
      }
    }

    insights.push({
      area,
      lat: entry.lat,
      lng: entry.lng,
      score: Math.round(score * 100) / 100,
      dominantNeedType,
      sampleSize: entry.total,
    });
  }

  return insights.sort((a, b) => b.score - a.score).slice(0, TOP_N);
}
