import { Combobox } from "@base-ui/react";
import type { TimeZone } from "@vvo/tzdb";
import { formatTime, getAmPm, getDayIcon, getDayPhase } from "./time";
import {
	ALL_TIMEZONES,
	findTimezoneByName,
	formatOffsetStr,
	formatTzLabel,
	getOffsetHours,
} from "./timezones";

export interface ZoneRowProps {
	label: string;
	color: string;
	tzName: string;
	time: number;
	isRef: boolean;
	onSetRef: () => void;
	onTimezoneChange: (ianaName: string) => void;
	position: "top" | "bottom";
}

function filterTimezones(item: TimeZone, inputValue: string): boolean {
	const q = inputValue.toLowerCase();
	return (
		item.name.toLowerCase().includes(q) ||
		item.abbreviation.toLowerCase().includes(q) ||
		item.alternativeName.toLowerCase().includes(q) ||
		item.mainCities.some((c) => c.toLowerCase().includes(q))
	);
}

export default function ZoneRow({
	label,
	color,
	tzName,
	time,
	isRef,
	onSetRef,
	onTimezoneChange,
	position,
}: ZoneRowProps) {
	const timeStr = formatTime(time);
	const ampm = getAmPm(time);
	const icon = getDayIcon(getDayPhase(time));
	const selectedTz = findTimezoneByName(tzName) ?? null;

	return (
		<div
			className={`flex items-center gap-3 px-3 ${position === "top" ? "pb-1.5 pt-2.5" : "pb-2.5 pt-1.5"}`}
			onPointerDown={(e) => e.stopPropagation()}
		>
			<div
				className="flex items-center justify-center size-5.5 rounded-full text-xs font-semibold shrink-0"
				style={{ border: `2px solid ${color}`, color }}
			>
				{label}
			</div>

			<Combobox.Root
				items={ALL_TIMEZONES}
				value={selectedTz}
				onValueChange={(tz) => {
					if (tz) onTimezoneChange(tz.name);
				}}
				filter={filterTimezones}
				itemToStringLabel={formatTzLabel}
				autoHighlight
			>
				<Combobox.Trigger
					className="flex items-center justify-between gap-1.5 max-w-50 text-xs px-1.5 py-0.75 rounded border border-white/6 bg-bg-primary/80 outline-none cursor-default select-none data-[popup-open]:bg-white/5"
					style={{ color }}
				>
					<Combobox.Value placeholder={<span className="opacity-50">Select timezone</span>} />
					<Combobox.Icon className="flex shrink-0 opacity-50">
						<ChevronUpDownIcon />
					</Combobox.Icon>
				</Combobox.Trigger>
				<Combobox.Portal>
					<Combobox.Positioner align="start" sideOffset={4}>
						<Combobox.Popup
							className="[--input-height:2.25rem] origin-[var(--transform-origin)] max-w-[var(--available-width)] max-h-80 rounded-md border border-white/10 bg-bg-primary shadow-xl backdrop-blur-sm transition-[transform,scale,opacity] data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0"
							aria-label="Select timezone"
						>
							<div className="w-70 h-[var(--input-height)] p-1.5">
								<Combobox.Input
									placeholder="Search timezone..."
									className="h-full w-full rounded border border-white/10 bg-bg-secondary px-2 text-xs text-text-primary outline-none focus:border-white/20"
								/>
							</div>
							<Combobox.Empty className="px-3 py-2 text-xs text-text-secondary/50 empty:m-0 empty:p-0">
								No timezones found
							</Combobox.Empty>
							<Combobox.List className="overflow-y-auto scroll-py-1 py-1 overscroll-contain max-h-[min(calc(20rem_-_var(--input-height)),calc(var(--available-height)_-_var(--input-height)))] empty:p-0">
								{(tz: TimeZone) => (
									<Combobox.Item
										key={tz.name}
										value={tz}
										className="grid min-w-[var(--anchor-width)] cursor-default grid-cols-[0.75rem_1fr] items-center gap-2 py-1.5 pr-4 pl-3 text-xs leading-4 outline-none select-none text-text-secondary data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-text-primary data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1.5 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-white/8 data-[selected]:text-text-primary"
									>
										<Combobox.ItemIndicator className="col-start-1 self-center">
											<CheckIcon />
										</Combobox.ItemIndicator>
										<div className="col-start-2 flex items-baseline justify-between gap-3">
											<span>{tz.mainCities[0] ?? tz.name}</span>
											<span className="text-[10px] opacity-40 tabular-nums">
												UTC{formatOffsetStr(getOffsetHours(tz))} · {tz.abbreviation}
											</span>
										</div>
									</Combobox.Item>
								)}
							</Combobox.List>
						</Combobox.Popup>
					</Combobox.Positioner>
				</Combobox.Portal>
			</Combobox.Root>

			<button
				type="button"
				onClick={onSetRef}
				className="text-xs uppercase tracking-normal px-1.75 py-0.5 rounded-[3px] cursor-pointer whitespace-nowrap shrink-0"
				style={{
					border: `1px solid ${isRef ? `${color}55` : "rgba(255,255,255,0.06)"}`,
					background: isRef ? `${color}22` : "transparent",
					color: isRef ? color : "rgba(200,205,216,0.35)",
				}}
			>
				{isRef ? "\u2726 Ref" : "Ref"}
			</button>

			<div className="flex-1" />

			<span className="text-base font-semibold whitespace-nowrap shrink-0" style={{ color }}>
				{timeStr} <span className="text-xs opacity-50">{ampm}</span>{" "}
				<span className="text-xs">{icon}</span>
			</span>
		</div>
	);
}

function ChevronUpDownIcon() {
	return (
		<svg
			width="8"
			height="12"
			viewBox="0 0 8 12"
			fill="none"
			stroke="currentColor"
			strokeWidth="1.5"
			role="img"
			aria-label="Toggle dropdown"
		>
			<path d="M0.5 4.5L4 1.5L7.5 4.5" />
			<path d="M0.5 7.5L4 10.5L7.5 7.5" />
		</svg>
	);
}

function CheckIcon() {
	return (
		<svg
			width="10"
			height="10"
			viewBox="0 0 10 10"
			fill="currentColor"
			role="img"
			aria-label="Selected"
		>
			<path d="M9.1603 1.12218C9.50684 1.34873 9.60427 1.81354 9.37792 2.16038L5.13603 8.66012C5.01614 8.8438 4.82192 8.96576 4.60451 8.99384C4.3871 9.02194 4.1683 8.95335 4.00574 8.80615L1.24664 6.30769C0.939709 6.02975 0.916013 5.55541 1.19372 5.24822C1.47142 4.94102 1.94536 4.91731 2.2523 5.19524L4.36085 7.10461L8.12299 1.33999C8.34934 0.993152 8.81376 0.895638 9.1603 1.12218Z" />
		</svg>
	);
}
