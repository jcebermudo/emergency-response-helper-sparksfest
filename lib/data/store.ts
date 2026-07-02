import fs from "fs";
import path from "path";
import type { HistoricalRecord, Report } from "@/lib/types";
import { seedHistoricalRecords, seedReports } from "@/lib/data/seed";

// File-backed store, dev/demo-only. Each `next dev` invocation is a separate
// Node process (e.g. the demo runs one per fake-login port, see
// lib/demo-user.ts), so a plain in-memory array wouldn't be visible across
// them. Reports are persisted to disk instead so every process reads/writes
// the same data — this is what makes "Juan on :3000 reports a need, Maria on
// :3001 sees it" work without Firebase. Not safe for concurrent writes at
// real scale; fine for a local demo. Swap this whole file for a real
// Firestore/BigQuery client later — lib/data/reports.ts and
// lib/data/predictions.ts are the stable interface.
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

export function readReportsStore(): Report[] {
  ensureReportsFile();
  return JSON.parse(fs.readFileSync(REPORTS_FILE, "utf-8"));
}

export function writeReportsStore(reports: Report[]): void {
  ensureReportsFile();
  fs.writeFileSync(REPORTS_FILE, JSON.stringify(reports, null, 2));
}

// Historical records only feed the read-only insights heuristic (no writes,
// no cross-process notification need), so an in-memory singleton is fine.
const globalForStore = globalThis as unknown as {
  __historicalRecords?: HistoricalRecord[];
};

export const historicalStore: HistoricalRecord[] =
  globalForStore.__historicalRecords ??
  (globalForStore.__historicalRecords = seedHistoricalRecords());
