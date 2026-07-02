"use client";

import { useEffect, useRef, useState } from "react";
import { METRO_MANILA_LOCATIONS, type NamedLocation } from "@/lib/data/locations";

const MAX_SUGGESTIONS = 6;

function matches(location: NamedLocation, query: string): boolean {
  return location.area.toLowerCase().includes(query.toLowerCase());
}

export function AreaAutocomplete({
  value,
  onChange,
  onSelectLocation,
}: {
  value: string;
  onChange: (value: string) => void;
  onSelectLocation: (lat: number, lng: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const suggestions =
    value.trim().length > 0
      ? METRO_MANILA_LOCATIONS.filter((loc) => matches(loc, value)).slice(0, MAX_SUGGESTIONS)
      : [];

  function selectLocation(loc: NamedLocation) {
    onChange(loc.area);
    onSelectLocation(loc.lat, loc.lng);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((h) => (h + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((h) => (h - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      selectLocation(suggestions[highlighted]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <input
        type="text"
        name="area"
        required
        autoComplete="off"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setHighlighted(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder="Start typing a barangay or city…"
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      />

      {open && suggestions.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 text-sm shadow-lg">
          {suggestions.map((loc, i) => (
            <li key={loc.area}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectLocation(loc)}
                className={`flex w-full items-center px-3 py-1.5 text-left hover:bg-slate-50 ${
                  i === highlighted ? "bg-slate-50 text-slate-900" : "text-slate-700"
                }`}
              >
                {loc.area}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
