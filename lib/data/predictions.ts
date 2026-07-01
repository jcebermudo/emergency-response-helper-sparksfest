/**
 * getPredictedInsights — returns area risk scores for the Insights page.
 *
 * When a Firebase/GCP project is configured (NEXT_PUBLIC_FIREBASE_PROJECT_ID
 * is set at build time), this calls GET /api/insights which runs the live
 * BigQuery query over the tasks_history table.
 *
 * When no project is configured (local demo / CI) it falls back to the
 * in-memory heuristic over the seeded HistoricalRecord store so the UI still
 * works without any GCP credentials.
 */

import { historicalStore } from "@/lib/data/store";
import type { NeedType, PredictedAreaInsight } from "@/lib/types";

const RECENT_WINDOW_DAYS = 30;
const RECENCY_WEIGHT = 2;
const TOTAL_WEIGHT = 0.3;
const TOP_N = 8;

const HAS_FIREBASE_CONFIG = Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

export async function getPredictedInsights(): Promise<PredictedAreaInsight[]> {
  // ── Live path: BigQuery via API route ──────────────────────────────────────
  if (HAS_FIREBASE_CONFIG) {
    try {
      const res = await fetch(`${BASE_URL}/api/insights`, { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { insights: PredictedAreaInsight[] };
        // If BQ returned results, use them; otherwise fall through to mock
        if (data.insights.length > 0) return data.insights;
      }
    } catch {
      // Network error — fall through to mock
    }
  }

  // ── Mock fallback: in-memory heuristic ────────────────────────────────────
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
