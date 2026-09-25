import { Group, OctahedronGeometry, SphereGeometry, Vector3 } from "three";
import type { InteractiveTarget } from "../types";
import { makePalette, type DynamicWorldZone, type Point, type ZoneOptions, ZoneKit } from "./zoneKit";

export interface RegulatoryObservatoryOptions extends ZoneOptions {
  onDomainSelect?: (id: string) => void;
}

const domains = [
  { id: "rims", label: "RIMS" },
  { id: "document-quality", label: "Document quality" },
  { id: "submissions", label: "Submissions" },
  { id: "pharmacovigilance", label: "Pharmacovigilance" },
  { id: "data-integrity", label: "Data integrity" },
  { id: "responsible-ai", label: "Responsible AI" },
];

/** Open ivory drum, restrained glass dome, and a six-domain orbital instrument. */
export function createRegulatoryObservatory(
  options: RegulatoryObservatoryOptions = {},
): DynamicWorldZone {
  const kit = new ZoneKit("Regulatory Observatory architecture", 13, -1);
  const p = makePalette(kit);
  const nucleusMaterial = kit.material("observatory mineral sapphire", 0x1c7e98, 0x3192a9,
    { roughness: 0.2, metalness: 0.26, emissive: 0x087f9e,
      nightEmission: 0.44, dayEmission: 0.11 });
  const interactives: InteractiveTarget[] = [];
  let reducedMotion = options.reducedMotion ?? false;
  let elapsed = 0;
  kit.lamp("observatory instrument practical", 0xffd6a5, 2.1, 0.12, 8, [0, 3.6, 0]);

  kit.cylinder("observatory terraced stone foundation", 3.57, 3.83, 0.29,
    p.stone, [0, 0.12, 0], 28);
  kit.cylinder("observatory pale floor", 3.27, 3.35, 0.075,
    p.pale, [0, 0.3, 0], 28);
  kit.torus("observatory threshold compass", 2.65, 0.025, p.brass,
    [0, 0.35, 0]).rotation.x = -Math.PI / 2;
  for (const radius of [1.05, 1.68])
    kit.torus(`observatory floor brass orbit ${radius}`, radius, 0.018,
      p.brass, [0, 0.355, 0]).rotation.x = -Math.PI / 2;
  kit.bevel("observatory west entry step", [1.42, 0.11, 2.1], p.pale,
    [-3.47, 0.08, 0], kit.group, 0.035);

  // Tall open bays keep the inner network visible. The dome supplies the map silhouette.
  const columnCount = 12;
  for (let index = 0; index < columnCount; index += 1) {
    const angle = index * Math.PI * 2 / columnCount;
    const x = Math.cos(angle) * 3.18;
    const z = Math.sin(angle) * 3.18;
    kit.cylinder(`observatory colonnade pier ${index + 1}`, 0.15, 0.2,
      2.06, p.pale, [x, 1.42, z], 10);
    kit.cylinder(`observatory pier capital ${index + 1}`, 0.23, 0.23,
      0.13, p.brass, [x, 2.52, z], 10);
    const next = angle + Math.PI * 2 / columnCount;
    const arc: Point[] = [
      [x, 2.55, z],
      [Math.cos(angle + 0.13) * 3.18, 2.97, Math.sin(angle + 0.13) * 3.18],
      [Math.cos(angle + 0.26) * 3.18, 3.08, Math.sin(angle + 0.26) * 3.18],
      [Math.cos(next - 0.13) * 3.18, 2.97, Math.sin(next - 0.13) * 3.18],
      [Math.cos(next) * 3.18, 2.55, Math.sin(next) * 3.18],
    ];
    kit.curve(`observatory stone arch ${index + 1}`, arc, 0.09, p.pale);
  }
  kit.torus("observatory dome stone cornice", 3.25, 0.19, p.pale,
    [0, 2.88, 0]).rotation.x = -Math.PI / 2;
  kit.torus("observatory dome brass foot", 3.04, 0.055, p.brass,
    [0, 3.09, 0]).rotation.x = -Math.PI / 2;
  const dome = kit.add("observatory translucent hemisphere",
    kit.own(new SphereGeometry(3.02, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2)),
    p.glass, [0, 3.1, 0]);
  dome.castShadow = false;
  for (let meridian = 0; meridian < 12; meridian += 1) {
    const a = meridian * Math.PI / 6;
    const points: Point[] = [];
    for (let t = 0; t <= 6; t += 1) {
      const theta = t * Math.PI / 12;
      points.push([Math.cos(a) * Math.cos(theta) * 3.04,
        3.1 + Math.sin(theta) * 3.04,
        Math.sin(a) * Math.cos(theta) * 3.04]);
    }
    kit.curve(`observatory brass meridian ${meridian + 1}`, points, 0.037, p.brass);
  }
  for (const [height, radius] of [[3.88, 2.93], [4.64, 2.58], [5.28, 2.01]])
    kit.torus(`observatory dome latitude ${height}`, radius, 0.028,
      p.brass, [0, height, 0]).rotation.x = -Math.PI / 2;
  kit.cylinder("observatory apex finial", 0.17, 0.28, 0.26,
    p.brass, [0, 6.22, 0], 12);
  kit.sphere("observatory apex lamp", 0.22, p.goldLight, [0, 6.48, 0]);

  // The inner instrument floats above a dark dais with three canted orbits.
  kit.cylinder("domain network plinth", 0.94, 1.12, 0.5, p.dark,
    [0, 0.59, 0], 20);
  kit.cylinder("domain network brass deck", 0.86, 0.86, 0.08, p.brass,
    [0, 0.89, 0], 20);
  const instrument = new Group();
  instrument.name = "living controlled information network";
  instrument.position.y = 3.2;
  kit.group.add(instrument);
  const nucleus = kit.add("observatory central faceted regulatory node",
    kit.own(new OctahedronGeometry(0.53)), nucleusMaterial, [0, 0, 0], instrument);
  kit.sphere("regulatory node inner kernel", 0.15, p.goldLight, [0, 0, 0], instrument);
  for (let orbit = 0; orbit < 3; orbit += 1) {
    const hoop = kit.torus(`information orbital arc ${orbit + 1}`, 1.9 + orbit * 0.26,
      0.032, orbit === 1 ? p.tealLight : p.brass, [0, 0, 0], instrument, 72);
    hoop.rotation.set(0.75 + orbit * 0.28, orbit * 0.8, 0.28 + orbit * 0.35);
  }
  domains.forEach((domain, index) => {
    const angle = index * Math.PI / 3 + 0.3;
    const radius = index % 2 ? 2.22 : 1.93;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(index * 2.1) * 0.6;
    const z = Math.sin(angle) * radius;
    const node = new Group();
    node.name = `${domain.label} orbital domain`;
    node.position.set(x, y, z);
    node.userData.domainId = domain.id;
    instrument.add(node);
    kit.sphere(`${domain.label} luminous domain`, 0.21, index % 2 ? p.goldLight : p.tealLight,
      [0, 0, 0], node);
    kit.torus(`${domain.label} orbital collar`, 0.27, 0.022, p.brass,
      [0, 0, 0], node, 24).rotation.y = index * 0.54;
    kit.beam(`${domain.label} radial link`, [0, 0, 0], [-x * 0.72, -y * 0.72, -z * 0.72],
      0.018, p.glass, node);
    interactives.push({ id: `domain:${domain.id}`, object: node,
      label: domain.label, activate: () => options.onDomainSelect?.(domain.id) });
  });
  kit.text("observatory main plaque", ["REGULATORY", "OBSERVATORY"],
    1.45, 0.52, [-3.28, 1.97, 0]).rotation.y = -Math.PI / 2;

  kit.optimizeDrawCalls();
  return {
    id: "observatory", group: kit.group,
    entryPoint: new Vector3(9.55, 0, -1),
    cameraComposition: { position: new Vector3(7.4, 5.7, 5.4),
      target: new Vector3(13, 2.7, -1), durationMs: 1000 },
    interactiveObjects: interactives,
    setReducedMotion(value) { reducedMotion = value; },
    update(delta) {
      if (reducedMotion) return;
      elapsed += delta;
      instrument.rotation.y += delta * 0.08;
      nucleus.rotation.y += delta * 0.23;
      nucleus.position.y = Math.sin(elapsed * 1.1) * 0.06;
    },
    dispose: () => kit.dispose(),
  };
}
