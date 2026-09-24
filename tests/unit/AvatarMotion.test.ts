import { describe, expect, it } from "vitest";
import { AvatarMotion, AVATAR_MOTION } from "../../src/avatar/AvatarMotion";

const idle = { moveX: 0, moveZ: 0, interact: false };

describe("AvatarMotion", () => {
  it("normalizes diagonal input to the same travel speed as a cardinal direction", () => {
    const forward = new AvatarMotion();
    const diagonal = new AvatarMotion();
    let straightPose = forward.update({ ...idle, moveZ: 1 }, 1 / 60);
    let diagonalPose = diagonal.update({ ...idle, moveX: 1, moveZ: 1 }, 1 / 60);
    for (let frame = 1; frame < 120; frame += 1) {
      straightPose = forward.update({ ...idle, moveZ: 1 }, 1 / 60);
      diagonalPose = diagonal.update({ ...idle, moveX: 1, moveZ: 1 }, 1 / 60);
    }
    expect(straightPose.speed).toBeCloseTo(AVATAR_MOTION.maxSpeed, 4);
    expect(diagonalPose.speed).toBeCloseTo(straightPose.speed, 4);
    expect(diagonalPose.velocityX).toBeCloseTo(diagonalPose.velocityZ, 4);
  });

  it("clamps acceleration and top speed, including over-range input", () => {
    const motion = new AvatarMotion();
    const first = motion.update({ ...idle, moveZ: 99 }, 0.1);
    expect(first.speed).toBeLessThanOrEqual(AVATAR_MOTION.acceleration * 0.1 + 1e-6);
    let pose = first;
    for (let frame = 0; frame < 100; frame += 1) {
      pose = motion.update({ ...idle, moveZ: 99 }, 0.1);
    }
    expect(pose.speed).toBeCloseTo(AVATAR_MOTION.maxSpeed, 4);
  });

  it("decelerates monotonically to a motionless idle state", () => {
    const motion = new AvatarMotion();
    for (let frame = 0; frame < 40; frame += 1) motion.update({ ...idle, moveZ: 1 }, 1 / 60);
    let prior = Number.POSITIVE_INFINITY;
    let pose = motion.update(idle, 1 / 60);
    for (let frame = 0; frame < 80; frame += 1) {
      pose = motion.update(idle, 1 / 60);
      expect(pose.speed).toBeLessThanOrEqual(prior);
      prior = pose.speed;
    }
    expect(pose.speed).toBe(0);
    expect(pose.isMoving).toBe(false);
    expect(pose.stride).toBe(0);
  });

  it("limits steering to the authored turn rate and takes the shortest angle", () => {
    const motion = new AvatarMotion();
    const pose = motion.update({ ...idle, moveX: 1 }, 0.1);
    expect(pose.yaw).toBeCloseTo(AVATAR_MOTION.maxTurnRate * 0.1, 5);
    expect(Math.abs(pose.turnRate)).toBeLessThanOrEqual(AVATAR_MOTION.maxTurnRate + 1e-6);

    for (let frame = 0; frame < 100; frame += 1) motion.update({ ...idle, moveX: 1 }, 0.1);
    const reversed = motion.update({ ...idle, moveX: -1 }, 0.1);
    expect(reversed.yaw).toBeLessThan(pose.yaw + Math.PI / 2);
    expect(Math.abs(reversed.turnRate)).toBeLessThanOrEqual(AVATAR_MOTION.maxTurnRate + 1e-6);
  });

  it("suppresses idle breathing and bounce when reduced motion is enabled", () => {
    const motion = new AvatarMotion();
    let pose = motion.update(idle, 0.33);
    expect(Math.abs(pose.breath)).toBeGreaterThan(0);
    motion.setReducedMotion(true);
    pose = motion.update(idle, 0.33);
    expect(pose.breath).toBe(0);
    expect(pose.bounce).toBe(0);
    expect(pose.isMoving).toBe(false);

    pose = motion.update({ ...idle, moveZ: 1 }, 0.1);
    expect(pose.speed).toBeGreaterThan(0);
    expect(pose.bounce).toBe(0);
  });

  it("eases into and out of a console interaction pose", () => {
    const motion = new AvatarMotion();
    const first = motion.update({ ...idle, interact: true }, 0.1);
    expect(first.interaction).toBeGreaterThan(0);
    expect(first.interaction).toBeLessThan(1);
    let pose = first;
    for (let frame = 0; frame < 60; frame += 1) pose = motion.update({ ...idle, interact: true }, 1 / 60);
    expect(pose.interaction).toBeGreaterThan(0.95);
    for (let frame = 0; frame < 60; frame += 1) pose = motion.update(idle, 1 / 60);
    expect(pose.interaction).toBeLessThan(0.05);
  });
});
