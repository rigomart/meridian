import { useEffect, useRef, useState } from "react";
import { COLORS } from "./constants";
import HourCell from "./HourCell";
import { wrapHour } from "./time";
import type { DraggableBandsProps } from "./types";

const MAX_VISIBLE_HOURS = 24;
const MIN_VISIBLE_HOURS = 8;
const TARGET_CELL_WIDTH = 40;
const TOTAL_CELLS = 72;

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

export default function DraggableBands({ tzATime, tzBTime, onTimeChange }: DraggableBandsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [dragging, setDragging] = useState(false);

  const dragStartX = useRef(0);
  const isDragging = useRef(false);
  const totalDragDx = useRef(0);

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

  const visibleHours = Math.max(
    MIN_VISIBLE_HOURS,
    Math.min(MAX_VISIBLE_HOURS, Math.floor(containerWidth / TARGET_CELL_WIDTH)),
  );
  const cellW = containerWidth / visibleHours;
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
    const deltaHours = -dx * (visibleHours / containerWidth);
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
    <div className="px-4 sm:px-6">
      <div
        ref={containerRef}
        className={`relative overflow-hidden touch-none select-none rounded-lg border bg-white/[0.02] ${
          dragging ? "cursor-grabbing border-white/12" : "cursor-grab border-white/6"
        }`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* Zone A strip */}
        <div className="relative overflow-hidden">
          <div
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center size-5 rounded text-[10px] font-bold text-white pointer-events-none"
            style={{ background: COLORS.zoneA, boxShadow: `0 0 8px ${COLORS.zoneA}33` }}
          >
            A
          </div>
          <div
            className="flex will-change-transform"
            style={{ width: stripWidth, transform: `translateX(${txA}px)` }}
          >
            {buildCells(tzATime, cellW, COLORS.zoneA)}
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-white/5" />

        {/* Zone B strip */}
        <div className="relative overflow-hidden">
          <div
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center size-5 rounded text-[10px] font-bold text-white pointer-events-none"
            style={{ background: COLORS.zoneB, boxShadow: `0 0 8px ${COLORS.zoneB}33` }}
          >
            B
          </div>
          <div
            className="flex will-change-transform"
            style={{ width: stripWidth, transform: `translateX(${txB}px)` }}
          >
            {buildCells(tzBTime, cellW, COLORS.zoneB)}
          </div>
        </div>

        {/* Center indicator */}
        <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 flex flex-col items-center pointer-events-none z-10">
          <div className="size-1.5 rounded-full bg-white shadow-glow-sm shrink-0" />
          <div className="w-px flex-1 bg-white/25" />
          <div className="size-1.5 rounded-full bg-white shadow-glow-sm shrink-0" />
        </div>
      </div>

      <p
        className={`mt-2 text-center text-[10px] sm:text-xs ${
          dragging ? "text-text-secondary/50" : "text-text-secondary/25"
        }`}
      >
        {dragging ? "Shifting..." : "Drag to shift time"}
      </p>
    </div>
  );
}
