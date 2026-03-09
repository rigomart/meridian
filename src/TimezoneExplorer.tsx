import type { GeoPermissibleObjects } from "d3-geo";
import { useEffect, useRef, useState } from "react";
import { WORLD_ATLAS_URL } from "./constants";
import DraggableBands from "./DraggableBands";
import { decodeTopo } from "./geo";
import {
  findTimezoneByName,
  findTimezoneForOffset,
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

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between px-3 sm:px-5 py-2 border-b border-b-zone-a/8">
        <div className="flex items-center gap-2 sm:gap-4">
          <MeridianLogo />
          <h1 className="font-serif text-xl sm:text-2xl font-light leading-none text-text-primary">
            Meridian
          </h1>
          <span className="hidden sm:inline text-xs text-text-secondary/30">Timezone Explorer</span>
        </div>
        <div className="flex items-center gap-3">
          <CopyUrlButton />
          <a
            href="https://github.com/rigomart/meridian"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-text-secondary/25 hover:text-text-secondary/50 transition-colors"
          >
            GitHub
          </a>
        </div>
      </header>

      <div className="pt-2 sm:pt-4">
        <p className="text-[10px] sm:text-xs text-text-secondary/25 text-center mb-1.5">
          Drag bands to shift time
          {!isLive && (
            <button
              type="button"
              onClick={handleResetToNow}
              className="ml-2 text-zone-a/60 hover:text-zone-a transition-colors cursor-pointer"
            >
              · Reset to now
            </button>
          )}
        </p>
        <DraggableBands
          tzATime={tzATime}
          tzBTime={tzBTime}
          onTimeChange={handleTimeChange}
          tz1Offset={tz1Offset}
          tz2Offset={tz2Offset}
          tz1Name={tz1Name}
          tz2Name={tz2Name}
          refZone={refZone}
          onSetRef={setRefZone}
          onTimezoneChange={handleTimezoneChange}
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

function MeridianLogo() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 32 32"
      fill="none"
      aria-label="Meridian logo"
      role="img"
    >
      <circle cx="16" cy="16" r="12.5" stroke="#e8dcc8" strokeWidth="1.5" />
      <ellipse cx="16" cy="16" rx="5" ry="12.5" stroke="#e8dcc8" strokeWidth="1" opacity="0.3" />
      <line x1="3.5" y1="16" x2="28.5" y2="16" stroke="#e8dcc8" strokeWidth="1" opacity="0.3" />
      <line
        x1="16"
        y1="3.5"
        x2="16"
        y2="28.5"
        stroke="#ffb74d"
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
      className="text-xs text-text-secondary/25 hover:text-text-secondary/50 transition-colors cursor-pointer"
    >
      {copied ? "Copied!" : "Share"}
    </button>
  );
}
