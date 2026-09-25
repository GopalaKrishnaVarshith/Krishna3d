import { Group, OctahedronGeometry, Vector3 } from "three";
import { portfolioData } from "../../data/portfolioData";
import type { InteractiveTarget } from "../types";
import { makePalette, type DynamicWorldZone, type Point, type ZoneOptions, ZoneKit } from "./zoneKit";

export interface EvidenceVaultOptions extends ZoneOptions {
  onProjectSelect?: (id: string) => void;
}

export interface EvidenceVaultZone extends DynamicWorldZone {
  readonly capsulePositions: Map<string, Vector3>;
  readonly cameraPoints: Map<string, Vector3>;
  readonly metricMount: Group;
  readonly inspectionPoint: Vector3;
}

function symbol(kit: ZoneKit, parent: Group, index: number, p: ReturnType<typeof makePalette>): void {
  const light = index % 3 === 0 ? p.goldLight : p.tealLight;
  const line = (name: string, a: Point, b: Point, radius = 0.023) =>
    kit.beam(name, a, b, radius, light, parent);
  const ring = (name: string, radius: number, at: Point) =>
    kit.torus(name, radius, 0.023, light, at, parent, 24);
  switch (index) {
    case 0: // quality shield
      line("shield crown", [-0.2, 0.18, 0], [0, 0.27, 0]);
      line("shield crown right", [0, 0.27, 0], [0.2, 0.18, 0]);
      line("shield edge left", [-0.2, 0.18, 0], [-0.16, -0.12, 0]);
      line("shield base left", [-0.16, -0.12, 0], [0, -0.27, 0]);
      line("shield base right", [0, -0.27, 0], [0.16, -0.12, 0]);
      line("shield edge right", [0.16, -0.12, 0], [0.2, 0.18, 0]);
      break;
    case 1: // structured data
      for (const [x, y] of [[-0.12, 0.08], [0.12, 0.08], [0, -0.15]])
        kit.bevel("data cube", [0.15, 0.15, 0.15], light, [x, y, 0], parent, 0.015);
      break;
    case 2: // process gear
      ring("quality gear hub", 0.17, [0, 0, 0]);
      for (let i = 0; i < 8; i += 1) {
        const a = i * Math.PI / 4;
        line(`gear tooth ${i}`, [Math.cos(a) * 0.18, Math.sin(a) * 0.18, 0],
          [Math.cos(a) * 0.29, Math.sin(a) * 0.29, 0], 0.03);
      }
      break;
    case 3: // training cap
      kit.cone("learning crown", 0.25, 0.18, light, [0, 0.04, 0], 4, parent).rotation.y = Math.PI / 4;
      line("learning brim", [-0.28, -0.04, 0], [0.28, -0.04, 0], 0.035);
      line("learning tassel", [0.21, -0.01, 0], [0.21, -0.25, 0]);
      break;
    case 4: // safety pulse
      ring("safety circle", 0.24, [0, 0, 0]);
      [[-0.24, 0], [-0.12, 0], [-0.04, 0.14], [0.05, -0.16],
        [0.13, 0.02], [0.24, 0.02]].forEach((point, i, list) => {
        if (i < list.length - 1)
          line(`safety ECG ${i}`, [point[0], point[1], 0.05],
            [list[i + 1][0], list[i + 1][1], 0.05], 0.018);
      });
      break;
    case 5: // controlled document
      kit.bevel("document plane", [0.28, 0.38, 0.035], p.pale, [0, 0, 0], parent, 0.015);
      for (const y of [0.09, 0, -0.09]) line("document rule", [-0.09, y, 0.027], [0.09, y, 0.027], 0.012);
      break;
    case 6: // people
      for (const x of [-0.17, 0.17]) {
        kit.sphere("people head", 0.085, light, [x, 0.14, 0], parent, 8);
        line("people body", [x, 0.03, 0], [x, -0.21, 0], 0.045);
      }
      break;
    case 7: // governed scales
      line("scales mast", [0, -0.25, 0], [0, 0.23, 0], 0.035);
      line("scales crossbar", [-0.25, 0.13, 0], [0.25, 0.13, 0], 0.025);
      for (const x of [-0.2, 0.2]) {
        line("scales chain", [x, 0.13, 0], [x, -0.1, 0], 0.014);
        kit.bevel("scales pan", [0.19, 0.025, 0.12], light, [x, -0.11, 0], parent, 0.01);
      }
      break;
    case 8: // orbit
      ring("orbit primary", 0.23, [0, 0, 0]);
      kit.torus("orbit tilted", 0.24, 0.02, light, [0, 0, 0], parent, 24).rotation.y = 0.9;
      kit.sphere("orbit center", 0.075, light, [0, 0, 0], parent, 8);
      break;
    case 9: // network
      for (const [x, y] of [[0, 0.2], [-0.23, -0.12], [0.23, -0.12], [0, -0.02]])
        kit.sphere("network point", 0.06, light, [x, y, 0], parent, 8);
      line("network left", [0, 0.2, 0], [-0.23, -0.12, 0]);
      line("network right", [0, 0.2, 0], [0.23, -0.12, 0]);
      line("network base", [-0.23, -0.12, 0], [0.23, -0.12, 0]);
      break;
    default: // routing arrows
      line("routing stem", [0, -0.26, 0], [0, 0.1, 0], 0.038);
      line("routing branch left", [0, 0.08, 0], [-0.23, 0.2, 0]);
      line("routing branch right", [0, 0.08, 0], [0.23, 0.2, 0]);
      line("routing tip left", [-0.23, 0.2, 0], [-0.12, 0.21, 0]);
      line("routing tip right", [0.23, 0.2, 0], [0.12, 0.21, 0]);
  }
}

/** A walkable radial archive with exactly eleven data-bound project capsules. */
export function createEvidenceVault(options: EvidenceVaultOptions = {}): EvidenceVaultZone {
  const kit = new ZoneKit("Evidence Vault architecture", 0, -14);
  kit.group.position.y = -0.3;
  const p = makePalette(kit);
  const crystalMaterial = kit.material("evidence sapphire", 0x19758f, 0x318ca4,
    { roughness: 0.22, metalness: 0.26, emissive: 0x087993,
      nightEmission: 0.48, dayEmission: 0.12 });
  const interactives: InteractiveTarget[] = [];
  const capsulePositions = new Map<string, Vector3>();
  const cameraPoints = new Map<string, Vector3>();
  let reducedMotion = options.reducedMotion ?? false;
  let elapsed = 0;
  kit.lamp("vault inspection warm key", 0xffd5a4, 4.4, 0.18, 8, [0, 3.9, 0]);
  kit.lamp("vault threshold warm practical", 0xffc388, 2.1, 0.1, 6, [0, 2.25, 3.5]);

  // Sector break at the south bridge keeps the archive floor accessible.
  kit.cylinder("vault stepped pale floor", 4.05, 4.28, 0.24, p.stone,
    [0, 0.182, 0], 36);
  kit.cylinder("vault dark radial inset", 3.84, 3.92, 0.04, p.dark,
    [0, 0.286, 0], 36);
  kit.cylinder("vault ivory marble center", 2.68, 2.75, 0.027, p.pale,
    [0, 0.2985, 0], 36);
  for (const radius of [1.25, 2.43, 3.7]) {
    kit.torus(`vault brass floor orbit ${radius}`, radius, 0.025,
      p.brass, [0, 0.32, 0]).rotation.x = -Math.PI / 2;
  }
  for (let ray = 0; ray < 22; ray += 1) {
    const angle = ray * Math.PI / 11;
    kit.beam(`vault floor radial seam ${ray + 1}`,
      [Math.cos(angle) * 1.25, 0.321, Math.sin(angle) * 1.25],
      [Math.cos(angle) * 3.68, 0.321, Math.sin(angle) * 3.68],
      0.009, p.brass);
  }

  // Open arched wall and vaulted rib canopy remain transparent in the map view.
  const entranceArc = (angle: number) => Math.abs(Math.atan2(
    Math.sin(angle - Math.PI / 2), Math.cos(angle - Math.PI / 2))) < 0.65;
  for (let pier = 0; pier < 14; pier += 1) {
    const angle = pier * Math.PI * 2 / 14 + Math.PI / 14;
    if (entranceArc(angle)) continue;
    const x = Math.cos(angle) * 4.12;
    const z = Math.sin(angle) * 4.12;
    kit.cylinder(`vault arched pier ${pier + 1}`, 0.15, 0.21, 2.95,
      p.pale, [x, 1.7, z], 10);
    kit.cylinder(`vault pier brass capital ${pier + 1}`, 0.24, 0.24, 0.13,
      p.brass, [x, 3.22, z], 10);
    const next = angle + Math.PI * 2 / 14;
    const arch: Point[] = [
      [x, 3.16, z],
      [Math.cos(angle + 0.11) * 4.12, 3.63, Math.sin(angle + 0.11) * 4.12],
      [Math.cos(angle + 0.224) * 4.12, 3.78, Math.sin(angle + 0.224) * 4.12],
      [Math.cos(next - 0.11) * 4.12, 3.63, Math.sin(next - 0.11) * 4.12],
      [Math.cos(next) * 4.12, 3.16, Math.sin(next) * 4.12],
    ];
    if (!entranceArc(next)) kit.curve(`vault brass arch ${pier + 1}`, arch, 0.055, p.brass);
    if (pier % 2 === 0) {
      kit.curve(`vault dome rib ${pier + 1}`, [
        [x, 3.35, z], [x * 0.75, 4.25, z * 0.75],
        [x * 0.4, 4.75, z * 0.4], [0, 4.95, 0],
      ], 0.05, p.brass);
    }
  }
  for (let segment = 0; segment < 12; segment += 1) {
    const a = segment * Math.PI / 6;
    const mid = a + Math.PI / 12;
    if (Math.sin(mid) > 0.75) continue;
    const points: Point[] = [];
    for (let step = 0; step <= 4; step += 1) {
      const theta = a + step * Math.PI / 24;
      points.push([Math.cos(theta) * 4.13, 3.26, Math.sin(theta) * 4.13]);
    }
    kit.curve(`vault open cornice arc ${segment + 1}`, points, 0.09, p.stone);
  }
  kit.torus("vault dome crown oculus", 0.66, 0.075, p.brass,
    [0, 4.88, 0]).rotation.x = -Math.PI / 2;
  kit.bevel("vault bridge entry sill", [1.8, 0.1, 0.55], p.pale,
    [0, 0.256, 4.05], kit.group, 0.035);

  portfolioData.projects.forEach((project, index) => {
    // 120° through 420° leaves a 60° open wedge centered on the south bridge.
    const angle = (120 + index * 30) * Math.PI / 180;
    const x = Math.cos(angle) * 3.17;
    const z = Math.sin(angle) * 3.17;
    const capsule = new Group();
    capsule.name = `${project.number} ${project.title} project capsule`;
    capsule.position.set(x, 0, z);
    capsule.rotation.y = Math.atan2(-x, -z);
    capsule.userData.projectId = project.id;
    kit.group.add(capsule);
    kit.cylinder(`${project.id} stone podium`, 0.47, 0.51, 0.36,
      p.stone, [0, 0.45, 0], 14, capsule);
    kit.cylinder(`${project.id} base collar`, 0.5, 0.5, 0.075,
      p.brass, [0, 0.67, 0], 14, capsule);
    kit.cylinder(`${project.id} glass housing`, 0.34, 0.34, 0.82,
      p.glass, [0, 1.12, 0], 16, capsule);
    kit.torus(`${project.id} capsule glowing foot`, 0.35, 0.025,
      p.tealLight, [0, 0.72, 0], capsule).rotation.x = -Math.PI / 2;
    kit.cylinder(`${project.id} capsule cap`, 0.41, 0.36, 0.105,
      p.brass, [0, 1.59, 0], 14, capsule);
    for (let strut = 0; strut < 4; strut += 1) {
      const angle = strut * Math.PI / 2 + Math.PI / 4;
      const x = Math.cos(angle) * 0.34;
      const z = Math.sin(angle) * 0.34;
      kit.beam(`${project.id} capsule brass glazing strut ${strut + 1}`,
        [x, 0.74, z], [x, 1.58, z], 0.012, p.brass, capsule);
    }
    kit.sphere(`${project.id} capsule lamp`, 0.065, p.goldLight,
      [0, 1.68, 0], capsule, 8);
    kit.text(`${project.number} capsule number`, [project.number], 0.28, 0.28,
      [0, 0.43, 0.515], capsule, { fontSize: 175 });
    const glyph = new Group();
    glyph.name = `${project.title} icon`;
    glyph.position.set(0, 1.16, 0.05);
    capsule.add(glyph);
    symbol(kit, glyph, index, p);
    interactives.push({ id: `project:${project.id}`, object: capsule,
      label: project.title, activate: () => options.onProjectSelect?.(project.id) });
    capsulePositions.set(project.id, new Vector3(x, 0, z - 14));
    cameraPoints.set(project.id, new Vector3(x * 0.53, 2.02, z * 0.53 - 14));
  });

  // The central inspection station is intentionally low so capsule icons remain in view.
  kit.cylinder("vault central stepped inspection base", 0.97, 1.13, 0.34,
    p.dark, [0, 0.49, 0], 24);
  kit.cylinder("vault central brass rim", 1.02, 1.02, 0.075,
    p.brass, [0, 0.7, 0], 24);
  kit.cylinder("vault central translucent lens", 0.78, 0.78, 0.05,
    p.glass, [0, 0.76, 0], 24);
  for (const radius of [0.48, 0.75])
    kit.torus(`vault central hologram orbit ${radius}`, radius, 0.018,
      p.tealLight, [0, 0.81, 0]).rotation.x = -Math.PI / 2;
  const metricMount = new Group();
  metricMount.name = "vault central metric display mount";
  metricMount.position.set(0, 0.9, 0);
  kit.group.add(metricMount);
  for (let index = 0; index < 5; index += 1) {
    const height = [0.33, 0.53, 0.76, 0.6, 0.95][index];
    kit.bevel(`metric display bar ${index + 1}`, [0.09, height, 0.09],
      index % 2 === 0 ? crystalMaterial : p.goldLight,
      [-0.38 + index * 0.19, height / 2, 0], metricMount, 0.015);
  }
  const crystal = kit.add("vault inspectable evidence prism",
    kit.own(new OctahedronGeometry(0.33)), crystalMaterial, [0, 1.29, 0], metricMount);
  crystal.rotation.z = 0.2;
  kit.text("vault archive title", ["EVIDENCE", "VAULT"], 1.18, 0.42,
    [-3.32, 2.12, 2.34]).rotation.y = -0.88;

  kit.optimizeDrawCalls();
  return {
    id: "evidence-vault", group: kit.group,
    entryPoint: new Vector3(0, 0, -10.58),
    cameraComposition: { position: new Vector3(0, 4.25, -6.5),
      target: new Vector3(0, 1.38, -14), durationMs: 1050 },
    interactiveObjects: interactives,
    capsulePositions, cameraPoints, metricMount,
    inspectionPoint: new Vector3(0, 0, -12.7),
    setReducedMotion(value) { reducedMotion = value; },
    update(delta) {
      if (reducedMotion) return;
      elapsed += delta;
      crystal.rotation.y += delta * 0.18;
      crystal.position.y = 1.29 + Math.sin(elapsed * 1.4) * 0.055;
    },
    dispose: () => kit.dispose(),
  };
}
