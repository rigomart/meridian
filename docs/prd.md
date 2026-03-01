# Meridian — Timezone Explorer

## What is it

A single-page web app that helps you visually compare two timezones. You pick two zones (called Zone A and Zone B), and the app shows you the time difference on an interactive world map and a pair of draggable hour-band strips. The main use case is "if it's 3 PM for me, what time is it for them?" — answered visually, not with math.

The app is called **Meridian**. Subtitle: "Timezone Explorer".

---

## Tech Stack

- React (single .jsx file, functional components with hooks)
- d3-geo for map projection and path generation (d3 is the only external dependency)
- No build step beyond whatever renders React — designed to work as a single artifact/component
- Google Fonts loaded via `<link>` tag inside the component
- Map data fetched at runtime from `https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json` (TopoJSON, decoded inline — no topojson-client dependency)

---

## Visual Identity & Aesthetic

The overall vibe is **dark cartographic atlas meets modern data dashboard**. Think nautical charts, navigation instruments, control rooms. Not playful, not corporate — it should feel like a precision tool with character.

### Color Palette

| Role | Value | Notes |
|---|---|---|
| Background | `#080c14` → `#0d1220` → `#0f1525` | Vertical gradient, very dark navy |
| Primary text | `#e8dcc8` | Warm parchment/cream |
| Secondary text | `#c8cdd8` | Cool gray |
| Muted text | `rgba(200,205,216,0.35–0.45)` | Used for labels, hints |
| Zone A accent | `#ffb74d` | Warm amber/gold |
| Zone B accent | `#4fc3f7` | Cool cyan/sky blue |
| Work hours cells | `rgba(45,120,100,0.28)` | Teal green |
| Daytime cells | `rgba(45,120,100,0.10)` | Lighter teal |
| Night cells | `rgba(15,20,35,0.55)` | Deep navy |
| Borders | `rgba(255,255,255,0.02–0.04)` | Nearly invisible, structural |
| Panel background | `rgba(16,22,35,0.6)` | Semi-transparent dark navy |

### Typography

Two fonts, both from Google Fonts:

- **Cormorant Garamond** (weights: 300, 400, 600, 700) — used for the app title and as the base `font-family`. Gives the cartographic/editorial feel.
- **JetBrains Mono** (weights: 300, 400, 500) — used for everything else: times, labels, UTC offsets, city names, hour cell numbers, UI hints. This is the workhorse font. It should feel like instrument readouts.

All labels that describe UI elements (like "DRAG TO SCRUB TIME", "NEXT CLICK → ZONE A") are JetBrains Mono, uppercase, letter-spacing `0.06em–0.12em`, very low opacity (`0.25–0.4`). They're guidance, not decoration.

### General Styling Rules

- No emojis in the UI except for the day/night icons (☀ ☾ ◐) next to time displays.
- Borders are extremely subtle — mostly `rgba(255,255,255,0.04)`.
- Panel corners are `border-radius: 8–12px`.
- Transitions on hover/state changes: `0.2–0.3s` for color and border. No transitions on the draggable strips during drag (must feel instant).
- SVG elements use a glow filter (`feGaussianBlur` stdDeviation 2) on map markers.
- `user-select: none` on the draggable bands area.

---

## Layout (top to bottom)

### 1. Header

Full-width bar with bottom border (`1px solid rgba(255,183,77,0.08)`).

- **Left side:** App name "Meridian" in Cormorant Garamond, 38px, weight 300, color `#e8dcc8`. Below it, subtitle "Timezone Explorer" in JetBrains Mono 13px, uppercase, spaced-out, muted.
- **Right side:** Usage hint "Click zones on map · Drag bands to compare" in JetBrains Mono 12px, muted.

### 2. World Map

Centered, max-width 1000px (960 SVG + 40 padding). Responsive (`width: 100%`, `viewBox` based).

#### Map rendering details:

- **Projection:** d3 `geoNaturalEarth1`, fit to 960×480.
- **Background:** `rgba(8,12,20,0.6)` with a subtle radial gradient glow at center (`rgba(255,183,77,0.03)` → transparent).
- **Border:** `1px solid rgba(255,183,77,0.06)`, `border-radius: 8px`.
- **Graticule:** 15° step grid, stroke `rgba(200,210,230,0.06)`, 0.5px.
- **Sphere outline:** stroke `rgba(255,183,77,0.12)`, 1px.
- **Country polygons:** fill `rgba(200,210,230,0.07)`, stroke `rgba(200,210,230,0.12)`, 0.4px. `pointer-events: none` (clicks pass through to timezone bands).
- **Equator:** dashed line, `rgba(255,183,77,0.1)`, strokeDasharray `4,4`.

#### Timezone bands on the map:

25 vertical bands, each 15° longitude wide (from offset -12 to +12), rendered as polygon paths. These are **simplified mathematical bands**, not real political timezone boundaries. They span from latitude -85 to +85.

- **Default fill:** varies by computed day/night cycle at that offset's current time:
  - Day (6:00–18:00): `rgba(255,213,79,0.08)`
  - Dawn (5:00–6:00): `rgba(255,152,67,0.06)`
  - Dusk (18:00–19:00): `rgba(255,111,67,0.06)`
  - Night: `rgba(30,40,70,0.15)`
- **Selected fill:** `rgba(255,183,77,0.22)` with colored border (amber for Zone A, cyan for Zone B).
- **Hover:** border brightens to `rgba(255,255,255,0.12)`.
- **Cursor:** pointer on all bands.
- **Transitions:** fill and stroke 0.2s.

#### Click behavior:

Clicks alternate between setting Zone A and Zone B. A label in the top-right of the map area shows which zone the next click will set: "NEXT CLICK → ZONE A" (in amber) or "NEXT CLICK → ZONE B" (in cyan). After clicking, the target switches.

#### Selected zone markers:

For each selected zone (A and B), drawn at the center longitude of that offset:

- Vertical dashed line spanning most of the map height, in the zone's color, 1.5px, dasharray `6,4`, opacity 0.4, with glow filter.
- Filled circle (r=6) in the zone's color at the equator intersection, with glow.
- White inner circle (r=3).
- Letter label ("A" or "B") above the marker, JetBrains Mono 10px, zone color.

#### Hover tooltip:

When hovering a timezone band (that isn't selected), a small pill appears near the bottom of the map at latitude -60 of that band's center longitude:

- Dark background rect (`rgba(10,14,23,0.92)`) with border (`rgba(255,255,255,0.15)`), 110×24px, rounded.
- Text showing city name + current time, JetBrains Mono 10px, `#e8dcc8`.
- Example: "Bangkok · 14:30"

### 3. Control Panel

Below the map, same max-width, inside a rounded panel (`background: rgba(16,22,35,0.6)`, `border-radius: 12px`, `border: 1px solid rgba(255,183,77,0.06)`, `padding: 28px 32px`).

Contains two sub-sections stacked vertically:

#### 3a. Zone Cards + Difference Display

A flex row with three elements: Zone A card, center difference display, Zone B card. Wraps on narrow screens.

**Each Zone Card:**

- Rounded container (`border-radius: 10px`, `padding: 20px`, `min-width: 240px`, `flex: 1`).
- If it's the reference zone: subtle tinted background (`{color}08`), colored border (`{color}33`).
- If not: transparent background, very subtle border (`rgba(255,255,255,0.04)`).
- **Top row:** zone badge (26px circle, zone color border, letter inside) + "Zone A/B" label + "Set as ref" / "✦ Reference" toggle button.
- **Big time:** JetBrains Mono 32px, weight 300, `#e8dcc8`, 24h format like "16:30", followed by AM/PM in 14px at 0.5 opacity, followed by day/night icon in 18px.
- **City + UTC line:** JetBrains Mono 11px, muted. e.g. "Lima · UTC-5".
- **Dropdown:** full-width `<select>` element listing all timezone offsets with their representative city. Dark background, subtle border, JetBrains Mono 12px. Options formatted as "UTC+X — CityName".

**Reference toggle ("Set as ref" button):**

- When active: background `{color}22`, border `{color}55`, text in zone color, shows "✦ Reference".
- When inactive: near-transparent, shows "Set as ref".
- JetBrains Mono 9px, uppercase, letter-spacing.
- This controls which zone the time scrubbing is anchored to. When Zone A is the reference, the draggable bands scrub Zone A's time directly and Zone B follows based on the offset difference (and vice versa).

**Center Difference Display:**

- Vertically centered between the cards, min-width 120px, padding `0 24px`.
- Label "DIFFERENCE" in tiny uppercase muted text.
- Value like "5h ahead" or "Same time" in JetBrains Mono 18px, weight 500, `#e8dcc8`.
- Thin divider line (40px wide, `rgba(255,183,77,0.15)`).
- Sub-text: "B is 5h ahead relative to A" in 9px muted text.

#### 3b. Draggable Time Bands

This is the core interaction. Two horizontal hour-strip bands, one for Zone A and one for Zone B, with a single fixed needle at the center.

**Container:**

- `border-radius: 8px`, `overflow: hidden`.
- `background: rgba(8,12,20,0.3)`.
- Border changes on drag: default `rgba(255,255,255,0.04)`, dragging `rgba(255,183,77,0.15)`.
- `cursor: grab` (default), `cursor: grabbing` (while dragging).
- `touch-action: none` for mobile drag support.
- `position: relative` (for the needle positioning).

**How the scrolling strips work:**

Each band is a **wide horizontal strip** containing 72 hour cells (24 hours repeated 3 times, to allow seamless visual wrapping). The strip is wider than the container and is positioned via CSS `transform: translateX()`. The container clips the overflow.

The strip is translated so that the zone's current hour lands at the **exact horizontal center** of the container — which is where the fixed needle sits. Since Zone A and Zone B have different local times, their strips are naturally offset from each other. This offset IS the timezone difference, made visible.

- Visible hours in viewport: ~25 (so `cellW = containerWidth / 25`).
- Total cells rendered: 72 (with 24-cell padding before hour 0).
- Strip width: `72 * cellW`.
- Translation formula: `translateX = (containerWidth / 2) - ((normalizedHour + 24) * cellW) - (cellW * fractionalHourPart)`.
- `will-change: transform` for GPU acceleration.
- No CSS transition on transform during drag (must be instant). No transition at all in current version.

**Zone labels (above strip A and below strip B):**

Inside the draggable container, flush with the padding:

- Left: city name in zone color, JetBrains Mono 10px, with UTC offset in lighter opacity.
- Right: current time in zone color, JetBrains Mono 13px weight 600, with AM/PM and day/night icon.

**Individual hour cells:**

Each cell is a fixed-width div (`width = cellW`), 48px tall.

- Contains the hour number centered inside, JetBrains Mono.
- If it's the current hour: background in zone color with `bb` alpha, text is dark (`#0a0e17`), font 13px bold, shows full time (e.g. "16:30") instead of just the hour number.
- If work hours (9–17): teal background `rgba(45,120,100,0.28)`, text muted, shows hour number (e.g. "14"), font 10px.
- If daytime (6–18): lighter teal `rgba(45,120,100,0.10)`, same text style.
- If nighttime: dark `rgba(15,20,35,0.55)`, same text style.
- Right border: `1px solid rgba(255,255,255,0.04)`.

**The fixed needle:**

Absolutely positioned at `left: 50%`, spans the full height of the container (`top: 0; bottom: 0`). `pointer-events: none`.

Composed of three elements in a vertical flex column:

1. **Top diamond:** 12×12px square rotated 45° (CSS `transform: rotate(45deg)`), `background: #ffb74d`, `border-radius: 2px`, `box-shadow: 0 0 14px rgba(255,183,77,0.7)`.
2. **Vertical line:** `width: 2px`, `flex: 1`, `background: #ffb74d`, `box-shadow: 0 0 10px rgba(255,183,77,0.5)`.
3. **Bottom diamond:** same as top.

The needle is always amber-colored (same as Zone A accent). It represents "now" or the selected reference time.

**Drag behavior:**

- Uses Pointer Events (pointerdown, pointermove, pointerup) with `setPointerCapture` for reliable tracking.
- Drag direction: dragging right moves the strips right, which means going backward in time (earlier). Dragging left goes forward (later). This feels like you're physically pushing the timeline.
- Math: `deltaHours = -(pixelsDragged) * (25 / containerWidth)`. The result updates `refTime`, which is the time in whichever zone is set as the reference.
- Both strips move simultaneously because they're both derived from the same `refTime` state.
- Click (without drag): sets the time to whatever hour was clicked, based on its distance from center.

**Hint text below the bands:**

- Centered, JetBrains Mono 9px, very muted.
- Default: "Click or drag anywhere on the bands".
- While dragging: "Scrubbing..." in slightly brighter amber tint.

---

## State Model

| State variable | Type | Default | Purpose |
|---|---|---|---|
| `geoData` | GeoJSON FeatureCollection or null | null | Country polygons for map |
| `loading` | boolean | true | Map data loading state |
| `tz1Offset` | number | User's local UTC offset | Zone A timezone (e.g. -5 for Lima) |
| `tz2Offset` | number | 0 | Zone B timezone (e.g. 0 for London) |
| `refTime` | number (0–24, fractional) | Current hour + minutes/60 | The time in the reference zone |
| `refZone` | "A" or "B" | "A" | Which zone `refTime` refers to |
| `hoveredBand` | number or null | null | Which map timezone band is hovered |
| `nextClickTarget` | 1 or 2 | 1 | Whether next map click sets Zone A or B |

**Derived values:**

- `refOffset` = whichever offset matches `refZone`
- `tzATime` = if refZone is A: refTime, else refTime + (tz1Offset - refOffset)
- `tzBTime` = if refZone is B: refTime, else refTime + (tz2Offset - refOffset)
- `timeDiff` = tz2Offset - tz1Offset (used for the "Xh ahead/behind" label)

Time values freely go above 24 or below 0 during calculations and are wrapped with `((h % 24) + 24) % 24` only at display time.

---

## Timezone Data

The app uses **simplified mathematical timezone bands** (15° longitude slices), not real political boundaries. Each offset is mapped to a representative city:

```
-12: Baker Is.    -11: Pago Pago    -10: Honolulu    -9: Anchorage
-8: Los Angeles   -7: Denver        -6: Mexico City  -5: New York
-4: Santiago      -3: São Paulo     -2: Mid-Atlantic -1: Azores
 0: London         1: Paris          2: Cairo         3: Moscow
 4: Dubai          5: Karachi      5.5: Mumbai        6: Dhaka
 7: Bangkok        8: Shanghai       9: Tokyo       9.5: Adelaide
10: Sydney        11: Nouméa        12: Auckland
```

The available offsets for the dropdown are: -12 through +12 in integer steps, plus 5.5 and 9.5.

For the map bands, only integer offsets -12 to +12 are rendered (25 bands).

---

## Day/Night Classification

Used for map band fills, hour cell colors, and the icon next to time displays:

| Range | Classification | Icon |
|---|---|---|
| 06:00–17:59 | Day | ☀ |
| 05:00–05:59 | Dawn | ◐ |
| 18:00–18:59 | Dusk | ◐ |
| 19:00–04:59 | Night | ☾ |

---

## Time Formatting

- **24-hour display:** always `HH:MM` with zero-padding (e.g. "08:30", "16:55", "00:15").
- **AM/PM suffix:** shown alongside the 24h time in smaller, lower-opacity text. Determined by whether the hour >= 12.
- **Minutes precision:** the `refTime` state is fractional (e.g. 14.5 = 2:30 PM). The drag step granularity is pixel-level (not snapped to hours).

---

## Component Architecture

| Component | Props | Responsibility |
|---|---|---|
| `TimezoneExplorer` (default export) | none | Root. Owns all state, renders header + map + control panel. |
| `ZoneCard` | label, color, offset, time, isRef, onSetRef, onOffsetChange | One zone's info card with time display and dropdown. |
| `DraggableBands` | tzATime, tzBTime, tz1Label, tz2Label, onTimeChange, refOffset, tz1Offset, tz2Offset | The scrolling strip area with drag logic and fixed needle. |
| `HourCell` | hour, cellW, color, currentHour | Single hour cell inside a strip. Pure presentational. |

There's also an inline `decodeTopo` function that decodes TopoJSON without needing the topojson-client library.

---

## Known Limitations / Future Improvements

- **Timezone accuracy:** bands are 15° longitude slices, not real political boundaries. Real tz data would come from something like `timezone-boundary-builder`.
- **Half-hour/quirky offsets:** only 5.5 (India) and 9.5 (Adelaide) are supported. Missing Nepal (5.75), Chatham Islands (12.75), etc.
- **No DST awareness:** offsets are static. Real-world timezones shift seasonally.
- **No date context:** the app only deals with time-of-day, not "what day is it there" (matters when crossing midnight).
- **Mobile:** the drag interaction works (pointer events) but hasn't been optimized for small screens. The zone cards stack but could be tighter.
- **The map bands' day/night shading** updates as you drag the time strips, which is a nice touch but could be more prominent.