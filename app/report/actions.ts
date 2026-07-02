"use server";

/**
 * app/report/actions.ts
 *
 * createReportAction — calls the real POST /api/tasks endpoint when Firebase
 * credentials are available; falls back to the in-memory mock store otherwise
 * (so the demo still works without a Firebase project).
 */

import { revalidatePath } from "next/cache";
import { createReport } from "@/lib/data/reports";
import type { NeedType, TaskType, UrgencyLevel } from "@/lib/types";

/** Map frontend NeedType values to the API's TaskType vocabulary. */
const NEED_TO_TASK_TYPE: Record<NeedType, TaskType> = {
  food:       "supply",
  medical:    "medical",
  evacuation: "rescue",
  other:      "supply",
};

export interface CreateReportState {
  status: "idle" | "success" | "error";
  message?: string;
}

export async function createReportAction(
  _prevState: CreateReportState,
  formData: FormData
): Promise<CreateReportState> {
  const type = formData.get("type") as NeedType;
  const urgency = formData.get("urgency") as UrgencyLevel;
  const area = String(formData.get("area") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const contactInfo = String(formData.get("contactInfo") ?? "").trim();
  const reportedBy = String(formData.get("reportedBy") ?? "").trim();
  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));
  // ID token forwarded from the client via a hidden field (set by ReportForm)
  const idToken = String(formData.get("__idToken") ?? "").trim();

  if (!area || !description || Number.isNaN(lat) || Number.isNaN(lng)) {
    return {
      status: "error",
      message: "Please fill in all required fields and pin a location on the map.",
    };
  }

  // If a Firebase ID token was forwarded, hit the real Firestore API route.
  // Otherwise fall back to the in-memory mock store (demo / local dev without creds).
  if (idToken) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({ type: NEED_TO_TASK_TYPE[type], location: { lat, lng }, description }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        status: "error",
        message: data?.error ?? `Server error: ${res.status}`,
      };
    }
  } else {
    // Mock path — no auth token available
    await createReport({
      type,
      urgency,
      area,
      description,
      location: { lat, lng },
      contactInfo: contactInfo || undefined,
      reportedBy: reportedBy || undefined,
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/");

  return { status: "success" };
}
