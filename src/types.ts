import type { GeoPermissibleObjects } from "d3-geo";

export type RefZone = "A" | "B";
export type DayPhase = "day" | "dawn" | "dusk" | "night";

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
  tz1Name: string;
  tz2Name: string;
  refZone: RefZone;
  onSetRef: (zone: RefZone) => void;
  onTimezoneChange: (zone: "A" | "B", ianaName: string) => void;
}

export interface HourCellProps {
  hour: number;
  cellW: number;
  color: string;
  currentHour: number;
}
