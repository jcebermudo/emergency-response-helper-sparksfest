"use client";

/**
 * DisasterMap — Google Maps implementation.
 * Shows one marker per report (colour-coded by urgency) and an optional
 * heatmap layer weighted by urgency.
 */

import { useEffect, useRef } from "react";
import { loadLibrary } from "@/lib/gmaps";
import type { Report } from "@/lib/types";
import { urgencyDotColor } from "@/lib/ui/urgency-colors";

const METRO_MANILA_CENTER = { lat: 14.65, lng: 121.05 };
const URGENCY_WEIGHT: Record<Report["urgency"], number> = {
  low: 0.2,
  medium: 0.4,
  high: 0.7,
  critical: 1.0,
};

export function DisasterMap({
  reports,
  showHeatmap = true,
  onSelectReport,
}: {
  reports: Report[];
  showHeatmap?: boolean;
  onSelectReport?: (reportId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);

  // Initialise map once
  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    loadLibrary("maps").then(({ Map }) => {
      if (cancelled || !containerRef.current) return;
      if (!mapRef.current) {
        mapRef.current = new Map(containerRef.current, {
          center: METRO_MANILA_CENTER,
          zoom: 12,
          mapId: "disaster-map",
        });
      }
    });

    return () => { cancelled = true; };
  }, []);

  // Sync markers and heatmap whenever reports change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear old markers
    markersRef.current.forEach((m) => { m.map = null; });
    markersRef.current = [];
    heatmapRef.current?.setMap(null);
    heatmapRef.current = null;

    const map = mapRef.current;

    Promise.all([
      loadLibrary("marker"),
      loadLibrary("visualization"),
    ]).then(([{ AdvancedMarkerElement, PinElement }, { HeatmapLayer }]) => {
      reports.forEach((report) => {
        const position = { lat: report.location.lat, lng: report.location.lng };
        const dotColor = urgencyDotColor[report.urgency] ?? "#64748b";

        const pin = new PinElement({
          background: dotColor,
          borderColor: "#ffffff",
          glyphColor: "#ffffff",
          scale: report.urgency === "critical" ? 1.3 : 1,
        });

        const marker = new AdvancedMarkerElement({
          map,
          position,
          title: `${report.type} — ${report.area}`,
          content: pin.element,
        });

        marker.addListener("click", () => onSelectReport?.(report.id));
        markersRef.current.push(marker);
      });

      if (showHeatmap && reports.length > 0) {
        const points = reports.map((r) => ({
          location: new google.maps.LatLng(r.location.lat, r.location.lng),
          weight: URGENCY_WEIGHT[r.urgency],
        }));
        heatmapRef.current = new HeatmapLayer({
          data: points,
          map,
          radius: 40,
          opacity: 0.6,
        });
      }
    });
  }, [reports, showHeatmap, onSelectReport]);

  return <div ref={containerRef} style={{ height: "100%", width: "100%" }} />;
}
