import { describe, expect, it } from "vitest";
import { InputState, ORBIT_RADIANS_PER_PIXEL } from "../../src/controls/InputState";

describe("InputState", () => {
  it("combines simultaneous keys and normalizes diagonal movement", () => {
    const input = new InputState();
    input.keyDown("KeyW");
    input.keyDown("ArrowRight");
    expect(input.state.moveX).toBeCloseTo(Math.SQRT1_2);
    expect(input.state.moveZ).toBeCloseTo(-Math.SQRT1_2);
    input.keyUp("KeyW");
    expect(input.state.moveX).toBe(1);
    expect(input.state.moveZ).toBe(0);
    input.clear();
    expect(input.state.moveX).toBe(0);
  });

  it("ends pointer orbit on release and discards further movement", () => {
    const input = new InputState();
    input.pointerDown(1, 30, 40);
    input.pointerMove(1, 50, 60);
    expect(input.consumeFrame().orbitX).toBeCloseTo(20 * ORBIT_RADIANS_PER_PIXEL);
    input.pointerUp(1);
    input.pointerMove(1, 70, 80);
    expect(input.consumeFrame().orbitX).toBe(0);
  });

  it("converts one-pixel drags in both directions to small angular intent", () => {
    const input = new InputState();
    input.pointerDown(1, 100, 100);
    input.pointerMove(1, 101, 99);
    const positive = input.consumeFrame();
    expect(positive.orbitX).toBeCloseTo(ORBIT_RADIANS_PER_PIXEL);
    expect(positive.orbitY).toBeCloseTo(-ORBIT_RADIANS_PER_PIXEL);
    input.pointerMove(1, 100, 100);
    const negative = input.consumeFrame();
    expect(negative.orbitX).toBeCloseTo(-ORBIT_RADIANS_PER_PIXEL);
    expect(negative.orbitY).toBeCloseTo(ORBIT_RADIANS_PER_PIXEL);
    expect(ORBIT_RADIANS_PER_PIXEL).toBeLessThan(0.01);
  });

  it("clears a cancelled touch and releases its movement", () => {
    const input = new InputState();
    input.touchStart(4, 0, 0);
    input.touchMove(4, 60, -80);
    expect(input.state.moveZ).toBeLessThan(0);
    input.touchCancel(4);
    expect(input.state.moveX).toBe(0);
    expect(input.state.moveZ).toBe(0);
  });

  it("suppresses all intent while an overlay owns focus", () => {
    const input = new InputState();
    input.keyDown("KeyW");
    input.wheel(100);
    input.setBlocked(true);
    expect(input.consumeFrame()).toEqual({ moveX: 0, moveZ: 0, orbitX: 0, orbitY: 0, zoom: 0, interact: false });
    input.setBlocked(false);
    expect(input.state.moveZ).toBe(0);
  });
});
