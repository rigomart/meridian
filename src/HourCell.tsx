import type { HourCellProps } from "./types";
import { formatTime, wrapHour } from "./utils";

export default function HourCell({ hour, cellW, color, currentHour }: HourCellProps) {
	const wrappedHour = wrapHour(hour);
	const isCurrentHour = Math.floor(wrappedHour) === Math.floor(wrapHour(currentHour));

	let bg: string;
	let label: string;

	if (isCurrentHour) {
		return (
			<div
				style={{
					width: cellW,
					height: 48,
					flexShrink: 0,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					background: `${color}bb`,
					borderRight: "1px solid rgba(255,255,255,0.04)",
					fontSize: 13,
					fontWeight: 700,
					color: "#0a0e17",
					userSelect: "none",
				}}
			>
				{formatTime(currentHour)}
			</div>
		);
	}

	const isWorkHour = wrappedHour >= 9 && wrappedHour < 17;
	const isDaytime = wrappedHour >= 6 && wrappedHour < 18;

	if (isWorkHour) {
		bg = "rgba(45,120,100,0.28)";
	} else if (isDaytime) {
		bg = "rgba(45,120,100,0.10)";
	} else {
		bg = "rgba(15,20,35,0.55)";
	}
	label = String(Math.floor(wrappedHour));

	return (
		<div
			style={{
				width: cellW,
				height: 48,
				flexShrink: 0,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				background: bg,
				borderRight: "1px solid rgba(255,255,255,0.04)",
				fontSize: 10,
				fontWeight: 400,
				color: "rgba(200,205,216,0.45)",
				userSelect: "none",
			}}
		>
			{label}
		</div>
	);
}
