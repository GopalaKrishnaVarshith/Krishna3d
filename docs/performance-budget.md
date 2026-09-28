# Performance Budget

Measured on 2026-09-28 with `npm.cmd run build`.

| Area | Bytes | Notes |
|---|---:|---|
| HTML | 3,534 | Includes injected SEO metadata |
| CSS | 20,350 | Single global interface stylesheet |
| JavaScript | 749,356 | Split into app, world, avatar, and Three.js vendor chunks |
| Avatar WebP views | 1,326,310 | 32 optimized views for idle, walk, and interaction poses |
| Portrait asset | 77,058 | Static fallback/profile image |
| Company logos | 24,928 | Six optimized WebP marks |
| Publication cover | 5,712 | Optimized WebP cover |
| Crawler files and favicon | 626 | `robots.txt`, `sitemap.xml`, `favicon.svg` |
| Total built files | 2,207,874 | 2.11 MiB, below the 3 MB initial-interactive budget |

## Chunk Budget

The build intentionally isolates the Three.js runtime into its own vendor chunk:

| Chunk | Bytes | Gzip |
|---|---:|---:|
| `three-*.js` | 592,002 | 148,307 |
| `world-*.js` | 87,336 | 30,191 |
| `index-*.js` | 59,289 | 16,696 |
| `avatar-*.js` | 10,729 | 3,768 |

The configured Vite warning limit is 650 KB because the only large chunk is the measured Three.js vendor runtime. Application-owned chunks remain well below 100 KB minified.

## Runtime Quality Policy

The app starts at `high` quality and samples frame time continuously.

| Tier | Pixel ratio cap | Shadow map | Animated detail scale |
|---|---:|---:|---:|
| `high` | 1.75 | 2048 | 1.00 |
| `balanced` | 1.35 | 1024 | 0.72 |
| `low` | 1.00 | 512 | 0.45 |

After 180 sustained frames slower than 45 FPS, the next lower tier is applied. After 300 sustained frames faster than 58 FPS, the next higher tier is restored. Quality changes resize the renderer and reduce shadow-map pressure without rebuilding the scene.

## Resilience Gates

The browser resilience suite covers:

- WebGL-disabled launch falls back to the complete semantic portfolio.
- Simulated WebGL context loss pauses the canvas and restores the same world when the context returns.
- Direct navigation and project browse flows work without canvas interaction.
- A 360 px viewport keeps navigation, mobile movement, Interact, and Text version controls usable without horizontal overflow.

Unit tests cover hidden-tab visibility changes: rendering pauses, a pause prompt is shown, and rendering resumes when the page becomes visible again.
