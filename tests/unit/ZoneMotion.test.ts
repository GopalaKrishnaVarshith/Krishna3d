import type { Object3D } from "three";
import { describe, expect, it, vi } from "vitest";
import { createArrivalPlaza } from "../../src/world/zones/ArrivalPlaza";
import { createAutomationLab } from "../../src/world/zones/AutomationLab";
import { createEvidenceVault } from "../../src/world/zones/EvidenceVault";
import { createRegulatoryObservatory } from "../../src/world/zones/RegulatoryObservatory";
import { createCareerTrail } from "../../src/world/zones/CareerTrail";
import { createContactPortal } from "../../src/world/zones/ContactPortal";

function pose(object: Object3D): string {
  return [...object.position.toArray(), object.rotation.x, object.rotation.y, object.rotation.z,
    ...object.scale.toArray()].map((value) => Number(value.toFixed(6))).join(",");
}

describe("zone reduced motion", () => {
  it("freezes and resumes the authored motion in all six destinations", () => {
    const canvas = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      fillRect: vi.fn(), strokeRect: vi.fn(), fillText: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    const cases = [
      [createArrivalPlaza({ reducedMotion: true }), "fountain crystalline compass"],
      [createAutomationLab({ reducedMotion: true }), "travelling intake node 1"],
      [createEvidenceVault({ reducedMotion: true }), "vault inspectable evidence prism"],
      [createRegulatoryObservatory({ reducedMotion: true }), "living controlled information network"],
      [createCareerTrail({ reducedMotion: true }), "practo-product-specialist time beacon"],
      [createContactPortal({ reducedMotion: true }), "portal responsive inner iris"],
    ] as const;
    for (const [zone, name] of cases) {
      const object = zone.group.getObjectByName(name);
      expect(object, `${zone.id}: ${name}`).toBeDefined();
      const before = pose(object!);
      zone.update(1);
      expect(pose(object!), `${zone.id} frozen`).toBe(before);
      zone.setReducedMotion(false);
      zone.update(0.6);
      expect(pose(object!), `${zone.id} resumed`).not.toBe(before);
      zone.setReducedMotion(true);
      const paused = pose(object!);
      zone.update(1);
      expect(pose(object!), `${zone.id} paused again`).toBe(paused);
      zone.dispose();
    }
    canvas.mockRestore();
  });
});
