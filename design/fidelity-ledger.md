# Fidelity Ledger

These images are concept references for a procedurally modeled Three.js world. They establish topology, silhouette, camera, materials, and light. Generated surface detail is directional art, not an asset extraction or a requirement to reproduce every polygon. The supplied portrait remains the identity reference for Krishna's face.

| Area | Concept evidence | Implementation evidence | Status |
|---|---|---|---|
| Avatar silhouette | `concepts/avatar-turnaround.png` and supplied portrait | Task 5 round 4 four-view, close-up and motion captures listed below | Visual acceptance still open after round 4 self-audit |
| Arrival night | `concepts/arrival-night.png` | `../.superpowers/sdd/2026-09-24-krishna-three-portfolio/task-7-fix-arrival-night.png` | Lab, Vault, Observatory and avatar fit together over lit parapeted routes; still more graphic and less lush than the concept |
| Arrival day | `concepts/arrival-day.png` | `../.superpowers/sdd/2026-09-24-krishna-three-portfolio/task-7-fix-arrival-day.png` | Same geometry changes sun/sky/fog, pale stone, vegetation, blue sea and practical intensity before capture |
| World topology | `concepts/world-map.png` | `../.superpowers/sdd/2026-09-24-krishna-three-portfolio/task-7-fix-world-map.png` | Six reachable destinations, a distinct south approach, curved protected bridges and a longer eight-stop Career causeway |
| Evidence Vault | `concepts/evidence-vault.png` | `../.superpowers/sdd/2026-09-24-krishna-three-portfolio/task-7-fix-vault-entry.png` and `task-7-fix-vault-selected.png` | Eleven bound capsules, readable center and unobstructed entry; selected pod and grounded avatar inspected from inside |

## World construction inventory

| Element | Modeling interpretation | Fidelity check |
|---|---|---|
| Floating campus | Six destination clearings over one themed 260-unit sea, five curved protected spokes, a south approach causeway and two extra Career terraces. The central Arrival Plaza remains the hub. | Bridge mesh, parapet and collision projection use the same centerlines; every entry and milestone approach is walkable. |
| Arrival Plaza | Circular pale-stone platform with three brass inlays, flush step treads, compass markers, off-axis fountain, sculptural sign, lanterns and planted edges; avatar spawns on the south causeway. | Third-person camera shows Lab, Vault, Observatory and avatar together; compass bearings resolve to the actual island positions. |
| Automation Lab | Rectangular low-poly glazed enclosure with metal frame, two to three visible machine arms and workflow consoles. | Reads as a working space from world-map distance, not a generic box. |
| Evidence Vault | Circular archive with radial stone floor, structural ribs, one central inspection station and eleven separate perimeter capsules. | Capsules count to **11**; each is selectable and visually distinguishable. |
| Regulatory Observatory | Ivory drum and domed orbital frame with brass arcs and a central node. | Dome silhouette and orbiting information system remain legible at map distance. |
| Career Trail | S-shaped pale path crosses three joined right-side terraces with eight distance-spaced, two-sided company fixtures in chronology. | Eight role IDs have distinct positions, walkable approach points and sequential close captures `task-7-fix-career-01.png` through `-08.png`. |
| Contact Portal | A layered luminous ring gateway on its own terrace, reached by a bridge from the plaza. | Email and LinkedIn world targets carry real links; accessible HTML equivalents belong to the later runtime/UI integration. |
| Environment | One World water plane, faceted coastal slopes/islets, moon/stars/clouds, edge-placed cypress trees, instanced shrubs and cliff strata, sparse cascades, water glints and shoreline foam. | No near/far sea-plane overlap; batched final integrated QA rendered 483 arrival and 577 overview draw calls at 1600 × 900. |

The map is a planning view. The wide arrival view establishes the actual third-person camera language. Distant destinations may be simplified or occluded from a ground camera; navigation and content cannot depend on all landmarks being simultaneously visible.

The five PNG files are production design references. Do not ship these full-resolution concepts in the initial interactive bundle; construct the world from optimized geometry, materials and the approved content data.

## Avatar construction inventory

- **Identity:** use the supplied portrait for likeness, medium-brown complexion, dark wavy hair, thin gold glasses, thick eyebrows, moustache, full beard and softly rectangular face. The face can be sculpted instead of displaying a photographic patch. Never trim or crop the crown to fit the camera.
- **Body:** tailored navy suit with visible lapels, white open-collar shirt, dark trousers, brown belt, polished brown shoes, and relaxed hands. Retain a single character proportion set across front, three-quarter, side and back.
- **Procedural build:** one curved head with sculpted cheeks/jaw/nose, a swept hair mass, a wraparound jacket over a curved shirt front, pivoted limbs and brown Oxford forms. Round 4 maps the portrait and turnaround to these surfaces to carry the facial, hair and garment detail; the spatial mesh supplies profile and movement.
- **Camera check:** at normal follow distance, hair, glasses, beard, navy jacket and white shirt must each remain recognizable. Check front and side before approving the model.

### Initial Task 5 visual gate (superseded after review)

The browser renders below use `src/avatar/Avatar.ts` with the optimized portrait texture. They were compared by direct image inspection with both the source portrait and `concepts/avatar-turnaround.png`. The four captures are retained beside the Task 5 report as review evidence, outside the shipped bundle.

| View | Captured evidence | Inspection result |
|---|---|
| Front | `../.superpowers/sdd/2026-09-24-krishna-three-portfolio/task-5-front.png` (1100 × 900) | Complete crown and shoes; face crop preserves eyes, nose, mouth and beard; gold frames, navy jacket, white open shirt and medium-brown skin are visible. |
| Three-quarter | `../.superpowers/sdd/2026-09-24-krishna-three-portfolio/task-5-threequarter.png` (1100 × 900) | Convex portrait surface follows the modeled head rather than standing as a flat card; hair wraps the crown, glasses have side temples, and layered beard follows the jaw. |
| Side | `../.superpowers/sdd/2026-09-24-krishna-three-portfolio/task-5-side.png` (1100 × 900) | Full hair volume, ear, nose, glasses bridge/temple, beard profile, jacket depth and shoe outline remain legible. |
| World-scale proxy | `../.superpowers/sdd/2026-09-24-krishna-three-portfolio/task-5-world.png` (1600 × 900) | At a follow-distance camera on a temporary ringed-plaza proxy, hair, glasses, facial hair, navy suit and white shirt remain recognizable. This checks avatar scale only; Task 7 owns the actual plaza and lighting integration. |

The first capture exposed a dark triangle through the shirt, an oversized hair mass and an offset facial surface. Early corrections did not fully resolve the separate-face look, hairstyle, tailoring or motion evidence. The initial review rejected this gate.

The initial gate failed independent review for face integration, hair and tailoring quality, and direction-change sliding. Its captures are retained only as before-state evidence; the acceptance claim above is superseded by the revised gate below.

### Task 5 revised visual gate (2026-09-24)

The captures below render the revised `src/avatar/Avatar.ts` at the **same camera positions and image sizes** using `public/assets/portrait/krishna-portrait.webp`. They were inspected directly with `view_image` beside the supplied source portrait and `concepts/avatar-turnaround.png`. All QA captures are retained beside the Task 5 report and excluded from the shipped bundle.

| View | Revised evidence | Direct inspection |
|---|---|---|
| Front | `../.superpowers/sdd/2026-09-24-krishna-three-portfolio/task-5-fixed-front.png` (1100 × 900) | One textured head surface carries the brows, rimless gold glasses, nose, moustache, lips and beard without doubled front overlays. Full crown and shoes fit the frame; the smaller head sits in a narrower navy lapel and white open-collar silhouette. |
| Three-quarter | `../.superpowers/sdd/2026-09-24-krishna-three-portfolio/task-5-fixed-threequarter.png` (1100 × 900) | Portrait color feathers into the modeled cheek and jaw on the same mesh. The thin glasses temple, jaw beard, directional hair sweep, sloped shoulder and jacket depth are visible. |
| Side | `../.superpowers/sdd/2026-09-24-krishna-three-portfolio/task-5-fixed-side.png` (1100 × 900) | Continuous head and nose profile replaces the protruding dot nose and separate face patch. Hairline exposes the temple, the beard hugs the lower cheek/jaw, and the tapered sleeves and low brown shoe profile remain legible. |
| World-scale proxy | `../.superpowers/sdd/2026-09-24-krishna-three-portfolio/task-5-fixed-world.png` (1600 × 900) | At the same follow-distance camera, the full head, glasses, facial hair, navy suit, white shirt and brown shoes remain visible. This is a scale proxy on a ringed platform, not Task 7's actual plaza. |

Motion was rendered at a fixed follow-distance framing in `task-5-motion-walk.png`, `task-5-motion-turn-start.png`, `task-5-motion-turn-end.png`, `task-5-motion-interact.png`, `task-5-motion-reduced-idle-a.png`, `task-5-motion-reduced-idle-b.png`, and `task-5-motion-reduced-walk.png` in the same evidence directory. The walk and turn images show a gait on the facing axis; interaction raises one arm toward a console-height target. The two reduced-motion idle images are byte-identical while reduced-motion walking still advances with a smaller stride. A unit test now verifies zero lateral or backward velocity relative to capped yaw through 90-degree and reversal inputs.

The portrait is frontal, so side texture detail naturally diminishes. The continuous skin-toned head, shaped nose, ear, jaw beard and thin spectacle temple provide the side silhouette. The intentionally faceted suit and hair retain less image-level detail than the smooth turnaround; this is the specified procedural low-poly translation. Independent visual acceptance of the revised captures remains the next gate.

The independent round 1 re-review rejected the four static `task-5-fixed-*.png` images above for a still-visible photo/mesh boundary, knobby hair and schematic body. The motion and heading-alignment evidence passed. Those static images remain before-state evidence only.

### Task 5 round 2 visual gate (submitted for review)

The round 2 model removes the portrait decal entirely. The portrait is sampled only for complexion; face shape, eyes, brows, nose, smile, moustache, beard, glasses and hair are all modeled. Hair flow comes from one continuous, asymmetrically swept mesh with a small procedural strand texture. The shirt is a curved insert within a wraparound jacket; the hem overlaps the trousers. Legs, sleeves, hands and shoes were re-proportioned and visually inspected at front, three-quarter, side and follow distance against the portrait and approved turnaround.

| View | Round 2 browser capture | Direct inspection |
|---|---|---|
| Front | `../.superpowers/sdd/2026-09-24-krishna-three-portfolio/task-5-round2-front.png` (1100 × 900) | Complete dark swept crown and shoes, modeled face with thin gold glasses and continuous beard, navy jacket framing an open white shirt, longer trouser proportions and narrow sleeves. |
| Three-quarter | `../.superpowers/sdd/2026-09-24-krishna-three-portfolio/task-5-round2-threequarter.png` (1100 × 900) | Facial volumes and beard wrap are continuous with the side of the head; the jacket/lapel has depth, hands hang below the hem and rounded shoe toe/sole/heel are distinct. |
| Side | `../.superpowers/sdd/2026-09-24-krishna-three-portfolio/task-5-round2-side.png` (1100 × 900) | Full crown, nose/cheek/jaw profile, ear and gold spectacle temple are present; beard tapers behind the jaw and the jacket hem overlaps the upper trousers. Side camera was moved back slightly to include the taller full-body proportion. |
| World-scale proxy | `../.superpowers/sdd/2026-09-24-krishna-three-portfolio/task-5-round2-world.png` (1600 × 900) | Hair, glasses, beard, suit, white shirt and brown shoes remain distinguishable at follow distance on the neutral ringed-platform proxy. |

Additional close QA images (`task-5-round2-head.png`, `task-5-round2-headthreequarter.png`, `task-5-round2-headside.png`) were used to check face, hairline, beard, eyewear and neckline alignment. The final rig was also rendered in `task-5-round2-motion-walk.png`, `task-5-round2-motion-turn.png`, `task-5-round2-motion-interact.png` and `task-5-round2-motion-reduced-idle.png`; floor contact and elbow continuity were inspected after changing leg length. The turn/sliding logic and its unit test remain the independently accepted round 1 implementation.

Round 2 is a deliberate low-poly interpretation and remains less detailed than the smooth turnaround. These images establish a new review candidate, not independent acceptance or final world lighting proof.

### Task 5 round 3 self-audit (2026-09-25)

Round 3 retained the accepted heading-aligned motion. The head now uses a 64-column × 48-row surface with shaped cheeks, eye sockets, a bridge/tip nose profile and subtle vertex color. Almond eye surfaces sit against that head; pupils, lids, brows and thin gold oval frames share its landmarks. The beard is a wider continuous jaw mesh that tapers near the ears, and the moustache is smaller and seated on the face. The hair has a fitted base and five swept raised ribbons on the same scalp surface. Sleeves and trousers follow slightly bent centerlines; the jacket has a shorter shaped hem and shallow folded lapels; the shoes use a low upper, vamp seam, heel and thin sole.

| View | Round 3 render | Self-inspection against portrait and turnaround |
|---|---|---|
| Front | `../.superpowers/sdd/2026-09-24-krishna-three-portfolio/task-5-round3-front.png` (1100 × 900) | Full crown and shoes, with modeled hair/glasses/beard and a navy/white suit. Figure remains visibly schematic beside the tailored turnaround. |
| Three-quarter | `../.superpowers/sdd/2026-09-24-krishna-three-portfolio/task-5-round3-threequarter.png` (1100 × 900) | Head, beard, lapel and shoe profiles are more continuous, but facial expression and garment drape remain simplified. |
| Side | `../.superpowers/sdd/2026-09-24-krishna-three-portfolio/task-5-round3-side.png` (1100 × 900) | Nose and beard follow the head, and the lower shoe shape is visible. Side head and sleeve remain too plain relative to the reference. |
| World-scale proxy | `../.superpowers/sdd/2026-09-24-krishna-three-portfolio/task-5-round3-world.png` (1600 × 900) | Identity categories remain visible; the finished-character quality required for the visual gate is not established. |

Close renders `task-5-round3-head.png`, `task-5-round3-headthreequarter.png` and `task-5-round3-headside.png` were inspected for eye seating, nose profile, gold frame fit, hair layering and beard wrap. `task-5-round3-motion-walk.png`, `task-5-round3-motion-turn.png` and `task-5-round3-motion-interact.png` show no obvious new pose separation or floor-contact regression. Neutral key/fill/rim lighting was used to reveal form, not to claim a Task 7 lighting result.

**Self-review verdict: visual gate still fails.** The model is a cleaner procedural study, but its face, hair and suit remain far simpler than the approved character. Keep Task 5 open for a fresh art-direction/modeling pass. The accepted motion implementation and its tests remain usable.

### Task 5 round 4 image-projected spatial study (2026-09-25)

The current avatar remains a curved, articulated Three.js model. A 134,412-byte WebP atlas derived from the approved turnaround supplies front, three-quarter, side and back clothing/hair detail; the supplied portrait texture supplies the higher-resolution front face. A small shader chooses a source view from the camera angle around the rig and samples it in bind-pose coordinates, so textured clothing remains attached to walking limbs. Skin hands, neck and brown shoes use solid materials. This is a reference-led spatial rendering attempt, with no opaque character library or additional runtime dependency.

`../.superpowers/sdd/2026-09-24-krishna-three-portfolio/task-5-round4-{front,threequarter,side,back,world}.png` are the full-body and follow-distance captures. `task-5-round4-{head,headthreequarter,headside}.png` show the close face; `task-5-round4-{walk,turn,interact,reduced}.png` sample motion. Static close and full-body captures are 1100 × 900; follow-distance and motion captures are 1600 × 900. The captures were inspected with `view_image` against both references.

**Self-review verdict: visual gate remains open.** The face and suit detail are more recognizable, and the side/back maps carry useful depth cues. At close range, the view projection can still produce abrupt face/hair transitions; the sleeves, shoulder join, trouser drape, hands and shoes remain visibly less natural than the approved turnaround. The view-based blend also needs moving-camera evaluation. Do not treat these captures as acceptance or assume final plaza lighting will resolve the remaining form issues. The previously accepted heading-aligned motion controller remains unchanged and its tests still pass.

### Task 5 round 5 — approved-art multi-view candidate (2026-09-25)

The visible avatar now uses aligned transparent views from the approved turnaround on a curved, lit Three.js surface. The source portrait and turnaround were compared directly during the render audit; the portrait is retained as the constructor input, and the visible face at every angle comes from the same turnaround character design. The front, three-quarter, side and back no longer expose the earlier projected-photo/mesh seams, hard geometric collar, helmet hair, pipe trousers or bulky procedural shoes. The oval glasses, beard, upward swept hair, fitted navy jacket, white collar and brown Oxford profiles come from one consistent art direction. A rear three-quarter view, interaction pose and two walking key poses extend the approved artwork. The articulated depth shell casts shadows, while the established `AvatarMotion` still owns movement, steering and reduced motion.

Browser evidence is in `../.superpowers/sdd/2026-09-24-krishna-three-portfolio/task-5-round5-{front,threequarter,side,back,head-front,head-threequarter,head-side,world,walk-left,walk-right,turn,interact,reduced-idle-a,reduced-idle-b}.png`. A recorded 360-degree camera check is `task-5-round5-orbit.webm`, with sampled angle frames `task-5-round5-orbit-*.png`. The static key views and reach/walk endpoints are materially closer to the turnaround than rounds 1–4; the two reduced-idle captures are byte-identical.

**Self-review gate remains open.** At about 41–42 degrees, the view texture wipe leaves a visible collar/head and jacket transition seam in close orbit frames. A quick camera orbit and gait key-pose transitions have a short image-based change that a continuously sculpted 3D rig would not have. These limitations are present in the recorded evidence and should be reviewed under the final world camera and lighting before claiming character acceptance. The renderer uses no new runtime library or external model service; the 32 optimized WebP maps total about 1.26 MB compressed in the public bundle.

## Theme pairing

The two arrival concepts were made from one camera and geometry: bridge-side camera facing the circular plaza, Krishna standing on the near bridge, Vault centered beyond, Lab left, Observatory right. Night uses a deep-navy sky, moon/rim lighting, brass practicals, teal emissive paths and restrained particles. Day uses the same layout with pale-blue sky, warm directional sun, ivory stone, green planting and blue water; emission and particles are reduced. A theme switch must alter the world materials, fog, lights, water and atmosphere together.

## Evidence Vault inventory

The final Vault image contains eleven visible perimeter capsules in one radial sequence: shield, data cubes, gear, graduation cap, heart/pulse, document, people, balance scales, orbital ring, network nodes and routing arrows. These motifs are visual placeholders for the eleven approved public-safe case studies; bind each to a specific case-study record during implementation rather than inferring a confidential project name from the image. The central station has an inspectable project object and a compact metric hologram of bars/rings/dots. Keep the chamber walkable and the readable case-study interface in semantic HTML.

## Task 7 integrated visual review (2026-09-25)

This section records the first Task 7 pass. The correction round below supersedes its open bridge, Career, floor and camera findings.

The `task-7-*.png` captures above were taken in a temporary Vite/Chrome scaffold with the committed `World`, the actual `Avatar`, and the actual `CameraRig`. The scaffold mounted all six new zone groups and both `ThemeController.bindWorldTerrain(world.group)` and `bindSceneMaterials(world.group)` before rendering. It was removed after capture. The concept images and these renders were inspected directly with `view_image` at 1600 × 900. These are implementation evidence, not concept images placed into the runtime.

| Reference comparison | Finding in first render | Concrete Task 7 correction | Current read |
|---|---|---|---|
| Night/day arrival | A flat sky and hard water horizon left the plaza looking isolated; the centered fountain obscured the Vault approach. | Added faceted coastal ridges, sparse stars/clouds and a night-only moon; extended the sea, batched shoreline glints, shrubs and cliff strata; moved and reduced the fountain to keep the centerline open. | The same modeled scene changes sky, fog, sun/moon/ambient/practical lights, sea, stone, planting and emission. Lab and Observatory are still clipped at the edges of the 69° bridge-side capture, and the avatar is smaller than in the concept. |
| World map | The two foreground destinations were reversed, and the clearings lacked edge definition. | Swapped Career and Contact positions in `World.ts` and aligned both factories; added teal rails, low planted edges, stone strata and waterline marks. | All six silhouettes and five routes are distinct and reachable. Bridges remain straight rather than curved; the circular Career clearing compresses the eight stops compared with the long concept trail. |
| Evidence Vault | A complete front cornice crossed the character and inspection station; capsules read as empty pedestals. | Interrupted the entry cornice, lowered the inspection camera, moved the title plaque aside, added capsule glazing struts and distinct project motifs. | Eleven perimeter capsule groups map to eleven public case-study IDs. Front columns still occlude two side capsules from this single entry camera; later interaction shots should move closer to a selected pod. |
| Day/night practicals | Pale emissive pieces washed out as white in the first pass. | Reduced generic teal emission and gave the fountain, metric crystal and observatory nucleus separate mineral-blue materials. | Brighter bars remain readable at night without changing geometry. The daylight scene is still flatter and less landscaped than the rendered target. |
| Follow camera seam | The known avatar view wipe was exposed in earlier Task 5 close orbit work. | Used the committed CameraRig in the integrated scene and captured `task-7-avatar-arrival.png`, `task-7-avatar-orbit-38.png`, `task-7-avatar-orbit-42.png` and `task-7-avatar-orbit-45.png`. | A requested 42° orbit rendered at 44°; no view split is visible at normal follow distance in these samples. This does not clear the separate close-up avatar art gate. |

Opaque static trim is merged within each transform group, while project/capability/milestone/contact target groups and animated objects remain separate. The integrated renderer reported approximately **1,200 arrival draw calls before batching and 360 after**, with 488 in the final overview, 215 in the Vault view and roughly 192,000 arrival triangles. The screenshots prove composition and basic GPU submission counts on one software-rendered Chrome setup; they do not establish mobile frame rate or complete accessibility.

**Task 7 art gate: open.** The world is an authored spatial shell with differentiated places and interactions, but the final captured arrival and map are visibly more sparse and diagrammatic than the five production concepts. Before claiming finished visual fidelity, the runtime integration should stage a more cinematic camera sequence that shows the avatar at useful scale and then reveals both flanking destinations, and the shared terrain should gain curved, parapeted bridge forms and richer planted terraces. The accessible HTML case-study, career and contact interfaces are separate later tasks.

## Task 7 correction review (2026-09-25)

The `task-7-fix-*.png` captures were made from a fresh temporary Vite/Chrome scaffold that instantiated the committed World terrain plus all six zone factories, the actual Avatar, CameraRig and ThemeController. It was removed after capture. The final 1600 × 900 images were inspected with `view_image` against `concepts/arrival-night.png`, `arrival-day.png`, `world-map.png`, and `evidence-vault.png`. The comparison remains an art-direction judgment, not a claim of pixel matching.

| Review finding | Concrete change and evidence | Result |
|---|---|---|
| I1 compass reversal | Swapped Career/Contact marker bearings and tested each marker's vector against the registered destination position. | Five markers point toward their actual islands. |
| I2 buried avatar | Aligned primary walkable floor tops to Y=0 with 0–0.023 unit decorative clearance, lowered the World plaza plateau, and added movement-only boundaries for fixed raised stations. Standing and walking captures exist for all six destinations: `task-7-fix-{stand,walk}-{plaza,automation-lab,evidence-vault,observatory,career-trail,contact-portal}.png`. | Thirty-six-capture browser audit reported every sampled position walkable, and all standing/walking/Vault-selection/milestone foot contacts were between Y=0 and Y=0.0226. Shoes and legs are visible in the reviewed views. |
| I3 arrival/terrain/Lab | Added a south approach bridge and moved the spawn onto it; World now builds curved ribbons, stone curbs, brass handrails, warm lanterns and teal edges from the same centerlines used by collision projection. Added Career terraces, sloped coastal foothills/islets, edge planting, and stronger Lab masonry, canopy, visible arms, beacons and console materials. | `task-7-fix-arrival-{night,day}.png` shows Lab, Vault, Observatory and avatar together. `task-7-fix-world-map.png` shows the distinct long right-side trail. `task-7-fix-lab.png` shows the workflow through the pavilion. The output is still a deliberately spare low-poly interpretation beside the much denser concepts. |
| I4 Vault camera/ring | Opened a wider southern arch break, moved the camera back/up, cleared interior trees, separated floor layers to stop depth flicker, and added a selected-pod camera. | `task-7-fix-vault-entry.png` shows a grounded full avatar, center and most capsules; `task-7-fix-vault-selected.png` shows the selected gear pod and full avatar with a Y=0.012 floor contact. The eleven project IDs remain individually bound. |
| I5 Career length/order | Extended World with two right-side terraces and a continuous S path. Eight role fixtures use distance-spaced points and two-sided marks; the route keeps planting away from the walking ribbon. | `task-7-fix-career-overview.png` shows the longer route. `task-7-fix-career-01.png` through `-08.png` show the chronological stops; unit tests check eight distinct, walkable milestone and approach positions. |
| I6 camera seam | Captured successive real CameraRig orbit inputs in both directions at follow distance: `task-7-fix-orbit-plus-{38,39,snap44,next45}.png` and `task-7-fix-orbit-minus-{44,snap39,next38}.png`. | Measured camera angles were 38°, 39°, 44°, 45° forward and 44°, 39°, 38° backward. No avatar split was visible at either safe endpoint or adjacent moving sample; the 5° camera jump remains perceptible in the background and the separate close-up Avatar art gate is still open. |
| M1 motion proof | Added a focused test that freezes, resumes and re-freezes one authored moving object in each of the six zones; the ThemeController test title now describes only its own assertions. | Six zone-motion cases and immediate theme switching have direct test coverage. |
| M2 water seam | Replaced the two overlapping sea planes with one 260-unit World water surface. Mountain geometry slopes through irregular foothills into the coast; offshore islets interrupt the straight ridge/sea break. | The final night/day pair has one themed water body and a layered coastal horizon. |

Final integrated renderer counts were **483 arrival**, **577 overview**, **233 Vault entry**, **215 Lab**, and **396 Career overview** draw calls; arrival drew about **234,000 triangles**. The browser capture log reports zero page errors and zero console warnings. These counts are bounded QA evidence from one software-rendered Chrome setup, not mobile frame-rate proof.

**Correction status: ready for independent visual rereview.** The structural and movement findings above have concrete fixes and fresh evidence. The reference art remains richer in planting, stone detail and warm night lighting; visual acceptance should be judged against the attached images rather than inferred from test counts. Permanent zone registration and semantic HTML overlays remain later tasks.

## Review limits

- Generated images are conceptual and cannot by themselves verify exact metric values, text, avatar likeness at runtime, geometry count, accessibility or frame rate.
- The arrival pair closely matches in composition, though generative lighting changes introduce small per-pixel differences. Implement both states from one Three.js geometry set.
- The turnaround is intentionally polished and smoother than the target mesh. Treat its identity, proportions and clothing as binding; construct a controlled low-poly silhouette in code.
