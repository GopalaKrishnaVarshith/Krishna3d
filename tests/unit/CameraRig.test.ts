import { PerspectiveCamera, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { CameraRig, safeAvatarViewAngle } from "../../src/camera/CameraRig";

describe("CameraRig", () => {
  it("completes authored transitions immediately under reduced motion", () => {
    const camera = new PerspectiveCamera();
    const rig = new CameraRig(camera, { reducedMotion: true });
    const position = new Vector3(4, 5, 6);
    rig.transitionTo({ position, target: new Vector3(1, 2, 3), durationMs: 1200 });
    expect(camera.position.distanceTo(position)).toBeLessThan(1e-10);
    expect(rig.isTransitioning).toBe(false);
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
});
