import { BufferGeometry, CatmullRomCurve3, Float32BufferAttribute, Group, Vector3 } from "three";
import { portfolioData } from "../../data/portfolioData";
import type { CameraComposition, InteractiveTarget } from "../types";
import { makePalette, type DynamicWorldZone, type ZoneOptions, ZoneKit } from "./zoneKit";

export interface CareerTrailOptions extends ZoneOptions {
  onExperienceSelect?: (id: string) => void;
}

export interface CareerTrailZone extends DynamicWorldZone {
  readonly milestonePositions: Map<string, Vector3>;
  readonly milestoneApproaches: Map<string, Vector3>;
  readonly milestoneViewingPoints: Map<string, Vector3>;
  readonly milestoneCameras: Map<string, CameraComposition>;
}

function roleLines(role: string): string[] {
  const words = role.replace(/\s*\|\s*/g, " ").split(/\s+/);
  const lines: string[] = [];
  for (const word of words) {
    const current = lines.length - 1;
    if (current < 0 || (lines[current].length + word.length + 1 > 21 && lines.length < 3))
      lines.push(word);
    else lines[current] += ` ${word}`;
  }
  return lines;
}

function pathSurface(curve: CatmullRomCurve3, width: number): BufferGeometry {
  const vertices: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  for (let step = 0; step <= 60; step += 1) {
    const t = step / 60;
    const point = curve.getPoint(t);
    const direction = curve.getTangent(t);
    const nx = -direction.z;
    const nz = direction.x;
    for (const side of [-1, 1]) {
      vertices.push(point.x + nx * width * side / 2, point.y, point.z + nz * width * side / 2);
      normals.push(0, 1, 0);
    }
    if (step < 60) {
      const i = step * 2;
      indices.push(i, i + 2, i + 1, i + 1, i + 2, i + 3);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  return geometry;
}

/** An S-shaped planted causeway whose eight fixtures follow the approved role records. */
export function createCareerTrail(options: CareerTrailOptions = {}): CareerTrailZone {
  const kit = new ZoneKit("Career Trail landscape", 10, 13);
  kit.group.position.y = -0.2;
  const p = makePalette(kit);
  const trailStone = kit.material("walkable pale-stone career ribbon", 0xb9c7cb, 0xf2ead9,
    { roughness: 0.88, doubleSided: true });
  const interactives: InteractiveTarget[] = [];
  const milestonePositions = new Map<string, Vector3>();
  const milestoneApproaches = new Map<string, Vector3>();
  const milestoneViewingPoints = new Map<string, Vector3>();
  const milestoneCameras = new Map<string, CameraComposition>();
  let reducedMotion = options.reducedMotion ?? false;
  let elapsed = 0;
  kit.lamp("career trail guidance pool", 0xffd6a5, 2.1, 0.1, 8, [0, 3, 0]);

  for (const [name, x, z, radius] of [
    ["career starting terrace", 0, 0, 3.72],
    ["career middle terrace", 1.7, 4.4, 2.92],
    ["career final terrace", 4.2, 8.3, 2.7],
  ] as const) kit.cylinder(name, radius, radius + 0.15, 0.18,
    p.stone, [x, 0.128, z], 28);
  const curve = new CatmullRomCurve3([
    new Vector3(-2.35, 0.22, -2.75),
    new Vector3(-1.25, 0.22, -1.33),
    new Vector3(0.7, 0.22, -0.3),
    new Vector3(1.7, 0.22, 1.52),
    new Vector3(1.05, 0.22, 3.35),
    new Vector3(2.22, 0.22, 5.18),
    new Vector3(4.15, 0.22, 6.91),
    new Vector3(4.15, 0.22, 8.62),
  ], false, "centripetal");
  kit.add("career winding pale-stone path", kit.own(pathSurface(curve, 1.28)),
    trailStone);
  const left: [number, number, number][] = [];
  const right: [number, number, number][] = [];
  for (let step = 0; step <= 30; step += 1) {
    const t = step / 30;
    const point = curve.getPoint(t);
    const direction = curve.getTangent(t);
    const nx = -direction.z;
    const nz = direction.x;
    left.push([point.x + nx * 0.61, 0.245, point.z + nz * 0.61]);
    right.push([point.x - nx * 0.61, 0.245, point.z - nz * 0.61]);
  }
  kit.curve("career trail left brass border", left, 0.018, p.brass);
  kit.curve("career trail right brass border", right, 0.018, p.brass);
  kit.curve("career trail light trace", left.map(([x, y, z]) => [x, y + 0.012, z]),
    0.012, p.tealLight);

  const roles = [...portfolioData.experience].reverse();
  roles.forEach((role, index) => {
    const t = 0.06 + index * 0.125;
    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    const side = index % 2 === 0 ? 1 : -1;
    const nx = -tangent.z * side;
    const nz = tangent.x * side;
    const x = point.x + nx * 1.28;
    const z = point.z + nz * 1.28;
    const plinth = new Group();
    plinth.name = `${role.company} career milestone`;
    plinth.position.set(x, 0, z);
    plinth.rotation.y = Math.atan2(-nx, -nz);
    plinth.userData.experienceId = role.id;
    kit.group.add(plinth);
    kit.cylinder(`${role.id} footing`, 0.55, 0.63, 0.18, p.stone,
      [0, 0.3, 0], 12, plinth);
    kit.bevel(`${role.id} framed information spine`, [1.26, 1.7, 0.21],
      p.dark, [0, 1.28, 0], plinth, 0.06);
    kit.cylinder(`${role.id} marker brass cap`, 0.43, 0.43, 0.07,
      p.brass, [0, 2.18, 0], 12, plinth);
    kit.sphere(`${role.id} time beacon`, 0.13, p.goldLight,
      [0.46, 2.33, 0], plinth, 10);
    const number = String(index + 1).padStart(2, "0");
    for (const sideName of ["arrival", "return"] as const) {
      const face = new Group();
      face.name = `${role.company} ${sideName} information face`;
      face.position.z = sideName === "arrival" ? 0.118 : -0.118;
      face.rotation.y = sideName === "arrival" ? 0 : Math.PI;
      plinth.add(face);
      kit.text(`${role.company} ${sideName} chronology number`, [number], 0.76, 0.32,
        [0, 2.01, 0.015], face,
        { background: "#153d4d", foreground: "#ffe3a6", accent: "#c8a665", fontSize: 171 });
      kit.text(`${role.company} ${sideName} company name`, [role.company.toUpperCase()],
        1.12, 0.34, [0, 1.61, 0.015], face,
        { background: "#17394b", foreground: "#f5f3e9", accent: "#c8a665", fontSize: 86 });
      kit.bevel(`${role.company} ${sideName} authentic mark mount`, [0.94, 0.38, 0.06],
        p.pale, [0, 1.2, 0.02], face, 0.025);
      if (role.logo) kit.image(`${role.company} ${sideName} identity mark`, role.logo,
        0.8, 0.29, [0, 1.2, 0.057], face);
      else kit.text(`${role.company} ${sideName} exact-name mark`, [role.company.toUpperCase()],
        0.86, 0.3, [0, 1.2, 0.057], face,
        { background: "#e9e4d9", foreground: "#193b49", fontSize: 85 });
      kit.text(`${role.company} ${sideName} role`, roleLines(role.role), 1.13, 0.39,
        [0, 0.83, 0.018], face,
        { background: "#153d4d", foreground: "#eaf2ed", accent: "#5cb3c4", fontSize: 64 });
      const forwardRight = sideName === "arrival" ? side < 0 : side > 0;
      const arrow = forwardRight ? ">" : "<";
      const next = index < 7 ? `NEXT ${String(index + 2).padStart(2, "0")} ${arrow}`
        : `${arrow} CONTACT VIA PLAZA`;
      kit.text(`${role.company} ${sideName} next-direction cue`, [next], 1.12, 0.18,
        [0, 0.53, 0.018], face,
        { background: "#123a4d", foreground: "#ffe6ad", accent: "#5cb3c4", fontSize: 95 });
    }
    const topNumber = kit.text(`${role.company} overhead stop number`, [number],
      0.54, 0.54, [0, 2.22, 0], plinth,
      { background: "#123b4b", foreground: "#ffe7b2", accent: "#c8a665", fontSize: 270 });
    topNumber.rotation.x = -Math.PI / 2;
    const medallionX = point.x + nx * 0.68;
    const medallionZ = point.z + nz * 0.68;
    kit.cylinder(`${role.company} ground chronology medallion`, 0.47, 0.47, 0.017,
      p.brass, [medallionX, 0.224, medallionZ], 16);
    const groundNumber = kit.text(`${role.company} overhead ground number`, [number],
      0.62, 0.62, [medallionX, 0.235, medallionZ], kit.group,
      { background: "#123b4b", foreground: "#ffe7b2", accent: "#c8a665", fontSize: 270 });
    groundNumber.rotation.x = -Math.PI / 2;
    interactives.push({ id: `experience:${role.id}`, object: plinth,
      label: `${role.company}: ${role.role}`,
      activate: () => options.onExperienceSelect?.(role.id) });
    milestonePositions.set(role.id, new Vector3(10 + x, 0, 13 + z));
    milestoneApproaches.set(role.id, new Vector3(10 + point.x, 0, 13 + point.z));
    const viewingDirection = index === 7 ? -1 : 1;
    milestoneViewingPoints.set(role.id,
      new Vector3(10 + point.x + tangent.x * viewingDirection * 0.95, 0,
        13 + point.z + tangent.z * viewingDirection * 0.95));
    milestoneCameras.set(role.id, {
      position: new Vector3(10 + x - nx * 3.2 - tangent.x * 1.05,
        2.8, 13 + z - nz * 3.2 - tangent.z * 1.05),
      target: new Vector3(10 + x, 1.25, 13 + z), durationMs: 700, fov: 48,
    });
  });

  for (let index = 0; index < 7; index += 1) {
    const point = curve.getPointAt(0.1225 + index * 0.125);
    const tangent = curve.getTangentAt(0.1225 + index * 0.125).normalize();
    const side = new Vector3(-tangent.z, 0, tangent.x);
    const tail = point.clone().addScaledVector(tangent, -0.29);
    const tip = point.clone().addScaledVector(tangent, 0.27);
    kit.beam(`career directed path stem ${index + 1}`,
      [tail.x, 0.24, tail.z], [tip.x, 0.24, tip.z], 0.025, p.tealLight);
    for (const direction of [-1, 1]) {
      const wing = tip.clone().addScaledVector(tangent, -0.2)
        .addScaledVector(side, direction * 0.18);
      kit.beam(`career next-stop arrow wing ${index + 1}-${direction}`,
        [wing.x, 0.24, wing.z], [tip.x, 0.24, tip.z], 0.025, p.goldLight);
    }
  }

  // Groundcover clusters and small guide lights make this a landscaped route.
  for (let index = 0; index < 21; index += 1) {
    const angle = index * 2.399;
    const radius = 2.75 + (index % 3) * 0.21;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    if (Array.from({ length: 31 }, (_, sample) => curve.getPointAt(sample / 30))
      .some((point) => Math.hypot(x - point.x, z - point.z) < 1.25)) continue;
    kit.cylinder(`career planted bed ${index + 1}`, 0.31, 0.38, 0.12,
      p.stone, [x, 0.22, z], 8);
    kit.cone(`career shrub ${index + 1}`, 0.23, 0.51,
      p.planting, [x, 0.52, z], 7);
    if (index % 3 === 0)
      kit.sphere(`career path glimmer ${index + 1}`, 0.055, p.goldLight,
        [x + 0.2, 0.27, z]);
  }

  kit.optimizeDrawCalls();
  return {
    id: "career-trail", group: kit.group,
    entryPoint: new Vector3(7.67, 0, 10.28),
    cameraComposition: { position: new Vector3(12, 18, 23),
      target: new Vector3(11.5, 0, 16), durationMs: 1050, fov: 50 },
    interactiveObjects: interactives,
    milestonePositions,
    milestoneApproaches,
    milestoneViewingPoints,
    milestoneCameras,
    setReducedMotion(value) { reducedMotion = value; },
    update(delta) {
      if (reducedMotion) return;
      elapsed += delta;
      // Chronology beacons breathe as one quiet progress line, without moving the fixtures.
      interactives.forEach((target, index) => {
        const lamp = target.object.getObjectByName(`${roles[index].id} time beacon`);
        if (lamp) lamp.scale.setScalar(0.95 + 0.08 * Math.sin(elapsed * 0.8 - index * 0.45));
      });
    },
    dispose: () => kit.dispose(),
  };
}
