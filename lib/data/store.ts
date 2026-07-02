import fs from "fs";
import path from "path";
import type { HistoricalRecord, Report } from "@/lib/types";
import { seedHistoricalRecords, seedReports } from "@/lib/data/seed";

// Dev-only: the demo runs one `next dev` process per fake-login port (see
// lib/demo-user.ts), which are separate Node processes, so a plain
// in-memory array wouldn't be visible across them. In development, reports
// are persisted to disk instead so every process reads/writes the same
// data — this is what makes "Juan on :3000 reports a need, Maria on :3001
// sees it" work without Firebase. Not safe for concurrent writes at real
// scale, and most production hosts (e.g. serverless) have a read-only or
// ephemeral filesystem anyway, so production keeps the single-process
// in-memory store. Swap this whole file for a real Firestore/BigQuery
// client later — lib/data/reports.ts and lib/data/predictions.ts are the
// stable interface.
const IS_DEV = process.env.NODE_ENV === "development";

const DATA_DIR = path.join(process.cwd(), ".demo-store");
const REPORTS_FILE = path.join(DATA_DIR, "reports.json");

function ensureReportsFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(REPORTS_FILE)) {
    fs.writeFileSync(REPORTS_FILE, JSON.stringify(seedReports(), null, 2));
  }
}

// In-memory fallback for non-dev environments. globalThis caching keeps
// state alive across Next's Fast Refresh module re-evaluation in dev (same
// pattern as a Prisma-client singleton) and across warm serverless
// invocations in production.
const globalForStore = globalThis as unknown as {
  __reports?: Report[];
  __historicalRecords?: HistoricalRecord[];
};

function getInMemoryReports(): Report[] {
  return globalForStore.__reports ?? (globalForStore.__reports = seedReports());
}

export function readReportsStore(): Report[] {
  if (!IS_DEV) return getInMemoryReports();
  ensureReportsFile();
  return JSON.parse(fs.readFileSync(REPORTS_FILE, "utf-8"));
}

export function writeReportsStore(reports: Report[]): void {
  if (!IS_DEV) {
    globalForStore.__reports = reports;
    return;
  }
  ensureReportsFile();
  fs.writeFileSync(REPORTS_FILE, JSON.stringify(reports, null, 2));
}

// Historical records only feed the read-only insights heuristic (no writes,
// no cross-process notification need), so an in-memory singleton is fine in
// both dev and production.
export const historicalStore: HistoricalRecord[] =
  globalForStore.__historicalRecords ??
  (globalForStore.__historicalRecords = seedHistoricalRecords());
