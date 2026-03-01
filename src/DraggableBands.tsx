import { useEffect, useRef, useState } from "react";
import { COLORS } from "./constants";
import HourCell from "./HourCell";
import { wrapHour } from "./time";
import type { DraggableBandsProps } from "./types";
import ZoneRow from "./ZoneRow";

const VISIBLE_HOURS = 25;
const TOTAL_CELLS = 72;

function DiffRow({ timeDiff }: { timeDiff: number }) {
	const diffAbs = Math.abs(timeDiff);
	const diffLabel =
		timeDiff === 0 ? "Same time" : `${diffAbs}h ${timeDiff > 0 ? "ahead" : "behind"}`;

	return (
		<div className="flex items-center justify-center gap-3 py-[3px] border-y border-y-white/3 bg-bg-primary/20">
			<span className="text-xs uppercase tracking-wide text-text-secondary/30">Difference</span>
			<div className="w-5 h-px bg-zone-a/15" />
			<span className="text-sm font-medium text-text-primary">{diffLabel}</span>
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
	tz1Name,
	tz2Name,
	refZone,
	onSetRef,
	onTimezoneChange,
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
				className={`relative overflow-hidden bg-bg-primary/30 touch-none select-none border-y ${
					dragging ? "cursor-grabbing border-y-zone-a/15" : "cursor-grab border-y-white/4"
				}`}
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerMove}
				onPointerUp={handlePointerUp}
			>
				<ZoneRow
					label="A"
					color={COLORS.zoneA}
					tzName={tz1Name}
					time={tzATime}
					isRef={refZone === "A"}
					onSetRef={() => onSetRef("A")}
					onTimezoneChange={(name) => onTimezoneChange("A", name)}
					position="top"
				/>

				<div className="overflow-hidden">
					<div
						className="flex will-change-transform"
						style={{ width: stripWidth, transform: `translateX(${txA}px)` }}
					>
						{buildCells(tzATime, cellW, COLORS.zoneA)}
					</div>
				</div>

				<DiffRow timeDiff={timeDiff} />

				<div className="overflow-hidden">
					<div
						className="flex will-change-transform"
						style={{ width: stripWidth, transform: `translateX(${txB}px)` }}
					>
						{buildCells(tzBTime, cellW, COLORS.zoneB)}
					</div>
				</div>

				<ZoneRow
					label="B"
					color={COLORS.zoneB}
					tzName={tz2Name}
					time={tzBTime}
					isRef={refZone === "B"}
					onSetRef={() => onSetRef("B")}
					onTimezoneChange={(name) => onTimezoneChange("B", name)}
					position="bottom"
				/>

				<div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10">
					<div className="size-3 bg-zone-a rounded-[2px] rotate-45 shadow-glow shrink-0" />
					<div className="w-0.5 flex-1 bg-zone-a shadow-glow-sm" />
					<div className="size-3 bg-zone-a rounded-[2px] rotate-45 shadow-glow shrink-0" />
				</div>
			</div>

			<p
				className={`mt-2 text-center text-xs tracking-tight ${
					dragging ? "text-zone-a/50" : "text-text-secondary/30"
				}`}
			>
				{dragging ? "Shifting..." : "Click or drag anywhere on the bands"}
			</p>
		</div>
	);
}
