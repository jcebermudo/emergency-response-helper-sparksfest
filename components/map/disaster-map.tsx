"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer } from "react-leaflet";
import type { Report } from "@/lib/types";
import { HeatmapLayer } from "@/components/map/heatmap-layer";
import { ReportMarker } from "@/components/map/report-marker";

const METRO_MANILA_CENTER: [number, number] = [14.65, 121.05];

export function DisasterMap({
  reports,
  showHeatmap = true,
  onSelectReport,
}: {
  reports: Report[];
  showHeatmap?: boolean;
  onSelectReport?: (reportId: string) => void;
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
        <ReportMarker key={report.id} report={report} onSelect={onSelectReport} />
      ))}
    </MapContainer>
  );
}
