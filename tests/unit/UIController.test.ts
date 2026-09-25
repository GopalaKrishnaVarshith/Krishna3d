import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { portfolioData } from "../../src/data/portfolioData";
import { UIController } from "../../src/ui/UIController";

let root: HTMLElement;
let controller: UIController;

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = '<main id="experience"></main><div id="ui"></div>';
  root = document.querySelector<HTMLElement>("#ui")!;
});

afterEach(() => {
  controller?.dispose();
  document.body.style.overflow = "";
});

describe("UIController", () => {
  it("keeps every destination available and reports navigation", () => {
    const onNavigate = vi.fn();
    controller = new UIController(root, { onNavigate });
    const links = root.querySelectorAll<HTMLButtonElement>("[data-zone-target]");
    expect(links).toHaveLength(6);
    links[2].click();
    expect(onNavigate).toHaveBeenCalledWith("evidence-vault");
    controller.setZone("evidence-vault");
    expect(root.querySelector("[data-current-zone]")?.textContent).toContain("Evidence Vault");
    expect(links[2].getAttribute("aria-current")).toBe("location");
  });

  it("updates accessible loading progress and dismisses it at completion", () => {
    controller = new UIController(root);
    controller.setLoading(0.42);
    const progress = root.querySelector<HTMLProgressElement>("progress");
    expect(progress?.value).toBe(42);
    expect(root.querySelector("[data-loading]")?.textContent).toContain("42%");
    controller.setLoading(1);
    expect(root.querySelector("[data-loading]")).toBeNull();
  });

  it("opens one labelled dialog, traps focus, closes on Escape, and restores focus and scroll", () => {
    controller = new UIController(root);
    const trigger = root.querySelector<HTMLButtonElement>("[data-zone-target]")!;
    trigger.focus();
    document.body.style.overflow = "auto";
    controller.openProject("pharmacovigilance-training-enablement");
    const dialog = root.querySelector<HTMLElement>('[role="dialog"]')!;
    expect(dialog.getAttribute("aria-labelledby")).toBeTruthy();
    expect(dialog.textContent).toContain("Associates trained");
    expect(dialog.textContent).toContain("200+");
    expect(document.body.style.overflow).toBe("hidden");
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(root.querySelector<HTMLElement>(".ui-navigation")?.hasAttribute("inert")).toBe(true);
    const last = dialog.querySelectorAll<HTMLElement>("button, a").item(dialog.querySelectorAll("button, a").length - 1);
    last.focus();
    last.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true }));
    expect(dialog.contains(document.activeElement)).toBe(true);
    controller.openExperience(portfolioData.experience[0].id);
    expect(root.querySelectorAll('[role="dialog"]')).toHaveLength(1);
    expect(dialog.isConnected).toBe(false);
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(root.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(document.body.style.overflow).toBe("auto");
    expect(root.querySelector<HTMLElement>(".ui-navigation")?.hasAttribute("inert")).toBe(false);
  });

  it("supports next and previous records without losing dialog semantics", () => {
    controller = new UIController(root);
    controller.openProject(portfolioData.projects[0].id);
    root.querySelector<HTMLButtonElement>("[data-next]")!.click();
    expect(root.querySelector('[role="dialog"]')?.textContent).toContain(portfolioData.projects[1].title);
    root.querySelector<HTMLButtonElement>("[data-previous]")!.click();
    expect(root.querySelector('[role="dialog"]')?.textContent).toContain(portfolioData.projects[0].title);
  });

  it("persists theme and reduced motion and informs the host", () => {
    localStorage.setItem("krishna-world-theme", "day");
    localStorage.setItem("krishna-world-reduced-motion", "true");
    const onThemeChange = vi.fn();
    const onReducedMotionChange = vi.fn();
    controller = new UIController(root, { onThemeChange, onReducedMotionChange });
    expect(document.documentElement.dataset.theme).toBe("day");
    expect(document.documentElement.dataset.reducedMotion).toBe("true");
    root.querySelector<HTMLButtonElement>("[data-theme-toggle]")!.click();
    root.querySelector<HTMLButtonElement>("[data-motion-toggle]")!.click();
    expect(localStorage.getItem("krishna-world-theme")).toBe("night");
    expect(localStorage.getItem("krishna-world-reduced-motion")).toBe("false");
    expect(onThemeChange).toHaveBeenCalledWith("night");
    expect(onReducedMotionChange).toHaveBeenCalledWith(false);
  });

  it("exposes sound and mobile movement controls to the host", () => {
    const onSoundChange = vi.fn();
    const onMove = vi.fn();
    controller = new UIController(root, { onSoundChange, onMove });
    root.querySelector<HTMLButtonElement>("[data-sound-toggle]")!.click();
    expect(onSoundChange).toHaveBeenCalledWith(true);
    expect(root.querySelector("[data-sound-toggle]")?.getAttribute("aria-pressed")).toBe("true");
    const forward = root.querySelector<HTMLButtonElement>('[data-move="forward"]')!;
    forward.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    forward.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
    expect(onMove.mock.calls).toEqual([["forward", true], ["forward", false]]);
  });

  it("sets canonical and structured metadata from the same portfolio data", () => {
    controller = new UIController(root, { siteUrl: "https://example.org/portfolio" });
    expect(document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href).toBe("https://example.org/portfolio/");
    const schema = JSON.parse(document.querySelector<HTMLScriptElement>('script[data-portfolio-schema]')!.textContent!);
    expect(schema["@graph"][0].name).toBe(portfolioData.profile.name);
    expect(schema["@graph"][0].sameAs).toContain(portfolioData.profile.linkedin);
    expect(schema["@graph"][1].url).toBe("https://example.org/portfolio/");
  });

  it("renders all portfolio content and contact links in fallback", () => {
    controller = new UIController(root);
    controller.showFallback("WebGL is unavailable");
    expect(root.querySelectorAll("[data-fallback-skill]")).toHaveLength(4);
    expect(root.querySelectorAll("[data-fallback-project]")).toHaveLength(11);
    expect(root.querySelectorAll("[data-fallback-role]")).toHaveLength(8);
    expect(root.textContent).toContain(portfolioData.profile.name);
    expect(root.textContent).toContain(portfolioData.profile.publication.title);
    expect(root.querySelector(`a[href="mailto:${portfolioData.profile.email}"]`)).toBeTruthy();
    expect(root.querySelector(`a[href="${portfolioData.profile.linkedin}"]`)).toBeTruthy();
    expect(root.querySelector(`a[href="${portfolioData.profile.publication.url}"]`)).toBeTruthy();
    expect(document.querySelector("#experience")?.getAttribute("aria-hidden")).toBe("true");
    expect(document.activeElement?.id).toBe("fallback-title");
  });
});
