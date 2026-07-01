/**
 * GET /api/tasks/nearby?lat=14.5995&lng=120.9842&radiusKm=5&status=open
 *
 * Returns tasks within `radiusKm` kilometres of the given lat/lng.
 * Firestore doesn't support native geo-radius queries, so we fetch a
 * bounding-box first then filter to the exact circle in JS.
 *
 * This runs server-side so the Firebase Admin SDK can be used without
 * exposing service-account credentials to the browser.
 */
import { NextRequest, NextResponse } from "next/server";
import { Timestamp, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { db } from "@/lib/firebase-admin";
import { Task, TaskStatus } from "@/lib/types";

const EARTH_RADIUS_KM = 6371;

function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const lat      = parseFloat(searchParams.get("lat") ?? "");
  const lng      = parseFloat(searchParams.get("lng") ?? "");
  const radiusKm = parseFloat(searchParams.get("radiusKm") ?? "5");
  const status   = (searchParams.get("status") ?? "open") as TaskStatus;

  if (isNaN(lat) || isNaN(lng)) {
    return NextResponse.json(
      { error: "lat and lng query params are required" },
      { status: 400 }
    );
  }

  // Rough bounding-box in degrees (1° lat ≈ 111 km)
  const deltaLat = radiusKm / 111;
  const deltaLng = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

  const snap = await db
    .collection("tasks")
    .where("status", "==", status)
    .get();

  type TaskRow = Task & { id: string };

  const allRows: TaskRow[] = snap.docs.map(
    (doc: QueryDocumentSnapshot) => ({ id: doc.id, ...(doc.data() as Task) })
  );

  const results: TaskRow[] = allRows.filter((t: TaskRow) => {
    const tLat = t.location.latitude;
    const tLng = t.location.longitude;
    // Bounding-box pre-filter (cheap)
    if (
      tLat < lat - deltaLat || tLat > lat + deltaLat ||
      tLng < lng - deltaLng || tLng > lng + deltaLng
    ) return false;
    // Exact distance filter
    return haversineKm(lat, lng, tLat, tLng) <= radiusKm;
  });

  // Serialize: GeoPoint and Timestamp aren't JSON-serializable
  const serialised = results.map((t) => ({
    id: t.id,
    type: t.type,
    status: t.status,
    location: {
      lat: t.location.latitude,
      lng: t.location.longitude,
    },
    reportedBy: t.reportedBy,
    claimedBy: t.claimedBy,
    description: t.description,
    createdAt: (t.createdAt as Timestamp).toDate().toISOString(),
    updatedAt: (t.updatedAt as Timestamp).toDate().toISOString(),
  }));

  return NextResponse.json({ tasks: serialised });
}
