import { Camera, Object3D, Raycaster, Vector2, Vector3 } from "three";
import type { EventBus } from "../core/EventBus";
import type { InteractiveTarget } from "../world/types";

export interface InteractionEvents {
  "interaction:prompt": { id: string; label: string; action: string };
  "interaction:clear": { id: string };
}

export interface InteractionOptions {
  camera: Camera;
  events?: Pick<EventBus<InteractionEvents>, "emit">;
  overlayOpen?: () => boolean;
  maxDistance?: number;
}

/** One raycaster shared by every registered world target. Focus and pointer use the same action. */
export class InteractionSystem {
  readonly raycaster = new Raycaster();
  private readonly targets = new Map<string, InteractiveTarget>();
  private readonly objects: Object3D[] = [];
  private readonly owner = new Map<Object3D, InteractiveTarget>();
  private readonly origin = new Vector3();
  private readonly candidate = new Vector3();
  private readonly ndc = new Vector2();
  private selected: InteractiveTarget | null = null;
  private readonly baseScale = new WeakMap<Object3D, Vector3>();

  constructor(private readonly options: InteractionOptions) {
    this.raycaster.far = options.maxDistance ?? Infinity;
  }

  get current(): InteractiveTarget | null { return this.options.overlayOpen?.() ? null : this.selected; }

  register(target: InteractiveTarget): void {
    if (this.targets.has(target.id)) throw new Error(`Duplicate interaction target: ${target.id}`);
    this.targets.set(target.id, target);
    this.objects.push(target.object);
    this.owner.set(target.object, target);
    this.baseScale.set(target.object, target.object.scale.clone());
  }

  unregister(id: string): void {
    const target = this.targets.get(id);
    if (!target) return;
    if (this.selected === target) this.select(null);
    this.targets.delete(id);
    this.owner.delete(target.object);
    const index = this.objects.indexOf(target.object);
    if (index >= 0) this.objects.splice(index, 1);
    const scale = this.baseScale.get(target.object);
    if (scale) target.object.scale.copy(scale);
  }

  /** Normalized device coordinates in the -1 to +1 range. */
  point(x: number, y: number): InteractiveTarget | null {
    if (this.options.overlayOpen?.()) { this.select(null); return null; }
    this.ndc.set(x, y);
    this.options.camera.updateWorldMatrix(true, false);
    for (const object of this.objects) object.updateWorldMatrix(true, true);
    this.raycaster.setFromCamera(this.ndc, this.options.camera);
    const hits = this.raycaster.intersectObjects(this.objects, true);
    for (const hit of hits) {
      let node: Object3D | null = hit.object;
      while (node) {
        const target = this.owner.get(node);
        if (target) { this.select(target); return target; }
        node = node.parent;
      }
    }
    this.select(null);
    return null;
  }

  /** Keyboard or accessibility control may focus a stable target ID directly. */
  focus(id: string): boolean {
    if (this.options.overlayOpen?.()) { this.select(null); return false; }
    const target = this.targets.get(id);
    if (!target) { this.select(null); return false; }
    this.select(target);
    return true;
  }

  /** Finds the closest world target within reach for keyboard or gamepad exploration. */
  focusNearest(position: Vector3, reach = this.options.maxDistance ?? 4): InteractiveTarget | null {
    if (this.options.overlayOpen?.()) { this.select(null); return null; }
    let nearest: InteractiveTarget | null = null;
    let distance = reach * reach;
    for (const target of this.targets.values()) {
      target.object.getWorldPosition(this.candidate);
      const candidateDistance = this.candidate.distanceToSquared(this.origin.copy(position));
      if (candidateDistance < distance) { distance = candidateDistance; nearest = target; }
    }
    this.select(nearest);
    return nearest;
  }

  activate(): boolean {
    if (this.options.overlayOpen?.()) { this.select(null); return false; }
    if (!this.selected) return false;
    this.selected.activate();
    return true;
  }

  update(delta: number): void {
    if (this.options.overlayOpen?.()) this.select(null);
    const alpha = 1 - Math.exp(-12 * Math.max(0, delta));
    for (const target of this.targets.values()) {
      const base = this.baseScale.get(target.object);
      if (!base) continue;
      const multiplier = target === this.selected ? 1.08 : 1;
      this.candidate.copy(base).multiplyScalar(multiplier);
      target.object.scale.lerp(this.candidate, alpha);
    }
  }

  dispose(): void {
    for (const id of [...this.targets.keys()]) this.unregister(id);
  }

  private select(target: InteractiveTarget | null): void {
    if (target === this.selected) return;
    if (this.selected) this.options.events?.emit("interaction:clear", { id: this.selected.id });
    this.selected = target;
    if (target) this.options.events?.emit("interaction:prompt", {
      id: target.id, label: target.label, action: `Open ${target.label}`,
    });
  }
}
