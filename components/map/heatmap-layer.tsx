"use client";

import { useEffect } from "react";
import L from "leaflet";
import "leaflet.heat";
import { useMap } from "react-leaflet";
import type { Report } from "@/lib/types";

const URGENCY_WEIGHT: Record<Report["urgency"], number> = {
  low: 0.3,
  medium: 0.5,
  high: 0.8,
  critical: 1,
};

export function HeatmapLayer({ reports }: { reports: Report[] }) {
  const map = useMap();

  useEffect(() => {
    const points: L.HeatLatLngTuple[] = reports.map((r) => [
      r.location.lat,
      r.location.lng,
      URGENCY_WEIGHT[r.urgency],
    ]);

    const layer = L.heatLayer(points, { radius: 30, blur: 20, maxZoom: 17 });
    layer.addTo(map);

    return () => {
      map.removeLayer(layer);
    };
  }, [map, reports]);

  return null;
}
