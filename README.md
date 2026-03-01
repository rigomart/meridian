# Meridian

An interactive timezone comparison tool. Pick two zones, drag to shift time, and see how hours align across the world.

**Live:** [meridian.rigos.dev](https://meridian.rigos.dev)

## How it works

Meridian renders an SVG world map using a d3-geo equirectangular projection, divided into UTC offset bands with day/night shading based on the current time. You select two timezones (Zone A and Zone B) and compare them through two synchronized views:

- **World map** — Drag zone markers across the map to change timezone selections. Hover over any band to see its local time and representative city.
- **Time bands** — Two horizontal hour strips scroll in sync. Drag or click to shift time forward and backward. A center indicator marks the current moment.
- **Timezone search** — A searchable dropdown lets you pick any IANA timezone by city name.
- **Shareable URLs** — Zone selections and reference zone are encoded in the URL hash, so you can copy and share a link to any comparison.
- **Live clock** — Time updates every minute. Dragging pauses the clock; a "Reset to now" button brings it back.

## Getting started

Prerequisites: [Node.js](https://nodejs.org/) (v18+) and [Bun](https://bun.sh/).

```sh
# Clone the repo
git clone https://github.com/rigomart/meridian.git
cd meridian

# Install dependencies
bun install

# Start the dev server
bun run dev
```

The app will be available at `http://localhost:5173`.

## Scripts

| Command            | Description                          |
| ------------------ | ------------------------------------ |
| `bun run dev`      | Start the Vite dev server with HMR   |
| `bun run build`    | Type-check with tsc, then build      |
| `bun run preview`  | Preview the production build locally |
| `bun run lint`     | Lint and format with Biome           |
| `bun run lint:ci`  | CI-friendly lint check (no writes)   |
