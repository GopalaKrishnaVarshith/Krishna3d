import {
  BufferGeometry,
  Material,
  PerspectiveCamera,
  Scene,
  Texture,
  Vector3,
  WebGLRenderer,
} from "three";
import { Avatar } from "../avatar/Avatar";
import { CameraRig } from "../camera/CameraRig";
import { Controls } from "../controls/Controls";
import type { InteractionEvents } from "../interaction/InteractionSystem";
import { InteractionSystem } from "../interaction/InteractionSystem";
import type { UIController } from "../ui/UIController";
import { DESTINATIONS, assetUrl } from "../ui/templates";
import { MetricVisualization } from "../world/MetricVisualization";
import { ProjectVault } from "../world/ProjectVault";
import { ThemeController, type WorldTheme } from "../world/ThemeController";
import { World } from "../world/World";
import type { WorldZone } from "../world/types";
import type { DynamicWorldZone } from "../world/zones/zoneKit";
import type { EvidenceVaultZone } from "../world/zones/EvidenceVault";
import type { CareerTrailZone } from "../world/zones/CareerTrail";
import { portfolioData } from "../data/portfolioData";
import { AssetManager } from "./AssetManager";
import { EventBus, type ExperienceEvents } from "./EventBus";
import { PerformanceManager } from "./PerformanceManager";

class FrameTimer {
  private running = false;
  private previous = 0;

  constructor(private readonly now = () => performance.now()) {}

  start(): void {
    this.previous = this.now();
    this.running = true;
  }

  stop(): void {
    this.running = false;
  }

  getDelta(): number {
    if (!this.running) return 0;
    const current = this.now();
    const delta = (current - this.previous) / 1000;
    this.previous = current;
    return Math.max(0, Math.min(delta, 0.1));
  }
}

type TourFocusKind = "profile" | "section" | "capability" | "project" | "domain" | "experience" | "contact";

interface GuidedWalk {
  points: Vector3[];
  onArrive?: () => void;
  lastPosition: Vector3;
  stalledMs: number;
}

interface TourAudio {
  master: GainNode;
  delay: DelayNode;
  feedback: GainNode;
  filter: BiquadFilterNode;
  timer: number;
}

export class Experience {
  readonly renderer: WebGLRenderer;
  readonly scene = new Scene();
  readonly camera = new PerspectiveCamera(55, 1, 0.1, 200);
  readonly clock = new FrameTimer();
  readonly events = new EventBus<ExperienceEvents>();
  readonly assets = new AssetManager();
  readonly performance = new PerformanceManager();
  private readonly interactionEvents = new EventBus<InteractionEvents>();

  private world: World | null = null;
  private theme: ThemeController | null = null;
  private avatar: Avatar | null = null;
  private controls: Controls | null = null;
  private cameraRig: CameraRig | null = null;
  private interaction: InteractionSystem | null = null;
  private metrics: MetricVisualization | null = null;
  private vault: ProjectVault | null = null;
  private ui: UIController | null = null;
  private readonly mobileMoves = new Set<string>();
  private guidedWalk: GuidedWalk | null = null;
  private interactRequested = false;
  private interactHeld = false;
  private soundEnabled = false;
  private audio: AudioContext | null = null;
  private tourAudio: TourAudio | null = null;
  private fatalHandler: ((reason: string) => void) | null = null;
  private pointerStart: { x: number; y: number } | null = null;

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

  setFatalHandler(handler: (reason: string) => void): void { this.fatalHandler = handler; }

  /** Build one scene. The terrain is painted before the detailed zones and portrait load. */
  async initialize(ui: UIController): Promise<void> {
    if (this.disposed) throw new Error("Cannot initialize a disposed Experience");
    this.ui = ui;
    this.soundEnabled = ui.soundOn;
    const world = new World((zone) => this.enterZone(zone), { deferZones: true });
    this.world = world;
    this.scene.add(world.group);
    this.theme = new ThemeController(this.scene, { reducedMotion: ui.motionReduced });
    this.theme.bindWorldTerrain(world.group);
    this.mount();
    this.camera.fov = 74;
    this.camera.position.set(0, 6.8, 14.3);
    this.camera.lookAt(0, -0.5, -1.6);
    this.resize();
    this.renderer.render(this.scene, this.camera);
    ui.setLoading(0.4);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    if (this.disposed) return;

    world.registerZones({
      reducedMotion: ui.motionReduced,
      onNavigate: (id) => this.navigate(id),
      onCapabilitySelect: (id) => this.selectCapability(id),
      onProjectSelect: (id) => this.openProject(id),
      onDomainSelect: (id) => this.selectDomain(id),
      onExperienceSelect: (id) => this.openExperience(id),
      onEmail: (href) => { window.location.href = href; },
      onLinkedIn: (href) => { window.open(href, "_blank", "noopener,noreferrer"); },
    });
    this.theme.bindSceneMaterials(world.group);
    ui.setLoading(0.7);

    const portrait = await this.assets.loadTexture(assetUrl(portfolioData.profile.portrait));
    if (this.disposed) return;
    const avatar = new Avatar(portrait);
    this.avatar = avatar;
    avatar.group.position.copy(world.spawnPoint);
    avatar.setReducedMotion(ui.motionReduced);
    this.scene.add(avatar.group);

    const touchPadContainer = ui.rootElement.querySelector<HTMLElement>(".mobile-touch-pad") ?? undefined;
    this.controls = new Controls(this.renderer.domElement, {
      overlayOpen: () => ui.isOverlayOpen,
      touchPadContainer,
    });
    this.cameraRig = new CameraRig(this.camera, {
      terrainHeight: (x, z) => world.getHeightAt(x, z),
      obstructionDistance: (from, to) => world.getCameraObstructionDistance(from, to),
      reducedMotion: ui.motionReduced,
    });
    this.cameraRig.setAvatarPose(avatar.group.position, avatar.group.rotation.y);
    this.cameraRig.snapTo(avatar.group.position);

    this.interaction = new InteractionSystem({ camera: this.camera,
      events: this.interactionEvents, overlayOpen: () => ui.isOverlayOpen, maxDistance: 4.8 });
    for (const id of world.zones.ids) {
      for (const target of world.zones.get(id)!.interactiveObjects) this.interaction.register(target);
    }
    this.interactionEvents.on("interaction:prompt", ({ action }) =>
      ui.setContextPrompt(`${action} · press E or Interact`));
    this.interactionEvents.on("interaction:clear", () => {
      const id = world.zones.currentZone?.id;
      const hint = DESTINATIONS.find((destination) => destination.id === id)?.hint;
      if (hint) ui.setContextPrompt(hint);
    });
    this.renderer.domElement.addEventListener("click", this.handleCanvasClick);
    this.renderer.domElement.addEventListener("pointerdown", this.handleCanvasPointerDown);

    const vaultZone = world.zones.get("evidence-vault") as EvidenceVaultZone;
    this.metrics = new MetricVisualization();
    this.vault = new ProjectVault(vaultZone, { metrics: this.metrics, events: this.events });
    this.navigate("plaza");
    ui.setLoading(1);
    this.start();
  }

  navigate(id: string): void {
    if (!this.world?.zones.get(id)) return;
    this.world.zones.navigateTo(id);
    this.playNavigationSound();
  }

  openProject(id: string): void {
    if (!this.world || !this.vault || !this.ui) return;
    if (this.world.zones.currentZone?.id !== "evidence-vault") this.navigate("evidence-vault");
    if (!this.vault.open(id)) return;
    this.ui.openProject(id);
  }

  openExperience(id: string): void {
    if (!this.world || !this.ui) return;
    if (this.world.zones.currentZone?.id !== "career-trail") this.navigate("career-trail");
    const trail = this.world.zones.get("career-trail") as CareerTrailZone;
    const point = trail.milestoneViewingPoints.get(id);
    const composition = trail.milestoneCameras.get(id);
    if (point && composition && this.avatar && this.cameraRig) {
      this.avatar.group.position.copy(this.world.constrainPosition(point, this.avatar.colliderRadius));
      this.cameraRig.setAvatarPose(this.avatar.group.position, this.avatar.group.rotation.y);
      this.cameraRig.transitionTo(composition);
    }
    this.ui.openExperience(id);
  }

  tourNavigate(id: string, onArrive?: () => void): number {
    if (!this.world || !this.avatar) { onArrive?.(); return 900; }
    const zone = this.world.zones.get(id);
    if (!zone) { onArrive?.(); return 900; }
    return this.startGuidedWalk(this.routeTo(zone.entryPoint), () => {
      this.activateTourZone(zone);
      onArrive?.();
    });
  }

  tourFocus(kind: TourFocusKind, id?: string, onArrive?: () => void): number {
    if (!this.world || !this.avatar) { onArrive?.(); return 0; }
    this.playNavigationSound();
    if (kind === "profile") return this.focusTourProfile(onArrive);
    if (kind === "section") { onArrive?.(); return 0; }
    if (kind === "capability" && id) return this.focusTourInteractive("automation-lab", `capability:${id}`, onArrive);
    if (kind === "domain" && id) return this.focusTourInteractive("observatory", `domain:${id}`, onArrive);
    if (kind === "project" && id) return this.focusTourProject(id, onArrive);
    if (kind === "experience" && id) return this.focusTourExperience(id, onArrive);
    onArrive?.();
    return kind === "contact" ? 900 : 500;
  }

  stopTour(): void {
    this.guidedWalk = null;
    this.stopTourMusic();
  }

  startTourMusic(): void {
    if (this.tourAudio) return;
    const audio = this.ensureAudio();
    if (!audio) return;
    void audio.resume();
    const now = audio.currentTime;
    const master = audio.createGain();
    const filter = audio.createBiquadFilter();
    const delay = audio.createDelay(1);
    const feedback = audio.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.075, now + 0.65);
    filter.type = "lowpass";
    filter.frequency.value = 1700;
    delay.delayTime.value = 0.28;
    feedback.gain.value = 0.24;
    master.connect(filter).connect(audio.destination);
    filter.connect(delay).connect(feedback).connect(delay);
    delay.connect(audio.destination);
    let step = 0;
    const scale = [261.63, 329.63, 392, 493.88, 587.33, 493.88, 392, 329.63];
    const playNote = (frequency: number, at: number, duration: number, volume: number,
      type: OscillatorType) => {
      const oscillator = audio.createOscillator();
      const noteGain = audio.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, at);
      oscillator.detune.setValueAtTime(Math.sin(step) * 5, at);
      noteGain.gain.setValueAtTime(0.0001, at);
      noteGain.gain.exponentialRampToValueAtTime(volume, at + 0.025);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
      oscillator.connect(noteGain).connect(master);
      oscillator.start(at);
      oscillator.stop(at + duration + 0.04);
    };
    const playStep = () => {
      const at = audio.currentTime + 0.02;
      playNote(scale[step % scale.length], at, 0.24, 0.085, "triangle");
      if (step % 4 === 0) playNote(scale[0] / 2, at, 0.36, 0.055, "sine");
      if (step % 8 === 6) playNote(scale[4] * 2, at, 0.12, 0.032, "sine");
      step += 1;
    };
    playStep();
    const timer = window.setInterval(playStep, 420);
    this.tourAudio = { master, delay, feedback, filter, timer };
  }

  setTheme(theme: WorldTheme): void {
    this.theme?.setTheme(theme);
    this.events.emit("theme:change", { theme });
  }

  setReducedMotion(value: boolean): void {
    this.theme?.setReducedMotion(value);
    this.avatar?.setReducedMotion(value);
    this.cameraRig?.setReducedMotion(value);
    for (const id of this.world?.zones.ids ?? [])
      (this.world?.zones.get(id) as DynamicWorldZone).setReducedMotion(value);
  }

  setSound(value: boolean): void {
    this.soundEnabled = value;
    if (value) void this.ensureAudio()?.resume();
    else void this.audio?.suspend();
  }

  setMove(direction: "forward" | "back" | "left" | "right", pressed: boolean): void {
    if (pressed) this.mobileMoves.add(direction);
    else this.mobileMoves.delete(direction);
  }

  requestInteraction(): void { if (!this.ui?.isOverlayOpen) this.interactRequested = true; }

  start(): void {
    if (this.disposed) throw new Error("Cannot start a disposed Experience");
    this.mount();
    this.resume();
  }

  private mount(): void {
    if (this.started) return;
    this.started = true;
    this.container.appendChild(this.renderer.domElement);
    window.addEventListener("resize", this.handleResize);
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    this.renderer.domElement.addEventListener("webglcontextlost", this.handleContextLost);
    this.renderer.domElement.addEventListener("webglcontextrestored", this.handleContextRestored);
    this.resize();
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    window.removeEventListener("resize", this.handleResize);
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    this.renderer.domElement.removeEventListener("webglcontextlost", this.handleContextLost);
    this.renderer.domElement.removeEventListener("webglcontextrestored", this.handleContextRestored);
    this.renderer.domElement.removeEventListener("click", this.handleCanvasClick);
    this.renderer.domElement.removeEventListener("pointerdown", this.handleCanvasPointerDown);
    this.pause();

    this.vault?.dispose();
    this.metrics?.dispose();
    this.interaction?.dispose();
    this.interactionEvents.clear();
    this.controls?.dispose();
    this.mobileMoves.clear();
    if (this.avatar) {
      this.disposeObjectResources(this.avatar.group);
      this.avatar.group.removeFromParent();
    }
    this.world?.dispose();
    this.theme?.dispose();
    this.stopTour();
    void this.audio?.close();
    this.audio = null;
    this.ui = null;
    this.vault = null;
    this.metrics = null;
    this.interaction = null;
    this.controls = null;
    this.cameraRig = null;
    this.avatar = null;
    this.world = null;
    this.theme = null;

    this.disposeObjectResources(this.scene);
    this.scene.clear();
    this.assets.dispose();
    this.events.clear();
    this.renderer.forceContextLoss();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private disposeObjectResources(root: Scene | Avatar["group"]): void {
    const geometries = new Set<BufferGeometry>();
    const materials = new Set<Material>();
    const materialTextures = new Set<Texture>();
    root.traverse((object) => {
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
  }

  private readonly handleResize = (): void => this.resize();

  private readonly handleVisibilityChange = (): void => {
    if (document.hidden) {
      this.pause();
      this.ui?.setContextPrompt("3D renderer paused while the tab is in the background.");
    } else {
      this.resume();
      this.restoreContextPrompt();
    }
  };

  private readonly handleContextLost = (event: Event): void => {
    event.preventDefault();
    this.contextLost = true;
    this.pause();
    this.ui?.setContextPrompt("3D renderer paused. Restoring the scene when graphics return.");
  };

  private readonly handleContextRestored = (): void => {
    this.contextLost = false;
    this.resize();
    this.resume();
    this.restoreContextPrompt();
  };

  private readonly renderFrame = (): void => {
    try {
      const delta = this.clock.getDelta();
      const nextTier = this.performance.sample(delta * 1000);
      if (nextTier) {
        this.theme?.setQualityTier(nextTier);
        this.resize();
        this.events.emit("quality:change", { tier: nextTier });
      }
      this.updateWorld(delta);
      this.renderer.render(this.scene, this.camera);
    } catch (error) {
      this.pause();
      if (!this.fatalHandler) throw error;
      this.fatalHandler("The 3D display could not continue. The complete text portfolio is available below.");
    }
  };

  private focusTourProject(id: string, onArrive?: () => void): number {
    const zone = this.world?.zones.get("evidence-vault") as EvidenceVaultZone | undefined;
    const capsule = zone?.capsulePositions.get(id);
    if (!zone || !capsule) return 500;
    const center = new Vector3(0, 0, -14);
    const standPoint = capsule.clone().lerp(center, 0.58).setY(0);
    const target = capsule.clone().lerp(center, 0.42).setY(1.35);
    const cameraPoint = zone.cameraPoints.get(id)?.clone() ?? new Vector3(0, 4.6, -6.7);
    cameraPoint.y = Math.max(cameraPoint.y, 2.35);
    return this.startGuidedWalk(this.routeTo(standPoint), () => {
      this.vault?.open(id);
      this.cameraRig?.transitionTo({
        position: cameraPoint,
        target,
        durationMs: 700,
        fov: 60,
      });
      onArrive?.();
    });
  }

  private focusTourProfile(onArrive?: () => void): number {
    this.cameraRig?.transitionTo({
      position: new Vector3(-3.8, 2.5, 6.2),
      target: new Vector3(-2.55, 1.05, 1.25),
      durationMs: 650,
      fov: 46,
    });
    onArrive?.();
    return 0;
  }

  private focusTourInteractive(zoneId: string, targetId: string, onArrive?: () => void): number {
    const zone = this.world?.zones.get(zoneId);
    const target = zone?.interactiveObjects.find((item) => item.id === targetId);
    if (!target || !this.avatar) { onArrive?.(); return 500; }
    const point = new Vector3();
    target.object.getWorldPosition(point);
    point.y = 0;
    const direction = point.clone().sub(this.avatar.group.position).setY(0);
    if (direction.lengthSq() > 0) direction.normalize();
    return this.startGuidedWalk([point.clone().addScaledVector(direction, -1.05)], onArrive);
  }

  private focusTourExperience(id: string, onArrive?: () => void): number {
    const trail = this.world?.zones.get("career-trail") as CareerTrailZone | undefined;
    const point = trail?.milestoneViewingPoints.get(id);
    const composition = trail?.milestoneCameras.get(id);
    if (!point) { onArrive?.(); return 500; }
    return this.startGuidedWalk([point], () => {
      if (composition) this.cameraRig?.transitionTo(composition);
      onArrive?.();
    });
  }

  private startGuidedWalk(points: Vector3[], onArrive?: () => void): number {
    if (!this.avatar) { onArrive?.(); return 0; }
    const clean = points.map((point) => point.clone().setY(0))
      .filter((point) => point.distanceToSquared(this.avatar!.group.position) > 0.16);
    if (!clean.length) { onArrive?.(); return 0; }
    this.guidedWalk = { points: clean, onArrive, lastPosition: this.avatar.group.position.clone(), stalledMs: 0 };
    return this.estimateWalkMs(clean);
  }

  private routeTo(target: Vector3): Vector3[] {
    if (!this.avatar) return [target.clone()];
    const center = new Vector3(0, 0, 0);
    const points: Vector3[] = [];
    if (target.distanceTo(center) > 6 && this.avatar.group.position.distanceTo(center) > 1.2)
      points.push(center);
    points.push(target.clone());
    return points;
  }

  private estimateWalkMs(points: Vector3[]): number {
    if (!this.avatar) return 0;
    let previous = this.avatar.group.position;
    let distance = 0;
    for (const point of points) {
      distance += previous.distanceTo(point);
      previous = point;
    }
    return Math.max(900, Math.ceil(distance / 1.65 * 1000 + 650));
  }

  private guidedInput(delta: number): { x: number; z: number } | null {
    if (!this.guidedWalk || !this.avatar) return null;
    const position = this.avatar.group.position;
    while (this.guidedWalk.points.length) {
      const target = this.guidedWalk.points[0];
      const dx = target.x - position.x;
      const dz = target.z - position.z;
      const distance = Math.hypot(dx, dz);
      if (distance > 0.36) {
        const moved = position.distanceTo(this.guidedWalk.lastPosition);
        this.guidedWalk.stalledMs = moved < 0.015 ? this.guidedWalk.stalledMs + delta * 1000 : 0;
        this.guidedWalk.lastPosition.copy(position);
        if (this.guidedWalk.stalledMs > 1400 && this.world) {
          // ponytail: tour-only recovery; replace with navmesh routing if authored paths grow.
          position.copy(this.world.constrainPosition(target, this.avatar.colliderRadius));
          this.guidedWalk.stalledMs = 0;
        }
        return { x: dx / distance, z: dz / distance };
      }
      this.guidedWalk.points.shift();
      this.guidedWalk.stalledMs = 0;
      this.guidedWalk.lastPosition.copy(position);
    }
    const onArrive = this.guidedWalk.onArrive;
    this.guidedWalk = null;
    onArrive?.();
    return { x: 0, z: 0 };
  }

  private activateTourZone(zone: WorldZone): void {
    this.world?.zones.activate(zone.id);
    this.cameraRig?.transitionTo(zone.cameraComposition);
    this.ui?.setZone(zone.id);
    this.events.emit("zone:enter", { zoneId: zone.id });
  }

  private updateWorld(delta: number): void {
    if (!this.world || !this.avatar || !this.controls || !this.cameraRig || !this.interaction) return;
    const intent = this.controls.consumeFrame();
    const guided = this.guidedInput(delta);
    const x = guided?.x ?? intent.moveX + Number(this.mobileMoves.has("right")) - Number(this.mobileMoves.has("left"));
    const z = guided?.z ?? intent.moveZ + Number(this.mobileMoves.has("back")) - Number(this.mobileMoves.has("forward"));
    const magnitude = Math.max(1, Math.hypot(x, z));
    const activate = this.interactRequested || (intent.interact && !this.interactHeld);
    this.interactHeld = intent.interact;
    this.interactRequested = false;
    const pose = this.avatar.update({ moveX: x / magnitude, moveZ: z / magnitude,
      interact: intent.interact || activate }, delta);
    this.avatar.group.position.copy(this.world.constrainPosition(
      this.avatar.group.position, this.avatar.colliderRadius));
    this.cameraRig.setAvatarPose(this.avatar.group.position, pose.yaw);
    this.cameraRig.orbit(intent.orbitX, intent.orbitY);
    this.cameraRig.zoom(intent.zoom);
    this.cameraRig.follow(this.avatar.group.position, delta);
    this.avatar.faceCamera(this.camera.position);
    this.theme?.update(delta);
    this.world.update(delta);
    this.interaction.focusNearest(this.avatar.group.position);
    if (activate) this.interaction.activate();
    this.interaction.update(delta);
    this.vault?.update(delta, this.avatar.group.position, this.ui?.motionReduced);
    this.metrics?.update(delta, this.ui?.motionReduced);
  }

  private enterZone(zone: WorldZone): void {
    if (this.avatar && this.world && this.cameraRig) {
      this.avatar.group.position.copy(this.world.constrainPosition(zone.entryPoint,
        this.avatar.colliderRadius));
      this.cameraRig.setAvatarPose(this.avatar.group.position, this.avatar.group.rotation.y);
      this.cameraRig.transitionTo(zone.cameraComposition);
    }
    this.ui?.setZone(zone.id);
    this.events.emit("zone:enter", { zoneId: zone.id });
  }

  private selectCapability(id: string): void { this.ui?.openCapability(id); }
  private selectDomain(id: string): void { this.ui?.openDomain(id); }

  private restoreContextPrompt(): void {
    const id = this.world?.zones.currentZone?.id;
    const hint = DESTINATIONS.find((destination) => destination.id === id)?.hint;
    if (hint) this.ui?.setContextPrompt(hint);
  }

  private readonly handleCanvasPointerDown = (event: PointerEvent): void => {
    this.pointerStart = { x: event.clientX, y: event.clientY };
  };

  private readonly handleCanvasClick = (event: MouseEvent): void => {
    if (!this.interaction || this.ui?.isOverlayOpen) return;
    if (this.pointerStart && Math.hypot(event.clientX - this.pointerStart.x,
      event.clientY - this.pointerStart.y) > 6) return;
    this.pointerStart = null;
    const bounds = this.renderer.domElement.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const x = (event.clientX - bounds.left) / bounds.width * 2 - 1;
    const y = 1 - (event.clientY - bounds.top) / bounds.height * 2;
    if (this.interaction.point(x, y)) this.interaction.activate();
  };

  private ensureAudio(): AudioContext | null {
    if (this.audio) return this.audio;
    if (typeof AudioContext === "undefined") return null;
    try { this.audio = new AudioContext(); } catch { return null; }
    return this.audio;
  }

  private stopTourMusic(): void {
    if (!this.tourAudio) return;
    const { master, delay, feedback, filter, timer } = this.tourAudio;
    window.clearInterval(timer);
    const audio = this.audio;
    const now = audio?.currentTime ?? 0;
    try {
      if (audio) master.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    } catch { /* The audio graph may already be closed. */ }
    window.setTimeout(() => {
      master.disconnect();
      delay.disconnect();
      feedback.disconnect();
      filter.disconnect();
    }, 450);
    this.tourAudio = null;
  }

  private playNavigationSound(): void {
    if (!this.soundEnabled) return;
    const audio = this.ensureAudio();
    if (!audio) return;
    void audio.resume();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    const now = audio.currentTime;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(392, now);
    oscillator.frequency.exponentialRampToValueAtTime(523.25, now + 0.16);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.012, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.21);
  }

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
