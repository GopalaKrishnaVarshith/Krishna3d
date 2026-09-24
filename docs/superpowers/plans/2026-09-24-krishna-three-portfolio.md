# Krishna Three.js Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use krishnas-product-os:subagent-driven-development (recommended) or krishnas-product-os:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a separate, production-ready, explorable Three.js portfolio world with a recognizable procedural Krishna avatar, six spatial destinations, all approved portfolio content, accessible navigation, and adaptive performance.

**Architecture:** A Vite and TypeScript application owns one persistent Three.js renderer and an independent semantic HTML interface. Focused modules manage the procedural avatar, world zones, controls, camera, interactions, adaptive quality, and typed portfolio data through a small event bus. The 3D canvas is the primary experience; the same data powers accessible overlays and a complete non-WebGL fallback.

**Tech Stack:** TypeScript, Vite, Three.js and Three.js addons, Vitest, Playwright, semantic HTML, modular CSS.

## Global Constraints

- Keep this project separate at `outputs/krishna-three-portfolio`; do not modify the existing portfolio or its GitHub Pages repository.
- Use pure Three.js. Do not use React, React Three Fiber, GSAP, a game engine, or a general animation framework.
- Use the supplied portrait as the face texture and likeness reference; preserve the complete hair silhouette, glasses, beard, complexion, blue suit, and full head.
- Build six destinations: Arrival Plaza, Automation Lab, Evidence Vault, Regulatory Observatory, Career Trail, and Contact Portal.
- Include all eleven approved public-safe projects and the complete eight-role experience timeline.
- Keep internal tool names and confidential implementation details out of the public content.
- Provide night and daylight world states, keyboard/pointer/wheel/touch controls, direct destination navigation, reduced motion, WebGL fallback, and context-loss recovery.
- Target 50–60 FPS on a typical desktop integrated GPU, 30 FPS on representative mid-range mobile, an initial interactive payload below 3 MB, and a meaningful scene within 3 seconds on normal broadband.
- Treat the accepted design spec at `docs/superpowers/specs/2026-09-24-krishna-three-portfolio-design.md` as authoritative.
- Use Image Gen concepts as modeling references. The visible world and avatar remain code-native Three.js geometry because the user explicitly requested procedural Three.js modeling.

---

## Planned File Structure

```text
krishna-three-portfolio/
├── design/
│   ├── concepts/
│   └── fidelity-ledger.md
├── public/
│   ├── assets/portrait/krishna-portrait.webp
│   ├── assets/companies/*.webp
│   ├── favicon.svg
│   ├── robots.txt
│   └── sitemap.xml
├── src/
│   ├── core/Experience.ts
│   ├── core/EventBus.ts
│   ├── core/AssetManager.ts
│   ├── core/PerformanceManager.ts
│   ├── data/portfolioData.ts
│   ├── data/types.ts
│   ├── avatar/Avatar.ts
│   ├── avatar/AvatarMaterials.ts
│   ├── avatar/AvatarMotion.ts
│   ├── controls/InputState.ts
│   ├── controls/Controls.ts
│   ├── camera/CameraRig.ts
│   ├── interaction/InteractionSystem.ts
│   ├── world/World.ts
│   ├── world/types.ts
│   ├── world/ThemeController.ts
│   ├── world/ZoneManager.ts
│   ├── world/zones/ArrivalPlaza.ts
│   ├── world/zones/AutomationLab.ts
│   ├── world/zones/EvidenceVault.ts
│   ├── world/zones/RegulatoryObservatory.ts
│   ├── world/zones/CareerTrail.ts
│   ├── world/zones/ContactPortal.ts
│   ├── ui/UIController.ts
│   ├── ui/renderOverlay.ts
│   ├── ui/renderFallback.ts
│   ├── styles/tokens.css
│   ├── styles/global.css
│   ├── styles/ui.css
│   └── main.ts
├── tests/unit/*.test.ts
├── tests/e2e/portfolio.spec.ts
├── index.html
├── package.json
├── playwright.config.ts
├── tsconfig.json
└── vite.config.ts
```

---

### Task 1: Produce the visual source of truth

**Files:**
- Create: `design/concepts/arrival-night.png`
- Create: `design/concepts/arrival-day.png`
- Create: `design/concepts/avatar-turnaround.png`
- Create: `design/concepts/evidence-vault.png`
- Create: `design/concepts/world-map.png`
- Create: `design/fidelity-ledger.md`

**Interfaces:**
- Consumes: approved design specification and supplied portrait `C:/Users/gravipro/Downloads/exec-5132d7b1-818f-4ee2-8e75-fe0d4cff622e.png`.
- Produces: five concept images and a written modeling inventory used by Tasks 4–8.

- [ ] **Step 1: Generate the complete world-map concept**

Use Image Gen with the supplied portrait as a reference. The prompt must request a polished low-poly floating regulatory campus with six named visual destinations, winding paths, water, vegetation, refined midnight teal and brass materials, and a central stylized Krishna avatar. Require a wide 16:9 game-camera view with no UI cards and no invented text.

- [ ] **Step 2: Generate night and daylight arrival concepts**

Generate two coordinated 16:9 arrival-plaza images with identical geometry and camera. The night version uses moonlight, teal paths, brass highlights, and controlled particles. The daylight version uses blue sky, pale stone, greenery, and warm directional light.

- [ ] **Step 3: Generate the avatar turnaround**

Generate a clean four-view character sheet using the supplied portrait: front, three-quarter, side, and back. Require full hair, gold-rim glasses, beard, moustache, medium-brown complexion, tailored navy suit, white shirt, dark trousers, and polished shoes. Specify stylized high-end low-poly 3D character design on a neutral background, with consistent proportions across all views.

- [ ] **Step 4: Generate the Evidence Vault concept**

Generate a cinematic circular archive containing eleven distinct project capsules, a central inspection platform, a metric hologram, and the avatar for scale. Keep the geometry practical for procedural Three.js construction.

- [ ] **Step 5: Inspect and record the visual system**

Create `design/fidelity-ledger.md` with this initial inventory:

```markdown
# Fidelity Ledger

| Area | Concept evidence | Implementation evidence | Status |
|---|---|---|---|
| Avatar silhouette | `avatar-turnaround.png` | Added during Task 5 | Awaiting Task 5 review |
| Arrival night | `arrival-night.png` | Added during Task 7 | Awaiting Task 7 review |
| Arrival day | `arrival-day.png` | Added during Task 7 | Awaiting Task 7 review |
| World topology | `world-map.png` | Added during Task 7 | Awaiting Task 7 review |
| Evidence Vault | `evidence-vault.png` | Added during Task 7 | Awaiting Task 7 review |
```

- [ ] **Step 6: Commit the approved concept set**

```powershell
git add design
git commit -m "design: establish Three.js world and avatar concepts"
```

---

### Task 2: Scaffold the tested Vite and Three.js application

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `playwright.config.ts`
- Create: `index.html`
- Create: `.gitignore`
- Create: `src/main.ts`
- Create: `src/styles/tokens.css`
- Create: `src/styles/global.css`
- Create: `src/styles/ui.css`
- Create: `tests/unit/smoke.test.ts`

**Interfaces:**
- Consumes: Node.js 20 or later.
- Produces: `npm run dev`, `npm run build`, `npm run test`, and `npm run test:e2e`; one mount element `#app`, canvas host `#experience`, and semantic interface root `#ui`.

- [ ] **Step 1: Write the initial failing smoke test**

```ts
import { describe, expect, it } from "vitest";
import { APP_TITLE } from "../../src/main";

describe("application shell", () => {
  it("exports the approved portfolio title", () => {
    expect(APP_TITLE).toBe("Krishna Varshith — Regulatory Systems World");
  });
});
```

- [ ] **Step 2: Create package scripts and dependencies**

Use `three` as the only runtime dependency. Add Vite, TypeScript, Vitest, Playwright, ESLint, and TypeScript ESLint as development dependencies. Define scripts `dev`, `build`, `preview`, `typecheck`, `lint`, `test`, and `test:e2e`.

- [ ] **Step 3: Run the smoke test and confirm the expected failure**

Run: `npm.cmd test -- --run tests/unit/smoke.test.ts`  
Expected: FAIL because `src/main.ts` or `APP_TITLE` does not exist.

- [ ] **Step 4: Implement the minimal application shell**

```ts
export const APP_TITLE = "Krishna Varshith — Regulatory Systems World";

const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("Missing #app root");
root.innerHTML = `<main id="experience" aria-label="Interactive 3D portfolio"></main><div id="ui"></div>`;
```

- [ ] **Step 5: Add design tokens and full-viewport canvas rules**

Define exact tokens for night navy, teal, brass, ivory, daylight sky, focus color, readable text widths, motion durations, UI z-index, and safe-area insets. Do not create card components.

- [ ] **Step 6: Run tests, typecheck, lint, and build**

Run:

```powershell
npm.cmd test -- --run
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

Expected: all commands exit 0.

- [ ] **Step 7: Commit the scaffold**

```powershell
git add package.json package-lock.json vite.config.ts tsconfig.json playwright.config.ts index.html .gitignore src tests
git commit -m "build: scaffold pure Three.js portfolio"
```

---

### Task 3: Create typed public-safe portfolio data

**Files:**
- Create: `src/data/types.ts`
- Create: `src/data/portfolioData.ts`
- Create: `tests/unit/portfolioData.test.ts`
- Create: `public/assets/portrait/krishna-portrait.webp`
- Create: `public/assets/companies/*.webp`

**Interfaces:**
- Produces: `PortfolioData`, `Project`, `ExperienceRole`, `SkillDomain`, `Metric`, and `portfolioData`.

```ts
export interface Metric { label: string; value: string; numericValue?: number }
export interface SkillDomain {
  id: string; number: string; title: string; summary: string;
  skills: string[]; proof: string; tone: "teal" | "blue" | "brass" | "violet";
}
export interface Project {
  id: string; number: string; title: string; category: string;
  summary: string; challenge: string; response: string; outcome: string;
  skills: string[]; metrics: Metric[];
}
export interface ExperienceRole {
  id: string; company: string; role: string; period: string; location: string;
  description: string; highlights: string[]; skills: string[]; logo?: string;
}
export interface PortfolioData {
  profile: { name: string; title: string; location: string; email: string; linkedin: string; portrait: string };
  projects: Project[]; experience: ExperienceRole[]; skillDomains: SkillDomain[];
}
```

- [ ] **Step 1: Write completeness tests**

```ts
expect(portfolioData.projects).toHaveLength(11);
expect(portfolioData.experience).toHaveLength(8);
expect(portfolioData.skillDomains).toHaveLength(4);
expect(portfolioData.projects.every((project) => project.id && project.title && project.outcome)).toBe(true);
expect(JSON.stringify(portfolioData)).not.toMatch(/HFMatch|SPLMatch|nimbus\.amgen/i);
```

- [ ] **Step 2: Run tests and confirm they fail**

Run: `npm.cmd test -- --run tests/unit/portfolioData.test.ts`  
Expected: FAIL because data modules do not exist.

- [ ] **Step 3: Implement the data types and approved content**

Transcribe the existing public-safe data from the current portfolio constants. Keep generic descriptions for confidential internal work. Add only the published metrics already present in approved content.

- [ ] **Step 4: Prepare optimized assets**

Create a full-head portrait WebP at a maximum of 1024 pixels on the long edge and company-logo WebPs sized for 128-pixel display. Preserve the source portrait separately outside the web bundle.

- [ ] **Step 5: Run completeness and confidentiality tests**

Run: `npm.cmd test -- --run tests/unit/portfolioData.test.ts`  
Expected: PASS with 11 projects, 8 roles, 4 skill domains, and no internal tool names.

- [ ] **Step 6: Commit the data layer**

```powershell
git add src/data tests/unit/portfolioData.test.ts public/assets
git commit -m "feat: add public-safe portfolio data and assets"
```

---

### Task 4: Build the core rendering and adaptive-quality lifecycle

**Files:**
- Create: `src/core/EventBus.ts`
- Create: `src/core/AssetManager.ts`
- Create: `src/core/PerformanceManager.ts`
- Create: `src/core/Experience.ts`
- Create: `tests/unit/EventBus.test.ts`
- Create: `tests/unit/PerformanceManager.test.ts`
- Modify: `src/main.ts`

**Interfaces:**
- Produces: `EventBus<ExperienceEvents>`, `AssetManager.loadTexture(url)`, `PerformanceManager.sample(deltaMs)`, `Experience.start()`, `Experience.dispose()`.

```ts
export interface ExperienceEvents {
  "zone:enter": { zoneId: string };
  "project:open": { projectId: string };
  "theme:change": { theme: "night" | "day" };
  "quality:change": { tier: "high" | "balanced" | "low" };
}
```

- [ ] **Step 1: Write failing event and quality tests**

Test typed subscribe/unsubscribe behavior and require the quality manager to move from `high` to `balanced` after 180 sustained frames below 45 FPS.

- [ ] **Step 2: Run the tests and confirm failure**

Run: `npm.cmd test -- --run tests/unit/EventBus.test.ts tests/unit/PerformanceManager.test.ts`

- [ ] **Step 3: Implement the event bus and quality policy**

Use `Map<keyof Events, Set<Function>>` for subscriptions. Cap pixel ratio at 1.75, 1.35, and 1.0 for high, balanced, and low tiers.

- [ ] **Step 4: Implement Experience lifecycle**

Create one renderer, one scene, one perspective camera, one clock, resize handling, visibility pause/resume, `webglcontextlost`, `webglcontextrestored`, and deterministic disposal.

- [ ] **Step 5: Verify lifecycle and build**

Run unit tests, typecheck, lint, and production build. Inspect the browser console for zero initialization errors.

- [ ] **Step 6: Commit core lifecycle**

```powershell
git add src/core src/main.ts tests/unit
git commit -m "feat: add Three.js lifecycle and adaptive quality"
```

---

### Task 5: Model and animate the Krishna avatar

**Files:**
- Create: `src/avatar/AvatarMaterials.ts`
- Create: `src/avatar/AvatarMotion.ts`
- Create: `src/avatar/Avatar.ts`
- Create: `tests/unit/AvatarMotion.test.ts`

**Interfaces:**
- Consumes: portrait texture from Task 3 and concept turnaround from Task 1.
- Produces: `Avatar.group`, `Avatar.colliderRadius`, `Avatar.update(input, delta)`, `Avatar.setReducedMotion(value)`, `Avatar.faceCamera(target)`.

```ts
export interface AvatarInput { moveX: number; moveZ: number; interact: boolean }
export interface AvatarPose { speed: number; turnRate: number; isMoving: boolean }
```

- [ ] **Step 1: Write failing motion tests**

Test normalized diagonal input, acceleration clamping, deceleration, turn-rate limits, idle state, and reduced-motion suppression of idle animation.

- [ ] **Step 2: Run tests and confirm failure**

Run: `npm.cmd test -- --run tests/unit/AvatarMotion.test.ts`

- [ ] **Step 3: Implement procedural modeling materials**

Create shared navy wool, white cotton, skin, hair, beard, dark leather, gold metal, and glass materials. Keep material counts bounded and reuse geometries for hair clusters.

- [ ] **Step 4: Construct the avatar hierarchy**

Build pelvis, torso, shoulders, upper/lower limbs, shoes, neck, shaped head, curved portrait facial surface, ears, layered beard, moustache, eyebrows, glasses, and clustered full hair. Use named pivot groups for hips, shoulders, elbows, knees, neck, and head.

- [ ] **Step 5: Implement authored movement**

Implement damped acceleration, yaw steering, walk-cycle leg and arm phase, body lean, idle breathing, head look, console interaction, and reduced-motion pose behavior.

- [ ] **Step 6: Perform the avatar visual gate**

Render front, three-quarter, side, and in-world screenshots. Compare them to `avatar-turnaround.png` and the supplied portrait with `view_image`. Fix hair silhouette, glasses, beard, skin tone, suit proportions, and facial crop before proceeding.

- [ ] **Step 7: Run motion tests and commit**

```powershell
npm.cmd test -- --run tests/unit/AvatarMotion.test.ts
git add src/avatar tests/unit/AvatarMotion.test.ts design/fidelity-ledger.md
git commit -m "feat: model and animate Krishna avatar"
```

---

### Task 6: Implement controls, camera, and navigable terrain

**Files:**
- Create: `src/controls/InputState.ts`
- Create: `src/controls/Controls.ts`
- Create: `src/camera/CameraRig.ts`
- Create: `src/world/World.ts`
- Create: `src/world/types.ts`
- Create: `src/world/ZoneManager.ts`
- Create: `tests/unit/InputState.test.ts`
- Create: `tests/unit/ZoneManager.test.ts`

**Interfaces:**
- Produces: `Controls.state`, `CameraRig.follow(target, delta)`, `CameraRig.transitionTo(composition)`, `ZoneManager.register(zone)`, `ZoneManager.navigateTo(zoneId)`.

```ts
export interface CameraComposition {
  position: THREE.Vector3;
  target: THREE.Vector3;
  durationMs: number;
}
export interface InteractiveTarget {
  id: string;
  object: THREE.Object3D;
  label: string;
  activate(): void;
}
export interface WorldZone {
  id: string;
  group: THREE.Group;
  entryPoint: THREE.Vector3;
  cameraComposition: CameraComposition;
  interactiveObjects: InteractiveTarget[];
  update(delta: number): void;
  dispose(): void;
}
```

- [ ] **Step 1: Write failing input and zone tests**

Test simultaneous keys, pointer release, touch cancellation, reduced-motion camera transition duration, unique zone registration, and direct destination navigation.

- [ ] **Step 2: Run tests and confirm failure**

Run: `npm.cmd test -- --run tests/unit/InputState.test.ts tests/unit/ZoneManager.test.ts`

- [ ] **Step 3: Implement normalized input**

Support WASD, arrows, pointer drag, wheel intent, on-screen touch pad, interaction key, and blur cleanup. Prevent controls from stealing input while an overlay is open.

- [ ] **Step 4: Implement follow camera and transitions**

Use critically damped position and look-target interpolation, terrain-aware minimum height, obstruction push-in, safe pitch/yaw limits, and skippable authored transitions.

- [ ] **Step 5: Build the island terrain and paths**

Construct an irregular floating island with layered rock underside, raised plateau, water plane, vegetation clusters, brass path inlays, zone clearings, and simple circular collision boundaries.

- [ ] **Step 6: Verify movement on desktop and mobile**

Use Browser/IAB to walk from the plaza to two zones, test direct navigation, test focus behavior, and confirm touch controls at a mobile viewport.

- [ ] **Step 7: Commit navigation**

```powershell
git add src/controls src/camera src/world tests/unit
git commit -m "feat: add avatar controls camera and world navigation"
```

---

### Task 7: Build the six distinct world destinations

**Files:**
- Create: `src/world/ThemeController.ts`
- Create: `src/world/zones/ArrivalPlaza.ts`
- Create: `src/world/zones/AutomationLab.ts`
- Create: `src/world/zones/EvidenceVault.ts`
- Create: `src/world/zones/RegulatoryObservatory.ts`
- Create: `src/world/zones/CareerTrail.ts`
- Create: `src/world/zones/ContactPortal.ts`
- Create: `tests/unit/ThemeController.test.ts`

**Interfaces:**
- Produces: each zone as `WorldZone` with `id`, `group`, `entryPoint`, `cameraComposition`, `interactiveObjects`, `update(delta)`, and `dispose()`.

- [ ] **Step 1: Write failing theme-state tests**

Require night and day palettes to update sky, fog, ambient light, key light, emissive intensity, and saved preference before first frame.

- [ ] **Step 2: Implement Arrival Plaza and shared zone contract**

Create the sculptural name sign, destination compass, theme-responsive fountain, arrival lights, and initial avatar position.

- [ ] **Step 3: Implement Automation Lab**

Build moving intake nodes, routing rails, decision gate, review stations, and four capability consoles. Motion must pause under reduced-motion mode.

- [ ] **Step 4: Implement Evidence Vault shell**

Build a circular archive with eleven capsule positions, inspection platform, camera points, controlled lighting, and a central metric display mount.

- [ ] **Step 5: Implement Regulatory Observatory**

Build a dome and orbiting domain network for RIMS, document quality, submissions, pharmacovigilance, data integrity, and responsible AI.

- [ ] **Step 6: Implement Career Trail and Contact Portal**

Create eight milestone plinths with company marks and a final luminous contact gateway with email and LinkedIn interaction objects.

- [ ] **Step 7: Implement ThemeController**

Transition materials and lights without reallocating the scene. Apply a no-animation state immediately when reduced motion is active.

- [ ] **Step 8: Run the visual world gate**

Capture night and daylight arrival screenshots and the Evidence Vault. Compare them with the corresponding concepts using `view_image`; update `design/fidelity-ledger.md` with concrete fixes.

- [ ] **Step 9: Run tests and commit**

```powershell
npm.cmd test -- --run tests/unit/ThemeController.test.ts
git add src/world tests/unit/ThemeController.test.ts design/fidelity-ledger.md
git commit -m "feat: build regulatory systems world destinations"
```

---

### Task 8: Add raycast interactions, projects, and spatial metrics

**Files:**
- Create: `src/interaction/InteractionSystem.ts`
- Create: `src/world/ProjectVault.ts`
- Create: `src/world/MetricVisualization.ts`
- Create: `tests/unit/InteractionSystem.test.ts`
- Create: `tests/unit/MetricVisualization.test.ts`

**Interfaces:**
- Produces: `InteractionSystem.register(target)`, `InteractionSystem.focus(id)`, `ProjectVault.open(projectId)`, and `MetricVisualization.setMetrics(metrics)`.

- [ ] **Step 1: Write failing interaction tests**

Test nearest eligible target selection, keyboard focus parity, disabled interaction while overlays are open, and project ID resolution for all eleven capsules.

- [ ] **Step 2: Write failing metric tests**

Require safe numeric parsing for `99%`, `200+`, `230+`, `15+`, and `2`, while preserving display strings.

- [ ] **Step 3: Implement raycast and focus handling**

Use one raycaster, reusable vectors, hover emphasis through material uniforms or scale damping, and semantic interaction prompts emitted through the event bus.

- [ ] **Step 4: Implement eleven project capsules**

Generate capsule geometry from project categories, keep a stable project-to-object map, and animate only the active capsule and nearby ambient details.

- [ ] **Step 5: Implement spatial metric visualizations**

Use ring progress, rising columns, counted markers, and radial comparisons. Keep visualizations truthful to the available metric and label approximate values explicitly.

- [ ] **Step 6: Verify every capsule and commit**

Run tests, then use direct destination navigation to open each project and confirm correct title, outcome, skills, and metric state.

```powershell
git add src/interaction src/world tests/unit
git commit -m "feat: add project interactions and spatial metrics"
```

---

### Task 9: Build the accessible interface, overlays, and fallback

**Files:**
- Create: `src/ui/UIController.ts`
- Create: `src/ui/renderOverlay.ts`
- Create: `src/ui/renderFallback.ts`
- Create: `src/ui/templates.ts`
- Modify: `src/styles/ui.css`
- Modify: `index.html`
- Create: `tests/unit/UIController.test.ts`

**Interfaces:**
- Produces: `UIController.openProject(id)`, `UIController.openExperience(id)`, `UIController.setZone(id)`, `UIController.setLoading(progress)`, `UIController.showFallback(reason)`.

- [ ] **Step 1: Write failing UI-state tests**

Test one overlay at a time, focus restoration, escape-to-close, navigator availability, reduced-motion persistence, theme persistence, and fallback content completeness.

- [ ] **Step 2: Implement the loading and navigation interface**

Create loading progress, name/current-zone indicator, destination navigator, theme control, sound control, reduced-motion control, and context prompt. Keep the opening viewport visually restrained.

- [ ] **Step 3: Implement semantic project and experience overlays**

Use dialog semantics, labelled headings, close button, focus trap, body scroll protection, escape behavior, metrics, highlights, and next/previous navigation.

- [ ] **Step 4: Implement the static fallback**

Render profile, four skill domains, eleven projects, eight experience roles, publication, email, and LinkedIn from the same data when WebGL is unavailable or disabled.

- [ ] **Step 5: Add metadata and crawler files**

Add canonical metadata, social metadata, Person/WebSite JSON-LD, `robots.txt`, and `sitemap.xml`. Keep the project deployable at either a root domain or configured base path.

- [ ] **Step 6: Run accessibility-focused tests and commit**

```powershell
npm.cmd test -- --run tests/unit/UIController.test.ts
git add src/ui src/styles/ui.css index.html public/robots.txt public/sitemap.xml tests/unit/UIController.test.ts
git commit -m "feat: add accessible portfolio interface and fallback"
```

---

### Task 10: Integrate the complete experience and add browser coverage

**Files:**
- Modify: `src/core/Experience.ts`
- Modify: `src/main.ts`
- Create: `tests/e2e/portfolio.spec.ts`

**Interfaces:**
- Consumes: all modules from Tasks 3–9.
- Produces: one complete launch path and verified public interaction journey.

- [ ] **Step 1: Write failing browser journeys**

```ts
test("direct navigation opens every destination", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Explore destinations" }).click();
  await page.getByRole("button", { name: "Evidence Vault" }).click();
  await expect(page.getByText("11 case studies")).toBeVisible();
});

test("reduced motion and daylight persist", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Reduce motion" }).click();
  await page.getByRole("button", { name: "Daylight mode" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "day");
  await expect(page.locator("html")).toHaveAttribute("data-motion", "reduced");
});
```

- [ ] **Step 2: Connect world, avatar, zones, interactions, and UI**

Initialize modules in deterministic order: renderer, assets, world, theme, zones, avatar, controls, camera, interaction system, UI, then animation loop. Dispose in reverse order.

- [ ] **Step 3: Add loading and failure flow**

Show the first meaningful plaza geometry before optional zone detail finishes. Route fatal renderer or asset errors to the semantic fallback without losing navigation.

- [ ] **Step 4: Run browser journeys at desktop and mobile**

Run: `npm.cmd run test:e2e`  
Expected: all journeys pass at desktop and the configured mobile project.

- [ ] **Step 5: Commit complete integration**

```powershell
git add src tests/e2e
git commit -m "feat: integrate complete 3D portfolio journey"
```

---

### Task 11: Performance, responsiveness, and resilience pass

**Files:**
- Modify: `src/core/PerformanceManager.ts`
- Modify: `src/core/AssetManager.ts`
- Modify: `src/avatar/AvatarMaterials.ts`
- Modify: `src/world/World.ts`
- Modify: `src/world/zones/AutomationLab.ts`
- Modify: `src/world/zones/EvidenceVault.ts`
- Modify: `src/world/zones/RegulatoryObservatory.ts`
- Modify: `src/world/zones/CareerTrail.ts`
- Create: `tests/e2e/resilience.spec.ts`
- Create: `docs/performance-budget.md`

**Interfaces:**
- Produces: measured payload, frame-time, quality-tier, context-loss, and hidden-page behavior evidence.

- [ ] **Step 1: Write resilience browser tests**

Test WebGL-disabled fallback, simulated context loss/restoration, hidden-page pause indicator, small viewport control usability, and direct navigation without canvas interaction.

- [ ] **Step 2: Measure the production bundle**

Run `npm.cmd run build` and record total initial JS, textures, and initial scene assets in `docs/performance-budget.md`. Fail the task if the initial interactive payload exceeds 3 MB without a documented and approved reason.

- [ ] **Step 3: Profile frame behavior**

Measure the plaza, Automation Lab, Evidence Vault, and Career Trail. Reduce draw calls with instancing and shared materials; lower shadow and particle quality at balanced and low tiers.

- [ ] **Step 4: Verify resilience and responsive controls**

Run the resilience suite and manually check keyboard, pointer, touch, reduced motion, night/day, and browser resize behavior.

- [ ] **Step 5: Commit performance evidence**

```powershell
git add src tests/e2e/resilience.spec.ts docs/performance-budget.md
git commit -m "perf: enforce 3D portfolio quality budgets"
```

---

### Task 12: Agency-level visual QA and release verification

**Files:**
- Modify: `src/avatar/Avatar.ts`
- Modify: `src/avatar/AvatarMaterials.ts`
- Modify: `src/world/World.ts`
- Modify: `src/world/ThemeController.ts`
- Modify: `src/world/zones/ArrivalPlaza.ts`
- Modify: `src/world/zones/AutomationLab.ts`
- Modify: `src/world/zones/EvidenceVault.ts`
- Modify: `src/world/zones/RegulatoryObservatory.ts`
- Modify: `src/world/zones/CareerTrail.ts`
- Modify: `src/world/zones/ContactPortal.ts`
- Modify: `src/styles/ui.css`
- Modify: `design/fidelity-ledger.md`
- Create: `README.md`

**Interfaces:**
- Produces: final visual evidence, completed fidelity ledger, clean build, and maintainer instructions.

- [ ] **Step 1: Capture final browser renders**

Capture arrival night, arrival daylight, avatar close view, Evidence Vault, Automation Lab, Career Trail, project overlay, and mobile controls at stable viewports.

- [ ] **Step 2: Compare concepts and renders with `view_image`**

Inspect the accepted concept and matching browser screenshot pairs. Record at least five concrete comparisons covering composition, avatar likeness, palette, lighting, zone geometry, text hierarchy, and mobile behavior.

- [ ] **Step 3: Repair every fixable mismatch**

Do not accept rough primitives, clipped hair, unreadable overlays, generic materials, accidental wrapping, empty zones, missing interaction feedback, or inconsistent day/night art direction.

- [ ] **Step 4: Run the full verification suite**

```powershell
npm.cmd test -- --run
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run test:e2e
git status --short
```

Expected: zero test failures, type errors, lint errors, build errors, browser-test failures, and unexpected working-tree files.

- [ ] **Step 5: Complete the fidelity ledger and README**

Document setup, controls, architecture, accessibility behavior, quality tiers, deployment, and the intentional use of procedural Three.js art. List any remaining intentional deviations from the concept; if none remain, state that explicitly.

- [ ] **Step 6: Commit the verified release**

```powershell
git add .
git commit -m "release: complete Krishna regulatory systems world"
```
