import { portfolioData } from "../data/portfolioData";
import type { PortfolioData } from "../data/types";
import { renderFallback } from "./renderFallback";
import { renderExperienceOverlay, renderProjectOverlay } from "./renderOverlay";
import { DESTINATIONS, escapeHtml, type Theme, updateMetadata } from "./templates";

const MOTION_KEY = "krishna-world-reduced-motion";
const THEME_KEY = "krishna-world-theme";
const SOUND_KEY = "krishna-world-sound";
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface UIControllerOptions {
  data?: PortfolioData;
  siteUrl?: string;
  onNavigate?: (zoneId: string) => void;
  onThemeChange?: (theme: Theme) => void;
  onReducedMotionChange?: (reduced: boolean) => void;
  onSoundChange?: (enabled: boolean) => void;
  onMove?: (direction: "forward" | "back" | "left" | "right", pressed: boolean) => void;
}

function saved(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}
function persist(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* Private browsing can block storage. */ }
}

/** Semantic controls and content surface for the Three.js world. */
export class UIController {
  private readonly data: PortfolioData;
  private theme: Theme;
  private reducedMotion: boolean;
  private soundEnabled: boolean;
  private overlay: HTMLElement | null = null;
  private returnFocus: HTMLElement | null = null;
  private priorOverflow = "";
  private readonly priorInert = new Map<HTMLElement, boolean>();
  private fallback = false;
  private disposed = false;

  constructor(private readonly root: HTMLElement, private readonly options: UIControllerOptions = {}) {
    this.data = options.data || portfolioData;
    this.theme = saved(THEME_KEY) === "day" ? "day" : "night";
    this.reducedMotion = saved(MOTION_KEY) === null
      ? Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches)
      : saved(MOTION_KEY) === "true";
    this.soundEnabled = saved(SOUND_KEY) === "true";
    document.documentElement.dataset.theme = this.theme;
    document.documentElement.dataset.reducedMotion = String(this.reducedMotion);
    updateMetadata(this.data, options.siteUrl);
    this.render();
    this.root.addEventListener("click", this.handleClick);
    this.root.addEventListener("pointerdown", this.handlePointerDown);
    this.root.addEventListener("pointerup", this.handlePointerUp);
    this.root.addEventListener("pointercancel", this.handlePointerUp);
    document.addEventListener("keydown", this.handleKeydown);
    document.addEventListener("focusin", this.handleFocusIn);
  }

  get currentTheme(): Theme { return this.theme; }
  get motionReduced(): boolean { return this.reducedMotion; }
  get soundOn(): boolean { return this.soundEnabled; }

  setZone(id: string): void {
    const destination = DESTINATIONS.find((item) => item.id === id);
    if (!destination) return;
    const current = this.root.querySelector<HTMLElement>("[data-current-zone]");
    if (current) current.textContent = destination.label;
    for (const button of this.root.querySelectorAll<HTMLButtonElement>("[data-zone-target]")) {
      if (button.dataset.zoneTarget === id) button.setAttribute("aria-current", "location");
      else button.removeAttribute("aria-current");
    }
    this.setContextPrompt(destination.hint);
  }

  setLoading(progress: number): void {
    const loading = this.root.querySelector<HTMLElement>("[data-loading]");
    if (!loading) return;
    if (progress >= 1) { loading.remove(); return; }
    const value = Math.round(Math.min(1, Math.max(0, progress)) * 100);
    loading.querySelector<HTMLProgressElement>("progress")!.value = value;
    loading.querySelector<HTMLElement>("[data-loading-number]")!.textContent = `${value}%`;
  }

  setContextPrompt(prompt: string): void {
    const element = this.root.querySelector<HTMLElement>("[data-context-prompt]");
    if (element) element.textContent = prompt;
  }

  openProject(id: string): void {
    const index = this.data.projects.findIndex((item) => item.id === id);
    if (index < 0 || this.fallback) return;
    this.openDialog(renderProjectOverlay(this.data.projects[index], index, this.data.projects.length), "project", index);
  }

  openExperience(id: string): void {
    const index = this.data.experience.findIndex((item) => item.id === id);
    if (index < 0 || this.fallback) return;
    this.openDialog(renderExperienceOverlay(this.data.experience[index], index, this.data.experience.length), "experience", index);
  }

  showFallback(reason: string): void {
    this.closeDialog();
    this.fallback = true;
    this.root.classList.add("is-fallback");
    this.root.replaceChildren(renderFallback(this.data, reason));
    const world = document.querySelector<HTMLElement>("#experience");
    world?.setAttribute("aria-hidden", "true");
    if (world) world.hidden = true;
    document.documentElement.classList.add("fallback-active");
    document.body.style.overflow = "auto";
    this.root.querySelector<HTMLElement>("#fallback-title")?.focus();
  }

  closeDialog(): void {
    if (!this.overlay) return;
    this.overlay.remove();
    this.overlay = null;
    for (const [element, inert] of this.priorInert) {
      if (inert) element.setAttribute("inert", "");
      else element.removeAttribute("inert");
    }
    this.priorInert.clear();
    document.body.style.overflow = this.priorOverflow;
    this.returnFocus?.focus();
    this.returnFocus = null;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.closeDialog();
    this.root.removeEventListener("click", this.handleClick);
    this.root.removeEventListener("pointerdown", this.handlePointerDown);
    this.root.removeEventListener("pointerup", this.handlePointerUp);
    this.root.removeEventListener("pointercancel", this.handlePointerUp);
    document.removeEventListener("keydown", this.handleKeydown);
    document.removeEventListener("focusin", this.handleFocusIn);
    if (this.fallback) {
      document.documentElement.classList.remove("fallback-active");
      this.root.classList.remove("is-fallback");
      const world = document.querySelector<HTMLElement>("#experience");
      if (world) { world.hidden = false; world.removeAttribute("aria-hidden"); }
      document.body.style.overflow = "";
    }
  }

  private render(): void {
    const { profile } = this.data;
    this.root.innerHTML = `
      <a class="skip-link" href="#portfolio-navigation">Skip to destinations</a>
      <header class="ui-header"><div class="ui-identity"><span class="ui-monogram" aria-hidden="true">KV</span><div><strong>${escapeHtml(profile.name)}</strong><span data-current-zone>Arrival Plaza</span></div></div><div class="ui-header-actions"><button type="button" data-theme-toggle aria-label="Switch to ${this.theme === "night" ? "day" : "night"} theme">${this.theme === "night" ? "Day" : "Night"} mode</button><button type="button" data-sound-toggle aria-pressed="${this.soundEnabled}" aria-label="${this.soundEnabled ? "Mute" : "Enable"} sound">Sound ${this.soundEnabled ? "on" : "off"}</button><button type="button" data-motion-toggle aria-pressed="${this.reducedMotion}" aria-label="${this.reducedMotion ? "Enable" : "Reduce"} motion">${this.reducedMotion ? "Motion off" : "Reduce motion"}</button></div></header>
      <nav id="portfolio-navigation" class="ui-navigation" aria-label="Destinations"><span class="eyebrow">Explore the world</span><ol>${DESTINATIONS.map((destination, index) => `<li><button type="button" data-zone-target="${destination.id}" ${index === 0 ? 'aria-current="location"' : ""}><span class="nav-number">${String(index + 1).padStart(2, "0")}</span><span>${escapeHtml(destination.label)}</span></button></li>`).join("")}</ol></nav>
      <div class="ui-footer"><p class="ui-prompt"><span class="prompt-mark" aria-hidden="true">✦</span><span data-context-prompt>Meet Krishna and choose a path</span></p><div class="ui-quick-links"><a href="mailto:${escapeHtml(profile.email)}">Email</a><a href="${escapeHtml(profile.linkedin)}" target="_blank" rel="noopener noreferrer">LinkedIn <span aria-hidden="true">↗</span></a><button type="button" data-fallback-toggle>Text version</button></div></div>
      <div class="mobile-controls" role="group" aria-label="Move in the world"><button type="button" data-move="left" aria-label="Move left">←</button><button type="button" data-move="forward" aria-label="Move forward">↑</button><button type="button" data-move="back" aria-label="Move back">↓</button><button type="button" data-move="right" aria-label="Move right">→</button></div>
      <div class="loading-screen" data-loading role="status" aria-label="Loading portfolio"><div class="loading-inner"><span class="eyebrow">Entering the world</span><strong>${escapeHtml(profile.name)}</strong><p>Building your view of the work.</p><progress max="100" value="0" aria-label="Loading progress"></progress><span data-loading-number>0%</span></div></div>`;
  }

  private openDialog(element: HTMLElement, type: "project" | "experience", index: number): void {
    if (!this.overlay) {
      this.returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      this.priorOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
    } else this.overlay.remove();
    element.dataset.detailType = type;
    element.dataset.detailIndex = String(index);
    this.overlay = element;
    this.root.append(element);
    if (!this.priorInert.size) {
      for (const child of this.root.children) {
        if (child instanceof HTMLElement && child !== element) {
          this.priorInert.set(child, child.hasAttribute("inert"));
          child.setAttribute("inert", "");
        }
      }
    }
    element.querySelector<HTMLElement>("button[data-close]")?.focus();
  }

  private readonly handleClick = (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const button = target.closest<HTMLElement>("button, [data-close]");
    if (!button) return;
    if (button.hasAttribute("data-close")) { this.closeDialog(); return; }
    const zone = button.dataset.zoneTarget;
    if (zone) { this.options.onNavigate?.(zone); this.setZone(zone); return; }
    if (button.hasAttribute("data-theme-toggle")) {
      this.theme = this.theme === "night" ? "day" : "night";
      document.documentElement.dataset.theme = this.theme;
      persist(THEME_KEY, this.theme);
      button.textContent = this.theme === "night" ? "Day mode" : "Night mode";
      button.setAttribute("aria-label", `Switch to ${this.theme === "night" ? "day" : "night"} theme`);
      this.options.onThemeChange?.(this.theme);
    } else if (button.hasAttribute("data-motion-toggle")) {
      this.reducedMotion = !this.reducedMotion;
      document.documentElement.dataset.reducedMotion = String(this.reducedMotion);
      persist(MOTION_KEY, String(this.reducedMotion));
      button.textContent = this.reducedMotion ? "Motion off" : "Reduce motion";
      button.setAttribute("aria-pressed", String(this.reducedMotion));
      button.setAttribute("aria-label", this.reducedMotion ? "Enable motion" : "Reduce motion");
      this.options.onReducedMotionChange?.(this.reducedMotion);
    } else if (button.hasAttribute("data-sound-toggle")) {
      this.soundEnabled = !this.soundEnabled;
      persist(SOUND_KEY, String(this.soundEnabled));
      button.textContent = this.soundEnabled ? "Sound on" : "Sound off";
      button.setAttribute("aria-pressed", String(this.soundEnabled));
      button.setAttribute("aria-label", this.soundEnabled ? "Mute sound" : "Enable sound");
      this.options.onSoundChange?.(this.soundEnabled);
    } else if (button.hasAttribute("data-fallback-toggle")) {
      this.showFallback("You chose the text version of this portfolio.");
    } else if (button.hasAttribute("data-next") || button.hasAttribute("data-previous")) {
      const type = this.overlay?.dataset.detailType;
      const current = Number(this.overlay?.dataset.detailIndex || 0);
      const records = type === "project" ? this.data.projects : this.data.experience;
      const next = (current + (button.hasAttribute("data-next") ? 1 : -1) + records.length) % records.length;
      if (type === "project") this.openProject(this.data.projects[next].id);
      else this.openExperience(this.data.experience[next].id);
    }
  };

  private readonly handlePointerDown = (event: PointerEvent): void => {
    const target = event.target;
    if (target instanceof Element) {
      const direction = target.closest<HTMLElement>("[data-move]")?.dataset.move as "forward" | "back" | "left" | "right" | undefined;
      if (direction) this.options.onMove?.(direction, true);
    }
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    const target = event.target;
    if (target instanceof Element) {
      const direction = target.closest<HTMLElement>("[data-move]")?.dataset.move as "forward" | "back" | "left" | "right" | undefined;
      if (direction) this.options.onMove?.(direction, false);
    }
  };

  private readonly handleKeydown = (event: KeyboardEvent): void => {
    if (!this.overlay) return;
    if (event.key === "Escape") { event.preventDefault(); this.closeDialog(); return; }
    if (event.key !== "Tab") return;
    const focusable = [...this.overlay.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((item) => !item.hidden);
    if (!focusable.length) { event.preventDefault(); return; }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };

  private readonly handleFocusIn = (event: FocusEvent): void => {
    if (this.overlay && event.target instanceof Node && !this.overlay.contains(event.target)) {
      this.overlay.querySelector<HTMLElement>(FOCUSABLE)?.focus();
    }
  };
}
