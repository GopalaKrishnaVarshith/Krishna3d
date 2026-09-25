import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  CylinderGeometry,
  Group,
  Mesh,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
  type Material,
  type Texture,
} from "three";
import { createAvatarMaterials, type AvatarMaterials } from "./AvatarMaterials";
import { AvatarMotion, type AvatarInput, type AvatarPose } from "./AvatarMotion";

interface Ring { y: number; rx: number; rz: number; cx?: number; cz?: number }

const UP = new Vector3(0, 1, 0);
const HEAD: Ring[] = [
  { y: -0.255, rx: 0.1, rz: 0.096 },
  { y: -0.213, rx: 0.145, rz: 0.136 },
  { y: -0.135, rx: 0.18, rz: 0.159 },
  { y: -0.035, rx: 0.207, rz: 0.178 },
  { y: 0.087, rx: 0.208, rz: 0.172 },
  { y: 0.174, rx: 0.185, rz: 0.155 },
  { y: 0.25, rx: 0.12, rz: 0.103 },
];
const BODY: Ring[] = [
  { y: -0.1, rx: 0.19, rz: 0.125 },
  { y: -0.055, rx: 0.18, rz: 0.123 },
  { y: 0.1, rx: 0.195, rz: 0.134 },
  { y: 0.35, rx: 0.22, rz: 0.158 },
  { y: 0.53, rx: 0.26, rz: 0.162 },
  { y: 0.56, rx: 0.272, rz: 0.145 },
  { y: 0.67, rx: 0.11, rz: 0.088 },
];

function ringAt(rings: Ring[], y: number): Ring {
  if (y <= rings[0].y) return rings[0];
  for (let index = 1; index < rings.length; index += 1) {
    const upper = rings[index];
    if (y <= upper.y) {
      const lower = rings[index - 1];
      const t = (y - lower.y) / (upper.y - lower.y);
      return { y, rx: lower.rx + (upper.rx - lower.rx) * t,
        rz: lower.rz + (upper.rz - lower.rz) * t };
    }
  }
  return rings[rings.length - 1];
}

function faceZ(rings: Ring[], x: number, y: number): number {
  const ring = ringAt(rings, y);
  return ring.rz * Math.sqrt(Math.max(0.01, 1 - (x / ring.rx) ** 2));
}

function headPoint(angle: number, y: number): [number, number] {
  const ring = ringAt(HEAD, y);
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);
  const x = ring.rx * Math.sign(sin) * Math.abs(sin) ** 0.86;
  let z = ring.rz * Math.sign(cos) * Math.abs(cos) ** 0.9;
  if (cos > 0) {
    const ridge = 0.018 * Math.exp(-((angle / 0.17) ** 2 + ((y + 0.003) / 0.08) ** 2));
    const tip = 0.043 * Math.exp(-((angle / 0.18) ** 2 + ((y + 0.071) / 0.031) ** 2));
    const wing = 0.012 * Math.exp(-(((Math.abs(angle) - 0.18) / 0.09) ** 2
      + ((y + 0.078) / 0.03) ** 2));
    const cheek = 0.014 * Math.exp(-(((Math.abs(angle) - 0.58) / 0.3) ** 2
      + ((y + 0.028) / 0.115) ** 2));
    const sockets = [-0.087, 0.087].reduce((sum, eyeX) => sum +
      0.013 * Math.exp(-(((x - eyeX) / 0.053) ** 2 + ((y - 0.041) / 0.029) ** 2)), 0);
    z += ridge + tip + wing + cheek - sockets;
  }
  return [x, z];
}

function headSurfaceZ(x: number, y: number): number {
  const ring = ringAt(HEAD, y);
  const sine = Math.min(0.999, (Math.abs(x) / ring.rx) ** (1 / 0.86));
  const angle = Math.sign(x) * Math.asin(sine);
  return headPoint(angle, y)[1];
}

function shape(positions: number[], indices: number[]): BufferGeometry {
  const result = new BufferGeometry();
  result.setAttribute("position", new BufferAttribute(new Float32Array(positions), 3));
  result.setIndex(indices);
  result.computeVertexNormals();
  return result;
}

function loft(rings: Ring[], segments = 24): BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  rings.forEach((ring, row) => {
    for (let column = 0; column <= segments; column += 1) {
      const angle = column / segments * Math.PI * 2;
      positions.push((ring.cx ?? 0) + ring.rx * Math.sin(angle), ring.y,
        (ring.cz ?? 0) + ring.rz * Math.cos(angle));
      if (row && column < segments) {
        const below = (row - 1) * (segments + 1) + column;
        const above = row * (segments + 1) + column;
        indices.push(below, below + 1, above, below + 1, above + 1, above);
      }
    }
  });
  return shape(positions, indices);
}

function sculptedHead(): BufferGeometry {
  const rows = 48;
  const columns = 64;
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row <= rows; row += 1) {
    const y = -0.255 + row / rows * 0.505;
    for (let column = 0; column <= columns; column += 1) {
      const angle = column / columns * Math.PI * 2;
      const [x, z] = headPoint(angle > Math.PI ? angle - Math.PI * 2 : angle, y);
      positions.push(x, y, z);
      const forward = Math.max(0, Math.cos(angle));
      const cheeks = [-0.115, 0.115].reduce((sum, cheekX) => sum +
        Math.exp(-(((x - cheekX) / 0.05) ** 2 + ((y + 0.035) / 0.067) ** 2)), 0);
      const sockets = [-0.087, 0.087].reduce((sum, eyeX) => sum +
        Math.exp(-(((x - eyeX) / 0.054) ** 2 + ((y - 0.05) / 0.031) ** 2)), 0);
      const nose = Math.exp(-((x / 0.035) ** 2 + ((y + 0.04) / 0.075) ** 2));
      const lower = Math.max(0, Math.min(1, (-y - 0.12) / 0.13));
      const tone = 0.98 + forward * (0.035 * cheeks - 0.052 * sockets + 0.02 * nose - 0.045 * lower);
      colors.push(tone * (1 + 0.01 * cheeks), tone * (1 - 0.015 * cheeks),
        tone * (1 - 0.02 * cheeks));
      if (row && column < columns) {
        const below = (row - 1) * (columns + 1) + column;
        const above = row * (columns + 1) + column;
        indices.push(below, below + 1, above, below + 1, above + 1, above);
      }
    }
  }
  const result = shape(positions, indices);
  result.setAttribute("color", new BufferAttribute(new Float32Array(colors), 3));
  return result;
}

function almondEye(centerX: number, centerY: number): BufferGeometry {
  const steps = 18;
  const positions: number[] = [];
  const indices: number[] = [];
  for (let index = 0; index <= steps; index += 1) {
    const t = index / steps * 2 - 1;
    const x = centerX + t * 0.043;
    const height = Math.sqrt(Math.max(0, 1 - t * t));
    const upper = centerY + 0.011 * height;
    const lower = centerY - 0.008 * height;
    positions.push(x, upper, headSurfaceZ(x, upper) + 0.004,
      x, lower, headSurfaceZ(x, lower) + 0.004);
    if (index < steps) {
      const point = index * 2;
      indices.push(point, point + 1, point + 2,
        point + 2, point + 1, point + 3);
    }
  }
  return shape(positions, indices);
}

function beardShell(): BufferGeometry {
  const rows = 14;
  const columns = 48;
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row <= rows; row += 1) {
    const t = row / rows;
    for (let column = 0; column <= columns; column += 1) {
      const angle = -2.45 + column / columns * 4.9;
      const side = Math.abs(angle) / 2.45;
      const top = -0.139 + 0.09 * side * side + 0.004 * Math.sin(7 * angle);
      const taper = Math.max(0, Math.min(1, (side - 0.78) / 0.22));
      const bottom = -0.257 + 0.064 * side + 0.145 * taper * taper;
      const y = top + (bottom - top) * t;
      const [x, z] = headPoint(angle, y);
      positions.push(x * 1.015, y, z * 1.024 + 0.004);
      const tone = 0.77 + 0.17 * (0.5 + 0.5 * Math.sin(9 * angle + 13 * t));
      colors.push(tone, tone * 0.91, tone * 0.88);
      if (row < rows && column < columns) {
        const index = row * (columns + 1) + column;
        indices.push(index, index + columns + 1, index + 1,
          index + 1, index + columns + 1, index + columns + 2);
      }
    }
  }
  const result = shape(positions, indices);
  result.setAttribute("color", new BufferAttribute(new Float32Array(colors), 3));
  return result;
}

function hairSurface(angle: number, t: number): Vector3 {
  const radius = Math.sqrt(Math.max(0, 1 - t * t));
  const forward = Math.cos(angle);
  const hairline = 0.047 + 0.098 * Math.max(0, forward)
    - 0.04 * Math.max(0, -forward) + 0.055 * Math.sin(angle);
  const crest = 0.03 * Math.exp(-(((Math.sin(angle) - 0.32) / 0.61) ** 2))
    * Math.max(0, forward) * Math.sin(Math.PI * t);
  const wave = 0.008 * Math.sin(5 * angle - 4 * t) * Math.sin(Math.PI * t);
  const swell = Math.sin(Math.PI * t);
  return new Vector3(
    (0.195 + 0.03 * swell + wave) * radius * Math.sin(angle) + 0.047 * t * t,
    hairline + (0.365 - hairline) * t + crest,
    (0.164 + 0.026 * swell + wave * 0.7) * radius * forward - 0.013,
  );
}

function hairBase(): BufferGeometry {
  const rows = 24;
  const columns = 64;
  const positions: number[] = [];
  const colors: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row <= rows; row += 1) {
    const t = row / rows;
    for (let column = 0; column <= columns; column += 1) {
      const angle = -Math.PI + column / columns * Math.PI * 2;
      const tone = 0.62 + 0.38 * (0.5 + 0.5 * Math.sin(5 * angle - 4 * t));
      const point = hairSurface(angle, t);
      positions.push(point.x, point.y, point.z);
      colors.push(tone, tone * 0.94, tone * 0.92);
      uvs.push(column / columns, t);
      if (row && column < columns) {
        const below = (row - 1) * (columns + 1) + column;
        const above = row * (columns + 1) + column;
        indices.push(below, below + 1, above, below + 1, above + 1, above);
      }
    }
  }
  const result = shape(positions, indices);
  result.setAttribute("color", new BufferAttribute(new Float32Array(colors), 3));
  result.setAttribute("uv", new BufferAttribute(new Float32Array(uvs), 2));
  return result;
}

function sweptHairLock(startAngle: number, endAngle: number, startT: number, endT: number): BufferGeometry {
  const rows = 22;
  const positions: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row <= rows; row += 1) {
    const s = row / rows;
    const angle = startAngle + (endAngle - startAngle) * s + 0.07 * Math.sin(Math.PI * s);
    const t = startT + (endT - startT) * s + 0.035 * Math.sin(2 * Math.PI * s);
    const width = 0.015 + 0.12 * Math.sin(Math.PI * s);
    for (const lateral of [-1, 0, 1]) {
      const actualAngle = angle + width * lateral;
      const point = hairSurface(actualAngle, t);
      const lift = (lateral === 0 ? 0.019 : 0.004) * Math.sin(Math.PI * s);
      const normal = new Vector3(Math.sin(actualAngle), 0.35, Math.cos(actualAngle)).normalize();
      point.addScaledVector(normal, lift);
      positions.push(point.x, point.y, point.z);
    }
    if (row < rows) {
      const index = row * 3;
      indices.push(index, index + 3, index + 1,
        index + 1, index + 3, index + 4,
        index + 1, index + 4, index + 2,
        index + 2, index + 4, index + 5);
    }
  }
  return shape(positions, indices);
}

function lapelRibbon(side: number): BufferGeometry {
  const rows = [
    { x: 0.097, y: 0.638, width: 0.026 },
    { x: 0.168, y: 0.535, width: 0.052 },
    { x: 0.126, y: 0.365, width: 0.027 },
  ];
  const positions: number[] = [];
  const indices: number[] = [];
  for (const lift of [0.026, 0.014]) {
    rows.forEach(({ x, y, width }) => {
      for (const edge of [-1, 1]) {
        const actualX = side * (x + edge * width);
        positions.push(actualX, y, faceZ(BODY, actualX, y) + lift);
      }
    });
  }
  const back = rows.length * 2;
  for (let row = 0; row < rows.length - 1; row += 1) {
    const index = row * 2;
    indices.push(index, index + 2, index + 1, index + 1, index + 2, index + 3);
    indices.push(back + index, back + index + 1, back + index + 2,
      back + index + 1, back + index + 3, back + index + 2);
    for (const edge of [0, 1]) {
      const a = index + edge;
      const b = index + 2 + edge;
      indices.push(a, back + a, b, b, back + a, back + b);
    }
  }
  return shape(positions, indices);
}

function collarPanel(side: number): BufferGeometry {
  const points: Array<[number, number]> = [
    [side * 0.034, 0.635], [side * 0.11, 0.601],
    [side * 0.092, 0.545], [side * 0.021, 0.576],
  ];
  const positions = points.flatMap(([x, y]) => [x, y, faceZ(BODY, x, y) + 0.017]);
  return shape(positions, [0, 1, 2, 0, 2, 3]);
}

function jacketShell(): BufferGeometry {
  const rows = 24;
  const columns = 40;
  const positions: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row <= rows; row += 1) {
    const y = BODY[0].y + row / rows * (BODY[BODY.length - 1].y - BODY[0].y);
    const ring = ringAt(BODY, y);
    const chestOpening = Math.exp(-(((y - 0.54) / 0.17) ** 2));
    const opening = 0.34 + 0.12 * chestOpening;
    for (let column = 0; column <= columns; column += 1) {
      const angle = opening + column / columns * (Math.PI * 2 - 2 * opening);
      const wrapped = angle > Math.PI ? angle - Math.PI * 2 : angle;
      const frontTail = 0.048 * Math.exp(-(((Math.abs(wrapped) - 0.55) / 0.28) ** 2))
        * (1 - row / rows) ** 3;
      positions.push((ring.rx + 0.014) * Math.sin(angle), y - frontTail,
        (ring.rz + 0.014) * Math.cos(angle));
      if (row && column < columns) {
        const below = (row - 1) * (columns + 1) + column;
        const above = row * (columns + 1) + column;
        indices.push(below, below + 1, above, below + 1, above + 1, above);
      }
    }
  }
  return shape(positions, indices);
}

function shirtFront(): BufferGeometry {
  const rows = 24;
  const positions: number[] = [];
  const indices: number[] = [];
  for (let row = 0; row <= rows; row += 1) {
    const y = row / rows * BODY[BODY.length - 1].y;
    const ring = ringAt(BODY, y);
    const chestOpening = Math.exp(-(((y - 0.54) / 0.17) ** 2));
    const width = ring.rx * Math.sin(0.34 + 0.12 * chestOpening) + 0.008;
    for (const x of [-width, 0, width]) {
      positions.push(x, y, faceZ(BODY, x, y) + 0.011);
    }
    if (row < rows) {
      const index = row * 3;
      indices.push(index, index + 1, index + 3,
        index + 1, index + 4, index + 3,
        index + 1, index + 2, index + 4,
        index + 2, index + 5, index + 4);
    }
  }
  return shape(positions, indices);
}

function oxfordUpper(): BufferGeometry {
  const sections = [
    { z: -0.11, width: 0.065, top: 0.072 },
    { z: -0.04, width: 0.079, top: 0.112 },
    { z: 0.055, width: 0.092, top: 0.092 },
    { z: 0.135, width: 0.096, top: 0.062 },
    { z: 0.18, width: 0.071, top: 0.043 },
    { z: 0.205, width: 0.026, top: 0.03 },
  ];
  const positions: number[] = [];
  const indices: number[] = [];
  sections.forEach(({ z, width, top }, index) => {
    positions.push(-width, 0.017, z, width, 0.017, z, -width, top, z, width, top, z);
    if (index < sections.length - 1) {
      const i = index * 4;
      indices.push(i + 2, i + 6, i + 3, i + 3, i + 6, i + 7);
      indices.push(i, i + 1, i + 4, i + 1, i + 5, i + 4);
      indices.push(i, i + 4, i + 2, i + 2, i + 4, i + 6);
      indices.push(i + 1, i + 3, i + 5, i + 3, i + 7, i + 5);
    }
  });
  return shape(positions, indices);
}

function soleGeometry(): BufferGeometry {
  const sections = [
    { z: -0.12, width: 0.067 }, { z: -0.05, width: 0.08 },
    { z: 0.09, width: 0.105 }, { z: 0.17, width: 0.082 },
    { z: 0.213, width: 0.026 },
  ];
  const positions: number[] = [];
  const indices: number[] = [];
  sections.forEach(({ z, width }, index) => {
    positions.push(-width, 0, z, width, 0, z, -width, 0.023, z, width, 0.023, z);
    if (index < sections.length - 1) {
      const i = index * 4;
      indices.push(i + 2, i + 6, i + 3, i + 3, i + 6, i + 7);
      indices.push(i, i + 1, i + 4, i + 1, i + 5, i + 4);
      indices.push(i, i + 4, i + 2, i + 2, i + 4, i + 6);
      indices.push(i + 1, i + 3, i + 5, i + 3, i + 7, i + 5);
    }
  });
  return shape(positions, indices);
}

function part(parent: Group, name: string, geometry: BufferGeometry, material: Material,
  position: [number, number, number] = [0, 0, 0], scale: [number, number, number] = [1, 1, 1],
  shadow = true): Mesh {
  const result = new Mesh(geometry, material);
  result.name = name;
  result.position.set(...position);
  result.scale.set(...scale);
  result.castShadow = shadow;
  result.receiveShadow = shadow;
  parent.add(result);
  return result;
}

function curveGeometry(points: Array<[number, number, number]>, radius: number): BufferGeometry {
  return new TubeGeometry(new CatmullRomCurve3(points.map(([x, y, z]) => new Vector3(x, y, z))),
    14, radius, 6, false);
}

/** A portrait-led sculptural figure with one modeled face and shared, disposable resources. */
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
    const rounded = new SphereGeometry(1, 16, 12);
    const rodShape = new CylinderGeometry(1, 1, 1, 8);
    const glassesRing = new TorusGeometry(0.047, 0.0016, 5, 36);
    const lens = new CylinderGeometry(0.046, 0.046, 0.001, 32);
    const upperSleeve = loft([
      { y: -0.34, rx: 0.059, rz: 0.06, cx: 0.032, cz: 0.016 },
      { y: -0.22, rx: 0.067, rz: 0.067, cx: 0.027, cz: 0.01 },
      { y: -0.06, rx: 0.077, rz: 0.075, cx: 0.014 },
      { y: 0.04, rx: 0.089, rz: 0.081 },
      { y: 0.105, rx: 0.03, rz: 0.035 },
    ], 16);
    const lowerSleeve = loft([
      { y: -0.318, rx: 0.048, rz: 0.047, cx: -0.017, cz: 0.03 },
      { y: -0.2, rx: 0.053, rz: 0.051, cx: 0.008, cz: 0.025 },
      { y: -0.04, rx: 0.06, rz: 0.058, cx: 0.028, cz: 0.007 },
      { y: 0.025, rx: 0.066, rz: 0.063, cx: 0.032 },
    ], 16);
    const thigh = loft([
      { y: -0.39, rx: 0.073, rz: 0.075, cx: 0.012, cz: 0.012 },
      { y: -0.24, rx: 0.083, rz: 0.082, cx: 0.01, cz: 0.006 },
      { y: -0.05, rx: 0.095, rz: 0.092, cx: 0.006 },
      { y: 0.035, rx: 0.097, rz: 0.092 },
    ], 16);
    const calf = loft([
      { y: -0.405, rx: 0.062, rz: 0.064, cx: -0.008, cz: 0.014 },
      { y: -0.25, rx: 0.07, rz: 0.072, cz: 0.009 },
      { y: -0.07, rx: 0.076, rz: 0.077, cx: 0.006 },
      { y: 0.025, rx: 0.071, rz: 0.073 },
    ], 16);
    const cuff = new CylinderGeometry(0.055, 0.052, 0.022, 12);
    const finger = new CylinderGeometry(0.008, 0.006, 0.043, 7);
    const shoe = oxfordUpper();
    const sole = soleGeometry();
    const box = new BoxGeometry(1, 1, 1);

    this.hips.name = "hips";
    this.hips.position.y = 1.15;
    this.group.add(this.hips);
    part(this.hips, "shaped inner torso", loft(BODY, 32), mat.wool);
    part(this.hips, "curved white shirt front", shirtFront(), mat.cotton,
      undefined, undefined, false);
    part(this.hips, "wraparound fitted navy jacket", jacketShell(), mat.wool);
    part(this.hips, "open collar at throat", shape([
      -0.034, 0.644, faceZ(BODY, -0.034, 0.644) + 0.022,
      0, 0.588, faceZ(BODY, 0, 0.588) + 0.022,
      0.034, 0.644, faceZ(BODY, 0.034, 0.644) + 0.022,
    ], [0, 1, 2]), mat.skin, undefined, undefined, false);
    for (const side of [-1, 1]) {
      const name = side < 0 ? "left" : "right";
      part(this.hips, `${name} folded shirt collar`, collarPanel(side), mat.cotton,
        undefined, undefined, false);
      part(this.hips, `${name} continuous tailored lapel`, lapelRibbon(side), mat.lapel,
        undefined, undefined, false);
      part(this.hips, `${name} pocket welt`, box, mat.lapel,
        [side * 0.165, 0.155, 0.127], [0.07, 0.009, 0.009], false);
    }
    for (const y of [0.39, 0.27, 0.15]) {
      part(this.hips, `shirt button ${y}`, rounded, mat.cotton,
        [0, y, faceZ(BODY, 0, y) + 0.018], [0.006, 0.006, 0.003], false);
    }
    part(this.hips, "small brown belt", box, mat.leather,
      [0, -0.005, 0.131], [0.126, 0.019, 0.012], false);
    part(this.hips, "belt buckle", box, mat.gold,
      [0, -0.005, 0.14], [0.027, 0.022, 0.006], false);

    this.buildLeg("left", -1, thigh, calf, shoe, sole, box, mat);
    this.buildLeg("right", 1, thigh, calf, shoe, sole, box, mat);
    this.buildArm("left", -1, upperSleeve, lowerSleeve, cuff, rounded, finger, mat);
    this.buildArm("right", 1, upperSleeve, lowerSleeve, cuff, rounded, finger, mat);

    this.neck.name = "neck";
    this.neck.position.y = 0.655;
    this.hips.add(this.neck);
    part(this.neck, "neck", rounded, mat.skin, [0, 0.045, 0], [0.079, 0.107, 0.072]);
    this.head.name = "head";
    this.head.position.y = 0.185;
    this.head.scale.setScalar(0.92);
    this.neck.add(this.head);
    part(this.head, "sculpted face cheeks and jaw", sculptedHead(), mat.skinFace);
    part(this.head, "continuous jaw beard", beardShell(), mat.beardMass,
      undefined, undefined, false);
    for (const side of [-1, 1]) {
      const name = side < 0 ? "left" : "right";
      part(this.head, `${name} ear`, rounded, mat.skin,
        [side * 0.208, -0.035, -0.014], [0.03, 0.054, 0.028]);
      const eyeX = side * 0.087;
      const eyeY = 0.041;
      const surfaceZ = headSurfaceZ(eyeX, eyeY);
      part(this.head, `${name} seated almond eye`, almondEye(eyeX, eyeY), mat.eyeWhite,
        undefined, undefined, false);
      part(this.head, `${name} dark iris`, rounded, mat.iris,
        [eyeX + side * 0.002, eyeY, surfaceZ + 0.007], [0.008, 0.009, 0.003], false);
      part(this.head, `${name} upper eyelid`, curveGeometry([
        [eyeX - 0.041, eyeY, headSurfaceZ(eyeX - 0.041, eyeY) + 0.006],
        [eyeX - 0.02, eyeY + 0.009, headSurfaceZ(eyeX - 0.02, eyeY + 0.009) + 0.006],
        [eyeX, eyeY + 0.011, headSurfaceZ(eyeX, eyeY + 0.011) + 0.006],
        [eyeX + 0.02, eyeY + 0.009, headSurfaceZ(eyeX + 0.02, eyeY + 0.009) + 0.006],
        [eyeX + 0.041, eyeY, headSurfaceZ(eyeX + 0.041, eyeY) + 0.006],
      ], 0.0025), mat.skinShade, undefined, undefined, false);
      part(this.head, `${name} eye catchlight`, rounded, mat.eyeWhite,
        [eyeX + side * 0.001, eyeY + 0.004, surfaceZ + 0.011], [0.002, 0.002, 0.001], false);
      part(this.head, `${name} expressive eyebrow`, curveGeometry([
        [side * 0.035, 0.084, headSurfaceZ(side * 0.035, 0.084) + 0.009],
        [side * 0.074, 0.094, headSurfaceZ(side * 0.074, 0.094) + 0.009],
        [side * 0.117, 0.09, headSurfaceZ(side * 0.117, 0.09) + 0.009],
        [side * 0.136, 0.082, headSurfaceZ(side * 0.136, 0.082) + 0.009],
      ], 0.006), mat.hair, undefined, undefined, false);
      const moustacheX = side * 0.032;
      const moustacheY = -0.11;
      part(this.head, `${name} sculpted moustache`, rounded, mat.beard,
        [moustacheX, moustacheY, headSurfaceZ(moustacheX, moustacheY) + 0.004],
        [0.035, 0.0085, 0.007], false).rotation.z = -side * 0.12;
      part(this.head, `${name} nostril`, rounded, mat.skinShade,
        [side * 0.023, -0.089, headSurfaceZ(side * 0.023, -0.089) + 0.004],
        [0.006, 0.003, 0.002], false);
      const glassesZ = surfaceZ + 0.025;
      part(this.head, `${name} gold glasses rim`, glassesRing, mat.gold,
        [eyeX, eyeY, glassesZ], [1, 0.82, 1], false).rotation.y = side * 0.15;
      part(this.head, `${name} clear lens`, lens, mat.glass,
        [eyeX, eyeY, glassesZ - 0.002], [1, 1, 0.82], false).rotation.x = Math.PI / 2;
      this.rod(this.head, `${name} gold temple`, rodShape, mat.gold,
        new Vector3(side * 0.136, eyeY, glassesZ - 0.008),
        new Vector3(side * 0.208, 0.014, 0), 0.002);
    }
    part(this.head, "subtle smiling mouth", curveGeometry([
      [-0.052, -0.128, headSurfaceZ(-0.052, -0.128) + 0.006],
      [-0.026, -0.14, headSurfaceZ(-0.026, -0.14) + 0.006],
      [0, -0.143, headSurfaceZ(0, -0.143) + 0.006],
      [0.026, -0.14, headSurfaceZ(0.026, -0.14) + 0.006],
      [0.052, -0.128, headSurfaceZ(0.052, -0.128) + 0.006],
    ], 0.0025), mat.iris, undefined, undefined, false);
    part(this.head, "lower lip", rounded, mat.lip,
      [0, -0.155, headSurfaceZ(0, -0.155) + 0.004], [0.04, 0.006, 0.003], false);
    part(this.head, "fine gold glasses bridge", curveGeometry([
      [-0.038, 0.056, headSurfaceZ(-0.038, 0.056) + 0.028],
      [0, 0.063, headSurfaceZ(0, 0.063) + 0.028],
      [0.038, 0.056, headSurfaceZ(0.038, 0.056) + 0.028],
    ], 0.0018), mat.gold, undefined, undefined, false);

    part(this.head, "single sculpted wavy hair mass", hairBase(), mat.hairMass);
    for (const [name, startAngle, endAngle, startT, endT] of [
      ["swept forelock A", -1.08, 0.24, 0.09, 0.69],
      ["swept forelock B", -0.82, 0.49, 0.1, 0.78],
      ["swept forelock C", -0.55, 0.72, 0.12, 0.82],
      ["swept forelock D", -0.3, 0.92, 0.16, 0.76],
      ["upper crown lock", -1.2, 0.37, 0.47, 0.91],
    ] as Array<[string, number, number, number, number]>) {
      part(this.head, name, sweptHairLock(startAngle, endAngle, startT, endT), mat.hairLock,
        undefined, undefined, false);
    }
  }

  update(input: AvatarInput, delta: number): AvatarPose {
    const pose = this.motion.update(input, delta);
    const dt = Number.isFinite(delta) ? Math.max(0, Math.min(delta, 0.1)) : 0;
    this.group.position.x += pose.velocityX * dt;
    this.group.position.z += pose.velocityZ * dt;
    this.group.rotation.y = pose.yaw;
    this.hips.position.y = 1.15 + pose.bounce + pose.breath;
    this.hips.rotation.x = pose.lean;
    this.hips.rotation.z = -pose.turnRate / 3.4 * 0.018;
    this.leftHip.rotation.x = pose.stride * 0.34;
    this.rightHip.rotation.x = -pose.stride * 0.34;
    this.leftKnee.rotation.x = Math.max(0, -pose.stride) * 0.26;
    this.rightKnee.rotation.x = Math.max(0, pose.stride) * 0.26;
    this.leftShoulder.rotation.x = -pose.stride * 0.24;
    this.rightShoulder.rotation.x = pose.stride * 0.24 - pose.interaction * 0.75;
    this.leftElbow.rotation.x = -0.16;
    this.rightElbow.rotation.x = -0.16 - pose.interaction * 0.48;
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
      -Math.atan2(local.y - 1.99, Math.hypot(local.x, local.z))));
  }

  private buildLeg(name: "left" | "right", side: number, thigh: BufferGeometry, calf: BufferGeometry,
    upper: BufferGeometry, sole: BufferGeometry, box: BufferGeometry,
    mat: AvatarMaterials): void {
    const hip = side < 0 ? this.leftHip : this.rightHip;
    const knee = side < 0 ? this.leftKnee : this.rightKnee;
    hip.name = `${name}Hip`;
    hip.position.set(side * 0.13, 1.15, 0);
    hip.scale.y = 1.335;
    hip.rotation.z = side * 0.025;
    this.group.add(hip);
    part(hip, `${name} trouser thigh`, thigh, mat.wool,
      undefined, [side, 1, 1]);
    knee.name = `${name}Knee`;
    knee.position.y = -0.387;
    knee.rotation.z = -side * 0.03;
    hip.add(knee);
    part(knee, `${name} shaped trouser calf`, calf, mat.wool,
      undefined, [side, 1, 1]);
    const shoeY = -0.474;
    part(knee, `${name} curved Oxford upper`, upper, mat.leather, [0, shoeY, 0]);
    part(knee, `${name} outlined shoe sole`, sole, mat.sole, [0, shoeY, 0]);
    part(knee, `${name} dark heel`, box, mat.sole,
      [0, shoeY + 0.015, -0.079], [0.125, 0.03, 0.064]);
    part(knee, `${name} Oxford vamp seam`, curveGeometry([
      [-0.07, shoeY + 0.07, 0.075], [0, shoeY + 0.084, 0.084],
      [0.07, shoeY + 0.07, 0.075],
    ], 0.0016), mat.sole, undefined, undefined, false);
    for (const z of [-0.018, 0.013, 0.044]) {
      this.rod(knee, `${name} shoe lace ${z}`, box, mat.sole,
        new Vector3(-0.024, shoeY + 0.112 - (z + 0.018) * 0.22, z),
        new Vector3(0.024, shoeY + 0.112 - (z + 0.018) * 0.22, z), 0.0015);
    }
  }

  private buildArm(name: "left" | "right", side: number, upper: BufferGeometry, lower: BufferGeometry,
    cuff: BufferGeometry, rounded: BufferGeometry, finger: BufferGeometry, mat: AvatarMaterials): void {
    const shoulder = side < 0 ? this.leftShoulder : this.rightShoulder;
    const elbow = side < 0 ? this.leftElbow : this.rightElbow;
    shoulder.name = `${name}Shoulder`;
    shoulder.position.set(side * 0.261, 0.47, 0);
    shoulder.rotation.z = side * 0.18;
    this.hips.add(shoulder);
    part(shoulder, `${name} tailored upper sleeve`, upper, mat.wool,
      undefined, [side, 1, 1]);
    elbow.name = `${name}Elbow`;
    elbow.position.set(side * 0.016, -0.33, 0);
    elbow.rotation.z = -side * 0.27;
    shoulder.add(elbow);
    part(elbow, `${name} tapered forearm sleeve`, lower, mat.wool,
      undefined, [side, 1, 1]);
    part(elbow, `${name} white shirt cuff`, cuff, mat.cotton,
      [0, -0.318, 0]);
    part(elbow, `${name} relaxed palm`, rounded, mat.skin,
      [0, -0.37, 0.012], [0.04, 0.061, 0.036]);
    for (const x of [-0.024, -0.008, 0.008, 0.024]) {
      part(elbow, `${name} finger ${x}`, finger, mat.skin,
        [x, -0.421, 0.019], [1, 1, 1]);
    }
    part(elbow, `${name} thumb`, rounded, mat.skin,
      [-side * 0.042, -0.363, 0.041], [0.017, 0.041, 0.019]);
  }

  private rod(parent: Group, name: string, geometry: BufferGeometry, material: Material,
    start: Vector3, end: Vector3, radius: number): void {
    const direction = end.clone().sub(start);
    const result = part(parent, name, geometry, material,
      [start.x + direction.x * 0.5, start.y + direction.y * 0.5, start.z + direction.z * 0.5],
      [radius, direction.length(), radius]);
    result.quaternion.setFromUnitVectors(UP, direction.normalize());
  }
}
