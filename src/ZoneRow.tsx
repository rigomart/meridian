import { Combobox } from "@base-ui/react";
import type { TimeZone } from "@vvo/tzdb";
import { formatTime, getAmPm, getDayIcon, getDayPhase } from "./time";
import { ALL_TIMEZONES, findTimezoneByName, formatTzLabel } from "./timezones";

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
				<div className="relative flex items-center max-w-50">
					<Combobox.Input
						placeholder="Search timezone..."
						className="text-xs pl-1.5 pr-5 py-0.75 rounded border border-white/6 bg-bg-primary/80 outline-none cursor-pointer w-full"
						style={{ color }}
					/>
					<Combobox.Trigger className="absolute right-0.5 flex items-center justify-center size-4 cursor-pointer opacity-50 hover:opacity-100">
						<ChevronIcon />
					</Combobox.Trigger>
				</div>
				<Combobox.Portal>
					<Combobox.Positioner side="bottom" align="start" sideOffset={4}>
						<Combobox.Popup className="max-h-60 w-70 overflow-y-auto rounded-md border border-white/10 bg-bg-primary shadow-xl backdrop-blur-sm">
							<Combobox.List className="p-1">
								{(tz: TimeZone) => (
									<Combobox.Item
										key={tz.name}
										value={tz}
										className="flex items-center gap-2 px-2 py-1 text-xs rounded cursor-pointer text-text-secondary data-highlighted:bg-white/8 data-highlighted:text-text-primary data-selected:text-text-primary"
									>
										<Combobox.ItemIndicator className="flex items-center w-3 shrink-0">
											<CheckIcon />
										</Combobox.ItemIndicator>
										{formatTzLabel(tz)}
									</Combobox.Item>
								)}
							</Combobox.List>
							<Combobox.Empty className="px-3 py-2 text-xs text-text-secondary/50">
								No timezones found
							</Combobox.Empty>
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

function ChevronIcon() {
	return (
		<svg
			width="10"
			height="10"
			viewBox="0 0 10 10"
			fill="currentColor"
			role="img"
			aria-label="Toggle dropdown"
		>
			<path
				d="M2 3.5L5 6.5L8 3.5"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
				fill="none"
			/>
		</svg>
	);
}

function CheckIcon() {
	return (
		<svg width="10" height="10" viewBox="0 0 10 10" fill="none" role="img" aria-label="Selected">
			<path
				d="M2 5L4.5 7.5L8 2.5"
				stroke="currentColor"
				strokeWidth="1.5"
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</svg>
	);
}
