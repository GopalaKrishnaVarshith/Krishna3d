# Krishna Regulatory Systems World

An independent pure Three.js portfolio for Krishna Varshith R. It presents regulatory workflow, document quality, automation, responsible AI, and career evidence as a navigable 3D island world.

## Run locally

```powershell
npm.cmd install
npm.cmd run dev -- --host 127.0.0.1
```

Open `http://127.0.0.1:5173/`.

## Scripts

```powershell
npm.cmd test -- --run
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test:e2e
```

## Controls

- Use `WASD` or arrow keys to walk.
- Drag the canvas to orbit the camera.
- Use the mouse wheel to zoom.
- Press `E`, `Space`, or `Enter` near a prompt to open details.
- On mobile, use the on-screen movement pad and direction buttons.
- Use **Day mode**, **Sound**, **Reduce motion**, **Browse projects**, **Browse experience**, and **Text version** from the UI.

## What is included

- Six destinations: Arrival Plaza, Automation Lab, Evidence Vault, Regulatory Observatory, Career Experience, and Contact Portal.
- Eleven public-safe project case studies and eight career entries.
- A portrait-informed avatar built from optimized local WebP assets.
- Semantic HTML overlays for project and career details.
- A complete text fallback for no-WebGL, failed asset load, or user preference.
- SEO metadata, JSON-LD, `robots.txt`, and `sitemap.xml` generated at build time.

## Architecture

- `src/core/Experience.ts` owns renderer lifecycle, loading, resize, visibility, context restore, and the frame loop.
- `src/world/World.ts` owns shared terrain, bridges, collision, and zone registration.
- `src/world/zones/*` contains destination geometry and authored interactions.
- `src/avatar/*` owns character visuals and movement.
- `src/camera/CameraRig.ts` owns follow camera, destination compositions, and safe avatar angles.
- `src/ui/*` owns the accessible controls, overlays, fallback, and metadata.

## Accessibility and resilience

- The 3D scene is backed by keyboard controls and semantic dialogs.
- The text version contains all projects, roles, and contact links.
- Reduced motion persists across reloads and removes authored animation where practical.
- WebGL loss pauses the scene and resumes it after context restore.
- Hidden tabs pause rendering until the page is visible again.

## Quality tiers

The app starts at high quality and adapts during runtime:

- `high`: higher pixel ratio cap and 2048 shadow map.
- `balanced`: lower pixel ratio cap and 1024 shadow map.
- `low`: 1x pixel ratio cap and 512 shadow map.

The current build budget is documented in `docs/performance-budget.md`.

## Deployment

Build with:

```powershell
npm.cmd run build
```

Set `VITE_SITE_URL` when deploying to a real URL, for example:

```powershell
$env:VITE_SITE_URL = "https://gopalakrishnavarshith.github.io/krishna-three-portfolio/"
npm.cmd run build
```

The generated `dist/` folder is static and can be hosted on GitHub Pages or any static host.

## Visual direction

This is a procedural low-poly Three.js interpretation of the approved concept direction. The runtime uses real 3D geometry, authored camera compositions, local optimized avatar textures, and CSS/HTML overlays. The concept renders are denser and more cinematic; the runtime keeps the same world idea while staying light enough for browser delivery.
