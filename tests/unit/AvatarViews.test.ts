import { describe, expect, it } from "vitest";
import { selectAvatarViews } from "../../src/avatar/Avatar";

describe("avatar view selection", () => {
  it("uses the one approved character at the cardinal and rear-quarter views", () => {
    expect(selectAvatarViews(0).from).toBe("front");
    expect(selectAvatarViews(Math.PI / 4).to).toBe("quarter_positive");
    expect(selectAvatarViews(-Math.PI / 4).to).toBe("quarter_negative");
    expect(selectAvatarViews(Math.PI / 2).to).toBe("side_positive");
    expect(selectAvatarViews(-Math.PI / 2).to).toBe("side_negative");
    expect(selectAvatarViews(3 * Math.PI / 4).to).toBe("rear_quarter_positive");
    expect(selectAvatarViews(-3 * Math.PI / 4).to).toBe("rear_quarter_negative");
    expect(selectAvatarViews(Math.PI).to).toBe("back");
    expect(selectAvatarViews(-Math.PI).to).toBe("back");
  });

  it("blends continuously within each view interval and around the back seam", () => {
    const step = 0.00001;
    for (const boundary of [Math.PI / 4, Math.PI / 2, 3 * Math.PI / 4]) {
      const before = selectAvatarViews(boundary - step);
      const after = selectAvatarViews(boundary + step);
      expect(before.to).toBe(after.from);
      expect(before.blend).toBeCloseTo(1, 6);
      expect(after.blend).toBeCloseTo(0, 6);
    }
    const beforeBack = selectAvatarViews(Math.PI - step);
    const afterBack = selectAvatarViews(-Math.PI + step);
    expect(beforeBack.to).toBe("back");
    expect(afterBack.to).toBe("back");
    expect(beforeBack.blend).toBeCloseTo(1, 6);
    expect(afterBack.blend).toBeCloseTo(1, 6);
  });

  it("keeps blend values bounded for wrapped camera angles", () => {
    for (const angle of [0, 0.3, 1.2, 5 * Math.PI, -7 * Math.PI]) {
      const view = selectAvatarViews(angle);
      expect(view.blend).toBeGreaterThanOrEqual(0);
      expect(view.blend).toBeLessThanOrEqual(1);
    }
  });
});
