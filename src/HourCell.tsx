import { formatTime, wrapHour } from "./time";
import type { HourCellProps } from "./types";

export default function HourCell({ hour, cellW, color, currentHour }: HourCellProps) {
	const wrappedHour = wrapHour(hour);
	const isCurrentHour = Math.floor(wrappedHour) === Math.floor(wrapHour(currentHour));

	if (isCurrentHour) {
		return (
			<div
				className="h-12 shrink-0 flex items-center justify-center border-r border-r-white/4 text-sm font-bold text-text-inverse select-none"
				style={{ width: cellW, background: `${color}bb` }}
			>
				{formatTime(currentHour)}
			</div>
		);
	}

	const isWorkHour = wrappedHour >= 9 && wrappedHour < 17;
	const isDaytime = wrappedHour >= 6 && wrappedHour < 18;

	const bgClass = isWorkHour
		? "bg-hour-teal/28"
		: isDaytime
			? "bg-hour-teal/10"
			: "bg-hour-night/55";

	return (
		<div
			className={`h-12 shrink-0 flex items-center justify-center border-r border-r-white/4 text-xs text-text-secondary/45 select-none ${bgClass}`}
			style={{ width: cellW }}
		>
			{String(Math.floor(wrappedHour))}
		</div>
	);
}
