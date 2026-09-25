import { afterEach, describe, expect, it } from "vitest";
import { Controls } from "../../src/controls/Controls";

let controls: Controls | null = null;
afterEach(() => { controls?.dispose(); controls = null; document.body.replaceChildren(); });

describe("Controls DOM adapter", () => {
  it("ignores movement while an overlay is open and clears it on blur", () => {
    const canvas = document.createElement("div");
    document.body.append(canvas);
    let overlay = false;
    controls = new Controls(canvas, { overlayOpen: () => overlay });
    window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyW", bubbles: true }));
    expect(controls.state.moveZ).toBe(-1);
    overlay = true;
    expect(controls.state.moveZ).toBe(0);
    overlay = false;
    expect(controls.state.moveZ).toBe(0);
    window.dispatchEvent(new KeyboardEvent("keydown", { code: "KeyD", bubbles: true }));
    window.dispatchEvent(new Event("blur"));
    expect(controls.state.moveX).toBe(0);
  });

  it("creates and owns a visible touch pad when a container is supplied", () => {
    const canvas = document.createElement("div");
    const container = document.createElement("div");
    document.body.append(canvas, container);
    controls = new Controls(canvas, { touchPadContainer: container });
    const pad = container.querySelector<HTMLElement>("[aria-label='Movement touch pad']");
    expect(pad).not.toBeNull();
    expect(pad?.style.width).toBe("112px");
    controls.dispose();
    controls = null;
    expect(container.children).toHaveLength(0);
  });
});
