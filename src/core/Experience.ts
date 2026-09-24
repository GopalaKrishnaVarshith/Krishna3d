import {
  BufferGeometry,
  Clock,
  Material,
  PerspectiveCamera,
  Scene,
  Texture,
  WebGLRenderer,
} from "three";
import { AssetManager } from "./AssetManager";
import { EventBus, type ExperienceEvents } from "./EventBus";
import { PerformanceManager } from "./PerformanceManager";

export class Experience {
  readonly renderer: WebGLRenderer;
  readonly scene = new Scene();
  readonly camera = new PerspectiveCamera(55, 1, 0.1, 200);
  readonly clock = new Clock(false);
  readonly events = new EventBus<ExperienceEvents>();
  readonly assets = new AssetManager();
  readonly performance = new PerformanceManager();

  private started = false;
  private running = false;
  private contextLost = false;
  private disposed = false;

  constructor(
    private readonly container: HTMLElement,
    renderer = new WebGLRenderer({ antialias: true, powerPreference: "high-performance" }),
  ) {
    this.renderer = renderer;
    this.renderer.setClearColor(0x08131c);
    this.camera.position.set(0, 2, 8);
    this.camera.lookAt(0, 0, 0);
  }

  start(): void {
    if (this.disposed) throw new Error("Cannot start a disposed Experience");
    if (this.started) return;
    this.started = true;
    this.container.appendChild(this.renderer.domElement);
    window.addEventListener("resize", this.handleResize);
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    this.renderer.domElement.addEventListener("webglcontextlost", this.handleContextLost);
    this.renderer.domElement.addEventListener("webglcontextrestored", this.handleContextRestored);
    this.resize();
    this.resume();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    window.removeEventListener("resize", this.handleResize);
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    this.renderer.domElement.removeEventListener("webglcontextlost", this.handleContextLost);
    this.renderer.domElement.removeEventListener("webglcontextrestored", this.handleContextRestored);
    this.pause();

    const geometries = new Set<BufferGeometry>();
    const materials = new Set<Material>();
    const materialTextures = new Set<Texture>();
    this.scene.traverse((object) => {
      const drawable = object as typeof object & {
        geometry?: BufferGeometry;
        material?: Material | Material[];
      };
      if (drawable.geometry instanceof BufferGeometry) geometries.add(drawable.geometry);
      const objectMaterials = drawable.material;
      if (Array.isArray(objectMaterials)) {
        for (const material of objectMaterials) materials.add(material);
      } else if (objectMaterials instanceof Material) {
        materials.add(objectMaterials);
      }
    });
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) {
      for (const value of Object.values(material)) {
        if (value instanceof Texture && !this.assets.owns(value)) materialTextures.add(value);
      }
      material.dispose();
    }
    for (const texture of materialTextures) texture.dispose();
    this.scene.clear();
    this.assets.dispose();
    this.events.clear();
    this.renderer.forceContextLoss();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private readonly handleResize = (): void => this.resize();

  private readonly handleVisibilityChange = (): void => {
    if (document.hidden) this.pause();
    else this.resume();
  };

  private readonly handleContextLost = (event: Event): void => {
    event.preventDefault();
    this.contextLost = true;
    this.pause();
  };

  private readonly handleContextRestored = (): void => {
    this.contextLost = false;
    this.resize();
    this.resume();
  };

  private readonly renderFrame = (): void => {
    const nextTier = this.performance.sample(this.clock.getDelta() * 1000);
    if (nextTier) {
      this.resize();
      this.events.emit("quality:change", { tier: nextTier });
    }
    this.renderer.render(this.scene, this.camera);
  };

  private resize(): void {
    if (this.disposed || !this.started) return;
    const width = Math.max(1, this.container.clientWidth || window.innerWidth);
    const height = Math.max(1, this.container.clientHeight || window.innerHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.performance.pixelRatioCap));
    this.renderer.setSize(width, height, false);
  }

  private resume(): void {
    if (!this.started || this.disposed || this.contextLost || document.hidden || this.running) return;
    this.clock.start();
    this.renderer.setAnimationLoop(this.renderFrame);
    this.running = true;
  }

  private pause(): void {
    if (!this.running) return;
    this.renderer.setAnimationLoop(null);
    this.clock.stop();
    this.running = false;
  }
}
