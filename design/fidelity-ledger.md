# Fidelity Ledger

These images are concept references for a procedurally modeled Three.js world. They establish topology, silhouette, camera, materials, and light. Generated surface detail is directional art, not an asset extraction or a requirement to reproduce every polygon. The supplied portrait remains the identity reference for Krishna's face.

| Area | Concept evidence | Implementation evidence | Status |
|---|---|---|---|
| Avatar silhouette | `concepts/avatar-turnaround.png` | Added during Task 5 | Awaiting Task 5 review |
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

- **Identity:** use the supplied portrait as the facial source. Preserve the complete upward and sideward dark wavy hair volume, medium-brown skin, thin gold round/rimless glasses, thick eyebrows, moustache, full beard and softly rectangular face. Never trim or crop the crown to fit the camera.
- **Body:** tailored navy suit with visible lapels, white open-collar shirt, dark trousers, brown belt, polished brown shoes, and relaxed hands. Retain a single character proportion set across front, three-quarter, side and back.
- **Procedural build:** custom rounded head, layered tapered hair clumps, separate eyebrows/beard/moustache masses, thin tubular glasses, beveled jacket and lapels, pivoted limbs, simple hands and shoes. Use the portrait-derived face texture only where it improves identity. The turnaround is an anatomy and clothing reference; its smooth render should be translated to a visibly stylized mesh budget.
- **Camera check:** at normal follow distance, hair, glasses, beard, navy jacket and white shirt must each remain recognizable. Check front and side before approving the model.

## Theme pairing

The two arrival concepts were made from one camera and geometry: bridge-side camera facing the circular plaza, Krishna standing on the near bridge, Vault centered beyond, Lab left, Observatory right. Night uses a deep-navy sky, moon/rim lighting, brass practicals, teal emissive paths and restrained particles. Day uses the same layout with pale-blue sky, warm directional sun, ivory stone, green planting and blue water; emission and particles are reduced. A theme switch must alter the world materials, fog, lights, water and atmosphere together.

## Evidence Vault inventory

The final Vault image contains eleven visible perimeter capsules in one radial sequence: shield, data cubes, gear, graduation cap, heart/pulse, document, people, balance scales, orbital ring, network nodes and routing arrows. These motifs are visual placeholders for the eleven approved public-safe case studies; bind each to a specific case-study record during implementation rather than inferring a confidential project name from the image. The central station has an inspectable project object and a compact metric hologram of bars/rings/dots. Keep the chamber walkable and the readable case-study interface in semantic HTML.

## Review limits

- Generated images are conceptual and cannot by themselves verify exact metric values, text, avatar likeness at runtime, geometry count, accessibility or frame rate.
- The arrival pair closely matches in composition, though generative lighting changes introduce small per-pixel differences. Implement both states from one Three.js geometry set.
- The turnaround is intentionally polished and smoother than the target mesh. Treat its identity, proportions and clothing as binding; construct a controlled low-poly silhouette in code.
