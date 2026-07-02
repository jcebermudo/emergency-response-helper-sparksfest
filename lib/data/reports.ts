import { randomUUID } from "crypto";
import { readReportsStore, writeReportsStore } from "@/lib/data/store";
import type { NeedType, NewReportInput, Report, ReportStatus } from "@/lib/types";

export interface ReportFilters {
  type?: NeedType;
  status?: ReportStatus;
}

// All functions below return Promises even though the backing store is
// synchronous file I/O. This keeps call sites (Server Actions, components)
// stable when this file is later swapped for a real async Firestore/BigQuery
// adapter.

export async function getReports(filters?: ReportFilters): Promise<Report[]> {
  let results = readReportsStore();
  if (filters?.type) {
    results = results.filter((r) => r.type === filters.type);
  }
  if (filters?.status) {
    results = results.filter((r) => r.status === filters.status);
  }
  return results.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getReportById(id: string): Promise<Report | null> {
  return readReportsStore().find((r) => r.id === id) ?? null;
}

export async function createReport(input: NewReportInput): Promise<Report> {
  const now = new Date().toISOString();
  const report: Report = {
    id: `report-${randomUUID()}`,
    type: input.type,
    location: input.location,
    area: input.area,
    description: input.description,
    urgency: input.urgency,
    contactInfo: input.contactInfo,
    reportedBy: input.reportedBy,
    status: "open",
    createdAt: now,
    updatedAt: now,
  };
  const reports = readReportsStore();
  reports.unshift(report);
  writeReportsStore(reports);
  return report;
}

export async function claimReport(id: string, responderName: string): Promise<Report> {
  const reports = readReportsStore();
  const report = reports.find((r) => r.id === id);
  if (!report) {
    throw new Error(`Report ${id} not found`);
  }
  // Check-then-set guard against duplicate claims. Two separate demo
  // processes writing near-simultaneously can still race on the file; when
  // swapped for real Firestore, this is the seam where a transaction would go.
  if (report.status !== "open") {
    throw new Error(`Report ${id} is already ${report.status}`);
  }
  report.status = "claimed";
  report.claimedBy = responderName;
  report.updatedAt = new Date().toISOString();
  writeReportsStore(reports);
  return report;
}

export async function updateReportStatus(
  id: string,
  status: ReportStatus,
  responderName: string
): Promise<Report> {
  const reports = readReportsStore();
  const report = reports.find((r) => r.id === id);
  if (!report) {
    throw new Error(`Report ${id} not found`);
  }
  if (report.claimedBy && report.claimedBy !== responderName) {
    throw new Error(`Report ${id} is claimed by another responder`);
  }
  report.status = status;
  report.claimedBy = report.claimedBy ?? responderName;
  report.updatedAt = new Date().toISOString();
  writeReportsStore(reports);
  return report;
}
