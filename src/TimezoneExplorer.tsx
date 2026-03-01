import type { GeoPermissibleObjects } from "d3-geo";
import { useEffect, useState } from "react";
import DraggableBands from "./DraggableBands";
import { COLORS, WORLD_ATLAS_URL } from "./data";
import type { ClickTarget, RefZone } from "./types";
import { decodeTopo } from "./utils";
import WorldMap from "./WorldMap";

function getLocalOffset(): number {
	return -(new Date().getTimezoneOffset() / 60);
}

function getCurrentFractionalHour(): number {
	const now = new Date();
	return now.getHours() + now.getMinutes() / 60;
}

export default function TimezoneExplorer() {
	const [geoData, setGeoData] = useState<GeoPermissibleObjects | null>(null);
	const [loading, setLoading] = useState(true);
	const [tz1Offset, setTz1Offset] = useState(getLocalOffset);
	const [tz2Offset, setTz2Offset] = useState(0);
	const [refTime, setRefTime] = useState(getCurrentFractionalHour);
	const [refZone, setRefZone] = useState<RefZone>("A");
	const [hoveredBand, setHoveredBand] = useState<number | null>(null);
	const [nextClickTarget, setNextClickTarget] = useState<ClickTarget>(1);

	const refOffset = refZone === "A" ? tz1Offset : tz2Offset;
	const tzATime = refZone === "A" ? refTime : refTime + (tz1Offset - refOffset);
	const tzBTime = refZone === "B" ? refTime : refTime + (tz2Offset - refOffset);

	useEffect(() => {
		const controller = new AbortController();
		fetch(WORLD_ATLAS_URL, { signal: controller.signal })
			.then((r) => {
				if (!r.ok) throw new Error(`HTTP ${r.status}`);
				return r.json();
			})
			.then((topo) => {
				setGeoData(decodeTopo(topo));
				setLoading(false);
			})
			.catch((err) => {
				if (err.name !== "AbortError") {
					console.error("Failed to load map data:", err);
					setLoading(false);
				}
			});
		return () => controller.abort();
	}, []);

	function handleBandClick(offset: number) {
		if (nextClickTarget === 1) {
			setTz1Offset(offset);
			setNextClickTarget(2);
		} else {
			setTz2Offset(offset);
			setNextClickTarget(1);
		}
	}

	function handleTimeChange(deltaHours: number) {
		setRefTime((prev) => prev + deltaHours);
	}

	function handleOffsetChange(zone: "A" | "B", offset: number) {
		if (zone === "A") setTz1Offset(offset);
		else setTz2Offset(offset);
	}

	return (
		<div className="min-h-screen">
			{/* Header */}
			<header
				className="flex items-end justify-between px-8 py-5"
				style={{
					borderBottom: "1px solid rgba(255,183,77,0.08)",
				}}
			>
				<div>
					<h1
						style={{
							fontFamily: "var(--font-serif)",
							fontSize: 38,
							fontWeight: 300,
							color: COLORS.textPrimary,
							lineHeight: 1,
							margin: 0,
						}}
					>
						Meridian
					</h1>
					<p
						className="mt-1"
						style={{
							fontSize: 13,
							textTransform: "uppercase",
							letterSpacing: "0.12em",
							color: "rgba(200,205,216,0.4)",
							margin: 0,
						}}
					>
						Timezone Explorer
					</p>
				</div>
				<p
					style={{
						fontSize: 12,
						color: "rgba(200,205,216,0.35)",
						margin: 0,
					}}
				>
					Click zones on map · Drag bands to compare
				</p>
			</header>

			{/* Draggable Bands — primary interaction */}
			<div className="mx-auto" style={{ maxWidth: 1000, padding: "24px 20px 0" }}>
				<DraggableBands
					tzATime={tzATime}
					tzBTime={tzBTime}
					onTimeChange={handleTimeChange}
					tz1Offset={tz1Offset}
					tz2Offset={tz2Offset}
					refZone={refZone}
					onSetRef={setRefZone}
					onOffsetChange={handleOffsetChange}
				/>
			</div>

			{/* World Map */}
			<div className="py-5">
				<WorldMap
					geoData={geoData}
					loading={loading}
					tz1Offset={tz1Offset}
					tz2Offset={tz2Offset}
					refTime={refTime}
					refOffset={refOffset}
					hoveredBand={hoveredBand}
					onHoverBand={setHoveredBand}
					onClickBand={handleBandClick}
					nextClickTarget={nextClickTarget}
				/>
			</div>
		</div>
	);
}
