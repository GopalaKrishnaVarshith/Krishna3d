import { BufferGeometry, Float32BufferAttribute, IcosahedronGeometry,
  InstancedMesh, Matrix4, PlaneGeometry, SphereGeometry, TorusGeometry, Vector3 } from "three";
import { type Point, ZoneKit } from "./zoneKit";

function mountainRidge(depth: number, phase: number): BufferGeometry {
  const vertices: number[] = [];
  const indices: number[] = [];
  for (let index = 0; index <= 58; index += 1) {
    const x = -104 + index * 3.6;
    const high = 7 + 8 * Math.abs(Math.sin(index * 0.41 + phase))
      + 4 * Math.abs(Math.cos(index * 0.19 + phase * 2.1))
      + 3 * Math.abs(Math.sin(index * 1.11 + phase));
    vertices.push(x, -3.25, depth, x, high, depth);
    if (index < 58) {
      const base = index * 2;
      indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** Shared campus atmosphere owned by the Arrival zone so day and night use identical geometry. */
export function buildAtmosphere(kit: ZoneKit): void {
  const sea = kit.material("continuous coastal sea", 0x0b2c45, 0x287da8,
    { roughness: 0.45, metalness: 0.16, doubleSided: true });
  const seaMesh = kit.add("continuous water beyond the island plane",
    kit.own(new PlaneGeometry(260, 260)), sea, [0, -3.235, 0]);
  seaMesh.rotation.x = -Math.PI / 2;
  seaMesh.receiveShadow = false;
  const far = kit.material("far coastal mountains", 0x213a53, 0x829dae,
    { roughness: 1, doubleSided: true });
  const near = kit.material("near coastal mountains", 0x294960, 0x668aa0,
    { roughness: 1, doubleSided: true });
  kit.add("distant irregular mountain ridge", kit.own(mountainRidge(-88, 2.1)), far);
  kit.add("middle irregular mountain ridge", kit.own(mountainRidge(-66, 0.3)), near);

  const moon = kit.material("moon disk", 0xe8e4cb, 0xbad5df,
    { emissive: 0xf1ead3, nightEmission: 0.95, dayEmission: 0,
      transparent: true, nightOpacity: 1, dayOpacity: 0 });
  const moonMesh = kit.sphere("night moon beyond the coast", 1.35, moon,
    [20, 15, -48], kit.group, 22);
  moonMesh.castShadow = false;
  const starMaterial = kit.material("restrained night stars", 0xf0f2df, 0xe8f4f7,
    { emissive: 0xffffff, nightEmission: 0.7, dayEmission: 0,
      transparent: true, nightOpacity: 0.88, dayOpacity: 0 });
  const starGeometry = kit.own(new SphereGeometry(0.1, 6, 4));
  const stars = new InstancedMesh(starGeometry, starMaterial, 73);
  stars.name = "batched sparse sky stars";
  let seed = 97;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (let index = 0; index < 73; index += 1) {
    const x = -85 + random() * 170;
    const y = 19 + random() * 28;
    const z = -62 - random() * 11;
    const size = 0.4 + random() * 1.4;
    const matrix = new Matrix4().makeScale(size, size, size).setPosition(x, y, z);
    stars.setMatrixAt(index, matrix);
  }
  stars.instanceMatrix.needsUpdate = true;
  stars.castShadow = false;
  kit.group.add(stars);

  const cloud = kit.material("horizon cloud banks", 0x32475e, 0xe2eff0,
    { roughness: 1, transparent: true, nightOpacity: 0.65, dayOpacity: 0.82 });
  for (let bank = 0; bank < 7; bank += 1) {
    const x = -65 + bank * 19;
    const y = 22 + (bank % 3) * 3.1;
    const z = -58 - (bank % 2) * 8;
    for (let lobe = 0; lobe < 3; lobe += 1) {
      const mesh = kit.sphere(`layered cloud bank ${bank + 1} lobe ${lobe + 1}`,
        1, cloud, [x + (lobe - 1) * 3.3, y + (lobe % 2) * 0.65, z], kit.group, 8);
      mesh.scale.set(3.3, 1.05 + lobe * 0.15, 1.25);
      mesh.castShadow = false;
    }
  }

  const foam = kit.material("shoreline turquoise foam", 0x5ab6c9, 0xa5d5dd,
    { emissive: 0x38b2cc, nightEmission: 0.45, dayEmission: 0.05,
      transparent: true, nightOpacity: 0.67, dayOpacity: 0.58 });
  const islands: Array<{ x: number; z: number; radius: number; plantRadius: number }> = [
    { x: 0, z: 0, radius: 3.0, plantRadius: 5.22 },
    { x: -13, z: 0, radius: 2.42, plantRadius: 4.05 },
    { x: 0, z: -14, radius: 2.45, plantRadius: 4.32 },
    { x: 13, z: -1, radius: 2.38, plantRadius: 4.01 },
    { x: 10, z: 13, radius: 2.3, plantRadius: 3.84 },
    { x: -10, z: 13, radius: 2.21, plantRadius: 3.65 },
  ];
  for (const island of islands) {
    const ring = kit.torus("island waterline foam", island.radius, 0.03,
      foam, [island.x, -3.17, island.z], kit.group, 44);
    ring.rotation.x = -Math.PI / 2;
  }
  const rock = kit.material("faceted coastal cliff strata", 0x45566a, 0x86939a,
    { roughness: 0.98 });
  const strataGeometry = kit.own(new IcosahedronGeometry(1, 0));
  const strata = new InstancedMesh(strataGeometry, rock, islands.length * 40);
  strata.name = "batched two-level stone cliff strata";
  let stoneIndex = 0;
  islands.forEach((island, islandIndex) => {
    for (let level = 0; level < 2; level += 1) {
      for (let index = 0; index < 20; index += 1) {
        const angle = index * Math.PI / 10 + level * 0.16 + islandIndex;
        const radius = island.plantRadius * (level === 0 ? 0.96 : 0.81);
        const x = island.x + Math.cos(angle) * radius;
        const z = island.z + Math.sin(angle) * radius;
        const scale = 0.53 + (index % 4) * 0.07;
        strata.setMatrixAt(stoneIndex++, new Matrix4().makeScale(scale, 0.52 + level * 0.1,
          scale * 0.85).setPosition(x, level === 0 ? -0.48 : -1.25, z));
      }
    }
  });
  strata.instanceMatrix.needsUpdate = true;
  kit.group.add(strata);

  const glint = kit.material("sea glint", 0x4dacc3, 0xbde3ea,
    { emissive: 0x3db8d4, nightEmission: 0.33, dayEmission: 0.06,
      transparent: true, nightOpacity: 0.47, dayOpacity: 0.4 });
  const glintGeometry = kit.own(new TorusGeometry(1, 0.035, 4, 12, Math.PI * 1.18));
  const glints = new InstancedMesh(glintGeometry, glint, 120);
  glints.name = "batched shallow water ripples";
  for (let index = 0; index < 120; index += 1) {
    const x = -34 + random() * 68;
    const z = -33 + random() * 70;
    const size = 0.18 + random() * 0.37;
    const matrix = new Matrix4().makeRotationX(-Math.PI / 2)
      .scale(new Vector3(size, size * 0.64, size));
    matrix.setPosition(x, -3.157, z);
    glints.setMatrixAt(index, matrix);
  }
  glints.instanceMatrix.needsUpdate = true;
  glints.castShadow = false;
  kit.group.add(glints);

  // Repeated low shrubs are batched, with reserved openings at each bridge end.
  const shrub = kit.material("planted island edges", 0x2b5c57, 0x59815d,
    { roughness: 1 });
  const flowers = kit.material("subtle flowering groundcover", 0x6d6b88, 0x8e9aab,
    { roughness: 1 });
  const shrubGeometry = kit.own(new IcosahedronGeometry(1, 0));
  const shrubs = new InstancedMesh(shrubGeometry, shrub, 246);
  const blooms = new InstancedMesh(shrubGeometry, flowers, 54);
  shrubs.name = "batched shoreline shrubs";
  blooms.name = "batched lavender groundcover";
  let planted = 0;
  let flowerCount = 0;
  islands.forEach((island, islandIndex) => {
    const opening = Math.atan2(-island.z, -island.x);
    for (let index = 0; index < 41; index += 1) {
      const angle = index * Math.PI * 2 / 41 + islandIndex * 0.21;
      const diff = Math.atan2(Math.sin(angle - opening), Math.cos(angle - opening));
      const plazaExit = islandIndex === 0 && islands.slice(1).some((destination) => {
        const route = Math.atan2(destination.z, destination.x);
        return Math.abs(Math.atan2(Math.sin(angle - route), Math.cos(angle - route))) < 0.16;
      });
      if (plazaExit || (islandIndex !== 0 && Math.abs(diff) < 0.22)) {
        // Keep instance counts stable with very small, buried placeholder transforms.
        shrubs.setMatrixAt(planted++, new Matrix4().makeScale(0, 0, 0));
        if (index % 5 === 0) blooms.setMatrixAt(flowerCount++, new Matrix4().makeScale(0, 0, 0));
        continue;
      }
      const radius = island.plantRadius + Math.sin(index * 4.7) * 0.13;
      const x = island.x + Math.cos(angle) * radius;
      const z = island.z + Math.sin(angle) * radius;
      const scale = 0.18 + (index % 5) * 0.055;
      shrubs.setMatrixAt(planted++, new Matrix4().makeScale(scale * 1.35, scale * 0.7, scale)
        .setPosition(x, 0.1 + scale * 0.35, z));
      if (index % 5 === 0) {
        blooms.setMatrixAt(flowerCount++, new Matrix4().makeScale(0.16, 0.11, 0.16)
          .setPosition(x + 0.17, 0.25, z - 0.14));
      }
    }
  });
  // Count 54 accommodates at most 9 blooms per island; unused matrices stay invisible.
  for (; flowerCount < 54; flowerCount += 1)
    blooms.setMatrixAt(flowerCount, new Matrix4().makeScale(0, 0, 0));
  shrubs.instanceMatrix.needsUpdate = true;
  blooms.instanceMatrix.needsUpdate = true;
  shrubs.castShadow = true;
  kit.group.add(shrubs, blooms);

  const rail = kit.material("bridge teal wayfinding rail", 0x70d7df, 0x6faebe,
    { emissive: 0x2dc9dc, nightEmission: 0.9, dayEmission: 0.12,
      roughness: 0.3, metalness: 0.4 });
  for (const island of islands.slice(1)) {
    const length = Math.hypot(island.x, island.z);
    const perpendicularX = -island.z / length;
    const perpendicularZ = island.x / length;
    for (const side of [-1, 1]) {
      const points: Point[] = [];
      for (const t of [0.27, 0.4, 0.52, 0.64, 0.76])
        points.push([island.x * t + perpendicularX * side * 1.09, 0.035,
          island.z * t + perpendicularZ * side * 1.09]);
      kit.curve("continuous luminous bridge edge", points, 0.018, rail);
    }
  }
  const cascade = kit.material("sparse cliff cascade", 0x75d4e5, 0xa5dce9,
    { emissive: 0x39b5d8, nightEmission: 0.55, dayEmission: 0.08,
      transparent: true, nightOpacity: 0.74, dayOpacity: 0.63 });
  for (const [x, z] of [[-3.75, 1.7], [3.73, 1.6], [-16.6, 0.9], [16.4, -0.3]] as const) {
    for (let strand = 0; strand < 4; strand += 1) {
      const offset = (strand - 1.5) * 0.13;
      const points: Point[] = [
        [x + offset, -0.28, z],
        [x + offset * 1.2, -1.18, z + 0.12],
        [x + offset * 1.5, -2.15, z + 0.27],
        [x + offset * 1.8, -3.08, z + 0.48],
      ];
      kit.curve("cliff waterfall strand", points, 0.025, cascade);
    }
  }
}
