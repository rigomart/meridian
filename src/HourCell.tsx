import { wrapHour } from "./time";
import type { HourCellProps } from "./types";

export default function HourCell({ hour, cellW, color, currentHour }: HourCellProps) {
  const wrappedHour = wrapHour(hour);
  const isCurrentHour = Math.floor(wrappedHour) === Math.floor(wrapHour(currentHour));

  if (isCurrentHour) {
    return (
      <div
        className="h-10 sm:h-12 shrink-0 flex items-center justify-center border-r border-r-white/4 text-xs sm:text-sm font-bold font-mono text-white select-none"
        style={{ width: cellW, background: `${color}99` }}
      >
        {String(Math.floor(wrapHour(currentHour)))}
      </div>
    );
  }

  const isWorkHour = wrappedHour >= 9 && wrappedHour < 17;
  const isDaytime = wrappedHour >= 6 && wrappedHour < 18;

  const bg = isWorkHour ? `${color}1a` : isDaytime ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.2)";

  return (
    <div
      className="h-10 sm:h-12 shrink-0 flex items-center justify-center border-r border-r-white/4 text-[10px] sm:text-xs font-mono text-text-secondary/45 select-none"
      style={{ width: cellW, background: bg }}
    >
      {String(Math.floor(wrappedHour))}
    </div>
  );
}
