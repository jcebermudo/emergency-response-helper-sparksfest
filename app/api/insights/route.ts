/**
 * GET /api/insights
 *
 * Queries BigQuery for the recency-weighted area risk scores used by the
 * Insights page. Falls back gracefully when BigQuery is unavailable
 * (returns an empty array so the caller uses the local mock heuristic).
 *
 * BigQuery SQL mirrors the heuristic in lib/data/predictions.ts:
 *   score = (incidents in last 30 days × 2) + (all-time incidents × 0.3)
 *
 * No auth required — this is read-only, non-sensitive aggregated data.
 */
import { NextResponse } from "next/server";
import { BigQuery } from "@google-cloud/bigquery";
import type { PredictedAreaInsight, NeedType } from "@/lib/types";

const DATASET = "emergency_response";
const TABLE   = "tasks_history";
const TOP_N   = 8;

const QUERY = `
  WITH base AS (
    SELECT
      area,
      AVG(latitude)  AS lat,
      AVG(longitude) AS lng,
      type,
      COUNT(*)       AS cnt,
      COUNTIF(updated_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)) AS recent_cnt
    FROM \`${DATASET}.${TABLE}\`
    GROUP BY area, type
  ),
  scored AS (
    SELECT
      area,
      ANY_VALUE(lat) AS lat,
      ANY_VALUE(lng) AS lng,
      ROUND(SUM(recent_cnt) * 2 + SUM(cnt) * 0.3, 2) AS score,
      SUM(cnt) AS sample_size,
      ARRAY_AGG(STRUCT(type, cnt) ORDER BY cnt DESC LIMIT 1)[OFFSET(0)].type AS dominant_type
    FROM base
    GROUP BY area
  )
  SELECT area, lat, lng, score, sample_size, dominant_type
  FROM scored
  ORDER BY score DESC
  LIMIT ${TOP_N}
`;

export async function GET() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    return NextResponse.json({ insights: [] });
  }

  try {
    const bq = new BigQuery({ projectId });
    const [rows] = await bq.query({ query: QUERY, location: "asia-southeast1" });

    const insights: PredictedAreaInsight[] = rows.map(
      (row: Record<string, unknown>) => ({
        area:              String(row.area),
        lat:               Number(row.lat),
        lng:               Number(row.lng),
        score:             Number(row.score),
        sampleSize:        Number(row.sample_size),
        dominantNeedType:  String(row.dominant_type) as NeedType,
      })
    );

    return NextResponse.json({ insights });
  } catch {
    // BQ not available in this environment — caller falls back to mock
    return NextResponse.json({ insights: [] });
  }
}
