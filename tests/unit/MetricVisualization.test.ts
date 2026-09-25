import { describe, expect, it } from "vitest";
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
    const visual = new MetricVisualization();
    const measured = portfolioData.projects.flatMap((project) => project.metrics);
    visual.setMetrics(measured);
    expect(visual.metrics.map(({ display }) => display)).toEqual(measured.map(({ value }) => value));
    expect(visual.group.children.length).toBeGreaterThan(0);
    visual.setMetrics([]);
    expect(visual.group.children).toHaveLength(0);
    visual.dispose();
  });
});
