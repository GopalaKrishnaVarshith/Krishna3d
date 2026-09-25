import { Raycaster, Vector3 } from "three";
import { describe, expect, it, vi } from "vitest";
import { World } from "../../src/world/World";
import { createArrivalPlaza } from "../../src/world/zones/ArrivalPlaza";
import { createCareerTrail } from "../../src/world/zones/CareerTrail";
import { createAutomationLab } from "../../src/world/zones/AutomationLab";
import { createEvidenceVault } from "../../src/world/zones/EvidenceVault";
import { createRegulatoryObservatory } from "../../src/world/zones/RegulatoryObservatory";
import { createContactPortal } from "../../src/world/zones/ContactPortal";

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

  it("points each arrival compass waypoint toward its actual destination", () => {
    const canvas = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      fillRect: vi.fn(), strokeRect: vi.fn(), fillText: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    const world = new World();
    const plaza = createArrivalPlaza();
    for (const target of plaza.interactiveObjects) {
      const id = target.id.replace("navigate:", "");
      const destination = world.zones.get(id)!.group.position;
      const waypoint = target.object.position;
      const alignment = (waypoint.x * destination.x + waypoint.z * destination.z) /
        (Math.hypot(waypoint.x, waypoint.z) * Math.hypot(destination.x, destination.z));
      expect(alignment).toBeGreaterThan(0.98);
    }
    plaza.dispose();
    world.dispose();
    canvas.mockRestore();
  });

  it("supports a longer ordered Career route through eight walkable milestones", () => {
    const canvas = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      fillRect: vi.fn(), strokeRect: vi.fn(), fillText: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    const world = new World();
    const trail = createCareerTrail({ reducedMotion: true });
    const positions = [...trail.milestonePositions.values()];
    const approaches = [...trail.milestoneApproaches.values()];
    const viewingPoints = [...trail.milestoneViewingPoints.values()];
    expect(positions).toHaveLength(8);
    expect(approaches).toHaveLength(8);
    expect(viewingPoints).toHaveLength(8);
    for (const position of positions)
      expect(world.isWalkable(position.x, position.z, 0.34)).toBe(true);
    for (const position of approaches)
      expect(world.isWalkable(position.x, position.z, 0.34)).toBe(true);
    for (const position of viewingPoints)
      expect(world.isWalkable(position.x, position.z, 0.34)).toBe(true);
    for (let index = 1; index < positions.length; index += 1)
      expect(positions[index].distanceTo(positions[index - 1])).toBeGreaterThan(1.05);
    expect(positions[7].z - positions[0].z).toBeGreaterThan(8);
    trail.dispose();
    world.dispose();
    canvas.mockRestore();
  });

  it("keeps each destination entry floor at the avatar movement height", () => {
    const canvas = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      fillRect: vi.fn(), strokeRect: vi.fn(), fillText: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    const world = new World();
    const zones = [createArrivalPlaza(), createAutomationLab(), createEvidenceVault(),
      createRegulatoryObservatory(), createCareerTrail(), createContactPortal()];
    for (const zone of zones) {
      world.group.add(zone.group);
      expect(world.isWalkable(zone.entryPoint.x, zone.entryPoint.z, 0.34)).toBe(true);
      const ray = new Raycaster(zone.entryPoint.clone().setY(0.4), new Vector3(0, -1, 0), 0, 1);
      const contact = ray.intersectObject(world.group, true)[0];
      expect(contact, zone.id).toBeDefined();
      expect(contact.point.y, `${zone.id}: ${contact.object.name}`).toBeGreaterThanOrEqual(-0.02);
      expect(contact.point.y, `${zone.id}: ${contact.object.name}`).toBeLessThanOrEqual(0.025);
    }
    for (const zone of zones) zone.dispose();
    world.dispose();
    canvas.mockRestore();
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

  it("repels the avatar from fixed raised stations while keeping the surface walkable", () => {
    const world = new World();
    for (const [x, z, radius] of [[13, -1, 1.17], [0, -14, 1.11]] as const) {
      const safe = world.constrainPosition(new Vector3(x, 0, z), 0.34);
      expect(Math.hypot(safe.x - x, safe.z - z)).toBeGreaterThanOrEqual(radius + 0.34 - 1e-5);
      expect(world.isWalkable(safe.x, safe.z, 0.34)).toBe(true);
      expect(safe.y).toBe(0);
    }
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
