# Fidelity Ledger

These images are concept references for a procedurally modeled Three.js world. They establish topology, silhouette, camera, materials, and light. Generated surface detail is directional art, not an asset extraction or a requirement to reproduce every polygon. The supplied portrait remains the identity reference for Krishna's face.

| Area | Concept evidence | Implementation evidence | Status |
|---|---|---|---|
| Avatar silhouette | `concepts/avatar-turnaround.png` and supplied portrait | Task 5 round 3 four-view, close-up and motion captures listed below | Visual acceptance still open after round 3 self-audit |
| Arrival night | `concepts/arrival-night.png` | Added during Task 7 | Awaiting Task 7 review |
| Arrival day | `concepts/arrival-day.png` | Added during Task 7 | Awaiting Task 7 review |
| World topology | `concepts/world-map.png` | Added during Task 7 | Awaiting Task 7 review |
| Evidence Vault | `concepts/evidence-vault.png` | Added during Task 7 | Awaiting Task 7 review |

## World construction inventory

| Element | Modeling interpretation | Fidelity check |
|---|---|---|
| Floating campus | Six destination islands/terraces over one water plane, joined by walkable curved bridges. Central Arrival Plaza is the hub. | All six zones are visibly separate and directly reachable. No detached decorative destination. |
| Arrival Plaza | Circular pale-stone platform with three concentric brass inlays, wide steps, low parapets, a bridge-side spawn, and planted edges. | Third-person camera sees avatar, traversable floor, and at least one onward route. |
| Automation Lab | Rectangular low-poly glazed enclosure with metal frame, two to three visible machine arms and workflow consoles. | Reads as a working space from world-map distance, not a generic box. |
| Evidence Vault | Circular archive with radial stone floor, structural ribs, one central inspection station and eleven separate perimeter capsules. | Capsules count to **11**; each is selectable and visually distinguishable. |
| Regulatory Observatory | Ivory drum and domed orbital frame with brass arcs and a central node. | Dome silhouette and orbiting information system remain legible at map distance. |
| Career Trail | Meandering planted causeway with eight evenly sequenced milestone fixtures. | Trail reads as a journey; eight milestones correspond to content records. |
| Contact Portal | A luminous ring gateway on its own terrace, reached by a bridge from the plaza. | Email and LinkedIn remain real accessible HTML actions. |
| Environment | One shared deep-blue water plane, terraced beveled rock, mineral-green ground patches, cypress-like instanced trees, shrubs, and sparse waterfalls or shoreline foam. | Detail is selectively repeated and batched so the initial scene remains within performance goals. |

The map is a planning view. The wide arrival view establishes the actual third-person camera language. Distant destinations may be simplified or occluded from a ground camera; navigation and content cannot depend on all landmarks being simultaneously visible.

The five PNG files are production design references. Do not ship these full-resolution concepts in the initial interactive bundle; construct the world from optimized geometry, materials and the approved content data.

## Avatar construction inventory

- **Identity:** use the supplied portrait for likeness, medium-brown complexion, dark wavy hair, thin gold glasses, thick eyebrows, moustache, full beard and softly rectangular face. The face can be sculpted instead of displaying a photographic patch. Never trim or crop the crown to fit the camera.
- **Body:** tailored navy suit with visible lapels, white open-collar shirt, dark trousers, brown belt, polished brown shoes, and relaxed hands. Retain a single character proportion set across front, three-quarter, side and back.
- **Procedural build:** one sculpted head with continuous skin cheeks/jaw, modeled eyes, brows, nose ridge, smile, beard and moustache, thin gold eyewear, a single asymmetric hair mass with procedural flow texture, a wraparound tailored jacket over a curved white shirt front, pivoted tapered limbs and brown Oxford shoes. The portrait supplies palette and anatomy cues; the turnaround supplies the full-body silhouette. Both are translated to a visibly stylized mesh budget.
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

## Theme pairing

The two arrival concepts were made from one camera and geometry: bridge-side camera facing the circular plaza, Krishna standing on the near bridge, Vault centered beyond, Lab left, Observatory right. Night uses a deep-navy sky, moon/rim lighting, brass practicals, teal emissive paths and restrained particles. Day uses the same layout with pale-blue sky, warm directional sun, ivory stone, green planting and blue water; emission and particles are reduced. A theme switch must alter the world materials, fog, lights, water and atmosphere together.

## Evidence Vault inventory

The final Vault image contains eleven visible perimeter capsules in one radial sequence: shield, data cubes, gear, graduation cap, heart/pulse, document, people, balance scales, orbital ring, network nodes and routing arrows. These motifs are visual placeholders for the eleven approved public-safe case studies; bind each to a specific case-study record during implementation rather than inferring a confidential project name from the image. The central station has an inspectable project object and a compact metric hologram of bars/rings/dots. Keep the chamber walkable and the readable case-study interface in semantic HTML.

## Review limits

- Generated images are conceptual and cannot by themselves verify exact metric values, text, avatar likeness at runtime, geometry count, accessibility or frame rate.
- The arrival pair closely matches in composition, though generative lighting changes introduce small per-pixel differences. Implement both states from one Three.js geometry set.
- The turnaround is intentionally polished and smoother than the target mesh. Treat its identity, proportions and clothing as binding; construct a controlled low-poly silhouette in code.
