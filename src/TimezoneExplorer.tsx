import type { GeoPermissibleObjects } from "d3-geo";
import { useEffect, useRef, useState } from "react";
import { COLORS, WORLD_ATLAS_URL } from "./constants";
import DraggableBands from "./DraggableBands";
import { decodeTopo } from "./geo";
import TimezoneCombobox from "./TimezoneCombobox";
import { formatTime, getAmPm, getDayIcon, getDayPhase } from "./time";
import {
  findTimezoneByName,
  findTimezoneForOffset,
  formatOffsetStr,
  getLocalTimezone,
  getOffsetHours,
} from "./timezones";
import type { RefZone } from "./types";
import WorldMap from "./WorldMap";

function getCurrentFractionalHour(): number {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60;
}

function initLocalTimezone(): { name: string; offset: number } {
  const local = getLocalTimezone();
  if (local) return { name: local.name, offset: getOffsetHours(local) };
  const offset = -(new Date().getTimezoneOffset() / 60);
  return { name: "Africa/Abidjan", offset };
}

function parseHash(): { a?: string; b?: string; ref?: RefZone } {
  const hash = window.location.hash.slice(1);
  if (!hash) return {};
  const params = new URLSearchParams(hash);
  const a = params.get("a") ?? undefined;
  const b = params.get("b") ?? undefined;
  const ref = params.get("ref");
  return { a, b, ref: ref === "A" || ref === "B" ? ref : undefined };
}

function resolveInitialZone(
  hashName: string | undefined,
  fallback: { name: string; offset: number },
): { name: string; offset: number } {
  if (!hashName) return fallback;
  const tz = findTimezoneByName(hashName);
  if (!tz) return fallback;
  return { name: tz.name, offset: getOffsetHours(tz) };
}

export default function TimezoneExplorer() {
  const [geoData, setGeoData] = useState<GeoPermissibleObjects | null>(null);
  const [loading, setLoading] = useState(true);

  const localInit = initLocalTimezone();
  const hashInit = parseHash();

  const initA = resolveInitialZone(hashInit.a, localInit);
  const initB = resolveInitialZone(hashInit.b, {
    name: "Africa/Abidjan",
    offset: 0,
  });

  const [tz1Offset, setTz1Offset] = useState(initA.offset);
  const [tz2Offset, setTz2Offset] = useState(initB.offset);
  const [tz1Name, setTz1Name] = useState(initA.name);
  const [tz2Name, setTz2Name] = useState(initB.name);

  const [refTime, setRefTime] = useState(getCurrentFractionalHour);
  const [refZone, setRefZone] = useState<RefZone>(hashInit.ref ?? "A");
  const [isLive, setIsLive] = useState(true);
  const [hoveredBand, setHoveredBand] = useState<number | null>(null);

  const refOffset = refZone === "A" ? tz1Offset : tz2Offset;
  const tzATime = refZone === "A" ? refTime : refTime + (tz1Offset - refOffset);
  const tzBTime = refZone === "B" ? refTime : refTime + (tz2Offset - refOffset);
  const timeDiff = tz2Offset - tz1Offset;

  // Sync state → URL hash
  const isInitialRender = useRef(true);
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    const params = new URLSearchParams();
    params.set("a", tz1Name);
    params.set("b", tz2Name);
    if (refZone !== "A") params.set("ref", refZone);
    history.replaceState(null, "", `#${params.toString()}`);
  }, [tz1Name, tz2Name, refZone]);

  // Live clock tick
  useEffect(() => {
    if (!isLive) return;
    const id = setInterval(() => {
      setRefTime(getCurrentFractionalHour());
    }, 60_000);
    return () => clearInterval(id);
  }, [isLive]);

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
    setIsLive(false);
    setRefTime((prev) => prev + deltaHours);
  }

  function handleResetToNow() {
    setRefTime(getCurrentFractionalHour());
    setIsLive(true);
  }

  function handleTimezoneChange(zone: "A" | "B", ianaName: string) {
    const tz = findTimezoneByName(ianaName);
    if (!tz) return;
    const offset = getOffsetHours(tz);
    if (zone === "A") {
      setTz1Name(tz.name);
      setTz1Offset(offset);
    } else {
      setTz2Name(tz.name);
      setTz2Offset(offset);
    }
  }

  function handleOffsetChange(zone: "A" | "B", offset: number) {
    const match = findTimezoneForOffset(offset);
    if (zone === "A") {
      setTz1Offset(offset);
      if (match) setTz1Name(match.name);
    } else {
      setTz2Offset(offset);
      if (match) setTz2Name(match.name);
    }
  }

  const diffLabel =
    timeDiff === 0 ? "Same time" : `${Math.abs(timeDiff)}h ${timeDiff > 0 ? "ahead" : "behind"}`;

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3">
        <div className="flex items-center gap-2.5">
          <MeridianLogo />
          <span className="text-sm font-semibold tracking-tight text-text-primary">Meridian</span>
        </div>
        <div className="flex items-center gap-3">
          {!isLive && (
            <button
              type="button"
              onClick={handleResetToNow}
              className="text-xs font-medium text-zone-a hover:text-zone-a/80 transition-colors cursor-pointer"
            >
              Reset to now
            </button>
          )}
          <CopyUrlButton />
          <a
            href="https://github.com/rigomart/meridian"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-text-secondary/30 hover:text-text-secondary/60 transition-colors"
          >
            GitHub
          </a>
        </div>
      </header>

      {/* ── Timeline bands (full width) ── */}
      <section className="pt-3 sm:pt-5">
        <DraggableBands tzATime={tzATime} tzBTime={tzBTime} onTimeChange={handleTimeChange} />
      </section>

      {/* ── Cards + Map (side by side on lg, stacked on mobile) ── */}
      <section className="px-4 sm:px-6 py-4 sm:py-6 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-[19rem_1fr] gap-4 lg:gap-5 items-start">
          {/* Left: zone cards + diff */}
          <div className="flex flex-col gap-3 lg:gap-0">
            <ZoneCard
              label="A"
              color={COLORS.zoneA}
              tzName={tz1Name}
              time={tzATime}
              offset={tz1Offset}
              isRef={refZone === "A"}
              onSetRef={() => setRefZone("A")}
              onTimezoneChange={(name) => handleTimezoneChange("A", name)}
            />

            {/* Diff badge — always horizontal */}
            <div className="hidden lg:flex items-center justify-center gap-2.5 py-2">
              <div className="w-5 h-px bg-white/8" />
              <span className="text-xs font-medium font-mono text-text-primary">{diffLabel}</span>
              <div className="w-5 h-px bg-white/8" />
            </div>

            <ZoneCard
              label="B"
              color={COLORS.zoneB}
              tzName={tz2Name}
              time={tzBTime}
              offset={tz2Offset}
              isRef={refZone === "B"}
              onSetRef={() => setRefZone("B")}
              onTimezoneChange={(name) => handleTimezoneChange("B", name)}
            />

            {/* Mobile/tablet diff */}
            <div className="lg:hidden flex items-center justify-center gap-2.5 -mt-1">
              <div className="w-5 h-px bg-white/8" />
              <span className="text-xs font-medium font-mono text-text-primary">{diffLabel}</span>
              <div className="w-5 h-px bg-white/8" />
            </div>
          </div>

          {/* Right: map */}
          <div className="min-w-0">
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
      </section>
    </div>
  );
}

/* ────────────────────────────────────────────────────
 *  Zone Card — glass panel with big time display
 * ──────────────────────────────────────────────────── */

function ZoneCard({
  label,
  color,
  tzName,
  time,
  offset,
  isRef,
  onSetRef,
  onTimezoneChange,
}: {
  label: string;
  color: string;
  tzName: string;
  time: number;
  offset: number;
  isRef: boolean;
  onSetRef: () => void;
  onTimezoneChange: (ianaName: string) => void;
}) {
  const timeStr = formatTime(time);
  const ampm = getAmPm(time);
  const icon = getDayIcon(getDayPhase(time));

  return (
    <div className="relative rounded-xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
      {/* Accent gradient at top edge */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${color}50, transparent)` }}
      />

      <div className="p-3.5 sm:p-4">
        {/* Row: badge · combobox · ref */}
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center size-6 rounded-lg text-[11px] font-bold text-white shrink-0"
            style={{ background: color }}
          >
            {label}
          </div>
          <TimezoneCombobox value={tzName} onValueChange={onTimezoneChange} color={color} />
          <div className="flex-1" />
          <button
            type="button"
            onClick={onSetRef}
            className="text-[10px] sm:text-xs uppercase px-2 py-0.5 rounded cursor-pointer shrink-0 transition-colors"
            style={{
              border: `1px solid ${isRef ? `${color}55` : "rgba(255,255,255,0.06)"}`,
              background: isRef ? `${color}18` : "transparent",
              color: isRef ? color : "rgba(161,161,170,0.4)",
            }}
          >
            {isRef ? "\u2726 Ref" : "Ref"}
          </button>
        </div>

        {/* Big time */}
        <div className="mt-3 sm:mt-4 flex items-baseline gap-2">
          <span
            className="text-3xl sm:text-4xl lg:text-[2.75rem] font-semibold tracking-tight font-mono leading-none"
            style={{ color }}
          >
            {timeStr}
          </span>
          <div className="flex flex-col gap-0.5 ml-0.5">
            <span className="text-[10px] sm:text-xs font-medium text-text-secondary/50">
              {ampm}
            </span>
            <span className="text-sm leading-none">{icon}</span>
          </div>
        </div>

        {/* UTC offset */}
        <div className="mt-2 text-[10px] sm:text-[11px] text-text-secondary/40 font-mono">
          UTC{formatOffsetStr(offset)}
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────
 *  Small components
 * ──────────────────────────────────────────────────── */

function MeridianLogo() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 32 32"
      fill="none"
      aria-label="Meridian logo"
      role="img"
    >
      <circle cx="16" cy="16" r="12.5" stroke="#f4f4f5" strokeWidth="1.5" opacity="0.5" />
      <ellipse cx="16" cy="16" rx="5" ry="12.5" stroke="#f4f4f5" strokeWidth="1" opacity="0.2" />
      <line x1="3.5" y1="16" x2="28.5" y2="16" stroke="#f4f4f5" strokeWidth="1" opacity="0.2" />
      <line
        x1="16"
        y1="3.5"
        x2="16"
        y2="28.5"
        stroke="#f97316"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CopyUrlButton() {
  const [copied, setCopied] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout>>(null);

  function handleCopy() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="text-xs text-text-secondary/30 hover:text-text-secondary/60 transition-colors cursor-pointer"
    >
      {copied ? "Copied!" : "Share"}
    </button>
  );
}
