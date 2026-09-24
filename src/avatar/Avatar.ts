import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CylinderGeometry,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  Mesh,
  Object3D,
  TorusGeometry,
  Vector3,
  type Material,
  type Texture,
} from "three";
import { createAvatarMaterials } from "./AvatarMaterials";
import { AvatarMotion, type AvatarInput, type AvatarPose } from "./AvatarMotion";

const UP = new Vector3(0, 1, 0);

function part(
  parent: Group,
  name: string,
  geometry: BufferGeometry,
  material: Material,
  position: [number, number, number],
  scale: [number, number, number],
): Mesh {
  const mesh = new Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function polygon(points: Array<[number, number, number]>): BufferGeometry {
  const positions: number[] = [];
  for (let index = 1; index < points.length - 1; index += 1) {
    positions.push(...points[0], ...points[index], ...points[index + 1]);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
  geometry.computeVertexNormals();
  return geometry;
}

/** Oval, convex portrait skin: the photo lives on a curved head surface, not a plane. */
function facialSurface(): BufferGeometry {
  const columns = 16;
  const rows = 14;
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row <= rows; row += 1) {
    const t = row / rows;
    const vertical = 1 - 2 * t;
    const halfWidth = 0.17 * Math.sqrt(1 - 0.7 * vertical * vertical);
    for (let column = 0; column <= columns; column += 1) {
      const lateral = 2 * column / columns - 1;
      const x = lateral * halfWidth;
      const y = 0.125 - t * 0.29;
      const z = 0.18 * Math.sqrt(Math.max(0.01, 1 - (x / 0.205) ** 2 - (y / 0.245) ** 2)) + 0.012;
      positions.push(x, y, z);
      uvs.push(0.5 + x / 0.17 * 0.218, 1 - (0.235 + t * 0.355));
      if (row < rows && column < columns) {
        const index = row * (columns + 1) + column;
        indices.push(index, index + columns + 1, index + 1);
        indices.push(index + 1, index + columns + 1, index + columns + 2);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
  geometry.setAttribute("uv", new BufferAttribute(new Float32Array(uvs), 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

interface HairClump {
  x: number;
  y: number;
  z: number;
  width: number;
  height: number;
  depth: number;
  angle: number;
}

function addHairClumps(parent: Group, geometry: BufferGeometry, material: Material, name: string, clumps: HairClump[]): void {
  const mesh = new InstancedMesh(geometry, material, clumps.length);
  mesh.name = name;
  mesh.castShadow = true;
  const transform = new Object3D();
  clumps.forEach((clump, index) => {
    transform.position.set(clump.x, clump.y, clump.z);
    transform.rotation.set(0, 0, clump.angle);
    transform.scale.set(clump.width, clump.height, clump.depth);
    transform.updateMatrix();
    mesh.setMatrixAt(index, transform.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  parent.add(mesh);
}

/** A single, disposal-compatible avatar with reusable geometry and an injected portrait texture. */
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
    const materials = createAvatarMaterials(portrait);
    const rounded = new IcosahedronGeometry(1, 2);
    const hairClump = new IcosahedronGeometry(1, 1);
    const limb = new CylinderGeometry(1, 1, 1, 8);
    const torso = new CylinderGeometry(0.265, 0.205, 0.64, 10, 1);
    const box = new BoxGeometry(1, 1, 1);
    const spectacle = new TorusGeometry(0.054, 0.0022, 4, 24);
    const lens = new CylinderGeometry(0.052, 0.052, 0.001, 24);
    const rodGeometry = new CylinderGeometry(1, 1, 1, 6);

    this.hips.name = "hips";
    this.hips.position.y = 0.85;
    this.group.add(this.hips);
    part(this.hips, "navy jacket body", torso, materials.wool, [0, 0.32, 0], [1, 1, 0.72]);
    part(this.hips, "rounded left shoulder", rounded, materials.wool, [-0.255, 0.56, 0], [0.125, 0.115, 0.15]);
    part(this.hips, "rounded right shoulder", rounded, materials.wool, [0.255, 0.56, 0], [0.125, 0.115, 0.15]);
    part(this.hips, "white shirt opening", polygon([
      [-0.13, 0.625, 0.209], [0.13, 0.625, 0.209], [0.1, 0.055, 0.174], [-0.1, 0.055, 0.174],
    ]), materials.cotton, [0, 0, 0], [1, 1, 1]);
    part(this.hips, "left white collar", polygon([
      [-0.064, 0.64, 0.218], [-0.014, 0.484, 0.219], [-0.13, 0.542, 0.212],
    ]), materials.cotton, [0, 0, 0], [1, 1, 1]);
    part(this.hips, "right white collar", polygon([
      [0.064, 0.64, 0.218], [0.13, 0.542, 0.212], [0.014, 0.484, 0.219],
    ]), materials.cotton, [0, 0, 0], [1, 1, 1]);
    part(this.hips, "left jacket lapel", polygon([
      [-0.125, 0.625, 0.213], [-0.23, 0.55, 0.17], [-0.135, 0.35, 0.194], [-0.063, 0.47, 0.221],
    ]), materials.lapel, [0, 0, 0], [1, 1, 1]);
    part(this.hips, "right jacket lapel", polygon([
      [0.125, 0.625, 0.213], [0.063, 0.47, 0.221], [0.135, 0.35, 0.194], [0.23, 0.55, 0.17],
    ]), materials.lapel, [0, 0, 0], [1, 1, 1]);
    for (const y of [0.22, 0.12]) {
      part(this.hips, `jacket button ${y}`, rounded, materials.gold, [-0.095, y, 0.158], [0.008, 0.008, 0.005]);
    }
    for (const side of [-1, 1]) {
      part(this.hips, `${side < 0 ? "left" : "right"} jacket pocket`, box, materials.lapel,
        [side * 0.185, 0.135, 0.12], [0.078, 0.012, 0.012]);
    }

    part(this.group, "brown belt", box, materials.leather, [0, 0.85, 0.01], [0.39, 0.052, 0.275]);
    part(this.group, "belt buckle", box, materials.gold, [0, 0.85, 0.155], [0.055, 0.034, 0.009]);

    this.buildLeg("left", -1, rounded, limb, box, materials);
    this.buildLeg("right", 1, rounded, limb, box, materials);
    this.buildArm("left", -1, rounded, limb, materials);
    this.buildArm("right", 1, rounded, limb, materials);

    this.neck.name = "neck";
    this.neck.position.set(0, 0.655, 0);
    this.hips.add(this.neck);
    part(this.neck, "visible neck", rounded, materials.skin, [0, 0.052, 0], [0.082, 0.105, 0.074]);
    this.head.name = "head";
    this.head.position.y = 0.19;
    this.neck.add(this.head);
    part(this.head, "shaped head", rounded, materials.skin, [0, 0, 0], [0.205, 0.245, 0.18]);
    part(this.head, "curved portrait face", facialSurface(), materials.face, [0, 0, 0], [1, 1, 1]);
    for (const side of [-1, 1]) {
      part(this.head, `${side < 0 ? "left" : "right"} ear`, rounded, materials.skin,
        [side * 0.2, -0.015, -0.008], [0.047, 0.078, 0.04]);
    }
    part(this.head, "profile nose", rounded, materials.skin, [0, -0.055, 0.213], [0.017, 0.034, 0.022]);
    part(this.head, "beard chin", rounded, materials.beard, [0, -0.19, 0.085], [0.125, 0.043, 0.075]);
    for (const side of [-1, 1]) {
      part(this.head, `${side < 0 ? "left" : "right"} layered beard`, rounded, materials.beard,
        [side * 0.12, -0.15, 0.055], [0.069, 0.07, 0.07]);
      part(this.head, `${side < 0 ? "left" : "right"} sideburn`, rounded, materials.beard,
        [side * 0.175, -0.065, 0.025], [0.025, 0.063, 0.04]);
      part(this.head, `${side < 0 ? "left" : "right"} moustache`, rounded, materials.beard,
        [side * 0.04, -0.088, 0.192], [0.046, 0.014, 0.013]);
      part(this.head, `${side < 0 ? "left" : "right"} eyebrow`, rounded, materials.hair,
        [side * 0.082, 0.093, 0.176], [0.057, 0.011, 0.01]);
    }

    part(this.head, "full hair cap", rounded, materials.hair, [0, 0.16, -0.015], [0.216, 0.173, 0.178]);
    const darkClumps: HairClump[] = [];
    const lightClumps: HairClump[] = [];
    for (let row = 0; row < 3; row += 1) {
      const count = row === 0 ? 12 : 10;
      for (let index = 0; index < count; index += 1) {
        const angle = index / count * Math.PI * 2 + row * 0.15;
        const radiusX = row === 0 ? 0.184 : row === 1 ? 0.145 : 0.085;
        const radiusZ = row === 0 ? 0.15 : row === 1 ? 0.12 : 0.07;
        const clump = {
          x: Math.sin(angle) * radiusX,
          y: 0.175 + row * 0.053 + (index % 3) * 0.011,
          z: Math.cos(angle) * radiusZ - 0.006,
          width: row === 0 ? 0.073 : 0.067,
          height: 0.074 + (index % 3) * 0.01,
          depth: 0.068,
          angle: -0.3 + Math.sin(angle) * 0.36,
        };
        (index % 4 === 0 ? lightClumps : darkClumps).push(clump);
      }
    }
    for (let index = 0; index < 7; index += 1) {
      darkClumps.push({
        x: -0.18 + index * 0.057,
        y: 0.235 + Math.sin(index * 1.2) * 0.017,
        z: 0.155 + Math.sin(index * 0.8) * 0.012,
        width: 0.065,
        height: 0.078,
        depth: 0.06,
        angle: -0.46 + index * 0.09,
      });
    }
    addHairClumps(this.head, hairClump, materials.hair, "wavy dark hair clusters", darkClumps);
    addHairClumps(this.head, hairClump, materials.hairLight, "wavy hair highlights", lightClumps);

    for (const side of [-1, 1]) {
      const eye = part(this.head, `${side < 0 ? "left" : "right"} spectacle rim`, spectacle,
        materials.gold, [side * 0.084, 0.04, 0.207], [1.05, 0.82, 1]);
      eye.renderOrder = 2;
      part(this.head, `${side < 0 ? "left" : "right"} clear lens`, lens,
        materials.glass, [side * 0.084, 0.04, 0.206], [1.05, 1, 0.82]).rotation.x = Math.PI / 2;
      this.rod(this.head, `spectacle temple ${side}`, rodGeometry, materials.gold,
        new Vector3(side * 0.139, 0.04, 0.206), new Vector3(side * 0.204, 0.028, 0.028), 0.0027);
    }
    this.rod(this.head, "spectacle bridge", rodGeometry, materials.gold,
      new Vector3(-0.03, 0.048, 0.21), new Vector3(0.03, 0.048, 0.21), 0.0024);
  }

  update(input: AvatarInput, delta: number): AvatarPose {
    const pose = this.motion.update(input, delta);
    const dt = Number.isFinite(delta) ? Math.max(0, Math.min(delta, 0.1)) : 0;
    this.group.position.x += pose.velocityX * dt;
    this.group.position.z += pose.velocityZ * dt;
    this.group.rotation.y = pose.yaw;
    this.hips.position.y = 0.85 + pose.bounce + pose.breath;
    this.hips.rotation.x = pose.lean;
    this.leftHip.rotation.x = pose.stride * 0.36;
    this.rightHip.rotation.x = -pose.stride * 0.36;
    this.leftKnee.rotation.x = Math.max(0, -pose.stride) * 0.25;
    this.rightKnee.rotation.x = Math.max(0, pose.stride) * 0.25;
    this.leftShoulder.rotation.x = -pose.stride * 0.27;
    this.rightShoulder.rotation.x = pose.stride * 0.27 - pose.interaction * 0.8;
    this.leftElbow.rotation.x = -0.07;
    this.rightElbow.rotation.x = -0.07 - pose.interaction * 0.45;
    this.neck.rotation.x = this.headAimPitch - pose.interaction * 0.09;
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
    this.headAimPitch = Math.max(-0.18, Math.min(0.18, -Math.atan2(local.y - 1.65, Math.hypot(local.x, local.z))));
  }

  private buildLeg(
    sideName: "left" | "right",
    side: number,
    rounded: BufferGeometry,
    limb: BufferGeometry,
    box: BufferGeometry,
    materials: ReturnType<typeof createAvatarMaterials>,
  ): void {
    const hip = side < 0 ? this.leftHip : this.rightHip;
    const knee = side < 0 ? this.leftKnee : this.rightKnee;
    hip.name = `${sideName}Hip`;
    hip.position.set(side * 0.11, 0.83, 0);
    this.group.add(hip);
    part(hip, `${sideName} trouser thigh`, limb, materials.wool, [0, -0.205, 0], [0.104, 0.41, 0.103]);
    knee.name = `${sideName}Knee`;
    knee.position.y = -0.405;
    hip.add(knee);
    part(knee, `${sideName} trouser calf`, limb, materials.wool, [0, -0.19, 0], [0.084, 0.39, 0.085]);
    part(knee, `${sideName} ankle`, rounded, materials.leather, [0, -0.37, 0.015], [0.07, 0.055, 0.08]);
    part(knee, `${sideName} polished brown shoe`, rounded, materials.leather, [0, -0.39, 0.08], [0.105, 0.067, 0.17]);
    part(knee, `${sideName} shoe sole`, box, materials.sole, [0, -0.447, 0.08], [0.207, 0.018, 0.31]);
  }

  private buildArm(
    sideName: "left" | "right",
    side: number,
    rounded: BufferGeometry,
    limb: BufferGeometry,
    materials: ReturnType<typeof createAvatarMaterials>,
  ): void {
    const shoulder = side < 0 ? this.leftShoulder : this.rightShoulder;
    const elbow = side < 0 ? this.leftElbow : this.rightElbow;
    shoulder.name = `${sideName}Shoulder`;
    shoulder.position.set(side * 0.285, 0.56, 0);
    shoulder.rotation.z = -side * 0.08;
    this.hips.add(shoulder);
    part(shoulder, `${sideName} jacket upper arm`, limb, materials.wool, [side * 0.013, -0.176, 0], [0.105, 0.35, 0.1]);
    elbow.name = `${sideName}Elbow`;
    elbow.position.set(side * 0.026, -0.35, 0);
    shoulder.add(elbow);
    part(elbow, `${sideName} jacket forearm`, limb, materials.wool, [0, -0.157, 0], [0.088, 0.32, 0.087]);
    part(elbow, `${sideName} white cuff`, limb, materials.cotton, [0, -0.31, 0], [0.088, 0.027, 0.087]);
    part(elbow, `${sideName} hand`, rounded, materials.skin, [0, -0.372, 0.009], [0.069, 0.105, 0.057]);
  }

  private rod(parent: Group, name: string, geometry: BufferGeometry, material: Material,
    start: Vector3, end: Vector3, radius: number): void {
    const direction = end.clone().sub(start);
    const rod = part(parent, name, geometry, material,
      [start.x + direction.x * 0.5, start.y + direction.y * 0.5, start.z + direction.z * 0.5],
      [radius, direction.length(), radius]);
    rod.quaternion.setFromUnitVectors(UP, direction.normalize());
  }
}
