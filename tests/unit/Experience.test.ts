import { afterEach, describe, expect, it, vi } from "vitest";
import { BoxGeometry, Mesh, MeshBasicMaterial, Texture, TextureLoader, Vector3, WebGLRenderer } from "three";
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

  it("disposes a shared texture on single and array scene materials exactly once", () => {
    const { experience } = createExperience();
    const texture = new Texture(document.createElement("img"));
    const textureDispose = vi.spyOn(texture, "dispose");
    const first = new MeshBasicMaterial({ map: texture });
    const second = new MeshBasicMaterial({ alphaMap: texture });
    const third = new MeshBasicMaterial({ map: texture });
    experience.scene.add(new Mesh(new BoxGeometry(), [first, second]));
    experience.scene.add(new Mesh(new BoxGeometry(), third));

    experience.dispose();
    experience.dispose();

    expect(textureDispose).toHaveBeenCalledTimes(1);
  });

  it("lets the asset manager dispose a loaded scene texture once", async () => {
    const { experience } = createExperience();
    const texture = new Texture(document.createElement("img"));
    const textureDispose = vi.spyOn(texture, "dispose");
    vi.spyOn(TextureLoader.prototype, "loadAsync").mockResolvedValue(texture);
    const loaded = await experience.assets.loadTexture("/sample.webp");
    experience.scene.add(new Mesh(new BoxGeometry(), new MeshBasicMaterial({ map: loaded })));

    experience.dispose();
    experience.dispose();

    expect(textureDispose).toHaveBeenCalledTimes(1);
  });


  it("walks the guided project tour toward the selected portfolio capsule", () => {
    const { experience } = createExperience();
    const projectId = "workflow-request-management";
    const entryPoint = new Vector3(0, 0, -10.58);
    const capsule = new Vector3(4, 0, -14);
    const cameraPoint = new Vector3(2.12, 2.35, -14);
    const zone = {
      id: "evidence-vault",
      entryPoint,
      capsulePositions: new Map([[projectId, capsule]]),
      cameraPoints: new Map([[projectId, cameraPoint]]),
    };
    (experience as unknown as {
      world: { zones: { get: (id: string) => unknown } };
      avatar: { group: { position: Vector3 } };
      vault: { open: (id: string) => unknown };
      cameraRig: { transitionTo: (composition: unknown) => void };
    }).world = { zones: { get: (id: string) => id === "evidence-vault" ? zone : undefined } };
    (experience as unknown as { avatar: { group: { position: Vector3 } } }).avatar = {
      group: { position: new Vector3(-13, 0, 0) },
    };
    const open = vi.fn();
    const transitionTo = vi.fn();
    (experience as unknown as { vault: { open: (id: string) => unknown } }).vault = { open };
    (experience as unknown as { cameraRig: { transitionTo: (composition: unknown) => void } }).cameraRig = { transitionTo };

    const arrived = vi.fn();
    experience.tourFocus("project", projectId, arrived);

    const guidedWalk = (experience as unknown as { guidedWalk: { points: Vector3[]; onArrive: () => void } }).guidedWalk;
    expect(guidedWalk.points.at(-1)?.distanceTo(entryPoint)).toBeGreaterThan(1);
    expect(guidedWalk.points.at(-1)?.distanceTo(capsule.clone().lerp(new Vector3(0, 0, -14), 0.58))).toBeLessThan(0.001);
    expect(arrived).not.toHaveBeenCalled();
    guidedWalk.onArrive();
    expect(arrived).toHaveBeenCalledOnce();
    expect(open).toHaveBeenCalledWith(projectId);
    expect(transitionTo).toHaveBeenCalledWith(expect.objectContaining({ position: cameraPoint, fov: 60 }));
  });

  it("pauses on context loss and resumes after restoration", () => {
    const { renderer, experience } = createExperience();
    const fatal = vi.fn();
    const setContextPrompt = vi.fn();
    experience.setFatalHandler(fatal);
    (experience as unknown as { ui: { setContextPrompt: (prompt: string) => void } }).ui = {
      setContextPrompt,
    };
    experience.start();
    const lost = new Event("webglcontextlost", { cancelable: true });
    renderer.domElement.dispatchEvent(lost);
    expect(lost.defaultPrevented).toBe(true);
    expect(renderer.setAnimationLoop).toHaveBeenLastCalledWith(null);
    expect(fatal).not.toHaveBeenCalled();
    expect(setContextPrompt).toHaveBeenCalledWith(
      "3D renderer paused. Restoring the scene when graphics return.",
    );

    renderer.domElement.dispatchEvent(new Event("webglcontextrestored"));
    expect(renderer.setAnimationLoop).toHaveBeenCalledTimes(3);
    expect(renderer.setAnimationLoop).not.toHaveBeenLastCalledWith(null);
    experience.dispose();
  });

  it("pauses while the page is hidden and resumes when visible", () => {
    const originalHidden = Object.getOwnPropertyDescriptor(document, "hidden");
    const { renderer, experience } = createExperience();
    const setContextPrompt = vi.fn();
    (experience as unknown as { ui: { setContextPrompt: (prompt: string) => void } }).ui = {
      setContextPrompt,
    };
    try {
      Object.defineProperty(document, "hidden", { configurable: true, value: false });
      experience.start();
      Object.defineProperty(document, "hidden", { configurable: true, value: true });
      document.dispatchEvent(new Event("visibilitychange"));
      expect(renderer.setAnimationLoop).toHaveBeenLastCalledWith(null);
      expect(setContextPrompt).toHaveBeenCalledWith(
        "3D renderer paused while the tab is in the background.",
      );

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
