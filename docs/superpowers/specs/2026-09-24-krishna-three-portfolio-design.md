# Krishna Three.js Portfolio — Experience Design

**Date:** 24 September 2026  
**Status:** Approved direction; ready for implementation planning  
**Project:** Separate portfolio experience at `outputs/krishna-three-portfolio`

## 1. Objective

Create a separate, production-ready personal portfolio as an explorable Three.js world. The experience must present Krishna Varshith R as a regulatory technology business analyst and workflow automation builder while demonstrating a high level of creative engineering craft.

The site must feel like a place visitors enter and explore. It must not be a conventional page with a decorative canvas, a collection of floating boxes, or a card grid placed over a shader background.

The existing portfolio and its deployed GitHub Pages site remain separate and unchanged.

## 2. Rewritten execution prompt

Build a fully interactive 3D portfolio using pure Three.js, TypeScript, and Vite. Do not use React Three Fiber. Use Krishna's supplied portrait to construct a carefully modeled, stylized procedural avatar that preserves his hairstyle, glasses, beard, complexion, blue suit, and complete head silhouette.

Create a handcrafted Regulatory Systems World inspired by the spatial storytelling of Bilal, the physical playfulness of Bruno Simon, and the cinematic atmosphere of Samsy. Use those sites only as interaction references; do not copy their code, models, branding, layouts, or assets.

The world must contain a welcome plaza, Automation Lab, Evidence Vault, Regulatory Observatory, Career Trail, and Contact Portal. Krishna's avatar should walk, turn, idle, and interact with these spaces. All eleven public-safe case studies, the complete experience history, skill groups, quantified outcomes, publication, email link, and LinkedIn profile must be represented.

Projects must be real objects or terminals in the world. Selecting one should trigger a camera transition and reveal a readable, accessible case-study interface with metrics and animated infographics. Dark and light themes must change the entire environment between night and daylight states.

Support pointer, keyboard, wheel, and touch input. Include accessible HTML navigation, reduced-motion behavior, WebGL capability detection, context-loss recovery, responsive mobile controls, a loading sequence, static fallback content, SEO metadata, and strict performance budgets.

The result must be beautiful, coherent, recruiter-friendly, and technically memorable. It must be treated as a finished portfolio product rather than a quick Three.js experiment.

## 3. Creative direction

### Concept: Regulatory Systems World

The visitor arrives above a floating island at night. The camera descends toward a central plaza where Krishna's avatar is waiting. Luminous paths connect six distinct destinations. Each destination translates one part of the portfolio into spatial storytelling.

The world uses a refined low-poly language rather than toy-like primitives. Forms are beveled, layered, and intentionally proportioned. The core palette is midnight blue, deep teal, mineral green, warm brass, and soft ivory. The daylight theme introduces pale stone, blue sky, clean water, and warm vegetation while preserving the same geometry.

Atmosphere comes from lighting, fog, particles, emissive paths, animated machinery, environmental sound controls, and deliberate camera work. It does not depend on large quantities of post-processing.

### Reference translation

- **Bilal:** character-led progression, miniature-world storytelling, clear destinations.
- **Bruno Simon:** free exploration, physical presence, playful environmental interaction.
- **Samsy:** cinematic lighting, spatial mystery, strong transitions, and a memorable opening.

The project will not reproduce any reference site's scene, model, assets, or navigation verbatim.

## 4. World map

### 4.1 Arrival Plaza

The opening area introduces Krishna, his positioning, location, and primary call to action. A sculptural sign establishes the message: “Regulatory clarity. Workflows people can trust.”

The visitor can immediately move the avatar or choose a destination from an always-available HTML navigator.

### 4.2 Automation Lab

A glass-and-metal workshop contains moving workflow machinery: intake nodes, decision gates, routing lines, review stations, and release indicators. The machinery visualizes the delivery path from discovery through adoption.

Interactive consoles reveal the four skill disciplines:

1. Workflow analysis and product delivery
2. Regulatory quality and data
3. Automation and engineering
4. Responsible AI delivery

### 4.3 Evidence Vault

A circular archive contains eleven project capsules. Each capsule represents one public-safe case study. Capsules use color, geometry, and iconography to distinguish quality, data, safety, support, training, content, and automation work.

Selecting a capsule moves the camera to a focused inspection position and opens an accessible case-study overlay. Projects with metrics display a compact Three.js infographic behind the overlay, including the approximately 99% documentation-effort reduction, 200+ associates trained, two recognitions, 230+ articles, and 15+ analysis parameters.

### 4.4 Regulatory Observatory

A domed observatory displays a living network of controlled information. Orbiting nodes represent RIMS, lifecycle data, document quality, submissions, pharmacovigilance, safety cases, terminology, metadata, human review, and governance.

Visitors can rotate the network and select a domain to see Krishna's related capabilities and experience evidence.

### 4.5 Career Trail

A landscaped path contains eight career milestones in chronological order. The avatar walks along the path while the environment changes to reflect product support, medical content, scientific planning, safety operations, regulatory data, and current regulatory technology work.

Each milestone includes company identity, role, dates, location, summary, highlights, and skills. Company marks remain authentic and subordinate to the world design.

### 4.6 Contact Portal

The final zone is a luminous gateway with email and LinkedIn actions. The avatar's arrival triggers a restrained completion moment rather than confetti or game-style rewards.

## 5. Krishna avatar

### 5.1 Modeling approach

The avatar will be built procedurally with Three.js geometry so it remains native to the requested stack. It will be stylized, recognizable, and polished rather than presented as a photorealistic digital double.

The model consists of:

- A shaped head using a modified sphere or custom rounded geometry.
- A portrait-derived facial texture on a curved facial surface.
- Layered hair clusters reproducing the full hairstyle and hair volume.
- Separate eyebrows, glasses, ears, beard, moustache, and jaw treatment.
- A tailored blue suit, white shirt, collar, arms, hands, trousers, and shoes.
- Carefully tuned proportions that read clearly at normal camera distance.

The supplied portrait will be cropped with the full head intact, color-corrected, and prepared as an optimized texture. The portrait will not be replaced with an invented face.

### 5.2 Animation

The procedural rig will provide:

- Idle breathing and subtle weight shift
- Head look and blink treatment where visually reliable
- Walking and turning cycles
- Arm swing and body lean
- Interaction gestures at consoles and project capsules
- Theme-change reaction and arrival pose

Animation will use hierarchical object groups, pivot nodes, damped interpolation, and authored motion curves. The avatar will not depend on an external character-animation framework.

## 6. Interaction model

### Desktop

- WASD and arrow-key movement
- Pointer drag for camera orbit within safe limits
- Wheel or trackpad for guided movement between nearby points of interest
- Clickable world objects with clear hover and focus states
- Direct destination navigation for visitors who do not want game controls

### Mobile

- On-screen movement pad
- Drag-to-look camera control
- Large interaction button near active objects
- Destination navigator as the fastest path
- Reduced world detail when GPU or viewport constraints require it

### Camera

The default camera follows behind and slightly above the avatar. Camera collision, easing, look-ahead, and zone-specific compositions keep the avatar and destination readable. Entering a project, experience milestone, or major zone triggers an authored camera transition that can be skipped.

## 7. Theme system

The light/dark toggle changes the environment rather than recoloring only the interface.

### Night state

- Deep navy sky and fog
- Cool moon and rim lights
- Teal and brass emissive paths
- Visible particles and illuminated terminals
- Dark glass and polished stone materials

### Daylight state

- Clear pale-blue sky
- Warm directional sunlight and soft shadows
- Ivory stone, brushed metal, green landscape, and blue water
- Reduced emissive intensity
- Brighter interface surfaces with strong text contrast

The saved preference applies before the first rendered frame to avoid a visible theme flash.

## 8. Interface layer

The interface is a restrained HTML layer above one full-screen canvas. It includes:

- Loading progress and asset status
- Name and current-zone indicator
- Theme, sound, and reduced-motion controls
- Destination navigator
- Contextual interaction prompt
- Case-study, experience, and capability overlays
- Mobile controls
- WebGL fallback content

Overlays use semantic HTML, focus trapping where appropriate, escape-to-close, keyboard navigation, and readable text widths. All important portfolio content remains accessible without interacting directly with the canvas.

## 9. Architecture

The implementation will use Vite, TypeScript, and Three.js with Three.js addons where needed. It will not use React, React Three Fiber, or a general animation framework.

Planned modules:

- `Experience`: application lifecycle, resize, pause, disposal, and context recovery
- `World`: scene assembly, environment, theme, and zone registration
- `Avatar`: procedural model, texture preparation, movement, and animation
- `Controls`: keyboard, pointer, wheel, and touch input normalization
- `CameraRig`: follow camera, transitions, collision, and reduced-motion behavior
- `InteractionSystem`: raycasting, focus, active-object prompts, and selection
- `ZoneManager`: destination state, guided navigation, and camera compositions
- `ProjectVault`: eleven project objects and metric visualizations
- `CareerTrail`: experience milestone generation
- `UI`: semantic overlay state and accessibility behavior
- `AssetManager`: progress, texture configuration, errors, and disposal
- `PerformanceManager`: adaptive pixel ratio and optional effect quality
- `portfolioData`: one typed source for profile, skills, projects, experience, and links

The world and UI communicate through a small typed event system. Portfolio data contains no Three.js objects, keeping content and rendering independent.

## 10. Data and confidentiality

The new project will reuse the public-safe portfolio data already approved for the existing site. Internal tool names, confidential source code, private system details, restricted metrics, and unpublished implementation information will not be introduced.

The existing eleven project case studies remain generic where confidentiality requires it.

## 11. Performance strategy

- One persistent WebGL canvas and one renderer
- Device pixel ratio capped and adapted to frame rate
- Reused geometries and materials
- Instancing for repeated environmental elements
- Texture dimensions selected for displayed size
- Compressed WebP or AVIF textures
- Conservative real-time shadows with baked-looking ambient treatment
- Frustum culling and distance-based detail reduction
- Paused rendering when the page is hidden
- Optional post-processing enabled only at suitable quality tiers
- No blocking font or model downloads before the first meaningful scene

Targets:

- Desktop: stable 50–60 frames per second on a typical modern integrated GPU
- Mobile: stable 30 frames per second on a representative mid-range device
- Initial interactive scene payload target below 3 MB
- First meaningful scene displayed within 3 seconds on a normal broadband connection
- No continuous GPU work while the page is hidden

## 12. Accessibility and fallback

- All destinations and content available through HTML navigation
- Keyboard-accessible actions and visible focus indicators
- `prefers-reduced-motion` disables camera sweeps, particles, idle motion, and unnecessary transitions
- Optional explicit reduced-motion control
- Sufficient light and dark theme contrast
- Descriptive text alternative for the world and avatar
- Static portfolio fallback for missing WebGL, context failure, or user preference
- Canvas marked appropriately so it does not obscure semantic document structure

## 13. Error handling

- WebGL capability detection before initializing the renderer
- Friendly fallback when WebGL is unavailable
- Loading errors identify the affected asset while keeping core navigation available
- WebGL context loss pauses the experience and offers recovery
- Quality automatically decreases after sustained low frame rate
- Navigation and contact links remain available if the 3D experience fails

## 14. Verification

The finished project must pass:

- Type checking and production build
- Unit tests for portfolio data, zone registration, navigation state, and quality selection
- Browser checks at desktop and mobile sizes
- Keyboard-only navigation
- Reduced-motion verification
- Light and dark world verification
- WebGL-disabled fallback verification
- Context-loss recovery check
- Visual review of avatar likeness, complete hair silhouette, glasses, beard, and suit
- Interaction checks for every world destination and all eleven projects
- Performance sampling for frame rate, initial payload, and avoidable console errors

## 15. Acceptance criteria

The design is complete when:

1. The first impression is an explorable 3D world rather than a conventional webpage.
2. Krishna's avatar is recognizable from the supplied portrait and never crops the top of his head.
3. The avatar can idle, walk, turn, and interact cleanly.
4. Every destination has distinct geometry, atmosphere, and interaction.
5. All eleven projects and the complete professional timeline are present.
6. Metrics appear as spatial or animated visualizations where supporting data exists.
7. Daylight and night modes each feel intentionally art-directed.
8. Recruiters can reach any major section without learning movement controls.
9. Mobile, reduced-motion, keyboard, and non-WebGL paths remain usable.
10. The existing portfolio project and deployment are unchanged.

## 16. Explicit exclusions

- No multiplayer, user accounts, backend, CMS, or analytics dashboard
- No copied reference-site source code or assets
- No photorealistic digital-double claim from one portrait
- No generic card-grid homepage
- No scroll hijacking
- No hidden or inaccessible portfolio content
- No internal or confidential tool names
