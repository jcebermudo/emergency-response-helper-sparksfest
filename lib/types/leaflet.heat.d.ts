// leaflet.heat has no official/reliable TypeScript types. This is a small
// manual shim covering only what this project uses. The `export {}` below
// makes this a module (rather than a global script), which is required for
// `declare module "leaflet"` to be treated as an augmentation that merges
// with @types/leaflet instead of shadowing it.
export {};

declare module "leaflet.heat" {
  import type { LayerOptions } from "leaflet";

  export interface HeatLayerOptions extends LayerOptions {
    minOpacity?: number;
    maxZoom?: number;
    max?: number;
    radius?: number;
    blur?: number;
    gradient?: Record<number, string>;
  }
}

declare module "leaflet" {
  export type HeatLatLngTuple = [number, number, number?];

  export interface HeatLayer extends Layer {
    setLatLngs(latlngs: HeatLatLngTuple[]): this;
    addLatLng(latlng: HeatLatLngTuple): this;
  }

  export function heatLayer(
    latlngs: HeatLatLngTuple[],
    options?: import("leaflet.heat").HeatLayerOptions
  ): HeatLayer;
}
