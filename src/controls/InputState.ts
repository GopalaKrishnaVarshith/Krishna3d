export interface ControlIntent {
  moveX: number;
  moveZ: number;
  orbitX: number;
  orbitY: number;
  zoom: number;
  interact: boolean;
}

const clamp = (value: number, limit = 1): number => Math.max(-limit, Math.min(limit, value));

/** Pointer pixels become radians here; CameraRig.orbit receives radians only. */
export const ORBIT_RADIANS_PER_PIXEL = 0.0035;

/** Owns raw device state; one-shot orbit and zoom deltas are consumed per frame. */
export class InputState {
  private readonly keys = new Set<string>();
  private pointer: { id: number; x: number; y: number } | null = null;
  private touch: { id: number; x: number; y: number; moveX: number; moveZ: number } | null = null;
  private orbitX = 0;
  private orbitY = 0;
  private zoom = 0;
  private blocked = false;

  get state(): ControlIntent {
    if (this.blocked) return { moveX: 0, moveZ: 0, orbitX: 0, orbitY: 0, zoom: 0, interact: false };
    const x = Number(this.keys.has("KeyD") || this.keys.has("ArrowRight"))
      - Number(this.keys.has("KeyA") || this.keys.has("ArrowLeft")) + (this.touch?.moveX ?? 0);
    const z = Number(this.keys.has("KeyS") || this.keys.has("ArrowDown"))
      - Number(this.keys.has("KeyW") || this.keys.has("ArrowUp")) + (this.touch?.moveZ ?? 0);
    const magnitude = Math.max(1, Math.hypot(x, z));
    return { moveX: x / magnitude, moveZ: z / magnitude,
      orbitX: this.orbitX, orbitY: this.orbitY, zoom: this.zoom,
      interact: this.keys.has("KeyE") || this.keys.has("Space") || this.keys.has("Enter") };
  }

  consumeFrame(): ControlIntent {
    const intent = this.state;
    this.orbitX = this.orbitY = this.zoom = 0;
    return intent;
  }

  keyDown(code: string): void { if (!this.blocked) this.keys.add(code); }
  keyUp(code: string): void { this.keys.delete(code); }
  pointerDown(id: number, x: number, y: number): void {
    if (!this.blocked && !this.pointer) this.pointer = { id, x, y };
  }
  pointerMove(id: number, x: number, y: number): void {
    if (!this.pointer || this.pointer.id !== id || this.blocked) return;
    this.orbitX += (x - this.pointer.x) * ORBIT_RADIANS_PER_PIXEL;
    this.orbitY += (y - this.pointer.y) * ORBIT_RADIANS_PER_PIXEL;
    this.pointer.x = x;
    this.pointer.y = y;
  }
  pointerUp(id: number): void { if (this.pointer?.id === id) this.pointer = null; }
  wheel(deltaY: number): void { if (!this.blocked && Number.isFinite(deltaY)) this.zoom += clamp(deltaY / 120, 4); }
  touchStart(id: number, x: number, y: number): void {
    if (!this.blocked && !this.touch) this.touch = { id, x, y, moveX: 0, moveZ: 0 };
  }
  touchMove(id: number, x: number, y: number): void {
    if (!this.touch || this.touch.id !== id || this.blocked) return;
    this.touch.moveX = clamp((x - this.touch.x) / 60);
    this.touch.moveZ = clamp((y - this.touch.y) / 60);
  }
  touchEnd(id: number): void { if (this.touch?.id === id) this.touch = null; }
  touchCancel(id: number): void { this.touchEnd(id); }
  setBlocked(blocked: boolean): void { if (blocked) this.clear(); this.blocked = blocked; }
  clear(): void {
    this.keys.clear();
    this.pointer = this.touch = null;
    this.orbitX = this.orbitY = this.zoom = 0;
  }
}
