export interface NamedLocation {
  area: string;
  lat: number;
  lng: number;
}

// Street/purok/sitio-level flood-prone locations across Metro Manila and
// Rizal, grouped by barangay for realism. The first 10 entries match the
// original seed set (lib/data/seed.ts AREA_HISTORY_WEIGHTS is index-aligned
// to them) — appended entries extend coverage for the area autocomplete
// with finer-grained, more specific addresses within those same barangays
// and beyond.
export const METRO_MANILA_LOCATIONS: NamedLocation[] = [
  { area: "J.P. Rizal St., Barangka, Marikina City", lat: 14.6297, lng: 121.0929 },
  { area: "Beata St., Malanday, Marikina City", lat: 14.6423, lng: 121.1027 },
  { area: "Sitio Ilaya, Cainta, Rizal", lat: 14.5786, lng: 121.1222 },
  { area: "Purok 4, San Jose, Rodriguez, Rizal", lat: 14.7256, lng: 121.1236 },
  { area: "C. Raymundo Ave., Rosario, Pasig City", lat: 14.5764, lng: 121.0851 },
  { area: "Amang Rodriguez Ave., Manggahan, Pasig City", lat: 14.5764, lng: 121.1 },
  { area: "Purok 6, Payatas, Quezon City", lat: 14.7169, lng: 121.1122 },
  { area: "Sitio San Roque, Batasan Hills, Quezon City", lat: 14.6907, lng: 121.1044 },
  { area: "R-10 Riverside, Tanza, Navotas City", lat: 14.6667, lng: 120.9437 },
  { area: "M. Naval St., Tugatog, Malabon City", lat: 14.6667, lng: 120.9578 },

  { area: "Sitio Kabuboy, Nangka, Marikina City", lat: 14.6733, lng: 121.1108 },
  { area: "A. Bonifacio Ave., Tumana, Marikina City", lat: 14.6558, lng: 121.1067 },
  { area: "Riverbanks Rd., Santo Niño, Marikina City", lat: 14.6355, lng: 121.0983 },
  { area: "Purok 2, Concepcion Uno, Marikina City", lat: 14.6386, lng: 121.0956 },
  { area: "Sitio Wawa, Barangka Ibaba, Marikina City", lat: 14.6272, lng: 121.0907 },

  { area: "Manggahan Floodway, Taytay, Rizal", lat: 14.5586, lng: 121.1328 },
  { area: "Purok 3, Angono, Rizal", lat: 14.5257, lng: 121.1536 },
  { area: "Sitio Kalinawan, Binangonan, Rizal", lat: 14.4653, lng: 121.1953 },
  { area: "Marikina-Infanta Rd., San Mateo, Rizal", lat: 14.6963, lng: 121.1178 },
  { area: "Sumulong Highway, Antipolo, Rizal", lat: 14.5878, lng: 121.176 },

  { area: "Marcos Highway, Santolan, Pasig City", lat: 14.6027, lng: 121.0819 },
  { area: "Sitio Ligid Tipas, Pinagbuhatan, Pasig City", lat: 14.5619, lng: 121.0919 },
  { area: "Kapitolyo Extension, Bagong Ilog, Pasig City", lat: 14.5647, lng: 121.0822 },

  { area: "Purok 5, Commonwealth, Quezon City", lat: 14.6989, lng: 121.0889 },
  { area: "Sitio Masagana, Bagong Silangan, Quezon City", lat: 14.7053, lng: 121.1064 },
  { area: "Quirino Highway, Novaliches, Quezon City", lat: 14.7333, lng: 121.0333 },

  { area: "R-10 Extension, San Roque, Navotas City", lat: 14.6595, lng: 120.9427 },
  { area: "Sitio Baclaran, Catmon, Malabon City", lat: 14.6767, lng: 120.9527 },
  { area: "M. H. Del Pilar St., Longos, Malabon City", lat: 14.6683, lng: 120.9558 },

  { area: "Tenement Compound, Tondo, Manila", lat: 14.6167, lng: 120.9667 },
  { area: "Purok 7, Barangay 176, Caloocan City", lat: 14.7433, lng: 120.9822 },
  { area: "Gen. T. de Leon Rd., Marulas, Valenzuela City", lat: 14.7011, lng: 120.9689 },
  { area: "Dagat-Dagatan Ave., Valenzuela City", lat: 14.6867, lng: 120.9611 },

  { area: "SSHG Village, Lower Bicutan, Taguig City", lat: 14.5122, lng: 121.0533 },
  { area: "M. Almeda St., Pateros, Metro Manila", lat: 14.5453, lng: 121.0689 },
  { area: "Purok 1, Bayanan, Muntinlupa City", lat: 14.3931, lng: 121.0364 },
];
