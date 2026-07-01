/**
 * Google Maps JS API initialisation — v2 functional API.
 * Call initGmaps() once (idempotent) before any importLibrary() call.
 */
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import type { LibraryMap } from "@googlemaps/js-api-loader";

let initialised = false;

function init() {
  if (initialised) return;
  initialised = true;
  setOptions({
    key: process.env.NEXT_PUBLIC_GMAPS_API_KEY!,
    v: "weekly",
  });
}

export function loadLibrary<T extends keyof LibraryMap>(name: T): Promise<LibraryMap[T]> {
  init();
  return importLibrary(name);
}
