import type { GeoPermissibleObjects } from "d3-geo";

export type RefZone = "A" | "B";
export type DayPhase = "day" | "dawn" | "dusk" | "night";

export interface TimezoneEntry {
	offset: number;
	city: string;
}

export interface WorldMapProps {
	geoData: GeoPermissibleObjects | null;
	loading: boolean;
	tz1Offset: number;
	tz2Offset: number;
	refTime: number;
	refOffset: number;
	hoveredBand: number | null;
	onHoverBand: (offset: number | null) => void;
	onOffsetChange: (zone: "A" | "B", offset: number) => void;
}

export interface DraggableBandsProps {
	tzATime: number;
	tzBTime: number;
	onTimeChange: (deltaHours: number) => void;
	tz1Offset: number;
	tz2Offset: number;
	refZone: RefZone;
	onSetRef: (zone: RefZone) => void;
	onOffsetChange: (zone: "A" | "B", offset: number) => void;
}

export interface HourCellProps {
	hour: number;
	cellW: number;
	color: string;
	currentHour: number;
}
