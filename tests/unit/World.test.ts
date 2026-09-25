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

  it("projects attempts beyond the island edge back to a walkable surface", () => {
    const world = new World();
    const safe = world.constrainPosition(new Vector3(30, -8, 30));
    expect(world.isWalkable(safe.x, safe.z, 0.33)).toBe(true);
    expect(safe.y).toBe(0);
    world.dispose();
  });
});
