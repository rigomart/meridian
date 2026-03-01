import type { HourCellProps } from "./types";
import { formatTime, wrapHour } from "./utils";

export default function HourCell({ hour, cellW, color, currentHour }: HourCellProps) {
	const wrappedHour = wrapHour(hour);
	const wrappedCurrent = wrapHour(currentHour);
	const isCurrentHour = Math.floor(wrappedHour) === Math.floor(wrappedCurrent);
	const isWorkHour = wrappedHour >= 9 && wrappedHour < 17;
	const isDaytime = wrappedHour >= 6 && wrappedHour < 18;

	let bg: string;
	let textColor: string;
	let fontSize: number;
	let fontWeight: number;
	let label: string;

	if (isCurrentHour) {
		bg = `${color}bb`;
		textColor = "#0a0e17";
		fontSize = 13;
		fontWeight = 700;
		label = formatTime(currentHour);
	} else if (isWorkHour) {
		bg = "rgba(45,120,100,0.28)";
		textColor = "rgba(200,205,216,0.45)";
		fontSize = 10;
		fontWeight = 400;
		label = String(Math.floor(wrappedHour));
	} else if (isDaytime) {
		bg = "rgba(45,120,100,0.10)";
		textColor = "rgba(200,205,216,0.45)";
		fontSize = 10;
		fontWeight = 400;
		label = String(Math.floor(wrappedHour));
	} else {
		bg = "rgba(15,20,35,0.55)";
		textColor = "rgba(200,205,216,0.45)";
		fontSize = 10;
		fontWeight = 400;
		label = String(Math.floor(wrappedHour));
	}

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
				fontFamily: "var(--font-mono)",
				fontSize,
				fontWeight,
				color: textColor,
				userSelect: "none",
			}}
		>
			{label}
		</div>
	);
}
