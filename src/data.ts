import type { TimezoneEntry } from "./types";

export const TIMEZONE_ENTRIES: TimezoneEntry[] = [
	{ offset: -12, city: "Baker Is." },
	{ offset: -11, city: "Pago Pago" },
	{ offset: -10, city: "Honolulu" },
	{ offset: -9, city: "Anchorage" },
	{ offset: -8, city: "Los Angeles" },
	{ offset: -7, city: "Denver" },
	{ offset: -6, city: "Mexico City" },
	{ offset: -5, city: "New York" },
	{ offset: -4, city: "Santiago" },
	{ offset: -3, city: "São Paulo" },
	{ offset: -2, city: "Mid-Atlantic" },
	{ offset: -1, city: "Azores" },
	{ offset: 0, city: "London" },
	{ offset: 1, city: "Paris" },
	{ offset: 2, city: "Cairo" },
	{ offset: 3, city: "Moscow" },
	{ offset: 4, city: "Dubai" },
	{ offset: 5, city: "Karachi" },
	{ offset: 5.5, city: "Mumbai" },
	{ offset: 6, city: "Dhaka" },
	{ offset: 7, city: "Bangkok" },
	{ offset: 8, city: "Shanghai" },
	{ offset: 9, city: "Tokyo" },
	{ offset: 9.5, city: "Adelaide" },
	{ offset: 10, city: "Sydney" },
	{ offset: 11, city: "Nouméa" },
	{ offset: 12, city: "Auckland" },
];

export const OFFSET_CITY_MAP: Record<number, string> = Object.fromEntries(
	TIMEZONE_ENTRIES.map((e) => [e.offset, e.city]),
);

export const COLORS = {
	zoneA: "#ffb74d",
	zoneB: "#4fc3f7",
	textPrimary: "#e8dcc8",
	textSecondary: "#c8cdd8",
} as const;

export const WORLD_ATLAS_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export const MAP_WIDTH = 960;
export const MAP_HEIGHT = 480;
