import { InputState, type ControlIntent } from "./InputState";

const CONTROL_KEYS = new Set(["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown",
  "ArrowLeft", "ArrowRight", "KeyE", "Space", "Enter"]);

export interface ControlsOptions {
  touchPad?: HTMLElement;
  touchPadContainer?: HTMLElement;
  overlayOpen?: () => boolean;
}

/** DOM adapter for keyboard, drag, wheel, and a supplied on-screen touch pad. */
export class Controls {
  readonly input = new InputState();
  private readonly touchPad: HTMLElement | undefined;
  private readonly ownsTouchPad: boolean;
  private readonly overlayOpen: () => boolean;

  constructor(private readonly canvas: HTMLElement, options: ControlsOptions = {}) {
    this.touchPad = options.touchPad ?? (options.touchPadContainer ? Controls.createTouchPad(options.touchPadContainer) : undefined);
    this.ownsTouchPad = !options.touchPad && !!options.touchPadContainer;
    this.overlayOpen = options.overlayOpen ?? (() => false);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
    canvas.addEventListener("pointerdown", this.onPointerDown);
    canvas.addEventListener("pointermove", this.onPointerMove);
    canvas.addEventListener("pointerup", this.onPointerUp);
    canvas.addEventListener("pointercancel", this.onPointerUp);
    canvas.addEventListener("lostpointercapture", this.onPointerUp);
    canvas.addEventListener("wheel", this.onWheel, { passive: false });
    this.touchPad?.addEventListener("pointerdown", this.onTouchDown);
    this.touchPad?.addEventListener("pointermove", this.onTouchMove);
    this.touchPad?.addEventListener("pointerup", this.onTouchUp);
    this.touchPad?.addEventListener("pointercancel", this.onTouchUp);
    this.touchPad?.addEventListener("lostpointercapture", this.onTouchUp);
  }

  static createTouchPad(parent: HTMLElement): HTMLElement {
    const pad = document.createElement("div");
    pad.setAttribute("role", "region");
    pad.setAttribute("aria-label", "Movement touch pad");
    pad.style.width = "112px";
    pad.style.height = "112px";
    pad.style.borderRadius = "50%";
    pad.style.border = "2px solid #b59655";
    pad.style.background = "rgba(23, 59, 72, 0.67)";
    pad.style.setProperty("touch-action", "none");
    pad.style.userSelect = "none";
    pad.style.display = "grid";
    pad.style.placeItems = "center";
    const center = document.createElement("span");
    center.setAttribute("aria-hidden", "true");
    center.style.width = "38px";
    center.style.height = "38px";
    center.style.borderRadius = "50%";
    center.style.background = "#b59655";
    center.style.pointerEvents = "none";
    pad.appendChild(center);
    parent.appendChild(pad);
    return pad;
  }

  get state(): ControlIntent {
    this.syncOverlay();
    return this.input.state;
  }

  consumeFrame(): ControlIntent {
    this.syncOverlay();
    return this.input.consumeFrame();
  }

  dispose(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("pointerup", this.onPointerUp);
    this.canvas.removeEventListener("pointercancel", this.onPointerUp);
    this.canvas.removeEventListener("lostpointercapture", this.onPointerUp);
    this.canvas.removeEventListener("wheel", this.onWheel);
    this.touchPad?.removeEventListener("pointerdown", this.onTouchDown);
    this.touchPad?.removeEventListener("pointermove", this.onTouchMove);
    this.touchPad?.removeEventListener("pointerup", this.onTouchUp);
    this.touchPad?.removeEventListener("pointercancel", this.onTouchUp);
    this.touchPad?.removeEventListener("lostpointercapture", this.onTouchUp);
    this.input.clear();
    if (this.ownsTouchPad) this.touchPad?.remove();
  }

  private syncOverlay(): void { this.input.setBlocked(this.overlayOpen()); }
  private readonly onKeyDown = (event: KeyboardEvent): void => {
    this.syncOverlay();
    if (!CONTROL_KEYS.has(event.code) || this.isEditing(event.target)) return;
    if ((event.code === "Enter" || event.code === "Space") &&
      (event.target as HTMLElement | null)?.closest?.("button, a[href], summary")) return;
    if (!this.overlayOpen()) event.preventDefault();
    this.input.keyDown(event.code);
  };
  private readonly onKeyUp = (event: KeyboardEvent): void => { this.input.keyUp(event.code); };
  private readonly onBlur = (): void => this.input.clear();
  private readonly onPointerDown = (event: PointerEvent): void => {
    this.syncOverlay();
    if (event.button !== 0 || this.overlayOpen()) return;
    this.capturePointer(this.canvas, event.pointerId);
    this.input.pointerDown(event.pointerId, event.clientX, event.clientY);
  };
  private readonly onPointerMove = (event: PointerEvent): void =>
    this.input.pointerMove(event.pointerId, event.clientX, event.clientY);
  private readonly onPointerUp = (event: PointerEvent): void => this.input.pointerUp(event.pointerId);
  private readonly onWheel = (event: WheelEvent): void => {
    this.syncOverlay();
    if (this.overlayOpen()) return;
    event.preventDefault();
    this.input.wheel(event.deltaY);
  };
  private readonly onTouchDown = (event: PointerEvent): void => {
    this.syncOverlay();
    if (this.overlayOpen()) return;
    event.preventDefault();
    if (this.touchPad) this.capturePointer(this.touchPad, event.pointerId);
    this.input.touchStart(event.pointerId, event.clientX, event.clientY);
  };
  private readonly onTouchMove = (event: PointerEvent): void =>
    this.input.touchMove(event.pointerId, event.clientX, event.clientY);
  private readonly onTouchUp = (event: PointerEvent): void => this.input.touchEnd(event.pointerId);
  private capturePointer(element: HTMLElement, id: number): void {
    try { element.setPointerCapture?.(id); } catch {
      // Capture may fail for synthetic or already-ended pointer events.
    }
  }
  private isEditing(target: EventTarget | null): boolean {
    const element = target as HTMLElement | null;
    return !!element?.isContentEditable || !!element?.closest?.("input, textarea, select, [role='textbox']");
  }
}
