import type { DayPhase } from "./types";

export function wrapHour(h: number): number {
  return ((h % 24) + 24) % 24;
}

export function getDayPhase(hour: number): DayPhase {
  const h = wrapHour(hour);
  if (h >= 6 && h < 18) return "day";
  if (h >= 5 && h < 6) return "dawn";
  if (h >= 18 && h < 19) return "dusk";
  return "night";
}

export function getDayIcon(phase: DayPhase): string {
  switch (phase) {
    case "day":
      return "☀";
    case "dawn":
    case "dusk":
      return "◐";
    case "night":
      return "☾";
  }
}

export function formatTime(fractionalHour: number): string {
  const wrapped = wrapHour(fractionalHour);
  const hours = Math.floor(wrapped);
  const minutes = Math.round((wrapped - hours) * 60) % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function getAmPm(fractionalHour: number): string {
  const h = Math.floor(wrapHour(fractionalHour));
  return h >= 12 ? "PM" : "AM";
}
