"use client";

/**
 * DisasterMap — Leaflet/OpenStreetMap implementation.
 * Shows one marker per report (colour-coded by urgency).
 * When showHeatmap is true, a heat layer is drawn behind the markers.
 *
 * Uses Leaflet instead of Google Maps for the demo — no API key/quota
 * dependency (see lib/demo-mode.ts).
 */

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer } from "react-leaflet";
import type { Report } from "@/lib/types";
import { HeatmapLayer } from "@/components/map/heatmap-layer";
import { ReportMarker } from "@/components/map/report-marker";

const METRO_MANILA_CENTER: [number, number] = [14.65, 121.05];

export function DisasterMap({
  reports,
  showHeatmap = true,
  responderName,
  onUpdated,
}: {
  reports: Report[];
  showHeatmap?: boolean;
  responderName: string;
  onUpdated: (report: Report) => void;
}) {
  return (
    <MapContainer
      center={METRO_MANILA_CENTER}
      zoom={12}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {showHeatmap && <HeatmapLayer reports={reports} />}
      {reports.map((report) => (
        <ReportMarker
          key={report.id}
          report={report}
          responderName={responderName}
          onUpdated={onUpdated}
        />
      ))}
    </MapContainer>
  );
}
