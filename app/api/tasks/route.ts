/**
 * POST /api/tasks
 * Body: { type, location: { lat, lng }, description }
 *
 * Creates a new open task reported by the authenticated user.
 * Requires Authorization: Bearer <firebase-id-token> header.
 */
import { NextRequest, NextResponse } from "next/server";
import { FieldValue, GeoPoint } from "firebase-admin/firestore";
import { db, auth, isCredentialError } from "@/lib/firebase-admin";
import { TaskType } from "@/lib/types";

const VALID_TYPES: TaskType[] = ["rescue", "supply", "medical"];

export async function POST(request: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────
  const token = request.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) {
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await auth.verifyIdToken(token);
    uid = decoded.uid;
  } catch (err) {
    if (isCredentialError(err)) {
      return NextResponse.json({ error: "Server credentials not configured. Set FIREBASE_SERVICE_ACCOUNT in .env.local." }, { status: 503 });
    }
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // ── Validate body ────────────────────────────────────────────────────────
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { type, location, description } = body as {
    type: TaskType;
    location: { lat: number; lng: number };
    description: string;
  };

  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json(
      { error: `type must be one of: ${VALID_TYPES.join(", ")}` },
      { status: 400 }
    );
  }
  if (!location?.lat || !location?.lng) {
    return NextResponse.json(
      { error: "location.lat and location.lng are required" },
      { status: 400 }
    );
  }
  if (!description?.trim()) {
    return NextResponse.json({ error: "description is required" }, { status: 400 });
  }

  // ── Write ────────────────────────────────────────────────────────────────
  let ref: FirebaseFirestore.DocumentReference;
  try {
  ref = await db.collection("tasks").add({
    type,
    status: "open",
    location: new GeoPoint(location.lat, location.lng),
    reportedBy: uid,
    claimedBy: null,
    description: description.trim(),
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  } catch (err) {
    if (isCredentialError(err)) {
      return NextResponse.json({ error: "Server credentials not configured. Set FIREBASE_SERVICE_ACCOUNT in .env.local." }, { status: 503 });
    }
    throw err;
  }

  return NextResponse.json({ success: true, taskId: ref.id }, { status: 201 });
}
