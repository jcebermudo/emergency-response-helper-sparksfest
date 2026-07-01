import type { HistoricalRecord, Report } from "@/lib/types";
import { seedHistoricalRecords, seedReports } from "@/lib/data/seed";

// In-memory store, dev/demo-only. Data does NOT persist across server restarts
// or serverless cold starts. globalThis caching keeps state alive across Next's
// Fast Refresh module re-evaluation in dev (same pattern as a Prisma-client
// singleton). Swap this whole file for a real Firestore/BigQuery client later —
// lib/data/reports.ts and lib/data/predictions.ts are the stable interface.
const globalForStore = globalThis as unknown as {
  __reports?: Report[];
  __historicalRecords?: HistoricalRecord[];
};

export const reportsStore: Report[] =
  globalForStore.__reports ?? (globalForStore.__reports = seedReports());

export const historicalStore: HistoricalRecord[] =
  globalForStore.__historicalRecords ??
  (globalForStore.__historicalRecords = seedHistoricalRecords());
