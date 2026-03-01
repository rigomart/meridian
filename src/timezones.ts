import { getTimeZones, type TimeZone } from "@vvo/tzdb";

export type { TimeZone };

const RAW_TIMEZONES: TimeZone[] = getTimeZones();

/** Deduplicated list: one entry per unique alternativeName + offset. */
export const ALL_TIMEZONES: TimeZone[] = (() => {
	const seen = new Set<string>();
	const result: TimeZone[] = [];
	for (const tz of RAW_TIMEZONES) {
		const key = `${tz.alternativeName}|${tz.currentTimeOffsetInMinutes}`;
		if (seen.has(key)) continue;
		seen.add(key);
		result.push(tz);
	}
	return result;
})();

export const OFFSET_CITY_MAP: Record<number, string> = (() => {
	const map: Record<number, string> = {};
	for (const tz of ALL_TIMEZONES) {
		const hours = tz.currentTimeOffsetInMinutes / 60;
		if (!(hours in map)) {
			map[hours] = tz.mainCities[0] ?? tz.name;
		}
	}
	return map;
})();

export function getOffsetHours(tz: TimeZone): number {
	return tz.currentTimeOffsetInMinutes / 60;
}

function formatOffsetStr(hours: number): string {
	const sign = hours >= 0 ? "+" : "-";
	const abs = Math.abs(hours);
	const h = Math.floor(abs);
	const m = Math.round((abs - h) * 60);
	return m === 0 ? `${sign}${h}` : `${sign}${h}:${String(m).padStart(2, "0")}`;
}

export function formatTzLabel(tz: TimeZone): string {
	const offsetStr = formatOffsetStr(getOffsetHours(tz));
	const city = tz.mainCities[0] ?? tz.name;
	return `UTC${offsetStr} ${tz.abbreviation} ${city}`;
}

export function findTimezoneForOffset(offset: number): TimeZone | undefined {
	return ALL_TIMEZONES.find(
		(tz) => tz.currentTimeOffsetInMinutes === offset * 60,
	);
}

export function findTimezoneByName(name: string): TimeZone | undefined {
	return (
		ALL_TIMEZONES.find((tz) => tz.name === name) ??
		RAW_TIMEZONES.find((tz) => tz.name === name || tz.group.includes(name))
	);
}

export function getLocalTimezone(): TimeZone | undefined {
	const localIana = Intl.DateTimeFormat().resolvedOptions().timeZone;
	return findTimezoneByName(localIana) ?? ALL_TIMEZONES.find(
		(tz) => tz.currentTimeOffsetInMinutes === -(new Date().getTimezoneOffset()),
	);
}
