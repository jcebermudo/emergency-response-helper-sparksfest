export interface NamedLocation {
  area: string;
  lat: number;
  lng: number;
}

// Real, recognizable flood-prone Metro Manila / Rizal barangays and
// localities with approximate coordinates. The first 10 entries match the
// original seed set (lib/data/seed.ts AREA_HISTORY_WEIGHTS is index-aligned
// to them) — appended entries extend coverage for the area autocomplete.
export const METRO_MANILA_LOCATIONS: NamedLocation[] = [
  { area: "Barangka, Marikina City", lat: 14.6297, lng: 121.0929 },
  { area: "Malanday, Marikina City", lat: 14.6423, lng: 121.1027 },
  { area: "Cainta, Rizal", lat: 14.5786, lng: 121.1222 },
  { area: "Rodriguez (Montalban), Rizal", lat: 14.7256, lng: 121.1236 },
  { area: "Rosario, Pasig City", lat: 14.5764, lng: 121.0851 },
  { area: "Manggahan, Pasig City", lat: 14.5764, lng: 121.1 },
  { area: "Payatas, Quezon City", lat: 14.7169, lng: 121.1122 },
  { area: "Batasan Hills, Quezon City", lat: 14.6907, lng: 121.1044 },
  { area: "Tanza, Navotas City", lat: 14.6667, lng: 120.9437 },
  { area: "Tugatog, Malabon City", lat: 14.6667, lng: 120.9578 },

  { area: "Nangka, Marikina City", lat: 14.6733, lng: 121.1108 },
  { area: "Tumana, Marikina City", lat: 14.6558, lng: 121.1067 },
  { area: "Santo Niño, Marikina City", lat: 14.6355, lng: 121.0983 },
  { area: "Concepcion Uno, Marikina City", lat: 14.6386, lng: 121.0956 },
  { area: "Taytay, Rizal", lat: 14.5586, lng: 121.1328 },
  { area: "Angono, Rizal", lat: 14.5257, lng: 121.1536 },
  { area: "Binangonan, Rizal", lat: 14.4653, lng: 121.1953 },
  { area: "San Mateo, Rizal", lat: 14.6963, lng: 121.1178 },
  { area: "Antipolo, Rizal", lat: 14.5878, lng: 121.176 },
  { area: "Santolan, Pasig City", lat: 14.6027, lng: 121.0819 },
  { area: "Pinagbuhatan, Pasig City", lat: 14.5619, lng: 121.0919 },
  { area: "Bagong Ilog, Pasig City", lat: 14.5647, lng: 121.0822 },
  { area: "Commonwealth, Quezon City", lat: 14.6989, lng: 121.0889 },
  { area: "Bagong Silangan, Quezon City", lat: 14.7053, lng: 121.1064 },
  { area: "Novaliches, Quezon City", lat: 14.7333, lng: 121.0333 },
  { area: "San Roque, Navotas City", lat: 14.6595, lng: 120.9427 },
  { area: "Catmon, Malabon City", lat: 14.6767, lng: 120.9527 },
  { area: "Longos, Malabon City", lat: 14.6683, lng: 120.9558 },
  { area: "Tondo, Manila", lat: 14.6167, lng: 120.9667 },
  { area: "Barangay 176, Caloocan City", lat: 14.7433, lng: 120.9822 },
  { area: "Marulas, Valenzuela City", lat: 14.7011, lng: 120.9689 },
  { area: "Dagat-Dagatan, Valenzuela City", lat: 14.6867, lng: 120.9611 },
  { area: "Lower Bicutan, Taguig City", lat: 14.5122, lng: 121.0533 },
  { area: "Pateros, Metro Manila", lat: 14.5453, lng: 121.0689 },
  { area: "Bayanan, Muntinlupa City", lat: 14.3931, lng: 121.0364 },
];
