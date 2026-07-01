export type NeedType = "food" | "medical" | "evacuation" | "other";

export type UrgencyLevel = "low" | "medium" | "high" | "critical";

export type ReportStatus = "open" | "claimed" | "in_progress" | "resolved";

export interface Report {
  id: string;
  type: NeedType;
  location: { lat: number; lng: number };
  area: string;
  description: string;
  urgency: UrgencyLevel;
  status: ReportStatus;
  contactInfo?: string;
  claimedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewReportInput {
  type: NeedType;
  location: { lat: number; lng: number };
  area: string;
  description: string;
  urgency: UrgencyLevel;
  contactInfo?: string;
}

// Responder identity is a plain typed name cached in localStorage — deliberate
// prototype simplification, not a security boundary. Anyone can claim as anyone.
export interface Responder {
  id: string;
  name: string;
}

export interface HistoricalRecord {
  area: string;
  lat: number;
  lng: number;
  type: NeedType;
  timestamp: string;
}

export interface PredictedAreaInsight {
  area: string;
  lat: number;
  lng: number;
  score: number;
  dominantNeedType: NeedType;
  sampleSize: number;
}
