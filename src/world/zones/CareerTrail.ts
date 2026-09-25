import { BufferGeometry, CatmullRomCurve3, Float32BufferAttribute, Group, Vector3 } from "three";
import { portfolioData } from "../../data/portfolioData";
import type { InteractiveTarget } from "../types";
import { makePalette, type DynamicWorldZone, type ZoneOptions, ZoneKit } from "./zoneKit";

export interface CareerTrailOptions extends ZoneOptions {
  onExperienceSelect?: (id: string) => void;
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
export function createCareerTrail(options: CareerTrailOptions = {}): DynamicWorldZone {
  const kit = new ZoneKit("Career Trail landscape", 10, 13);
  kit.group.scale.x = -1;
  const p = makePalette(kit);
  const trailStone = kit.material("walkable pale-stone career ribbon", 0xb9c7cb, 0xf2ead9,
    { roughness: 0.88, doubleSided: true });
  const interactives: InteractiveTarget[] = [];
  let reducedMotion = options.reducedMotion ?? false;
  let elapsed = 0;
  kit.lamp("career trail guidance pool", 0xffd6a5, 2.1, 0.1, 8, [0, 3, 0]);

  kit.cylinder("career terrace retaining step", 3.7, 3.95, 0.18,
    p.stone, [0, 0.075, 0], 28);
  const curve = new CatmullRomCurve3([
    new Vector3(2.35, 0.22, -2.75),
    new Vector3(1.45, 0.22, -1.82),
    new Vector3(-0.35, 0.22, -1.37),
    new Vector3(-1.34, 0.22, -0.44),
    new Vector3(-1.15, 0.22, 0.72),
    new Vector3(0.08, 0.22, 1.39),
    new Vector3(-0.58, 0.22, 2.3),
    new Vector3(-2.25, 0.22, 2.72),
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
    const t = 0.12 + index * 0.108;
    const point = curve.getPoint(t);
    const tangent = curve.getTangent(t);
    const side = index % 2 === 0 ? 1 : -1;
    const nx = -tangent.z * side;
    const nz = tangent.x * side;
    const x = point.x + nx * 0.9;
    const z = point.z + nz * 0.9;
    const plinth = new Group();
    plinth.name = `${role.company} career milestone`;
    plinth.position.set(x, 0, z);
    plinth.rotation.y = Math.atan2(-nx, -nz);
    plinth.userData.experienceId = role.id;
    kit.group.add(plinth);
    kit.cylinder(`${role.id} footing`, 0.37, 0.45, 0.15, p.stone,
      [0, 0.3, 0], 10, plinth);
    kit.cylinder(`${role.id} carved tapered marker`, 0.22, 0.33, 0.88,
      p.dark, [0, 0.81, 0], 8, plinth);
    kit.cylinder(`${role.id} marker brass cap`, 0.28, 0.28, 0.07,
      p.brass, [0, 1.3, 0], 10, plinth);
    kit.sphere(`${role.id} time beacon`, 0.115, p.goldLight,
      [0, 1.45, 0], plinth, 10);
    kit.bevel(`${role.id} authentic mark mount`, [0.47, 0.41, 0.07],
      p.pale, [0, 0.93, 0.21], plinth, 0.025);
    if (role.logo) kit.image(`${role.company} identity mark`, role.logo,
      0.39, 0.28, [0, 0.94, 0.258], plinth);
    else kit.text(`${role.company} exact-name marker`, [role.company.toUpperCase()],
      0.42, 0.26, [0, 0.94, 0.26], plinth,
      { background: "#e9e4d9", foreground: "#193b49", fontSize: 80 });
    const number = String(index + 1).padStart(2, "0");
    kit.text(`${role.company} chronology number`, [number], 0.29, 0.21,
      [0, 0.56, 0.275], plinth, { fontSize: 115 });
    interactives.push({ id: `experience:${role.id}`, object: plinth,
      label: `${role.company}: ${role.role}`,
      activate: () => options.onExperienceSelect?.(role.id) });
  });

  // Groundcover clusters and small guide lights make this a landscaped route.
  for (let index = 0; index < 21; index += 1) {
    const angle = index * 2.399;
    const radius = 2.75 + (index % 3) * 0.21;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
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
    cameraComposition: { position: new Vector3(3.9, 5.2, 11.3),
      target: new Vector3(10, 1.0, 13), durationMs: 1000 },
    interactiveObjects: interactives,
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
