"use client";

/**
 * DisasterMap — Google Maps implementation.
 * Shows one marker per report (colour-coded by urgency).
 * When showHeatmap is true, a translucent circle is drawn behind each marker
 * sized by urgency — replaces the deprecated HeatmapLayer (removed in v3.65).
 */

import { useEffect, useRef } from "react";
import { loadLibrary } from "@/lib/gmaps";
import type { Report } from "@/lib/types";
import { urgencyDotColor } from "@/lib/ui/urgency-colors";

const METRO_MANILA_CENTER = { lat: 14.65, lng: 121.05 };

// Heatmap circle radii in metres, keyed by urgency
const URGENCY_RADIUS: Record<Report["urgency"], number> = {
  low:      200,
  medium:   350,
  high:     500,
  critical: 700,
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
  const circlesRef = useRef<google.maps.Circle[]>([]);

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

  // Sync markers and circles whenever reports change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear previous overlays
    markersRef.current.forEach((m) => { m.map = null; });
    markersRef.current = [];
    circlesRef.current.forEach((c) => c.setMap(null));
    circlesRef.current = [];

    const map = mapRef.current;

    Promise.all([
      loadLibrary("marker"),
      loadLibrary("maps"),
    ]).then(([{ AdvancedMarkerElement, PinElement }, { Circle }]) => {
      reports.forEach((report) => {
        const position = { lat: report.location.lat, lng: report.location.lng };
        const color = urgencyDotColor[report.urgency] ?? "#64748b";

        // Urgency heatmap circle
        if (showHeatmap) {
          circlesRef.current.push(new Circle({
            map,
            center: position,
            radius: URGENCY_RADIUS[report.urgency],
            strokeOpacity: 0,
            fillColor: color,
            fillOpacity: 0.18,
          }));
        }

        // Pin marker — pass PinElement directly (pin.element is deprecated)
        const pin = new PinElement({
          background: color,
          borderColor: "#ffffff",
          glyphColor: "#ffffff",
          scale: report.urgency === "critical" ? 1.3 : 1,
        });

        const marker = new AdvancedMarkerElement({
          map,
          position,
          title: `${report.type} — ${report.area}`,
          content: pin,
        });

        // gmp-click replaces the deprecated 'click' event on AdvancedMarkerElement
        marker.addEventListener("gmp-click", () => onSelectReport?.(report.id));
        markersRef.current.push(marker);
      });
    });
  }, [reports, showHeatmap, onSelectReport]);

  return <div ref={containerRef} style={{ height: "100%", width: "100%" }} />;
}
