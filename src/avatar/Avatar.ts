import {
  BufferAttribute, CapsuleGeometry, DoubleSide, Group, Mesh,
  MeshStandardMaterial, PlaneGeometry, SRGBColorSpace, TextureLoader, Vector3,
  type Texture,
} from "three";
import { AvatarMotion, type AvatarInput, type AvatarPose } from "./AvatarMotion";

const HEIGHT = 2.18;
const WIDTH = 1.08;
const ANGLES = [0, Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4, Math.PI] as const;
const NAMES = ["front", "quarter_positive", "side_positive",
  "rear_quarter_positive", "back", "quarter_negative", "side_negative",
  "rear_quarter_negative"] as const;
type ViewName = typeof NAMES[number];
export interface AvatarViewSelection { from: ViewName; to: ViewName; blend: number }
const FACE_CENTERS: Record<ViewName, number> = {
  front: 256, quarter_positive: 230, side_positive: 199,
  rear_quarter_positive: 213, back: 256,
  quarter_negative: 282, side_negative: 313, rear_quarter_negative: 299,
};
const VIEW_YAWS: Record<ViewName, number> = {
  front: 0, quarter_positive: Math.PI / 4, side_positive: Math.PI / 2,
  rear_quarter_positive: 3 * Math.PI / 4, back: Math.PI,
  quarter_negative: -Math.PI / 4, side_negative: -Math.PI / 2,
  rear_quarter_negative: -3 * Math.PI / 4,
};

function clamp01(value: number): number { return Math.max(0, Math.min(1, value)); }

/** Continuous view selection from one approved character turnaround. */
export function selectAvatarViews(angle: number): AvatarViewSelection {
  const normalized = Math.atan2(Math.sin(angle), Math.cos(angle));
  const positive = normalized >= 0;
  const names: ViewName[] = ["front",
    positive ? "quarter_positive" : "quarter_negative",
    positive ? "side_positive" : "side_negative",
    positive ? "rear_quarter_positive" : "rear_quarter_negative", "back"];
  const absolute = Math.abs(normalized);
  for (let index = 0; index < ANGLES.length - 1; index += 1) {
    const start = ANGLES[index];
    const end = ANGLES[index + 1];
    if (absolute <= end) {
      const orbitProgress = clamp01((absolute - start) / (end - start));
      // Retain a crisp character image for most of each arc. The short,
      // eased interval still has no threshold jump or unrelated face swap.
      const bandStart = index >= 2 ? 0.55 : 0.84;
      const bandEnd = index >= 2 ? 0.72 : 0.98;
      const t = clamp01((orbitProgress - bandStart) / (bandEnd - bandStart));
      return { from: names[index], to: names[index + 1], blend: t * t * (3 - 2 * t) };
    }
  }
  return { from: "back", to: "back", blend: 0 };
}

function viewGeometry(): PlaneGeometry {
  const geometry = new PlaneGeometry(WIDTH, HEIGHT, 48, 96);
  const positions = geometry.getAttribute("position") as BufferAttribute;
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index) + HEIGHT / 2;
    const roundness = 0.038 + 0.06 * Math.exp(-(((y - 1.42) / 0.55) ** 2))
      + 0.034 * Math.exp(-(((y - 1.93) / 0.23) ** 2));
    const fraction = x / (WIDTH / 2);
    positions.setXYZ(index, x, y, roundness * Math.max(0, 1 - fraction * fraction));
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

function shadowPart(parent: Group, name: string, radius: number, length: number,
  x: number, y: number, z: number, material: MeshStandardMaterial,
  scaleX = 1, scaleY = 1, scaleZ = 1): void {
  const mesh = new Mesh(new CapsuleGeometry(radius, length, 6, 12), material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.scale.set(scaleX, scaleY, scaleZ);
  mesh.castShadow = true;
  parent.add(mesh);
}

function loadViews(prefix: string): Record<ViewName, Texture> {
  const loader = new TextureLoader();
  const result = {} as Record<ViewName, Texture>;
  for (const name of NAMES) {
    const texture = loader.load(`/assets/avatar/${prefix}${name}.webp`);
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 8;
    result[name] = texture;
  }
  return result;
}

function viewMaterial(views: Record<ViewName, Texture>,
  actionViews: Record<ViewName, Texture>, walkLeftViews: Record<ViewName, Texture>,
  walkRightViews: Record<ViewName, Texture>, from: { value: Texture },
  to: { value: Texture }, actionFrom: { value: Texture },
  actionTo: { value: Texture }, walkFrom: { value: Texture },
  walkTo: { value: Texture }, mix: { value: number },
  actionMix: { value: number }, walkMix: { value: number },
  faceFromShift: { value: number },
  faceToShift: { value: number }, wipeSign: { value: number }): MeshStandardMaterial {
  const material = new MeshStandardMaterial({
    color: 0xffffff, map: views.front, transparent: true, alphaTest: 0.025,
    depthWrite: true, side: DoubleSide, roughness: 0.92, metalness: 0,
    emissive: 0x17191d, emissiveIntensity: 0.15,
  });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.avatarSource = from;
    shader.uniforms.avatarDestination = to;
    shader.uniforms.avatarBlend = mix;
    shader.uniforms.avatarActionSource = actionFrom;
    shader.uniforms.avatarActionDestination = actionTo;
    shader.uniforms.avatarActionBlend = actionMix;
    shader.uniforms.avatarWalkSource = walkFrom;
    shader.uniforms.avatarWalkDestination = walkTo;
    shader.uniforms.avatarWalkBlend = walkMix;
    shader.uniforms.avatarFaceFromShift = faceFromShift;
    shader.uniforms.avatarFaceToShift = faceToShift;
    shader.uniforms.avatarWipeSign = wipeSign;
    shader.fragmentShader = shader.fragmentShader.replace("#include <common>", `#include <common>
uniform sampler2D avatarSource;
uniform sampler2D avatarDestination;
uniform sampler2D avatarActionSource;
uniform sampler2D avatarActionDestination;
uniform sampler2D avatarWalkSource;
uniform sampler2D avatarWalkDestination;
uniform float avatarBlend;
uniform float avatarActionBlend;
uniform float avatarWalkBlend;
uniform float avatarFaceFromShift;
uniform float avatarFaceToShift;
uniform float avatarWipeSign;`)
      .replace("#include <map_fragment>", `#ifdef USE_MAP
float avatarHeadWeight = smoothstep(0.72, 0.83, vMapUv.y);
vec2 avatarUvA = vMapUv + vec2(avatarFaceFromShift * avatarHeadWeight, 0.0);
vec2 avatarUvB = vMapUv + vec2(avatarFaceToShift * avatarHeadWeight, 0.0);
vec4 avatarA = texture2D(avatarSource, avatarUvA);
vec4 avatarB = texture2D(avatarDestination, avatarUvB);
vec4 avatarC = texture2D(avatarActionSource, avatarUvA);
vec4 avatarD = texture2D(avatarActionDestination, avatarUvB);
vec4 avatarE = texture2D(avatarWalkSource, avatarUvA);
vec4 avatarF = texture2D(avatarWalkDestination, avatarUvB);
float transitionX = avatarWipeSign > 0.0 ? vMapUv.x : 1.0 - vMapUv.x;
float bodyMix = smoothstep(1.0 - avatarBlend - 0.045,
  1.0 - avatarBlend + 0.045, transitionX);
float faceMix = smoothstep(0.69, 0.91, avatarBlend);
float localMix = mix(bodyMix, faceMix, avatarHeadWeight);
vec4 avatarIdle = mix(avatarA, avatarB, localMix);
vec4 avatarAction = mix(avatarC, avatarD, localMix);
vec4 avatarWalk = mix(avatarE, avatarF, localMix);
diffuseColor *= mix(mix(avatarIdle, avatarWalk, avatarWalkBlend),
  avatarAction, avatarActionBlend);
#endif`);
  };
  material.customProgramCacheKey = () => "approved-multiview-avatar-v4";
  material.addEventListener("dispose", () => {
    for (const texture of Object.values(views)) texture.dispose();
    for (const texture of Object.values(actionViews)) texture.dispose();
    for (const texture of Object.values(walkLeftViews)) texture.dispose();
    for (const texture of Object.values(walkRightViews)) texture.dispose();
  });
  return material;
}

/** Curved, lit character surface and articulated, cast-shadow depth shell. */
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
  private readonly views = loadViews("");
  private readonly actionViews = loadViews("interact-");
  private readonly walkLeftViews = loadViews("walk-left-");
  private readonly walkRightViews = loadViews("walk-right-");
  private readonly from = { value: this.views.front };
  private readonly to = { value: this.views.front };
  private readonly actionFrom = { value: this.actionViews.front };
  private readonly actionTo = { value: this.actionViews.front };
  private readonly walkFrom = { value: this.walkLeftViews.front };
  private readonly walkTo = { value: this.walkLeftViews.front };
  private readonly mix = { value: 0 };
  private readonly actionMix = { value: 0 };
  private readonly walkMix = { value: 0 };
  private readonly faceFromShift = { value: 0 };
  private readonly faceToShift = { value: 0 };
  private readonly wipeSign = { value: 1 };
  private readonly visual: Mesh<PlaneGeometry, MeshStandardMaterial>;
  private readonly rest: Float32Array;
  private readonly cameraPosition = new Vector3();
  private headAimYaw = 0;
  private headAimPitch = 0;
  private walkForward = true;
  private reducedMotion = false;

  // The approved turnaround was derived from the supplied portrait. All
  // visible angles use that single design; the caller retains portrait ownership.
  constructor(portrait: Texture) {
    void portrait;
    this.group.name = "KrishnaAvatar";
    const geometry = viewGeometry();
    this.rest = Float32Array.from(geometry.getAttribute("position").array as ArrayLike<number>);
    this.visual = new Mesh(geometry,
      viewMaterial(this.views, this.actionViews, this.walkLeftViews,
        this.walkRightViews, this.from, this.to,
        this.actionFrom, this.actionTo, this.walkFrom, this.walkTo,
        this.mix, this.actionMix, this.walkMix,
        this.faceFromShift, this.faceToShift, this.wipeSign));
    this.visual.name = "lit curved approved character surface";
    this.visual.receiveShadow = true;
    this.visual.frustumCulled = false;
    this.visual.renderOrder = 1;
    this.visual.onBeforeRender = (_renderer, _scene, camera) => {
      camera.getWorldPosition(this.cameraPosition);
      this.orientTo(this.cameraPosition);
    };
    this.group.add(this.visual);

    // These genuine volumes have depth, follow the logical joints, and cast
    // humanoid shadows. They cannot cover the authored face, garments or gaps.
    const shadow = new MeshStandardMaterial({ color: 0x1b2946,
      colorWrite: false, depthWrite: false });
    this.hips.name = "hips";
    this.hips.position.y = 1.13;
    this.group.add(this.hips);
    shadowPart(this.hips, "torso depth shell", 0.21, 0.5,
      0, 0.25, -0.025, shadow, 1.25, 1, 0.7);
    this.neck.name = "neck";
    this.neck.position.y = 0.65;
    this.hips.add(this.neck);
    shadowPart(this.neck, "neck depth shell", 0.065, 0.09, 0, 0.04, 0, shadow);
    this.head.name = "head";
    this.head.position.y = 0.13;
    this.neck.add(this.head);
    shadowPart(this.head, "head and hair depth shell", 0.19, 0.17,
      0, 0.06, 0, shadow, 1, 1.05, 0.85);
    this.makeLeg("left", -1, shadow);
    this.makeLeg("right", 1, shadow);
    this.makeArm("left", -1, shadow);
    this.makeArm("right", 1, shadow);
  }

  update(input: AvatarInput, delta: number): AvatarPose {
    const pose = this.motion.update(input, delta);
    const dt = Number.isFinite(delta) ? Math.max(0, Math.min(delta, 0.1)) : 0;
    this.group.position.x += pose.velocityX * dt;
    this.group.position.z += pose.velocityZ * dt;
    this.group.rotation.y = pose.yaw;
    this.hips.position.y = 1.13 + pose.bounce + pose.breath;
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
    const action = clamp01((pose.interaction - 0.25) / 0.65);
    this.actionMix.value = action * action * (3 - 2 * action);
    this.walkForward = pose.stride >= 0;
    const gait = clamp01((Math.abs(pose.stride) - 0.05) / 0.2);
    this.walkMix.value = this.reducedMotion ? 0 : gait * gait * (3 - 2 * gait);
    this.animateSurface(pose);
    return pose;
  }

  setReducedMotion(value: boolean): void {
    this.reducedMotion = value;
    this.motion.setReducedMotion(value);
  }

  faceCamera(target: Vector3): void {
    this.group.updateWorldMatrix(true, false);
    const local = this.group.worldToLocal(target.clone());
    this.headAimYaw = Math.max(-0.48, Math.min(0.48, Math.atan2(local.x, local.z)));
    this.headAimPitch = Math.max(-0.18, Math.min(0.18,
      -Math.atan2(local.y - 1.99, Math.hypot(local.x, local.z))));
    this.orientTo(target);
  }

  private orientTo(target: Vector3): void {
    this.group.updateWorldMatrix(true, false);
    const local = this.group.worldToLocal(target.clone());
    const angle = Math.atan2(local.x, local.z);
    const selection = selectAvatarViews(angle);
    this.from.value = this.views[selection.from];
    this.to.value = this.views[selection.to];
    this.actionFrom.value = this.actionViews[selection.from];
    this.actionTo.value = this.actionViews[selection.to];
    const walkViews = this.walkForward ? this.walkLeftViews : this.walkRightViews;
    this.walkFrom.value = walkViews[selection.from];
    this.walkTo.value = walkViews[selection.to];
    this.mix.value = selection.blend;
    const faceA = FACE_CENTERS[selection.from];
    const faceB = FACE_CENTERS[selection.to];
    const headT = clamp01((selection.blend - 0.69) / 0.22);
    const headMix = headT * headT * (3 - 2 * headT);
    const faceAtAngle = faceA + (faceB - faceA) * headMix;
    this.faceFromShift.value = (faceA - faceAtAngle) / 512;
    this.faceToShift.value = (faceB - faceAtAngle) / 512;
    this.wipeSign.value = angle >= 0 ? 1 : -1;
    const fromYaw = selection.from === "back" && angle < 0 ? -Math.PI
      : VIEW_YAWS[selection.from];
    const toYaw = selection.to === "back" && angle < 0 ? -Math.PI
      : VIEW_YAWS[selection.to];
    this.visual.rotation.y = fromYaw + (toYaw - fromYaw) * selection.blend;
    this.visual.updateMatrixWorld();
  }

  private animateSurface(pose: AvatarPose): void {
    const position = this.visual.geometry.getAttribute("position") as BufferAttribute;
    for (let index = 0; index < position.count; index += 1) {
      const at = index * 3;
      const x = this.rest[at];
      const y = this.rest[at + 1];
      const z = this.rest[at + 2];
      const side = Math.tanh(x * 13);
      const leg = clamp01((1.13 - y) / 0.72);
      const upper = clamp01((y - 0.4) / 0.8);
      const swing = side * pose.stride;
      position.setXYZ(index,
        x + swing * leg * 0.025,
        y + Math.max(0, swing) * leg * leg * 0.025 + pose.bounce * upper
          + pose.breath * upper,
        z + swing * leg * 0.07 + pose.lean * upper * 0.055);
    }
    position.needsUpdate = true;
    this.visual.geometry.computeVertexNormals();
  }

  private makeLeg(name: "left" | "right", side: number, shadow: MeshStandardMaterial): void {
    const hip = side < 0 ? this.leftHip : this.rightHip;
    const knee = side < 0 ? this.leftKnee : this.rightKnee;
    hip.name = `${name}Hip`;
    hip.position.set(side * 0.13, 1.13, 0);
    this.group.add(hip);
    shadowPart(hip, `${name} upper leg depth shell`, 0.085, 0.32, 0, -0.24, 0, shadow);
    knee.name = `${name}Knee`;
    knee.position.y = -0.46;
    hip.add(knee);
    shadowPart(knee, `${name} lower leg depth shell`, 0.073, 0.35, 0, -0.24, 0, shadow);
    shadowPart(knee, `${name} shoe depth shell`, 0.08, 0.15,
      0, -0.49, 0.055, shadow, 1.1, 0.45, 1.55);
  }

  private makeArm(name: "left" | "right", side: number, shadow: MeshStandardMaterial): void {
    const shoulder = side < 0 ? this.leftShoulder : this.rightShoulder;
    const elbow = side < 0 ? this.leftElbow : this.rightElbow;
    shoulder.name = `${name}Shoulder`;
    shoulder.position.set(side * 0.295, 0.52, 0);
    shoulder.rotation.z = side * 0.12;
    this.hips.add(shoulder);
    shadowPart(shoulder, `${name} upper arm depth shell`, 0.075, 0.27,
      0, -0.2, 0, shadow);
    elbow.name = `${name}Elbow`;
    elbow.position.y = -0.37;
    shoulder.add(elbow);
    shadowPart(elbow, `${name} forearm and hand depth shell`, 0.057, 0.33,
      0, -0.22, 0, shadow);
  }
}
