import { CanvasTexture, Sprite } from "three";
import { describe, expect, it, vi } from "vitest";
import { MetricVisualization, parseMetric } from "../../src/world/MetricVisualization";
import { portfolioData } from "../../src/data/portfolioData";

describe("metric parsing", () => {
  it.each([
    ["99%", 99, "percent", false, false],
    ["Approx. 99%", 99, "percent", true, false],
    ["200+", 200, "count", false, true],
    ["230+", 230, "count", false, true],
    ["15+", 15, "count", false, true],
    ["2", 2, "count", false, false],
  ] as const)("parses %s and retains qualification", (value, number, kind, approximate, lowerBound) => {
    expect(parseMetric({ label: "Example", value })).toMatchObject({
      display: value, number, kind, approximate, lowerBound,
    });
  });

  it("rejects untrusted numeric strings and impossible percentages", () => {
    expect(parseMetric({ label: "bad", value: "99% maybe" })).toBeNull();
    expect(parseMetric({ label: "bad", value: "120%" })).toBeNull();
    expect(parseMetric({ label: "bad", value: "NaN" })).toBeNull();
  });

  it("shows only sourced values and clears visuals for a project without metrics", () => {
    const fillText = vi.fn();
    const canvas = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      clearRect: vi.fn(), fillText,
    } as unknown as CanvasRenderingContext2D);
    const visual = new MetricVisualization();
    const measured = portfolioData.projects.flatMap((project) => project.metrics);
    visual.setMetrics(measured);
    expect(visual.metrics.map(({ display }) => display)).toEqual(measured.map(({ value }) => value));
    const labels = visual.group.children.map((station) =>
      station.children.find((child) => child instanceof Sprite));
    expect(labels.every((label) => label instanceof Sprite)).toBe(true);
    expect(labels.every((label) => (label as Sprite).material.map instanceof CanvasTexture)).toBe(true);
    for (const value of ["Approx. 99%", "200+", "230+", "15+", "2"])
      expect(fillText).toHaveBeenCalledWith(value, expect.any(Number), expect.any(Number), expect.any(Number));
    expect(visual.group.children.length).toBeGreaterThan(0);
    visual.setMetrics([]);
    expect(visual.group.children).toHaveLength(0);
    visual.dispose();
    canvas.mockRestore();
  });

  it("uses proportional geometry instead of counted markers for a fractional count", () => {
    const canvas = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      clearRect: vi.fn(), fillText: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    const visual = new MetricVisualization();
    visual.setMetrics([{ label: "Example", value: "2.5" }]);
    expect(visual.metrics[0].number).toBe(2.5);
    const station = visual.group.children[0];
    expect(station.children.some((child) => child.name.includes("counted marker"))).toBe(false);
    expect(station.children.some((child) => child.name.includes("rising column"))).toBe(true);
    visual.dispose(); canvas.mockRestore();
  });
});
