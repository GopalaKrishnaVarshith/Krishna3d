export interface AvatarInput {
  moveX: number;
  moveZ: number;
  interact: boolean;
}

export interface AvatarPose {
  speed: number;
  turnRate: number;
  isMoving: boolean;
  velocityX: number;
  velocityZ: number;
  yaw: number;
  walkPhase: number;
  stride: number;
  bounce: number;
  breath: number;
  lean: number;
  interaction: number;
}

export const AVATAR_MOTION = {
  maxSpeed: 2.1,
  acceleration: 5.2,
  deceleration: 7,
  maxTurnRate: 3.4,
} as const;

export class AvatarMotion {
  private velocityX = 0;
  private velocityZ = 0;
  private yaw = 0;
  private phase = 0;
  private elapsed = 0;
  private interaction = 0;
  private reducedMotion = false;

  setReducedMotion(value: boolean): void {
    this.reducedMotion = value;
  }

  update(input: AvatarInput, delta: number): AvatarPose {
    const dt = Number.isFinite(delta) ? Math.max(0, Math.min(delta, 0.1)) : 0;
    const moveX = Number.isFinite(input.moveX) ? input.moveX : 0;
    const moveZ = Number.isFinite(input.moveZ) ? input.moveZ : 0;
    const rawLength = Math.hypot(moveX, moveZ);
    const inputLength = Math.min(rawLength, 1);
    const normalizedX = rawLength > 0 ? moveX / rawLength : 0;
    const normalizedZ = rawLength > 0 ? moveZ / rawLength : 0;
    const desiredX = normalizedX * inputLength * AVATAR_MOTION.maxSpeed;
    const desiredZ = normalizedZ * inputLength * AVATAR_MOTION.maxSpeed;
    const differenceX = desiredX - this.velocityX;
    const differenceZ = desiredZ - this.velocityZ;
    const differenceLength = Math.hypot(differenceX, differenceZ);
    const rate = inputLength > 0 ? AVATAR_MOTION.acceleration : AVATAR_MOTION.deceleration;
    const velocityStep = Math.min(differenceLength, rate * dt);

    if (differenceLength > 0) {
      this.velocityX += (differenceX / differenceLength) * velocityStep;
      this.velocityZ += (differenceZ / differenceLength) * velocityStep;
    }
    if (Math.hypot(this.velocityX, this.velocityZ) < 1e-5) {
      this.velocityX = 0;
      this.velocityZ = 0;
    }

    let turnRate = 0;
    if (inputLength > 0 && dt > 0) {
      const targetYaw = Math.atan2(normalizedX, normalizedZ);
      const difference = Math.atan2(Math.sin(targetYaw - this.yaw), Math.cos(targetYaw - this.yaw));
      const change = Math.max(-AVATAR_MOTION.maxTurnRate * dt, Math.min(AVATAR_MOTION.maxTurnRate * dt, difference));
      this.yaw += change;
      turnRate = change / dt;
    }

    const speed = Math.hypot(this.velocityX, this.velocityZ);
    const isMoving = speed > 0.001;
    const intensity = Math.min(speed / AVATAR_MOTION.maxSpeed, 1);
    if (isMoving) this.phase += speed * dt * 5.6;
    this.elapsed += dt;
    const interactionTarget = input.interact ? 1 : 0;
    this.interaction += (interactionTarget - this.interaction) * (1 - Math.exp(-7 * dt));

    return {
      speed,
      turnRate,
      isMoving,
      velocityX: this.velocityX,
      velocityZ: this.velocityZ,
      yaw: this.yaw,
      walkPhase: this.phase,
      stride: isMoving ? Math.sin(this.phase) * intensity * (this.reducedMotion ? 0.18 : 1) : 0,
      bounce: this.reducedMotion ? 0 : Math.abs(Math.sin(this.phase)) * intensity * 0.015,
      breath: this.reducedMotion ? 0 : Math.sin(this.elapsed * 2) * 0.006,
      lean: intensity * (this.reducedMotion ? 0.012 : 0.045),
      interaction: this.interaction,
    };
  }
}
