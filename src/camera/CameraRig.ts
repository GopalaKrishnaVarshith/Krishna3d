import { MathUtils, PerspectiveCamera, Vector3 } from "three";
import type { CameraComposition } from "../world/types";

const DEGREE = Math.PI / 180;
const SEAM_START = 39 * DEGREE;
const SEAM_END = 44 * DEGREE;
const clamp = MathUtils.clamp;

/** Never submit a rendered camera angle inside the avatar's exposed view wipe. */
export function safeAvatarViewAngle(angle: number, direction = 0): number {
  const signed = Math.atan2(Math.sin(angle), Math.cos(angle));
  const absolute = Math.abs(signed);
  if (absolute <= SEAM_START || absolute >= SEAM_END) return signed;
  const edge = direction !== 0 ? direction * Math.sign(signed) > 0 ? SEAM_END : SEAM_START
    : absolute < (SEAM_START + SEAM_END) / 2 ? SEAM_START : SEAM_END;
  return Math.sign(signed) * edge;
}

interface CameraRigOptions {
  terrainHeight?: (x: number, z: number) => number;
  /** Distance available from the look target along the proposed camera ray. */
  obstructionDistance?: (from: Vector3, to: Vector3) => number | null;
  reducedMotion?: boolean;
}

function damp(current: number, goal: number, velocity: { value: number }, dt: number, smoothTime: number): number {
  const omega = 2 / smoothTime;
  const x = omega * dt;
  const decay = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const change = current - goal;
  const temp = (velocity.value + omega * change) * dt;
  velocity.value = (velocity.value - omega * temp) * decay;
  return goal + (change + temp) * decay;
}

/** Third-person camera with authored compositions and frame-safe avatar view sectors. */
export class CameraRig {
  private readonly terrainHeight: (x: number, z: number) => number;
  private readonly obstructionDistance: (from: Vector3, to: Vector3) => number | null;
  private readonly positionVelocity = [{ value: 0 }, { value: 0 }, { value: 0 }];
  private readonly targetVelocity = [{ value: 0 }, { value: 0 }, { value: 0 }];
  private readonly lookTarget = new Vector3();
  private readonly avatarPosition = new Vector3();
  private yaw = 0;
  private pitch = 18 * DEGREE;
  private distance = 5.8;
  private avatarYaw = 0;
  private reducedMotion: boolean;
  private transition: { fromPosition: Vector3; fromTarget: Vector3;
    fromFov: number; composition: CameraComposition; elapsedMs: number } | null = null;

  constructor(readonly camera: PerspectiveCamera, options: CameraRigOptions = {}) {
    this.terrainHeight = options.terrainHeight ?? (() => -Infinity);
    this.obstructionDistance = options.obstructionDistance ?? (() => null);
    this.reducedMotion = options.reducedMotion ?? false;
  }

  get isTransitioning(): boolean { return this.transition !== null; }
  get target(): Vector3 { return this.lookTarget.clone(); }
  get viewYaw(): number {
    const offset = this.camera.position.clone().sub(this.lookTarget);
    return Math.hypot(offset.x, offset.z) > 1e-6 ? Math.atan2(offset.x, offset.z) : this.yaw;
  }

  setReducedMotion(value: boolean): void {
    this.reducedMotion = value;
    if (value) this.skipTransition();
  }

  setAvatarYaw(yaw: number): void {
    if (!Number.isFinite(yaw)) return;
    this.avatarYaw = yaw;
    this.enforceSafeView();
  }

  setAvatarPose(position: Vector3, yaw: number): void {
    this.avatarPosition.copy(position);
    this.setAvatarYaw(yaw);
  }

  orbit(yawDelta: number, pitchDelta: number): void {
    if (this.transition) this.skipTransition();
    const prior = this.yaw;
    this.yaw += Number.isFinite(yawDelta) ? yawDelta : 0;
    this.yaw = this.avatarYaw + safeAvatarViewAngle(this.yaw - this.avatarYaw, this.yaw - prior);
    this.pitch = clamp(this.pitch + (Number.isFinite(pitchDelta) ? pitchDelta : 0), 8 * DEGREE, 62 * DEGREE);
  }

  zoom(delta: number): void {
    if (Number.isFinite(delta)) this.distance = clamp(this.distance + delta, 3.2, 10);
  }

  snapTo(target: Vector3): void {
    this.transition = null;
    this.avatarPosition.copy(target);
    this.lookTarget.copy(target).add(new Vector3(0, 1.5, 0));
    this.camera.position.copy(this.desiredPosition(this.lookTarget));
    this.resetVelocity();
    this.enforceSafeView();
    this.camera.lookAt(this.lookTarget);
  }

  follow(target: Vector3, delta: number): void {
    this.avatarPosition.copy(target);
    const dt = Number.isFinite(delta) ? clamp(delta, 0, 0.1) : 0;
    if (this.transition) {
      this.updateTransition(dt);
      return;
    }
    const desiredTarget = target.clone().add(new Vector3(0, 1.5, 0));
    const desiredPosition = this.desiredPosition(desiredTarget);
    if (this.reducedMotion || dt === 0) {
      if (this.reducedMotion) {
        this.lookTarget.copy(desiredTarget);
        this.camera.position.copy(desiredPosition);
      }
    } else {
      for (let axis = 0; axis < 3; axis += 1) {
        this.lookTarget.setComponent(axis, damp(this.lookTarget.getComponent(axis),
          desiredTarget.getComponent(axis), this.targetVelocity[axis], dt, 0.2));
        this.camera.position.setComponent(axis, damp(this.camera.position.getComponent(axis),
          desiredPosition.getComponent(axis), this.positionVelocity[axis], dt, 0.24));
      }
    }
    this.applyTerrain();
    this.enforceSafeView();
    this.camera.lookAt(this.lookTarget);
  }

  transitionTo(composition: CameraComposition): void {
    if (this.reducedMotion || composition.durationMs <= 0) {
      this.transition = null;
      this.camera.position.copy(composition.position);
      this.lookTarget.copy(composition.target);
      this.setFov(composition.fov);
      this.applyTerrain();
      this.enforceSafeView();
      this.camera.lookAt(this.lookTarget);
      return;
    }
    this.transition = { fromPosition: this.camera.position.clone(), fromTarget: this.lookTarget.clone(),
      fromFov: this.camera.fov, composition, elapsedMs: 0 };
  }

  skipTransition(): void {
    if (!this.transition) return;
    const composition = this.transition.composition;
    this.transition = null;
    this.camera.position.copy(composition.position);
    this.lookTarget.copy(composition.target);
    this.setFov(composition.fov);
    this.applyTerrain();
    this.enforceSafeView();
    this.camera.lookAt(this.lookTarget);
  }

  private updateTransition(dt: number): void {
    const transition = this.transition;
    if (!transition) return;
    transition.elapsedMs += dt * 1000;
    const ratio = clamp(transition.elapsedMs / transition.composition.durationMs, 0, 1);
    const eased = ratio * ratio * (3 - 2 * ratio);
    this.lookTarget.lerpVectors(transition.fromTarget, transition.composition.target, eased);
    this.camera.position.lerpVectors(transition.fromPosition, transition.composition.position, eased);
    if (transition.composition.fov !== undefined)
      this.setFov(transition.fromFov + (transition.composition.fov - transition.fromFov) * eased);
    this.applyTerrain();
    this.enforceSafeView();
    this.camera.lookAt(this.lookTarget);
    if (ratio >= 1) this.transition = null;
  }

  private desiredPosition(target: Vector3): Vector3 {
    const horizontal = Math.cos(this.pitch) * this.distance;
    const position = new Vector3(target.x + Math.sin(this.yaw) * horizontal,
      target.y + Math.sin(this.pitch) * this.distance,
      target.z + Math.cos(this.yaw) * horizontal);
    const available = this.obstructionDistance(target, position);
    if (available !== null && Number.isFinite(available)) {
      position.sub(target).setLength(Math.min(this.distance, Math.max(1.5, available - 0.2))).add(target);
    }
    position.y = Math.max(position.y, this.terrainHeight(position.x, position.z) + 0.5);
    return position;
  }

  private applyTerrain(): void {
    this.camera.position.y = Math.max(this.camera.position.y,
      this.terrainHeight(this.camera.position.x, this.camera.position.z) + 0.5);
  }

  private enforceSafeView(): void {
    const offset = this.camera.position.clone().sub(this.avatarPosition);
    const actual = Math.atan2(offset.x, offset.z);
    const safe = this.avatarYaw + safeAvatarViewAngle(actual - this.avatarYaw);
    const horizontal = Math.hypot(offset.x, offset.z);
    this.camera.position.x = this.avatarPosition.x + Math.sin(safe) * horizontal;
    this.camera.position.z = this.avatarPosition.z + Math.cos(safe) * horizontal;
    this.applyTerrain();
    this.yaw = this.avatarYaw + safeAvatarViewAngle(this.yaw - this.avatarYaw);
  }

  private resetVelocity(): void {
    for (const velocity of [...this.positionVelocity, ...this.targetVelocity]) velocity.value = 0;
  }

  private setFov(fov: number | undefined): void {
    if (fov === undefined || !Number.isFinite(fov)) return;
    const bounded = clamp(fov, 25, 100);
    if (Math.abs(this.camera.fov - bounded) < 1e-6) return;
    this.camera.fov = bounded;
    this.camera.updateProjectionMatrix();
  }
}
