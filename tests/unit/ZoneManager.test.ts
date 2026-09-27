import { Group, Vector3 } from "three";
import { describe, expect, it, vi } from "vitest";
import { ZoneManager } from "../../src/world/ZoneManager";
import type { WorldZone } from "../../src/world/types";

const zone = (id: string): WorldZone => ({
  id, group: new Group(), entryPoint: new Vector3(2, 1, 3),
  cameraComposition: { position: new Vector3(3, 4, 7), target: new Vector3(2, 1, 3), durationMs: 600 },
  interactiveObjects: [], update: vi.fn(), dispose: vi.fn(),
});

describe("ZoneManager", () => {
  it("rejects duplicate zone ids without attaching a second group", () => {
    const manager = new ZoneManager();
    manager.register(zone("lab"));
    expect(() => manager.register(zone("lab"))).toThrow(/already registered/i);
    expect(manager.group.children).toHaveLength(1);
  });

  it("navigates directly to a requested destination", () => {
    const manager = new ZoneManager();
    const lab = zone("lab");
    const vault = zone("vault");
    manager.register(lab);
    manager.register(vault);
    expect(manager.navigateTo("vault")).toBe(vault);
    expect(manager.currentZone?.id).toBe("vault");
    expect(() => manager.navigateTo("missing")).toThrow(/unknown zone/i);
  });

  it("activates a destination without firing navigation callbacks", () => {
    const onNavigate = vi.fn();
    const manager = new ZoneManager(onNavigate);
    const lab = zone("lab");
    manager.register(lab);
    expect(manager.activate("lab")).toBe(lab);
    expect(manager.currentZone?.id).toBe("lab");
    expect(onNavigate).not.toHaveBeenCalled();
  });
});
