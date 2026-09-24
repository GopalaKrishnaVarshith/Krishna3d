import { describe, expect, it } from "vitest";
import { PerformanceManager } from "../../src/core/PerformanceManager";

describe("PerformanceManager", () => {
  it("drops from high to balanced only after 180 consecutive frames below 45 FPS", () => {
    const manager = new PerformanceManager();
    expect(manager.tier).toBe("high");
    expect(manager.pixelRatioCap).toBe(1.75);

    for (let frame = 0; frame < 179; frame += 1) {
      expect(manager.sample(24)).toBeNull();
    }
    expect(manager.tier).toBe("high");
    expect(manager.sample(24)).toBe("balanced");
    expect(manager.tier).toBe("balanced");
    expect(manager.pixelRatioCap).toBe(1.35);
  });

  it("resets the slow streak when a frame reaches 45 FPS", () => {
    const manager = new PerformanceManager();
    for (let frame = 0; frame < 179; frame += 1) manager.sample(25);
    expect(manager.sample(1000 / 45)).toBeNull();
    expect(manager.sample(25)).toBeNull();
    expect(manager.tier).toBe("high");
  });

  it("steps down to low after a second sustained slow interval", () => {
    const manager = new PerformanceManager();
    for (let frame = 0; frame < 180; frame += 1) manager.sample(30);
    for (let frame = 0; frame < 179; frame += 1) manager.sample(30);
    expect(manager.sample(30)).toBe("low");
    expect(manager.pixelRatioCap).toBe(1);
    expect(manager.sample(30)).toBeNull();
  });

  it("ignores invalid timing samples", () => {
    const manager = new PerformanceManager();
    for (let frame = 0; frame < 179; frame += 1) manager.sample(24);
    expect(manager.sample(0)).toBeNull();
    expect(manager.sample(Number.NaN)).toBeNull();
    expect(manager.sample(24)).toBe("balanced");
  });
});
