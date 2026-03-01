import { useEffect, useRef, useState } from "react";
import { COLORS, TIMEZONE_ENTRIES } from "./data";
import HourCell from "./HourCell";
import type { DraggableBandsProps } from "./types";
import { formatTime, getAmPm, getDayIcon, getDayPhase, wrapHour } from "./utils";

const VISIBLE_HOURS = 25;
const TOTAL_CELLS = 72;

const diamondStyle: React.CSSProperties = {
	width: 12,
	height: 12,
	background: COLORS.zoneA,
	borderRadius: 2,
	transform: "rotate(45deg)",
	boxShadow: "0 0 14px rgba(255,183,77,0.7)",
	flexShrink: 0,
};

function ZoneRow({
	label,
	color,
	offset,
	time,
	isRef,
	onSetRef,
	onOffsetChange,
	position,
}: {
	label: string;
	color: string;
	offset: number;
	time: number;
	isRef: boolean;
	onSetRef: () => void;
	onOffsetChange: (offset: number) => void;
	position: "top" | "bottom";
}) {
	const timeStr = formatTime(time);
	const ampm = getAmPm(time);
	const icon = getDayIcon(getDayPhase(time));

	return (
		<div
			className={`flex items-center gap-3 px-3 ${position === "top" ? "pb-1.5 pt-2.5" : "pb-2.5 pt-1.5"}`}
			onPointerDown={(e) => e.stopPropagation()}
		>
			{/* Zone badge */}
			<div
				className="flex items-center justify-center"
				style={{
					width: 22,
					height: 22,
					borderRadius: "50%",
					border: `2px solid ${color}`,
					fontSize: 9,
					fontWeight: 600,
					color,
					flexShrink: 0,
				}}
			>
				{label}
			</div>

			{/* Compact dropdown */}
			<select
				value={offset}
				onChange={(e) => onOffsetChange(Number(e.target.value))}
				style={{
					fontSize: 10,
					padding: "3px 6px",
					borderRadius: 4,
					border: "1px solid rgba(255,255,255,0.06)",
					background: "rgba(8,12,20,0.8)",
					color,
					outline: "none",
					cursor: "pointer",
					maxWidth: 180,
				}}
			>
				{TIMEZONE_ENTRIES.map((tz) => (
					<option key={tz.offset} value={tz.offset}>
						UTC{tz.offset >= 0 ? "+" : ""}
						{tz.offset} {tz.city}
					</option>
				))}
			</select>

			{/* Ref toggle */}
			<button
				type="button"
				onClick={onSetRef}
				style={{
					fontSize: 8,
					textTransform: "uppercase",
					letterSpacing: "0.08em",
					padding: "2px 7px",
					borderRadius: 3,
					border: `1px solid ${isRef ? `${color}55` : "rgba(255,255,255,0.06)"}`,
					background: isRef ? `${color}22` : "transparent",
					color: isRef ? color : "rgba(200,205,216,0.35)",
					cursor: "pointer",
					whiteSpace: "nowrap",
					flexShrink: 0,
				}}
			>
				{isRef ? "✦ Ref" : "Ref"}
			</button>

			{/* Spacer */}
			<div className="flex-1" />

			{/* Time display */}
			<span
				style={{
					fontSize: 14,
					fontWeight: 600,
					color,
					whiteSpace: "nowrap",
					flexShrink: 0,
				}}
			>
				{timeStr} <span style={{ fontSize: 10, opacity: 0.5 }}>{ampm}</span>{" "}
				<span style={{ fontSize: 12 }}>{icon}</span>
			</span>
		</div>
	);
}

function DiffRow({ timeDiff }: { timeDiff: number }) {
	const diffAbs = Math.abs(timeDiff);
	const diffLabel =
		timeDiff === 0 ? "Same time" : `${diffAbs}h ${timeDiff > 0 ? "ahead" : "behind"}`;

	return (
		<div
			className="flex items-center justify-center gap-3"
			style={{
				padding: "3px 0",
				borderTop: "1px solid rgba(255,255,255,0.03)",
				borderBottom: "1px solid rgba(255,255,255,0.03)",
				background: "rgba(8,12,20,0.2)",
			}}
		>
			<span
				style={{
					fontSize: 9,
					textTransform: "uppercase",
					letterSpacing: "0.1em",
					color: "rgba(200,205,216,0.3)",
				}}
			>
				Difference
			</span>
			<div
				style={{
					width: 20,
					height: 1,
					background: "rgba(255,183,77,0.15)",
				}}
			/>
			<span
				style={{
					fontSize: 11,
					fontWeight: 500,
					color: COLORS.textPrimary,
				}}
			>
				{diffLabel}
			</span>
		</div>
	);
}

function buildCells(time: number, cellW: number, color: string) {
	const cells = [];
	for (let i = 0; i < TOTAL_CELLS; i++) {
		const hour = i - 24;
		cells.push(<HourCell key={i} hour={hour} cellW={cellW} color={color} currentHour={time} />);
	}
	return cells;
}

function getTranslateX(time: number, containerWidth: number, cellW: number): number {
	const wrapped = wrapHour(time);
	const intHour = Math.floor(wrapped);
	const frac = wrapped - intHour;
	return containerWidth / 2 - (intHour + 24) * cellW - cellW * frac;
}

export default function DraggableBands({
	tzATime,
	tzBTime,
	onTimeChange,
	tz1Offset,
	tz2Offset,
	refZone,
	onSetRef,
	onOffsetChange,
}: DraggableBandsProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [containerWidth, setContainerWidth] = useState(800);
	const [dragging, setDragging] = useState(false);

	const dragStartX = useRef(0);
	const isDragging = useRef(false);
	const totalDragDx = useRef(0);

	const timeDiff = tz2Offset - tz1Offset;

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		const ro = new ResizeObserver((entries) => {
			for (const entry of entries) {
				setContainerWidth(entry.contentRect.width);
			}
		});
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	const cellW = containerWidth / VISIBLE_HOURS;
	const stripWidth = TOTAL_CELLS * cellW;

	const txA = getTranslateX(tzATime, containerWidth, cellW);
	const txB = getTranslateX(tzBTime, containerWidth, cellW);

	function handlePointerDown(e: React.PointerEvent) {
		isDragging.current = true;
		totalDragDx.current = 0;
		dragStartX.current = e.clientX;
		setDragging(true);
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}

	function handlePointerMove(e: React.PointerEvent) {
		if (!isDragging.current) return;
		const dx = e.clientX - dragStartX.current;
		dragStartX.current = e.clientX;
		totalDragDx.current += dx;
		const deltaHours = -dx * (VISIBLE_HOURS / containerWidth);
		onTimeChange(deltaHours);
	}

	function handlePointerUp(e: React.PointerEvent) {
		const wasDragging = isDragging.current;
		const totalDx = totalDragDx.current;
		isDragging.current = false;
		setDragging(false);

		if (wasDragging && Math.abs(totalDx) < 3) {
			const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
			const clickX = e.clientX - rect.left;
			const distFromCenter = clickX - containerWidth / 2;
			const hourOffset = distFromCenter / cellW;
			onTimeChange(hourOffset);
		}
	}

	return (
		<div>
			<div
				ref={containerRef}
				style={{
					position: "relative",
					borderRadius: 8,
					overflow: "hidden",
					background: "rgba(8,12,20,0.3)",
					border: `1px solid ${dragging ? "rgba(255,183,77,0.15)" : "rgba(255,255,255,0.04)"}`,
					cursor: dragging ? "grabbing" : "grab",
					touchAction: "none",
					userSelect: "none",
				}}
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
			>
				{/* Zone A row */}
				<ZoneRow
					label="A"
					color={COLORS.zoneA}
					offset={tz1Offset}
					time={tzATime}
					isRef={refZone === "A"}
					onSetRef={() => onSetRef("A")}
					onOffsetChange={(o) => onOffsetChange("A", o)}
					position="top"
				/>

				{/* Strip A */}
				<div style={{ overflow: "hidden" }}>
					<div
						style={{
							display: "flex",
							width: stripWidth,
							transform: `translateX(${txA}px)`,
							willChange: "transform",
						}}
					>
						{buildCells(tzATime, cellW, COLORS.zoneA)}
					</div>
				</div>

				{/* Difference row */}
				<DiffRow timeDiff={timeDiff} />

				{/* Strip B */}
				<div style={{ overflow: "hidden" }}>
					<div
						style={{
							display: "flex",
							width: stripWidth,
							transform: `translateX(${txB}px)`,
							willChange: "transform",
						}}
					>
						{buildCells(tzBTime, cellW, COLORS.zoneB)}
					</div>
				</div>

				{/* Zone B row */}
				<ZoneRow
					label="B"
					color={COLORS.zoneB}
					offset={tz2Offset}
					time={tzBTime}
					isRef={refZone === "B"}
					onSetRef={() => onSetRef("B")}
					onOffsetChange={(o) => onOffsetChange("B", o)}
					position="bottom"
				/>

				{/* Fixed Needle */}
				<div
					style={{
						position: "absolute",
						left: "50%",
						top: 0,
						bottom: 0,
						transform: "translateX(-50%)",
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						pointerEvents: "none",
						zIndex: 10,
					}}
				>
					<div style={diamondStyle} />
					<div
						style={{
							width: 2,
							flex: 1,
							background: COLORS.zoneA,
							boxShadow: "0 0 10px rgba(255,183,77,0.5)",
						}}
					/>
					<div style={diamondStyle} />
				</div>
			</div>

			{/* Hint text */}
			<p
				className="mt-2 text-center"
				style={{
					fontSize: 9,
					color: dragging ? "rgba(255,183,77,0.5)" : "rgba(200,205,216,0.3)",
					letterSpacing: "0.06em",
				}}
			>
				{dragging ? "Scrubbing..." : "Click or drag anywhere on the bands"}
			</p>
		</div>
	);
}
