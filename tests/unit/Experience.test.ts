import { afterEach, describe, expect, it, vi } from "vitest";
import { BoxGeometry, Mesh, MeshBasicMaterial, WebGLRenderer } from "three";
import { Experience } from "../../src/core/Experience";

function createExperience() {
  const container = document.createElement("div");
  Object.defineProperties(container, {
    clientWidth: { value: 800 },
    clientHeight: { value: 400 },
  });
  document.body.appendChild(container);
  const renderer = {
    domElement: document.createElement("canvas"),
    setClearColor: vi.fn(),
    setPixelRatio: vi.fn(),
    setSize: vi.fn(),
    setAnimationLoop: vi.fn(),
    render: vi.fn(),
    forceContextLoss: vi.fn(),
    dispose: vi.fn(),
  } as unknown as WebGLRenderer;
  const experience = new Experience(container, renderer);
  return { container, renderer, experience };
}

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("Experience", () => {
  it("starts one loop, sizes the renderer, and releases scene resources once", () => {
    const { container, renderer, experience } = createExperience();
    const geometry = new BoxGeometry();
    const material = new MeshBasicMaterial();
    const geometryDispose = vi.spyOn(geometry, "dispose");
    const materialDispose = vi.spyOn(material, "dispose");
    experience.scene.add(new Mesh(geometry, material));

    experience.start();
    experience.start();
    expect(container.contains(renderer.domElement)).toBe(true);
    expect(renderer.setAnimationLoop).toHaveBeenCalledTimes(1);
    expect(renderer.setSize).toHaveBeenCalledWith(800, 400, false);
    expect(experience.camera.aspect).toBe(2);

    experience.dispose();
    experience.dispose();
    expect(renderer.setAnimationLoop).toHaveBeenLastCalledWith(null);
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
    expect(renderer.forceContextLoss).toHaveBeenCalledTimes(1);
    expect(geometryDispose).toHaveBeenCalledTimes(1);
    expect(materialDispose).toHaveBeenCalledTimes(1);
    expect(container.contains(renderer.domElement)).toBe(false);
    expect(() => experience.start()).toThrow("disposed");
  });

  it("pauses on context loss and resumes after restoration", () => {
    const { renderer, experience } = createExperience();
    experience.start();
    const lost = new Event("webglcontextlost", { cancelable: true });
    renderer.domElement.dispatchEvent(lost);
    expect(lost.defaultPrevented).toBe(true);
    expect(renderer.setAnimationLoop).toHaveBeenLastCalledWith(null);

    renderer.domElement.dispatchEvent(new Event("webglcontextrestored"));
    expect(renderer.setAnimationLoop).toHaveBeenCalledTimes(3);
    expect(renderer.setAnimationLoop).not.toHaveBeenLastCalledWith(null);
    experience.dispose();
  });

  it("pauses while the page is hidden and resumes when visible", () => {
    const originalHidden = Object.getOwnPropertyDescriptor(document, "hidden");
    const { renderer, experience } = createExperience();
    try {
      Object.defineProperty(document, "hidden", { configurable: true, value: false });
      experience.start();
      Object.defineProperty(document, "hidden", { configurable: true, value: true });
      document.dispatchEvent(new Event("visibilitychange"));
      expect(renderer.setAnimationLoop).toHaveBeenLastCalledWith(null);

      Object.defineProperty(document, "hidden", { configurable: true, value: false });
      document.dispatchEvent(new Event("visibilitychange"));
      expect(renderer.setAnimationLoop).toHaveBeenCalledTimes(3);
      expect(renderer.setAnimationLoop).not.toHaveBeenLastCalledWith(null);
    } finally {
      experience.dispose();
      if (originalHidden) Object.defineProperty(document, "hidden", originalHidden);
    }
  });

  it("applies a lower pixel ratio and publishes a quality change after slow frames", () => {
    const { renderer, experience } = createExperience();
    const listener = vi.fn();
    experience.events.on("quality:change", listener);
    vi.spyOn(experience.clock, "getDelta").mockReturnValue(0.03);
    experience.start();
    const frame = vi.mocked(renderer.setAnimationLoop).mock.calls[0][0];
    if (!frame) throw new Error("Expected animation callback");
    for (let index = 0; index < 180; index += 1) frame(0, {} as XRFrame);

    expect(listener).toHaveBeenCalledExactlyOnceWith({ tier: "balanced" });
    expect(renderer.setPixelRatio).toHaveBeenLastCalledWith(Math.min(window.devicePixelRatio || 1, 1.35));
    expect(renderer.render).toHaveBeenCalledTimes(180);
    experience.dispose();
  });
});
