import type { GeoPermissibleObjects } from "d3-geo";
import type { DayPhase } from "./types";

interface TopoGeometry {
	type: string;
	arcs: number[][] | number[][][];
}

interface TopoObject {
	type: string;
	geometries: TopoGeometry[];
}

interface TopoJSON {
	type: string;
	transform?: { scale: [number, number]; translate: [number, number] };
	arcs: [number, number][][];
	objects: Record<string, TopoObject>;
}

export function decodeTopo(topo: TopoJSON): GeoPermissibleObjects {
	const { transform, arcs: rawArcs } = topo;
	const sx = transform?.scale[0] ?? 1;
	const sy = transform?.scale[1] ?? 1;
	const tx = transform?.translate[0] ?? 0;
	const ty = transform?.translate[1] ?? 0;

	const decodedArcs: [number, number][][] = rawArcs.map((arc) => {
		let x = 0;
		let y = 0;
		return arc.map((point) => {
			x += point[0];
			y += point[1];
			return [x * sx + tx, y * sy + ty] as [number, number];
		});
	});

	function resolveArc(index: number): [number, number][] {
		if (index >= 0) return decodedArcs[index];
		return [...decodedArcs[~index]].reverse();
	}

	function resolveRing(indices: number[]): [number, number][] {
		const coords: [number, number][] = [];
		for (const idx of indices) {
			const arc = resolveArc(idx);
			for (let i = coords.length > 0 ? 1 : 0; i < arc.length; i++) {
				coords.push(arc[i]);
			}
		}
		return coords;
	}

	const objectKey = Object.keys(topo.objects)[0];
	const object = topo.objects[objectKey];

	const features = object.geometries.map((geom) => {
		let coordinates: unknown;
		if (geom.type === "Polygon") {
			coordinates = (geom.arcs as number[][]).map(resolveRing);
		} else if (geom.type === "MultiPolygon") {
			coordinates = (geom.arcs as number[][][]).map((polygon) => polygon.map(resolveRing));
		}
		return {
			type: "Feature" as const,
			geometry: { type: geom.type, coordinates },
			properties: {},
		};
	});

	return {
		type: "FeatureCollection",
		features,
	} as GeoPermissibleObjects;
}

export function wrapHour(h: number): number {
	return ((h % 24) + 24) % 24;
}

export function getDayPhase(hour: number): DayPhase {
	const h = wrapHour(hour);
	if (h >= 6 && h < 18) return "day";
	if (h >= 5 && h < 6) return "dawn";
	if (h >= 18 && h < 19) return "dusk";
	return "night";
}

export function getDayIcon(phase: DayPhase): string {
	switch (phase) {
		case "day":
			return "☀";
		case "dawn":
		case "dusk":
			return "◐";
		case "night":
			return "☾";
	}
}

export function formatTime(fractionalHour: number): string {
	const wrapped = wrapHour(fractionalHour);
	const hours = Math.floor(wrapped);
	const minutes = Math.round((wrapped - hours) * 60) % 60;
	return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function getAmPm(fractionalHour: number): string {
	const h = Math.floor(wrapHour(fractionalHour));
	return h >= 12 ? "PM" : "AM";
}

export function buildBandPolygon(offset: number): GeoJSON.Feature<GeoJSON.Polygon> {
	const centerLon = offset * 15;
	const west = centerLon - 7.5;
	const east = centerLon + 7.5;
	const north = 85;
	const south = -85;
	return {
		type: "Feature",
		properties: { offset },
		geometry: {
			type: "Polygon",
			coordinates: [
				[
					[west, north],
					[east, north],
					[east, south],
					[west, south],
					[west, north],
				],
			],
		},
	};
}

export function getBandFill(offset: number, refTime: number, refOffset: number): string {
	const localHour = wrapHour(refTime + (offset - refOffset));
	const phase = getDayPhase(localHour);
	switch (phase) {
		case "day":
			return "rgba(255,213,79,0.08)";
		case "dawn":
			return "rgba(255,152,67,0.06)";
		case "dusk":
			return "rgba(255,111,67,0.06)";
		case "night":
			return "rgba(30,40,70,0.15)";
	}
}
