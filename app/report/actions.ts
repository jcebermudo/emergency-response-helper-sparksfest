"use server";

import { revalidatePath } from "next/cache";
import { createReport } from "@/lib/data/reports";
import type { NeedType, UrgencyLevel } from "@/lib/types";

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
  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));

  if (!area || !description || Number.isNaN(lat) || Number.isNaN(lng)) {
    return { status: "error", message: "Please fill in all required fields and pin a location on the map." };
  }

  await createReport({
    type,
    urgency,
    area,
    description,
    location: { lat, lng },
    contactInfo: contactInfo || undefined,
  });

  revalidatePath("/dashboard");
  revalidatePath("/");

  return { status: "success" };
}
