import { Group, OctahedronGeometry, Vector3 } from "three";
import type { InteractiveTarget } from "../types";
import { buildAtmosphere } from "./Atmosphere";
import { makePalette, type DynamicWorldZone, type ZoneOptions, ZoneKit } from "./zoneKit";

export interface ArrivalPlazaOptions extends ZoneOptions {
  onNavigate?: (zoneId: string) => void;
}

const destinations = [
  { id: "automation-lab", angle: Math.PI, label: "Automation Lab" },
  { id: "evidence-vault", angle: -Math.PI / 2, label: "Evidence Vault" },
  { id: "observatory", angle: -0.08, label: "Regulatory Observatory" },
  { id: "career-trail", angle: 2.2, label: "Career Trail" },
  { id: "contact-portal", angle: 0.94, label: "Contact Portal" },
];

/** A navigable compass garden and low fountain, scaled to the existing plaza clearing. */
export function createArrivalPlaza(options: ArrivalPlazaOptions = {}): DynamicWorldZone {
  const kit = new ZoneKit("Arrival Plaza architecture", 0, 0);
  const p = makePalette(kit);
  const crystal = kit.material("arrival sea-glass crystal", 0x1d7897, 0x398da2,
    { roughness: 0.2, metalness: 0.22, emissive: 0x087d9d,
      nightEmission: 0.42, dayEmission: 0.11 });
  const interactives: InteractiveTarget[] = [];
  let reducedMotion = options.reducedMotion ?? false;
  let elapsed = 0;
  kit.lamp("arrival warm practical pool", 0xffc98a, 2.0, 0.18, 11, [0, 3.2, 0]);
  buildAtmosphere(kit);

  const fountain = new Group();
  fountain.name = "off-axis arrival fountain";
  fountain.position.set(1.58, 0, 0.48);
  fountain.scale.setScalar(0.64);
  kit.group.add(fountain);

  // The ground rings belong to World; these low additions preserve the bridge-side sightline.
  kit.cylinder("fountain three tier basin", 0.95, 1.13, 0.21, p.stone, [0, 0.17, 0], 28, fountain);
  kit.cylinder("fountain inset brass lip", 0.82, 0.88, 0.07, p.brass, [0, 0.31, 0], 32, fountain);
  kit.cylinder("fountain water disk", 0.73, 0.73, 0.025, p.glass, [0, 0.358, 0], 32, fountain);
  const ripple = kit.torus("fountain illuminated ripple", 0.51, 0.013, p.tealLight,
    [0, 0.374, 0], fountain);
  ripple.rotation.x = Math.PI / 2;
  kit.cylinder("fountain core", 0.23, 0.35, 0.72, p.dark, [0, 0.67, 0], 10, fountain);
  kit.cylinder("fountain crown", 0.3, 0.27, 0.11, p.brass, [0, 1.09, 0], 12, fountain);
  const jewel = kit.add("fountain crystalline compass", kit.own(new OctahedronGeometry(0.43)),
    crystal, [0, 1.64, 0], fountain);
  jewel.rotation.z = Math.PI / 8;
  for (let spoke = 0; spoke < 8; spoke += 1) {
    const angle = spoke * Math.PI / 4;
    kit.beam(`compass inlay ${spoke + 1}`,
      [Math.cos(angle) * 1.15, 0.105, Math.sin(angle) * 1.15],
      [Math.cos(angle) * 2.7, 0.105, Math.sin(angle) * 2.7],
      0.018, p.brass);
  }

  // Four staggered step treads make the plaza terrace read as carved stone from the south bridge.
  for (let step = 0; step < 4; step += 1) {
    const width = 3.85 + step * 0.36;
    kit.bevel(`arrival stair tread ${step + 1}`, [width, 0.11, 0.49], p.pale,
      [0, 0.062 + step * 0.007, 2.17 + step * 0.47], kit.group, 0.035);
    kit.box(`arrival stair brass nosing ${step + 1}`, [width - 0.14, 0.012, 0.018],
      p.brass, [0, 0.13 + step * 0.007, 2.41 + step * 0.47]);
  }

  // A low, curved identity marker is present without blocking the Vault bridge.
  const sign = new Group();
  sign.name = "sculptural identity sign";
  sign.position.set(-2.75, 0, 1.22);
  sign.rotation.y = -0.23;
  kit.group.add(sign);
  kit.bevel("identity footing", [2.2, 0.21, 0.55], p.dark, [0, 0.1, 0], sign, 0.045);
  kit.curve("identity brass sweep", [[-1.05, 0.22, 0], [-1.0, 0.98, 0],
    [-0.8, 1.55, 0], [0, 1.72, 0], [0.8, 1.55, 0], [1.0, 0.98, 0], [1.05, 0.22, 0]],
    0.04, p.brass, sign);
  kit.bevel("identity dark enamel inset", [1.72, 0.85, 0.1], p.deep,
    [0, 1.12, 0.02], sign, 0.05);
  kit.text("Regulatory clarity sign", ["KRISHNA VARSHITH", "REGULATORY CLARITY", "WORKFLOWS PEOPLE TRUST"],
    1.62, 0.77, [0, 1.12, 0.09], sign, { fontSize: 53 });

  // Short lanterns and route medallions make the destination compass readable after dusk.
  for (let index = 0; index < 10; index += 1) {
    const angle = index * Math.PI * 2 / 10 + 0.23;
    const x = Math.cos(angle) * 4.64;
    const z = Math.sin(angle) * 4.64;
    kit.cylinder(`arrival lantern plinth ${index + 1}`, 0.145, 0.18, 0.66,
      p.stone, [x, 0.34, z], 8);
    kit.cylinder(`arrival lantern collar ${index + 1}`, 0.185, 0.185, 0.055,
      p.brass, [x, 0.7, z], 8);
    kit.cylinder(`arrival lantern light ${index + 1}`, 0.075, 0.075, 0.23,
      p.goldLight, [x, 0.85, z], 8);
    kit.cone(`arrival lantern hood ${index + 1}`, 0.16, 0.13,
      p.dark, [x, 1.045, z], 8);
  }
  for (const destination of destinations) {
    const x = Math.cos(destination.angle) * 3.88;
    const z = Math.sin(destination.angle) * 3.88;
    const marker = new Group();
    marker.name = `${destination.label} compass waypoint`;
    marker.position.set(x, 0, z);
    kit.group.add(marker);
    const base = kit.cylinder(`${destination.label} compass inset`, 0.29, 0.31, 0.038,
      p.brass, [0, 0.075, 0], 16, marker);
    kit.cylinder(`${destination.label} luminous center`, 0.2, 0.2, 0.045,
      p.deep, [0, 0.102, 0], 16, marker);
    kit.cone(`${destination.label} compass needle`, 0.11, 0.25, crystal,
      [0, 0.265, 0], 4, marker);
    base.userData.zoneId = destination.id;
    interactives.push({ id: `navigate:${destination.id}`, object: marker,
      label: destination.label, activate: () => options.onNavigate?.(destination.id) });
  }

  kit.optimizeDrawCalls();
  return {
    id: "plaza", group: kit.group,
    entryPoint: new Vector3(0, 0, 3.7),
    cameraComposition: { position: new Vector3(0, 4.8, 9.2),
      target: new Vector3(0, 1.25, -0.45), durationMs: 950 },
    interactiveObjects: interactives,
    setReducedMotion(value) { reducedMotion = value; },
    update(delta) {
      if (reducedMotion) return;
      elapsed += delta;
      ripple.scale.setScalar(1 + 0.07 * Math.sin(elapsed * 1.8));
      jewel.position.y = 1.64 + 0.065 * Math.sin(elapsed * 1.45);
      jewel.rotation.y += delta * 0.16;
    },
    dispose: () => kit.dispose(),
  };
}
