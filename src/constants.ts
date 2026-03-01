// Keep in sync with @theme tokens in index.css
export const COLORS = {
  zoneA: "#ffb74d",
  zoneB: "#4fc3f7",
  textPrimary: "#e8dcc8",
  textSecondary: "#c8cdd8",
  geo: "#c8d2e6",
  tooltipBg: "rgba(10,14,23,0.92)",
} as const;

export const BAND_FILLS = {
  day: "rgba(255,213,79,0.08)",
  dawn: "rgba(255,152,67,0.06)",
  dusk: "rgba(255,111,67,0.06)",
  night: "rgba(30,40,70,0.15)",
} as const;

export const WORLD_ATLAS_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export const MAP_WIDTH = 960;
export const MAP_HEIGHT = 480;
