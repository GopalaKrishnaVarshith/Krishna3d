import { PerspectiveCamera, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { CameraRig, safeAvatarViewAngle } from "../../src/camera/CameraRig";
import { World } from "../../src/world/World";
import { ORBIT_RADIANS_PER_PIXEL } from "../../src/controls/InputState";

describe("CameraRig", () => {
  it("completes authored transitions immediately under reduced motion", () => {
    const camera = new PerspectiveCamera();
    const rig = new CameraRig(camera, { reducedMotion: true });
    const position = new Vector3(4, 5, 6);
    rig.transitionTo({ position, target: new Vector3(1, 2, 3), durationMs: 1200 });
    expect(camera.position.distanceTo(position)).toBeLessThan(1e-10);
    expect(rig.isTransitioning).toBe(false);
  });

  it("honors optional authored FOV while preserving the current FOV when omitted", () => {
    const camera = new PerspectiveCamera(55);
    const rig = new CameraRig(camera, { reducedMotion: true });
    rig.snapTo(new Vector3());
    rig.transitionTo({ position: new Vector3(0, 5, 8), target: new Vector3(),
      durationMs: 500, fov: 70 });
    expect(camera.fov).toBe(70);
    rig.transitionTo({ position: new Vector3(0, 5, 7), target: new Vector3(),
      durationMs: 500 });
    expect(camera.fov).toBe(70);

    const animatedCamera = new PerspectiveCamera(55);
    const animatedRig = new CameraRig(animatedCamera);
    animatedRig.snapTo(new Vector3());
    animatedRig.transitionTo({ position: new Vector3(0, 5, 8), target: new Vector3(),
      durationMs: 1000, fov: 75 });
    animatedRig.follow(new Vector3(), 0.5);
    expect(animatedCamera.fov).toBeGreaterThan(55);
    expect(animatedCamera.fov).toBeLessThan(75);
    animatedRig.skipTransition();
    expect(animatedCamera.fov).toBe(75);
  });

  it("never renders in the known 40 to 42 degree avatar seam during orbit", () => {
    const camera = new PerspectiveCamera();
    const rig = new CameraRig(camera);
    rig.snapTo(new Vector3(0, 0, 0));
    rig.setAvatarYaw(0);
    for (let i = 0; i < 100; i += 1) {
      rig.orbit(0.03, 0);
      rig.follow(new Vector3(0, 0, 0), 1 / 60);
      const angle = Math.atan2(camera.position.x, camera.position.z);
      if (Math.abs(angle) > 39 * Math.PI / 180 + 1e-4) {
        expect(Math.abs(angle)).toBeGreaterThanOrEqual(44 * Math.PI / 180 - 1e-4);
      }
    }
    expect(safeAvatarViewAngle(41 * Math.PI / 180, 1)).toBeGreaterThan(43 * Math.PI / 180);
    expect(safeAvatarViewAngle(-41 * Math.PI / 180, -1)).toBeLessThan(-43 * Math.PI / 180);
    const turningCamera = new PerspectiveCamera();
    const turningRig = new CameraRig(turningCamera);
    turningRig.snapTo(new Vector3(0, 0, 0));
    turningRig.setAvatarPose(new Vector3(0, 0, 0), -41 * Math.PI / 180);
    const relative = Math.atan2(turningCamera.position.x, turningCamera.position.z) + 41 * Math.PI / 180;
    expect(Math.abs(relative) <= 39 * Math.PI / 180 + 1e-4 || Math.abs(relative) >= 44 * Math.PI / 180 - 1e-4).toBe(true);
  });

  it("honors terrain minimum and a shorter obstruction distance", () => {
    const camera = new PerspectiveCamera();
    const rig = new CameraRig(camera, { terrainHeight: () => 4, obstructionDistance: () => 2 });
    rig.snapTo(new Vector3(0, 4, 0));
    expect(camera.position.y).toBeGreaterThanOrEqual(4.5);
    expect(camera.position.distanceTo(new Vector3(0, 5.5, 0))).toBeLessThanOrEqual(2.1);
  });

  it("keeps small drags bounded while crossing both seam sectors", () => {
    for (const sign of [-1, 1]) {
      const camera = new PerspectiveCamera();
      const rig = new CameraRig(camera, { reducedMotion: true });
      rig.snapTo(new Vector3());
      let previous = 0;
      for (let step = 0; step < 350; step += 1) {
        rig.orbit(sign * 2 * ORBIT_RADIANS_PER_PIXEL, 0);
        rig.follow(new Vector3(), 1 / 60);
        const angle = Math.atan2(camera.position.x, camera.position.z);
        expect(Math.abs(angle - previous)).toBeLessThan(6 * Math.PI / 180);
        expect(Math.abs(angle) <= 39 * Math.PI / 180 + 1e-4 ||
          Math.abs(angle) >= 44 * Math.PI / 180 - 1e-4).toBe(true);
        previous = angle;
      }
      expect(Math.abs(previous)).toBeGreaterThan(45 * Math.PI / 180);
    }
  });

  it("uses world tree obstructions to push the follow camera in", () => {
    const world = new World(undefined, { deferZones: true });
    world.collisionBoundaries.length = 0;
    world.collisionBoundaries.push({ center: new Vector3(0, 0, 3), radius: 0.4 });
    const camera = new PerspectiveCamera();
    const rig = new CameraRig(camera, { terrainHeight: (x, z) => world.getHeightAt(x, z),
      obstructionDistance: (from, to) => world.getCameraObstructionDistance(from, to) });
    rig.snapTo(new Vector3());
    expect(camera.position.z).toBeLessThan(3);
    world.dispose();
  });
});
