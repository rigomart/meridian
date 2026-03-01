import { type GeoPermissibleObjects, geoEquirectangular, geoGraticule, geoPath } from "d3-geo";
import { useRef } from "react";
import { COLORS, MAP_HEIGHT, MAP_WIDTH } from "./constants";
import { buildBandPolygon, getBandFill } from "./geo";
import { formatTime, wrapHour } from "./time";
import { OFFSET_CITY_MAP } from "./timezones";
import type { WorldMapProps } from "./types";

const projection = geoEquirectangular()
  .scale(MAP_HEIGHT / Math.PI)
  .translate([MAP_WIDTH / 2, MAP_HEIGHT / 2]);

const path = geoPath(projection);

const spherePath = path({ type: "Sphere" } as GeoPermissibleObjects) ?? "";
const graticulePath = path(geoGraticule().step([15, 15])()) ?? "";
const equatorPath =
  path({
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: [
        [-180, 0],
        [180, 0],
      ],
    },
  }) ?? "";

const LABEL_ROW_HEIGHT = 24;

const bandData = Array.from({ length: 25 }, (_, i) => {
  const offset = i - 12;
  return { offset, polygon: buildBandPolygon(offset), d: path(buildBandPolygon(offset)) ?? "" };
});

const bandLabels = bandData
  .map(({ offset }) => {
    const centerLon = offset * 15;
    const pt = projection([centerLon, 0]);
    if (!pt) return null;
    const label = offset === 0 ? "UTC" : `${offset > 0 ? "+" : ""}${offset}`;
    return { offset, x: pt[0], label };
  })
  .filter(Boolean) as { offset: number; x: number; label: string }[];

function ZoneMarker({
  offset,
  label,
  color,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  offset: number;
  label: string;
  color: string;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
}) {
  const centerLon = offset * 15;
  const top = projection([centerLon, 80]);
  const bottom = projection([centerLon, -80]);
  const equatorPt = projection([centerLon, 0]);
  const labelPt = projection([centerLon, 70]);
  if (!top || !bottom || !equatorPt || !labelPt) return null;

  return (
    <g
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className="cursor-grab active:cursor-grabbing touch-none"
    >
      {/* Invisible wider hit area for easier grabbing */}
      <line
        x1={top[0]}
        y1={top[1]}
        x2={bottom[0]}
        y2={bottom[1]}
        stroke="transparent"
        strokeWidth={20}
      />
      <line
        x1={top[0]}
        y1={top[1]}
        x2={bottom[0]}
        y2={bottom[1]}
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray="6,4"
        opacity={0.4}
        filter="url(#glow)"
        className="pointer-events-none"
      />
      <circle cx={equatorPt[0]} cy={equatorPt[1]} r={6} fill={color} filter="url(#glow)" />
      <circle cx={equatorPt[0]} cy={equatorPt[1]} r={3} fill="white" />
      <text
        x={labelPt[0]}
        y={labelPt[1]}
        textAnchor="middle"
        fill={color}
        className="text-xs font-medium pointer-events-none"
      >
        {label}
      </text>
    </g>
  );
}

function clientToOffset(svg: SVGSVGElement, clientX: number): number {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = MAP_HEIGHT / 2;
  const ctm = svg.getScreenCTM();
  if (!ctm) return 0;
  const svgPt = pt.matrixTransform(ctm.inverse());
  const coords = projection.invert?.([svgPt.x, svgPt.y]);
  if (!coords) return 0;
  return Math.max(-12, Math.min(12, Math.round(coords[0] / 15)));
}

export default function WorldMap({
  geoData,
  loading,
  tz1Offset,
  tz2Offset,
  refTime,
  refOffset,
  hoveredBand,
  onHoverBand,
  onOffsetChange,
}: WorldMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragZone = useRef<"A" | "B" | null>(null);

  if (loading || !geoData) {
    return (
      <div className="mx-auto flex items-center justify-center max-w-5xl h-120 bg-bg-primary/60 rounded-lg border border-zone-a/6 text-text-secondary/40 text-sm tracking-normal">
        LOADING MAP DATA...
      </div>
    );
  }

  function handlePointerDown(zone: "A" | "B", e: React.PointerEvent) {
    dragZone.current = zone;
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragZone.current || !svgRef.current) return;
    const offset = clientToOffset(svgRef.current, e.clientX);
    onOffsetChange(dragZone.current, offset);
  }

  function handlePointerUp() {
    dragZone.current = null;
  }

  return (
    <div className="mx-auto max-w-7xl px-5">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT + LABEL_ROW_HEIGHT}`}
        className="w-full h-auto rounded-lg border border-zone-a/6 bg-bg-primary/60"
      >
        <title>Timezone world map</title>
        <defs>
          <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,183,77,0.03)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#mapGlow)" />
        <path d={spherePath} fill="none" stroke="rgba(255,183,77,0.12)" strokeWidth={1} />
        <path d={graticulePath} fill="none" stroke={`${COLORS.geo}10`} strokeWidth={0.5} />

        {bandData.map(({ offset, d }) => {
          const isSelectedA = offset === tz1Offset;
          const isSelectedB = offset === tz2Offset;
          const isSelected = isSelectedA || isSelectedB;
          const isHovered = hoveredBand === offset;

          let fill = getBandFill(offset, refTime, refOffset);
          let stroke = "transparent";
          let strokeWidth = 0;

          if (isSelected) {
            fill = "transparent";
            stroke = isSelectedA ? COLORS.zoneA : COLORS.zoneB;
            strokeWidth = 1.5;
          }
          if (isHovered && !isSelected) {
            stroke = "rgba(255,255,255,0.12)";
            strokeWidth = 1;
          }

          return (
            <path
              key={offset}
              d={d}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              tabIndex={-1}
              className="transition-colors duration-200 outline-none"
              onMouseEnter={() => onHoverBand(offset)}
              onMouseLeave={() => onHoverBand(null)}
            />
          );
        })}

        <path
          d={path(geoData) ?? ""}
          fill={`${COLORS.geo}12`}
          stroke={`${COLORS.geo}1f`}
          strokeWidth={0.4}
          className="pointer-events-none"
        />

        <path
          d={equatorPath}
          fill="none"
          stroke="rgba(255,183,77,0.1)"
          strokeWidth={1}
          strokeDasharray="4,4"
          className="pointer-events-none"
        />

        <ZoneMarker
          offset={tz1Offset}
          label="A"
          color={COLORS.zoneA}
          onPointerDown={(e) => handlePointerDown("A", e)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
        <ZoneMarker
          offset={tz2Offset}
          label="B"
          color={COLORS.zoneB}
          onPointerDown={(e) => handlePointerDown("B", e)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />

        {hoveredBand !== null && hoveredBand !== tz1Offset && hoveredBand !== tz2Offset && (
          <BandTooltip offset={hoveredBand} refTime={refTime} refOffset={refOffset} />
        )}

        {bandLabels.map(({ offset, x, label }) => (
          <text
            key={offset}
            x={x}
            y={MAP_HEIGHT + LABEL_ROW_HEIGHT / 2 + 4}
            textAnchor="middle"
            fill={COLORS.textSecondary}
            opacity={offset === 0 ? 0.5 : 0.25}
            className="text-xs pointer-events-none"
          >
            {label}
          </text>
        ))}
      </svg>
      <p className="mt-1.5 text-center text-[10px] tracking-wide text-text-secondary/20">
        Approximate zones — actual timezone boundaries differ from these meridian-based bands
      </p>
    </div>
  );
}

function BandTooltip({
  offset,
  refTime,
  refOffset,
}: {
  offset: number;
  refTime: number;
  refOffset: number;
}) {
  const city = OFFSET_CITY_MAP[offset] ?? `UTC${offset >= 0 ? "+" : ""}${offset}`;
  const localTime = wrapHour(refTime + (offset - refOffset));
  const timeStr = formatTime(localTime);
  const tooltipText = `${city} \u00b7 ${timeStr}`;
  const centerLon = offset * 15;
  const pt = projection([centerLon, -60]);
  if (!pt) return null;

  return (
    <g className="pointer-events-none">
      <rect
        x={pt[0] - 55}
        y={pt[1] - 12}
        width={110}
        height={24}
        rx={6}
        fill={COLORS.tooltipBg}
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={0.5}
      />
      <text
        x={pt[0]}
        y={pt[1] + 4}
        textAnchor="middle"
        fill={COLORS.textPrimary}
        className="text-xs"
      >
        {tooltipText}
      </text>
    </g>
  );
}
