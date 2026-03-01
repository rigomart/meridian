import type { GeoPermissibleObjects } from "d3-geo";
import { useEffect, useState } from "react";
import DraggableBands from "./DraggableBands";
import { WORLD_ATLAS_URL } from "./data";
import type { RefZone } from "./types";
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

	function handleTimeChange(deltaHours: number) {
		setRefTime((prev) => prev + deltaHours);
	}

	function handleOffsetChange(zone: "A" | "B", offset: number) {
		if (zone === "A") setTz1Offset(offset);
		else setTz2Offset(offset);
	}

	return (
		<div className="min-h-screen">
			<header className="flex items-center justify-between px-5 py-2 border-b border-b-zone-a/8">
				<div className="flex items-baseline gap-3">
					<h1 className="font-serif text-2xl font-light leading-none text-text-primary">
						Meridian
					</h1>
					<span className="text-xs uppercase tracking-wider text-text-secondary/30">
						Timezone Explorer
					</span>
				</div>
				<p className="text-xs text-text-secondary/25">Drag zones on map · Drag bands to scrub time</p>
			</header>

			<div className="pt-4">
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
					onOffsetChange={handleOffsetChange}
				/>
			</div>
		</div>
	);
}
