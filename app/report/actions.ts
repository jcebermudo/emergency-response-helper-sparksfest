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
import { getBaseUrl } from "@/lib/base-url";
import { DEMO_MODE } from "@/lib/demo-mode";
import type { NeedType, TaskType, UrgencyLevel } from "@/lib/types";

/** Map frontend NeedType values to the API's TaskType vocabulary. */
const NEED_TO_TASK_TYPE: Record<NeedType, TaskType> = {
  food:       "supply",
  medical:    "medical",
  evacuation: "rescue",
  other:      "supply",
};

// Same gate as dashboard-client.tsx's onSnapshot: true when this deploy
// should behave like a real, Firebase-backed production app.
const HAS_FIREBASE_CONFIG = Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
const IS_LIVE_FIREBASE = !DEMO_MODE && HAS_FIREBASE_CONFIG;

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

  // In a live Firebase deploy, a missing token is a real problem (not
  // signed in, or the client failed to fetch one) — surface it as an error
  // instead of silently writing to the non-persistent mock store, which
  // shows "success" but the report vanishes. Mock fallback is only for
  // when Firebase genuinely isn't configured (local dev / demo).
  if (IS_LIVE_FIREBASE && !idToken) {
    return {
      status: "error",
      message: "You must be signed in to submit a report. Please sign in and try again.",
    };
  }

  if (IS_LIVE_FIREBASE) {
    const res = await fetch(`${getBaseUrl()}/api/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        type: NEED_TO_TASK_TYPE[type],
        needType: type,
        location: { lat, lng },
        description,
        area,
        urgency,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        status: "error",
        message: data?.error ?? `Server error: ${res.status}`,
      };
    }
  } else {
    // Mock path — Firebase isn't configured for this deploy at all (local
    // dev / demo). Not reached when IS_LIVE_FIREBASE, even without a token.
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
