import TimezoneCombobox from "./TimezoneCombobox";
import { formatTime, getAmPm, getDayIcon, getDayPhase } from "./time";

export interface ZoneRowProps {
  label: string;
  color: string;
  tzName: string;
  time: number;
  isRef: boolean;
  onSetRef: () => void;
  onTimezoneChange: (ianaName: string) => void;
  position: "top" | "bottom";
}

export default function ZoneRow({
  label,
  color,
  tzName,
  time,
  isRef,
  onSetRef,
  onTimezoneChange,
  position,
}: ZoneRowProps) {
  const timeStr = formatTime(time);
  const ampm = getAmPm(time);
  const icon = getDayIcon(getDayPhase(time));

  return (
    <div
      className={`flex items-center gap-3 px-3 ${position === "top" ? "pb-1.5 pt-2.5" : "pb-2.5 pt-1.5"}`}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        className="flex items-center justify-center size-5.5 rounded-full text-xs font-semibold shrink-0"
        style={{ border: `2px solid ${color}`, color }}
      >
        {label}
      </div>

      <TimezoneCombobox value={tzName} onValueChange={onTimezoneChange} color={color} />

      <button
        type="button"
        onClick={onSetRef}
        className="text-xs uppercase tracking-normal px-1.75 py-0.5 rounded-[3px] cursor-pointer whitespace-nowrap shrink-0"
        style={{
          border: `1px solid ${isRef ? `${color}55` : "rgba(255,255,255,0.06)"}`,
          background: isRef ? `${color}22` : "transparent",
          color: isRef ? color : "rgba(200,205,216,0.35)",
        }}
      >
        {isRef ? "\u2726 Ref" : "Ref"}
      </button>

      <div className="flex-1" />

      <span className="text-base font-semibold whitespace-nowrap shrink-0" style={{ color }}>
        {timeStr} <span className="text-xs opacity-50">{ampm}</span>{" "}
        <span className="text-xs">{icon}</span>
      </span>
    </div>
  );
}
