import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CylinderGeometry,
  Group,
  InstancedMesh,
  Mesh,
  Object3D,
  SphereGeometry,
  Vector3,
  type Material,
  type Texture,
} from "three";
import { createAvatarMaterials, type AvatarMaterials } from "./AvatarMaterials";
import { AvatarMotion, type AvatarInput, type AvatarPose } from "./AvatarMotion";

interface Ring { y: number; rx: number; rz: number }
interface HairClump { x: number; y: number; z: number; sx: number; sy: number; sz: number; tilt: number }

const UP = new Vector3(0, 1, 0);
const HEAD: Ring[] = [
  { y: -0.255, rx: 0.075, rz: 0.082 },
  { y: -0.215, rx: 0.12, rz: 0.125 },
  { y: -0.145, rx: 0.173, rz: 0.151 },
  { y: -0.035, rx: 0.202, rz: 0.173 },
  { y: 0.075, rx: 0.207, rz: 0.172 },
  { y: 0.165, rx: 0.188, rz: 0.157 },
  { y: 0.245, rx: 0.135, rz: 0.118 },
];
const BODY: Ring[] = [
  { y: -0.035, rx: 0.169, rz: 0.12 },
  { y: 0.045, rx: 0.187, rz: 0.126 },
  { y: 0.17, rx: 0.20, rz: 0.14 },
  { y: 0.40, rx: 0.227, rz: 0.151 },
  { y: 0.555, rx: 0.267, rz: 0.15 },
  { y: 0.615, rx: 0.225, rz: 0.141 },
  { y: 0.675, rx: 0.078, rz: 0.082 },
];

function ringAt(rings: Ring[], y: number): Ring {
  if (y <= rings[0].y) return rings[0];
  for (let index = 1; index < rings.length; index += 1) {
    if (y <= rings[index].y) {
      const lower = rings[index - 1];
      const upper = rings[index];
      const t = (y - lower.y) / (upper.y - lower.y);
      return { y, rx: lower.rx + (upper.rx - lower.rx) * t, rz: lower.rz + (upper.rz - lower.rz) * t };
    }
  }
  return rings[rings.length - 1];
}

function frontZ(rings: Ring[], x: number, y: number): number {
  const ring = ringAt(rings, y);
  return ring.rz * Math.sqrt(Math.max(0.01, 1 - (x / ring.rx) ** 2));
}

function geometry(positions: number[], indices: number[], uvs?: number[]): BufferGeometry {
  const result = new BufferGeometry();
  result.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
  if (uvs) result.setAttribute("uv", new BufferAttribute(new Float32Array(uvs), 2));
  result.setIndex(indices);
  result.computeVertexNormals();
  return result;
}

function loft(rings: Ring[], segments = 20): BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  rings.forEach((ring, row) => {
    for (let column = 0; column <= segments; column += 1) {
      const angle = column / segments * Math.PI * 2;
      positions.push(ring.rx * Math.sin(angle), ring.y, ring.rz * Math.cos(angle));
      if (row && column < segments) {
        const below = (row - 1) * (segments + 1) + column;
        const above = row * (segments + 1) + column;
        indices.push(below, below + 1, above, below + 1, above + 1, above);
      }
    }
  });
  return geometry(positions, indices);
}

/** One continuous portrait-mapped cranium, cheek, nose, and jaw surface. */
function headGeometry(): BufferGeometry {
  const rows = 36;
  const columns = 48;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row <= rows; row += 1) {
    const y = -0.255 + row / rows * 0.5;
    const ring = ringAt(HEAD, y);
    for (let column = 0; column <= columns; column += 1) {
      const angle = -Math.PI + column / columns * Math.PI * 2;
      const x = ring.rx * Math.sin(angle);
      const nose = 0.049 * Math.exp(-((angle / 0.23) ** 2 + ((y + 0.055) / 0.068) ** 2));
      positions.push(x, y, ring.rz * Math.cos(angle) + nose);
      uvs.push(column / columns, row / rows);
      if (row && column < columns) {
        const below = (row - 1) * (columns + 1) + column;
        const above = row * (columns + 1) + column;
        indices.push(below, below + 1, above, below + 1, above + 1, above);
      }
    }
  }
  return geometry(positions, indices, uvs);
}

function beardSide(side: number): BufferGeometry {
  const rows = 7;
  const columns = 9;
  const positions: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row <= rows; row += 1) {
    const t = row / rows;
    const y = -0.095 - 0.127 * t;
    const ring = ringAt(HEAD, y);
    const inner = 1.48 - 0.79 * t;
    for (let column = 0; column <= columns; column += 1) {
      const angle = side * (inner + (1.86 - inner) * column / columns);
      positions.push(ring.rx * Math.sin(angle) * 1.018, y, ring.rz * Math.cos(angle) * 1.018);
      if (row < rows && column < columns) {
        const index = row * (columns + 1) + column;
        indices.push(index, index + columns + 1, index + 1,
          index + 1, index + columns + 1, index + columns + 2);
      }
    }
  }
  return geometry(positions, indices);
}

function hairCap(): BufferGeometry {
  const rows = 9;
  const columns = 32;
  const positions: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row <= rows; row += 1) {
    const t = row / rows;
    const radius = Math.sqrt(Math.max(0, 1 - t * t));
    for (let column = 0; column <= columns; column += 1) {
      const angle = column / columns * Math.PI * 2;
      const forward = Math.cos(angle);
      const baseY = 0.088 + 0.057 * Math.max(0, forward) - 0.072 * Math.max(0, -forward)
        + 0.018 * Math.sin(angle);
      const y = baseY + (0.338 - baseY) * t;
      positions.push(0.218 * radius * Math.sin(angle), y, 0.178 * radius * forward - 0.012);
      if (row && column < columns) {
        const below = (row - 1) * (columns + 1) + column;
        const above = row * (columns + 1) + column;
        indices.push(below, below + 1, above, below + 1, above + 1, above);
      }
    }
  }
  return geometry(positions, indices);
}

function polygon(points: Array<[number, number, number]>): BufferGeometry {
  const positions = points.flatMap((point) => point);
  const indices: number[] = [];
  for (let index = 1; index < points.length - 1; index += 1) indices.push(0, index, index + 1);
  return geometry(positions, indices);
}

function bodyPanel(points: Array<[number, number]>, lift = 0.01): BufferGeometry {
  return polygon(points.map(([x, y]) => [x, y, frontZ(BODY, x, y) + lift]));
}

function shirtSurface(): BufferGeometry {
  const rows = [
    { y: 0.65, width: 0.061 }, { y: 0.56, width: 0.077 },
    { y: 0.36, width: 0.068 }, { y: 0.09, width: 0.05 },
  ];
  const positions: number[] = [];
  const indices: number[] = [];
  rows.forEach(({ y, width }, row) => {
    for (const x of [-width, 0, width]) positions.push(x, y, frontZ(BODY, x, y) + 0.013);
    if (row < rows.length - 1) {
      for (let column = 0; column < 2; column += 1) {
        const index = row * 3 + column;
        indices.push(index, index + 3, index + 1, index + 1, index + 3, index + 4);
      }
    }
  });
  return geometry(positions, indices);
}

function shoeGeometry(): BufferGeometry {
  const profile = [
    { z: -0.105, width: 0.067, top: 0.072 },
    { z: -0.025, width: 0.073, top: 0.111 },
    { z: 0.075, width: 0.094, top: 0.078 },
    { z: 0.155, width: 0.081, top: 0.053 },
    { z: 0.191, width: 0.045, top: 0.038 },
  ];
  const positions: number[] = [];
  const indices: number[] = [];
  profile.forEach(({ z, width, top }, index) => {
    positions.push(-width, 0.012, z, width, 0.012, z, -width, top, z, width, top, z);
    if (index < profile.length - 1) {
      const i = index * 4;
      indices.push(i + 2, i + 6, i + 3, i + 3, i + 6, i + 7);
      indices.push(i, i + 1, i + 4, i + 1, i + 5, i + 4);
      indices.push(i, i + 4, i + 2, i + 2, i + 4, i + 6);
      indices.push(i + 1, i + 3, i + 5, i + 3, i + 7, i + 5);
    }
  });
  indices.push(0, 2, 1, 1, 2, 3);
  const last = (profile.length - 1) * 4;
  indices.push(last, last + 1, last + 2, last + 1, last + 3, last + 2);
  return geometry(positions, indices);
}

function part(parent: Group, name: string, shape: BufferGeometry, material: Material,
  position: [number, number, number] = [0, 0, 0], scale: [number, number, number] = [1, 1, 1],
  shadow = true): Mesh {
  const mesh = new Mesh(shape, material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.castShadow = shadow;
  mesh.receiveShadow = shadow;
  parent.add(mesh);
  return mesh;
}

function clusteredHair(parent: Group, shape: BufferGeometry, material: Material,
  name: string, clumps: HairClump[]): void {
  const mesh = new InstancedMesh(shape, material, clumps.length);
  mesh.name = name;
  mesh.castShadow = true;
  const transform = new Object3D();
  clumps.forEach((clump, index) => {
    transform.position.set(clump.x, clump.y, clump.z);
    transform.rotation.set(0, 0, clump.tilt);
    transform.scale.set(clump.sx, clump.sy, clump.sz);
    transform.updateMatrix();
    mesh.setMatrixAt(index, transform.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  parent.add(mesh);
}

/** Portrait-led, low-poly avatar with a continuous head and a shared material palette. */
export class Avatar {
  readonly group = new Group();
  readonly colliderRadius = 0.34;

  private readonly motion = new AvatarMotion();
  private readonly hips = new Group();
  private readonly neck = new Group();
  private readonly head = new Group();
  private readonly leftHip = new Group();
  private readonly rightHip = new Group();
  private readonly leftKnee = new Group();
  private readonly rightKnee = new Group();
  private readonly leftShoulder = new Group();
  private readonly rightShoulder = new Group();
  private readonly leftElbow = new Group();
  private readonly rightElbow = new Group();
  private headAimYaw = 0;
  private headAimPitch = 0;

  constructor(portrait: Texture) {
    this.group.name = "KrishnaAvatar";
    const mat = createAvatarMaterials(portrait);
    const rounded = new SphereGeometry(1, 12, 8);
    const clumpShape = new SphereGeometry(1, 10, 6);
    const upperArm = loft([
      { y: -0.335, rx: 0.075, rz: 0.069 }, { y: -0.17, rx: 0.084, rz: 0.078 },
      { y: 0.02, rx: 0.098, rz: 0.086 }, { y: 0.1, rx: 0.038, rz: 0.043 },
    ], 12);
    const forearm = loft([
      { y: -0.305, rx: 0.06, rz: 0.056 }, { y: -0.16, rx: 0.066, rz: 0.063 },
      { y: 0.014, rx: 0.077, rz: 0.07 },
    ], 12);
    const cuff = new CylinderGeometry(0.067, 0.064, 0.022, 12);
    const thigh = new CylinderGeometry(0.102, 0.085, 1, 12);
    const calf = new CylinderGeometry(0.086, 0.071, 1, 12);
    const shoe = shoeGeometry();
    const box = new BoxGeometry(1, 1, 1);
    const lens = new CylinderGeometry(0.053, 0.053, 0.001, 24);
    const rod = new CylinderGeometry(1, 1, 1, 6);

    this.hips.name = "hips";
    this.hips.position.y = 0.85;
    this.group.add(this.hips);
    part(this.hips, "shaped navy jacket", loft(BODY), mat.wool);
    part(this.hips, "white shirt within jacket", shirtSurface(), mat.cotton, undefined, undefined, false);
    part(this.hips, "open-collar skin", bodyPanel([
      [-0.031, 0.655], [0, 0.595], [0.031, 0.655],
    ], 0.022), mat.skin, undefined, undefined, false);
    for (const side of [-1, 1]) {
      const sideName = side < 0 ? "left" : "right";
      part(this.hips, `${sideName} white open collar`, bodyPanel([
        [side * 0.032, 0.654], [side * 0.073, 0.632],
        [side * 0.079, 0.587], [side * 0.041, 0.602],
      ], 0.025), mat.cotton, undefined, undefined, false);
      part(this.hips, `${sideName} tailored lapel`, bodyPanel([
        [side * 0.077, 0.646], [side * 0.208, 0.565],
        [side * 0.111, 0.385], [side * 0.076, 0.515],
      ], 0.022), mat.lapel, undefined, undefined, false);
      part(this.hips, `${sideName} jacket welt pocket`, box, mat.lapel,
        [side * 0.163, 0.173, 0.129], [0.063, 0.009, 0.008], false);
    }
    part(this.hips, "belt visible at shirt opening", box, mat.leather,
      [0, 0.05, 0.148], [0.152, 0.023, 0.013], false);
    part(this.hips, "small belt buckle", box, mat.gold,
      [0, 0.05, 0.157], [0.029, 0.027, 0.006], false);
    part(this.group, "tailored trouser waist", loft([
      { y: 0.745, rx: 0.155, rz: 0.105 },
      { y: 0.805, rx: 0.185, rz: 0.12 },
      { y: 0.875, rx: 0.19, rz: 0.124 },
    ], 14), mat.wool);

    this.buildLeg("left", -1, thigh, calf, shoe, box, mat);
    this.buildLeg("right", 1, thigh, calf, shoe, box, mat);
    this.buildArm("left", -1, upperArm, forearm, cuff, rounded, mat);
    this.buildArm("right", 1, upperArm, forearm, cuff, rounded, mat);

    this.neck.name = "neck";
    this.neck.position.set(0, 0.655, 0);
    this.hips.add(this.neck);
    part(this.neck, "neck skin", rounded, mat.skin, [0, 0.055, 0], [0.075, 0.106, 0.07]);
    this.head.name = "head";
    this.head.position.y = 0.19;
    this.head.scale.setScalar(0.87);
    this.neck.add(this.head);
    part(this.head, "continuous portrait-mapped cranium cheek jaw", headGeometry(), mat.face);
    for (const side of [-1, 1]) {
      const sideName = side < 0 ? "left" : "right";
      part(this.head, `${sideName} ear`, rounded, mat.skin,
        [side * 0.206, -0.031, -0.008], [0.03, 0.055, 0.028]);
      part(this.head, `${sideName} side beard along jaw`, beardSide(side), mat.beard,
        undefined, undefined, false);
      const eyeX = side * 0.108;
      const eyeY = 0.02;
      const eyeZ = frontZ(HEAD, eyeX, eyeY) + 0.013;
      part(this.head, `${sideName} rimless glass lens`, lens, mat.glass,
        [eyeX, eyeY, eyeZ], [1, 1, 0.82], false).rotation.x = Math.PI / 2;
      this.rod(this.head, `${sideName} thin gold glasses temple`, rod, mat.gold,
        new Vector3(side * 0.154, 0.023, eyeZ - 0.005),
        new Vector3(side * 0.215, 0.007, 0.002), 0.0019);
    }
    part(this.head, "under-chin beard contour", rounded, mat.beard,
      [0, -0.24, 0.012], [0.091, 0.025, 0.096]);
    part(this.head, "sculpted swept hairline", hairCap(), mat.hair);
    const sweep: HairClump[] = [
      { x: -0.16, y: 0.205, z: 0.125, sx: 0.077, sy: 0.056, sz: 0.058, tilt: -0.36 },
      { x: -0.103, y: 0.234, z: 0.15, sx: 0.092, sy: 0.06, sz: 0.067, tilt: -0.52 },
      { x: -0.025, y: 0.256, z: 0.16, sx: 0.109, sy: 0.066, sz: 0.066, tilt: -0.58 },
      { x: 0.058, y: 0.284, z: 0.153, sx: 0.104, sy: 0.067, sz: 0.066, tilt: -0.52 },
      { x: 0.145, y: 0.31, z: 0.128, sx: 0.087, sy: 0.074, sz: 0.064, tilt: -0.35 },
      { x: 0.218, y: 0.3, z: 0.07, sx: 0.057, sy: 0.073, sz: 0.06, tilt: 0.22 },
      { x: -0.15, y: 0.303, z: 0.028, sx: 0.09, sy: 0.072, sz: 0.085, tilt: -0.18 },
      { x: -0.07, y: 0.334, z: 0.045, sx: 0.096, sy: 0.065, sz: 0.082, tilt: -0.3 },
      { x: 0.043, y: 0.349, z: 0.034, sx: 0.105, sy: 0.061, sz: 0.082, tilt: -0.4 },
      { x: 0.139, y: 0.353, z: 0.012, sx: 0.092, sy: 0.069, sz: 0.078, tilt: -0.28 },
      { x: -0.163, y: 0.282, z: -0.082, sx: 0.078, sy: 0.076, sz: 0.076, tilt: 0.16 },
      { x: -0.067, y: 0.338, z: -0.102, sx: 0.09, sy: 0.073, sz: 0.075, tilt: -0.13 },
      { x: 0.058, y: 0.342, z: -0.112, sx: 0.095, sy: 0.07, sz: 0.078, tilt: -0.25 },
      { x: 0.157, y: 0.281, z: -0.07, sx: 0.078, sy: 0.072, sz: 0.076, tilt: -0.31 },
      { x: -0.212, y: 0.135, z: 0.005, sx: 0.043, sy: 0.08, sz: 0.06, tilt: -0.13 },
      { x: 0.205, y: 0.151, z: -0.013, sx: 0.052, sy: 0.08, sz: 0.06, tilt: 0.15 },
      { x: -0.155, y: 0.152, z: -0.126, sx: 0.063, sy: 0.071, sz: 0.057, tilt: -0.31 },
      { x: 0.142, y: 0.148, z: -0.142, sx: 0.067, sy: 0.072, sz: 0.056, tilt: 0.2 },
    ];
    const highlights: HairClump[] = [
      { x: -0.105, y: 0.255, z: 0.165, sx: 0.048, sy: 0.025, sz: 0.028, tilt: -0.54 },
      { x: 0.055, y: 0.309, z: 0.153, sx: 0.051, sy: 0.025, sz: 0.029, tilt: -0.48 },
      { x: 0.154, y: 0.368, z: 0.025, sx: 0.043, sy: 0.022, sz: 0.028, tilt: -0.18 },
      { x: -0.055, y: 0.394, z: -0.052, sx: 0.042, sy: 0.018, sz: 0.026, tilt: -0.21 },
    ];
    clusteredHair(this.head, clumpShape, mat.hair, "directional dark hair locks", sweep);
    clusteredHair(this.head, clumpShape, mat.hairLight, "subtle swept hair highlights", highlights);
  }

  update(input: AvatarInput, delta: number): AvatarPose {
    const pose = this.motion.update(input, delta);
    const dt = Number.isFinite(delta) ? Math.max(0, Math.min(delta, 0.1)) : 0;
    this.group.position.x += pose.velocityX * dt;
    this.group.position.z += pose.velocityZ * dt;
    this.group.rotation.y = pose.yaw;
    this.hips.position.y = 0.85 + pose.bounce + pose.breath;
    this.hips.rotation.x = pose.lean;
    this.hips.rotation.z = -pose.turnRate / 3.4 * 0.018;
    this.leftHip.rotation.x = pose.stride * 0.34;
    this.rightHip.rotation.x = -pose.stride * 0.34;
    this.leftKnee.rotation.x = Math.max(0, -pose.stride) * 0.26;
    this.rightKnee.rotation.x = Math.max(0, pose.stride) * 0.26;
    this.leftShoulder.rotation.x = -pose.stride * 0.24;
    this.rightShoulder.rotation.x = pose.stride * 0.24 - pose.interaction * 0.75;
    this.leftElbow.rotation.x = -0.08;
    this.rightElbow.rotation.x = -0.08 - pose.interaction * 0.48;
    this.neck.rotation.x = this.headAimPitch - pose.interaction * 0.08;
    this.head.rotation.y = this.headAimYaw * (1 - pose.interaction * 0.5);
    return pose;
  }

  setReducedMotion(value: boolean): void {
    this.motion.setReducedMotion(value);
  }

  faceCamera(target: Vector3): void {
    this.group.updateWorldMatrix(true, false);
    const local = this.group.worldToLocal(target.clone());
    this.headAimYaw = Math.max(-0.48, Math.min(0.48, Math.atan2(local.x, local.z)));
    this.headAimPitch = Math.max(-0.18, Math.min(0.18,
      -Math.atan2(local.y - 1.7, Math.hypot(local.x, local.z))));
  }

  private buildLeg(name: "left" | "right", side: number, thigh: BufferGeometry, calf: BufferGeometry,
    shoe: BufferGeometry, box: BufferGeometry, mat: AvatarMaterials): void {
    const hip = side < 0 ? this.leftHip : this.rightHip;
    const knee = side < 0 ? this.leftKnee : this.rightKnee;
    hip.name = `${name}Hip`;
    hip.position.set(side * 0.101, 0.81, 0);
    this.group.add(hip);
    part(hip, `${name} tapered trouser thigh`, thigh, mat.wool,
      [0, -0.194, 0], [1, 0.39, 0.88]);
    knee.name = `${name}Knee`;
    knee.position.y = -0.385;
    hip.add(knee);
    part(knee, `${name} tapered trouser calf`, calf, mat.wool,
      [0, -0.197, 0], [1, 0.395, 0.88]);
    part(knee, `${name} low oxford shoe`, shoe, mat.leather, [0, -0.42, 0]);
    part(knee, `${name} slim shoe sole`, box, mat.sole,
      [0, -0.417, 0.03], [0.18, 0.015, 0.277]);
  }

  private buildArm(name: "left" | "right", side: number, upper: BufferGeometry, lower: BufferGeometry,
    cuff: BufferGeometry, rounded: BufferGeometry, mat: AvatarMaterials): void {
    const shoulder = side < 0 ? this.leftShoulder : this.rightShoulder;
    const elbow = side < 0 ? this.leftElbow : this.rightElbow;
    shoulder.name = `${name}Shoulder`;
    shoulder.position.set(side * 0.255, 0.515, 0);
    shoulder.rotation.z = side * 0.055;
    this.hips.add(shoulder);
    part(shoulder, `${name} sloped jacket sleeve`, upper, mat.wool);
    elbow.name = `${name}Elbow`;
    elbow.position.set(side * 0.011, -0.328, 0);
    elbow.rotation.z = side * 0.035;
    shoulder.add(elbow);
    part(elbow, `${name} tapered forearm`, lower, mat.wool);
    part(elbow, `${name} white cuff`, cuff, mat.cotton,
      [0, -0.295, 0], [1, 1, 0.86]);
    part(elbow, `${name} relaxed hand`, rounded, mat.skin,
      [0, -0.358, 0.008], [0.05, 0.084, 0.043]);
    part(elbow, `${name} thumb`, rounded, mat.skin,
      [-side * 0.042, -0.328, 0.035], [0.022, 0.047, 0.024]);
  }

  private rod(parent: Group, name: string, shape: BufferGeometry, material: Material,
    start: Vector3, end: Vector3, radius: number): void {
    const direction = end.clone().sub(start);
    const mesh = part(parent, name, shape, material,
      [start.x + direction.x * 0.5, start.y + direction.y * 0.5, start.z + direction.z * 0.5],
      [radius, direction.length(), radius]);
    mesh.quaternion.setFromUnitVectors(UP, direction.normalize());
  }
}
