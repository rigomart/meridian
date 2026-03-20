// Keep in sync with @theme tokens in index.css
export const COLORS = {
  zoneA: "#f97316",
  zoneB: "#38bdf8",
  textPrimary: "#f4f4f5",
  textSecondary: "#a1a1aa",
  geo: "#71717a",
  tooltipBg: "rgba(9,9,11,0.95)",
} as const;

export const BAND_FILLS = {
  day: "rgba(250,250,255,0.05)",
  dawn: "rgba(251,146,60,0.04)",
  dusk: "rgba(251,146,60,0.04)",
  night: "rgba(0,0,0,0.15)",
} as const;

export const WORLD_ATLAS_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export const MAP_WIDTH = 960;
export const MAP_HEIGHT = 480;
