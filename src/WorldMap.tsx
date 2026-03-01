import { type GeoPermissibleObjects, geoGraticule, geoNaturalEarth1, geoPath } from "d3-geo";
import { COLORS, MAP_HEIGHT, MAP_WIDTH, OFFSET_CITY_MAP } from "./data";
import type { WorldMapProps } from "./types";
import { buildBandPolygon, formatTime, getBandFill, wrapHour } from "./utils";

const projection = geoNaturalEarth1()
	.scale(153)
	.translate([MAP_WIDTH / 2, MAP_HEIGHT / 2]);

const path = geoPath(projection);
const graticule = geoGraticule().step([15, 15]);

const sphere: GeoPermissibleObjects = { type: "Sphere" };
const equator: GeoJSON.Feature<GeoJSON.LineString> = {
	type: "Feature",
	properties: {},
	geometry: {
		type: "LineString",
		coordinates: [
			[-180, 0],
			[180, 0],
		],
	},
};

const bandOffsets = Array.from({ length: 25 }, (_, i) => i - 12);

function ZoneMarker({ offset, label, color }: { offset: number; label: string; color: string }) {
	const centerLon = offset * 15;
	const top = projection([centerLon, 80]);
	const bottom = projection([centerLon, -80]);
	const equatorPt = projection([centerLon, 0]);
	const labelPt = projection([centerLon, 70]);
	if (!top || !bottom || !equatorPt || !labelPt) return null;

	return (
		<g>
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
			/>
			<circle cx={equatorPt[0]} cy={equatorPt[1]} r={6} fill={color} filter="url(#glow)" />
			<circle cx={equatorPt[0]} cy={equatorPt[1]} r={3} fill="white" />
			<text
				x={labelPt[0]}
				y={labelPt[1]}
				textAnchor="middle"
				fill={color}
				style={{
					fontFamily: "var(--font-mono)",
					fontSize: "10px",
					fontWeight: 500,
				}}
			>
				{label}
			</text>
		</g>
	);
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
	onClickBand,
	nextClickTarget,
}: WorldMapProps) {
	if (loading || !geoData) {
		return (
			<div
				className="mx-auto flex items-center justify-center"
				style={{
					maxWidth: 1000,
					height: 480,
					background: "rgba(8,12,20,0.6)",
					borderRadius: 8,
					border: "1px solid rgba(255,183,77,0.06)",
					color: "rgba(200,205,216,0.4)",
					fontFamily: "var(--font-mono)",
					fontSize: 13,
					letterSpacing: "0.08em",
				}}
			>
				LOADING MAP DATA...
			</div>
		);
	}

	const nextLabel = nextClickTarget === 1 ? "ZONE A" : "ZONE B";
	const nextColor = nextClickTarget === 1 ? COLORS.zoneA : COLORS.zoneB;

	return (
		<div className="mx-auto" style={{ maxWidth: 1000, padding: "0 20px" }}>
			<svg
				viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
				style={{
					width: "100%",
					height: "auto",
					borderRadius: 8,
					border: "1px solid rgba(255,183,77,0.06)",
					background: "rgba(8,12,20,0.6)",
				}}
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

				{/* Background with radial glow */}
				<rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#mapGlow)" />

				{/* Sphere outline */}
				<path d={path(sphere) ?? ""} fill="none" stroke="rgba(255,183,77,0.12)" strokeWidth={1} />

				{/* Graticule */}
				<path
					d={path(graticule()) ?? ""}
					fill="none"
					stroke="rgba(200,210,230,0.06)"
					strokeWidth={0.5}
				/>

				{/* Timezone bands */}
				{bandOffsets.map((offset) => {
					const band = buildBandPolygon(offset);
					const isSelectedA = offset === tz1Offset;
					const isSelectedB = offset === tz2Offset;
					const isSelected = isSelectedA || isSelectedB;
					const isHovered = hoveredBand === offset;

					let fill = getBandFill(offset, refTime, refOffset);
					let stroke = "transparent";
					let strokeWidth = 0;

					if (isSelected) {
						fill = "rgba(255,183,77,0.22)";
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
							d={path(band) ?? ""}
							fill={fill}
							stroke={stroke}
							strokeWidth={strokeWidth}
							tabIndex={-1}
							style={{
								cursor: "pointer",
								transition: "fill 0.2s, stroke 0.2s",
								outline: "none",
							}}
							onMouseEnter={() => onHoverBand(offset)}
							onMouseLeave={() => onHoverBand(null)}
							onClick={() => onClickBand(offset)}
						/>
					);
				})}

				{/* Country polygons */}
				<path
					d={path(geoData) ?? ""}
					fill="rgba(200,210,230,0.07)"
					stroke="rgba(200,210,230,0.12)"
					strokeWidth={0.4}
					style={{ pointerEvents: "none" }}
				/>

				{/* Equator */}
				<path
					d={path(equator) ?? ""}
					fill="none"
					stroke="rgba(255,183,77,0.1)"
					strokeWidth={1}
					strokeDasharray="4,4"
					style={{ pointerEvents: "none" }}
				/>

				{/* Zone markers */}
				<ZoneMarker offset={tz1Offset} label="A" color={COLORS.zoneA} />
				<ZoneMarker offset={tz2Offset} label="B" color={COLORS.zoneB} />

				{/* Next click indicator */}
				<text
					x={MAP_WIDTH - 16}
					y={24}
					textAnchor="end"
					fill={nextColor}
					opacity={0.5}
					style={{
						fontFamily: "var(--font-mono)",
						fontSize: "9px",
						letterSpacing: "0.1em",
						textTransform: "uppercase",
					}}
				>
					{`NEXT CLICK → ${nextLabel}`}
				</text>

				{/* Hover tooltip */}
				{hoveredBand !== null &&
					hoveredBand !== tz1Offset &&
					hoveredBand !== tz2Offset &&
					(() => {
						const city =
							OFFSET_CITY_MAP[hoveredBand] ?? `UTC${hoveredBand >= 0 ? "+" : ""}${hoveredBand}`;
						const localTime = wrapHour(refTime + (hoveredBand - refOffset));
						const timeStr = formatTime(localTime);
						const tooltipText = `${city} · ${timeStr}`;
						const centerLon = hoveredBand * 15;
						const pt = projection([centerLon, -60]);
						if (!pt) return null;
						return (
							<g style={{ pointerEvents: "none" }}>
								<rect
									x={pt[0] - 55}
									y={pt[1] - 12}
									width={110}
									height={24}
									rx={6}
									fill="rgba(10,14,23,0.92)"
									stroke="rgba(255,255,255,0.15)"
									strokeWidth={0.5}
								/>
								<text
									x={pt[0]}
									y={pt[1] + 4}
									textAnchor="middle"
									fill="#e8dcc8"
									style={{
										fontFamily: "var(--font-mono)",
										fontSize: "10px",
									}}
								>
									{tooltipText}
								</text>
							</g>
						);
					})()}
			</svg>
		</div>
	);
}
