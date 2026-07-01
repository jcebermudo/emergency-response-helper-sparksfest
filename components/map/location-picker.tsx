"use client";

/**
 * LocationPicker — Google Maps implementation.
 * Click anywhere on the map to drop a pin and capture lat/lng.
 */

import { useEffect, useLayoutEffect, useRef } from "react";
import { loadLibrary } from "@/lib/gmaps";

const METRO_MANILA_CENTER = { lat: 14.65, lng: 121.05 };

export function LocationPicker({
  value,
  onChange,
}: {
  value: { lat: number; lng: number } | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  // Stable ref so the click listener never captures a stale onChange
  const onChangeRef = useRef(onChange);
  useLayoutEffect(() => {
    onChangeRef.current = onChange;
  });

  // Initialise map once on mount
  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;

    Promise.all([
      loadLibrary("maps"),
      loadLibrary("marker"),
    ]).then(([{ Map }, { AdvancedMarkerElement }]) => {
      if (cancelled || !containerRef.current) return;

      if (!mapRef.current) {
        mapRef.current = new Map(containerRef.current, {
          center: value ?? METRO_MANILA_CENTER,
          zoom: 12,
          mapId: "location-picker",
        });

        mapRef.current.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();

          if (markerRef.current) {
            markerRef.current.position = { lat, lng };
          } else {
            markerRef.current = new AdvancedMarkerElement({
              map: mapRef.current!,
              position: { lat, lng },
            });
          }

          onChangeRef.current(lat, lng);
        });
      }

      // Drop pin if value was pre-set before map loaded
      if (value && !markerRef.current) {
        markerRef.current = new AdvancedMarkerElement({
          map: mapRef.current,
          position: value,
        });
        mapRef.current.setCenter(value);
      }
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep marker in sync when value changes externally
  useEffect(() => {
    if (!mapRef.current || !value) return;
    loadLibrary("marker").then(({ AdvancedMarkerElement }) => {
      if (markerRef.current) {
        markerRef.current.position = value;
      } else {
        markerRef.current = new AdvancedMarkerElement({
          map: mapRef.current!,
          position: value,
        });
      }
      mapRef.current!.panTo(value);
    });
  }, [value]);

  return <div ref={containerRef} style={{ height: "100%", width: "100%" }} />;
}
