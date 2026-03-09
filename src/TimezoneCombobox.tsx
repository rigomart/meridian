import { Combobox } from "@base-ui/react";
import type { TimeZone } from "@vvo/tzdb";
import { useMemo, useState } from "react";
import {
  ALL_TIMEZONES,
  findTimezoneByName,
  formatOffsetStr,
  formatTzLabel,
  getOffsetHours,
} from "./timezones";

interface TimezoneComboboxProps {
  value: string;
  onValueChange: (ianaName: string) => void;
  color?: string;
}

/** Get initials from alternativeName, e.g. "Central Time" → "ct", "Eastern European Time" → "eet" */
function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toLowerCase();
}

function filterAndSort(items: TimeZone[], query: string): TimeZone[] {
  if (!query) return items;
  const q = query.toLowerCase();

  const matches: Array<{ tz: TimeZone; priority: number }> = [];
  for (const tz of items) {
    const abbr = tz.abbreviation.toLowerCase();
    const initials = getInitials(tz.alternativeName);
    if (abbr === q || initials === q) {
      matches.push({ tz, priority: 0 });
    } else if (abbr.startsWith(q) || initials.startsWith(q)) {
      matches.push({ tz, priority: 1 });
    } else if (
      tz.mainCities.some((c) => c.toLowerCase().startsWith(q)) ||
      tz.alternativeName.toLowerCase().startsWith(q)
    ) {
      matches.push({ tz, priority: 2 });
    } else if (
      tz.name.toLowerCase().includes(q) ||
      abbr.includes(q) ||
      tz.alternativeName.toLowerCase().includes(q) ||
      `${tz.alternativeName} (${tz.abbreviation})`.toLowerCase().includes(q) ||
      tz.mainCities.some((c) => c.toLowerCase().includes(q))
    ) {
      matches.push({ tz, priority: 3 });
    }
  }

  matches.sort((a, b) => a.priority - b.priority);
  return matches.map((m) => m.tz);
}

export default function TimezoneCombobox({ value, onValueChange, color }: TimezoneComboboxProps) {
  const selectedTz = findTimezoneByName(value) ?? null;
  const [inputValue, setInputValue] = useState("");
  const filteredItems = useMemo(() => filterAndSort(ALL_TIMEZONES, inputValue), [inputValue]);

  return (
    <Combobox.Root
      items={ALL_TIMEZONES}
      value={selectedTz}
      onValueChange={(tz) => {
        if (tz) onValueChange(tz.name);
      }}
      filteredItems={filteredItems}
      onInputValueChange={setInputValue}
      itemToStringLabel={formatTzLabel}
      autoHighlight
    >
      <Combobox.Trigger
        className="flex h-6 min-w-28 sm:min-w-40 max-w-44 sm:max-w-52 items-center justify-between gap-1.5 sm:gap-2 rounded-md border border-white/8 bg-bg-primary/80 pr-2 sm:pr-2.5 pl-2 sm:pl-3 text-[11px] sm:text-xs select-none hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-1 focus-visible:outline-zone-a/60 data-[popup-open]:bg-white/5 cursor-default"
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
            className="[--input-container-height:2.25rem] origin-[var(--transform-origin)] max-w-[var(--available-width)] max-h-80 rounded-md bg-bg-primary shadow-lg text-text-primary outline outline-1 outline-white/10 transition-[transform,scale,opacity] data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0"
            aria-label="Select timezone"
          >
            <div className="w-70 h-[var(--input-container-height)] p-1.5">
              <Combobox.Input
                placeholder="e.g. New York, PST, Asia/Tokyo"
                className="h-full w-full font-normal rounded border border-white/10 bg-bg-secondary px-2.5 text-xs text-text-primary focus:outline focus:outline-2 focus:-outline-offset-1 focus:outline-zone-a/60"
              />
            </div>
            <Combobox.Empty className="px-3 py-2 text-xs text-text-secondary/50 empty:m-0 empty:p-0">
              No timezones found.
            </Combobox.Empty>
            <Combobox.List className="overflow-y-auto scroll-py-1 py-1 overscroll-contain max-h-[min(calc(20rem_-_var(--input-container-height)),calc(var(--available-height)_-_var(--input-container-height)))] empty:p-0 [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.15)_transparent]">
              {(tz: TimeZone) => (
                <Combobox.Item
                  key={tz.name}
                  value={tz}
                  className="min-w-[var(--anchor-width)] cursor-default py-1.5 pr-4 pl-3 outline-none select-none text-text-secondary data-[highlighted]:relative data-[highlighted]:z-0 data-[highlighted]:text-text-primary data-[highlighted]:before:absolute data-[highlighted]:before:inset-x-1.5 data-[highlighted]:before:inset-y-0 data-[highlighted]:before:z-[-1] data-[highlighted]:before:rounded-sm data-[highlighted]:before:bg-white/8 data-[selected]:text-text-primary"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-xs leading-4">{tz.mainCities[0] ?? tz.name}</span>
                    <span className="text-[10px] opacity-40 tabular-nums">
                      UTC{formatOffsetStr(getOffsetHours(tz))}
                    </span>
                  </div>
                  <div className="text-[10px] leading-3 opacity-35 mt-0.5">
                    {tz.alternativeName} ({tz.abbreviation})
                  </div>
                </Combobox.Item>
              )}
            </Combobox.List>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
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
