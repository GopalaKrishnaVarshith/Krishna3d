import { BoxGeometry, Group, Mesh, MeshBasicMaterial, PerspectiveCamera, Vector3 } from "three";
import { describe, expect, it, vi } from "vitest";
import { EventBus } from "../../src/core/EventBus";
import { InteractionSystem, type InteractionEvents } from "../../src/interaction/InteractionSystem";
import { ProjectVault } from "../../src/world/ProjectVault";
import { portfolioData } from "../../src/data/portfolioData";
import { createEvidenceVault } from "../../src/world/zones/EvidenceVault";
import { MetricVisualization } from "../../src/world/MetricVisualization";

function target(id: string, z: number) {
  const object = new Group();
  object.position.z = z;
  object.add(new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial()));
  return { id, label: id, object, activate: vi.fn() };
}

describe("InteractionSystem", () => {
  it("picks the nearest eligible intersected target and activates its exact ID", () => {
    const camera = new PerspectiveCamera(60, 1, 0.1, 100);
    const system = new InteractionSystem({ camera });
    const far = target("far", -8);
    const near = target("near", -4);
    system.register(far);
    system.register(near);
    expect(system.point(0, 0)?.id).toBe("near");
    expect(system.activate()).toBe(true);
    expect(near.activate).toHaveBeenCalledOnce();
    expect(far.activate).not.toHaveBeenCalled();
  });

  it("can pick a capsule from an overview camera farther than eight units away", () => {
    const camera = new PerspectiveCamera(60, 1, 0.1, 100);
    const system = new InteractionSystem({ camera });
    system.register(target("distant", -14));
    expect(system.point(0, 0)?.id).toBe("distant");
  });

  it("gives keyboard focus the same prompt and action as pointer selection", () => {
    const events = new EventBus<InteractionEvents>();
    const prompts: string[] = [];
    events.on("interaction:prompt", ({ id }) => prompts.push(id));
    const system = new InteractionSystem({ camera: new PerspectiveCamera(), events });
    const item = target("project:one", -4);
    system.register(item);
    expect(system.focus(item.id)).toBe(true);
    expect(prompts).toEqual([item.id]);
    expect(system.activate()).toBe(true);
    expect(item.activate).toHaveBeenCalledOnce();
  });

  it("suppresses pointer, focus, and activation while an overlay is open", () => {
    let overlay = false;
    const system = new InteractionSystem({ camera: new PerspectiveCamera(), overlayOpen: () => overlay });
    const item = target("one", -4);
    system.register(item);
    expect(system.focus("one")).toBe(true);
    overlay = true;
    expect(system.point(0, 0)).toBeNull();
    expect(system.focus("one")).toBe(false);
    expect(system.activate()).toBe(false);
    expect(item.activate).not.toHaveBeenCalled();
  });
});

describe("ProjectVault", () => {
  it("resolves and opens every published project through the matching capsule", () => {
    const canvas = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      fillRect: vi.fn(), strokeRect: vi.fn(), fillText: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    const zone = createEvidenceVault({ reducedMotion: true });
    const vault = new ProjectVault(zone);
    expect(vault.capsules.size).toBe(11);
    for (const project of portfolioData.projects) {
      expect(vault.capsules.get(project.id)).toBeDefined();
      expect(vault.open(project.id)).toEqual(project);
      expect(vault.activeProject?.id).toBe(project.id);
    }
    expect(vault.open("missing-project")).toBeNull();
    vault.update(1 / 60, new Vector3());
    vault.dispose();
    zone.dispose();
    canvas.mockRestore();
  });

  it("removes decorative bars when a bound project has no published metric", () => {
    const canvas = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      fillRect: vi.fn(), strokeRect: vi.fn(), fillText: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    const zone = createEvidenceVault({ reducedMotion: true });
    const metrics = new MetricVisualization();
    const vault = new ProjectVault(zone, { metrics });
    expect(metrics.group.parent).toBe(zone.metricMount);
    const bars = zone.metricMount.children.filter((child) =>
      child !== metrics.group && child.name !== "vault inspectable evidence prism");
    expect(bars.length).toBeGreaterThan(0);
    expect(bars.every((bar) => !bar.visible)).toBe(true);
    vault.open(portfolioData.projects[0].id);
    expect(metrics.group.children).toHaveLength(0);
    vault.open("product-support-documentation-automation");
    expect(metrics.group.userData.metricLabels).toEqual([
      "Documentation effort reduced: Approx. 99%", "Usage parameters analyzed: 15+",
    ]);
    expect(metrics.group.children).toHaveLength(2);
    vault.dispose();
    expect(bars.every((bar) => bar.visible)).toBe(true);
    metrics.dispose(); zone.dispose(); canvas.mockRestore();
  });
});
