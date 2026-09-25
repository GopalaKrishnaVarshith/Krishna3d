import { Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { World } from "../../src/world/World";

describe("World navigation shell", () => {
  it("keeps routes from plaza to two destinations walkable", () => {
    const world = new World();
    for (const id of ["automation-lab", "evidence-vault"]) {
      const destination = world.zones.get(id)?.entryPoint;
      expect(destination).toBeDefined();
      for (let step = 0; step <= 20; step += 1) {
        const t = step / 20;
        expect(world.isWalkable(destination!.x * t, destination!.z * t, 0.34)).toBe(true);
      }
    }
    world.dispose();
  });

  it("places the portal left and career trail right of the arrival bridge", () => {
    const world = new World();
    const portal = world.zones.get("contact-portal")!.group.position;
    const trail = world.zones.get("career-trail")!.group.position;
    expect(portal.x).toBeLessThan(0);
    expect(trail.x).toBeGreaterThan(0);
    for (const id of ["contact-portal", "career-trail"]) {
      const point = world.zones.get(id)!.entryPoint;
      expect(world.isWalkable(point.x, point.z, 0.34)).toBe(true);
    }
    world.dispose();
  });

  it("projects attempts beyond the island edge back to a walkable surface", () => {
    const world = new World();
    const safe = world.constrainPosition(new Vector3(30, -8, 30));
    expect(world.isWalkable(safe.x, safe.z, 0.33)).toBe(true);
    expect(safe.y).toBe(0);
    world.dispose();
  });

  it("pushes exact obstacle-center and near-center positions out by the collision limit", () => {
    const world = new World();
    world.collisionBoundaries.length = 0;
    world.collisionBoundaries.push({ center: new Vector3(0, 0, 0), radius: 0.5 });
    for (const x of [0, 1e-7]) {
      const safe = world.constrainPosition(new Vector3(x, 0, 0), 0.34);
      expect(safe.length()).toBeCloseTo(0.84, 5);
      expect(world.isWalkable(safe.x, safe.z, 0.34)).toBe(true);
    }
    world.dispose();
  });

  it("stays walkable after an edge obstacle pushes toward open water", () => {
    const world = new World();
    world.collisionBoundaries.length = 0;
    const obstacle = { center: new Vector3(5.35, 0, 0), radius: 0.45 };
    world.collisionBoundaries.push(obstacle);
    const safe = world.constrainPosition(obstacle.center.clone(), 0.34);
    expect(world.isWalkable(safe.x, safe.z, 0.34)).toBe(true);
    expect(safe.distanceTo(obstacle.center)).toBeGreaterThanOrEqual(0.79 - 1e-5);
    world.dispose();
  });

  it("reports the first tree obstruction along a camera ray", () => {
    const world = new World();
    world.collisionBoundaries.length = 0;
    world.collisionBoundaries.push({ center: new Vector3(0, 0, 3), radius: 0.4 });
    const distance = world.getCameraObstructionDistance(new Vector3(0, 1.5, 0), new Vector3(0, 2.5, 6));
    expect(distance).not.toBeNull();
    expect(distance!).toBeGreaterThan(2);
    expect(distance!).toBeLessThan(3);
    expect(world.getCameraObstructionDistance(new Vector3(3, 1.5, 0), new Vector3(3, 2.5, 6))).toBeNull();
    world.dispose();
  });
});
