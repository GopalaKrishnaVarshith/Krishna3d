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
  document.documentElement.style.overflow = "";
  document.documentElement.classList.remove("fallback-active");
  vi.useRealTimers();
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
    expect(root.querySelector("[data-current-zone]")?.textContent).toContain("Project Portfolio");
    expect(links[2].getAttribute("aria-current")).toBe("location");
  });

  it("updates loading progress, dismisses it, and hides the hero message after ten seconds", async () => {
    vi.useFakeTimers();
    controller = new UIController(root);
    expect(root.classList.contains("is-navigation-minimized")).toBe(true);
    root.querySelector<HTMLButtonElement>("[data-nav-toggle]")!.click();
    expect(root.classList.contains("is-navigation-minimized")).toBe(false);
    expect(root.querySelector<HTMLButtonElement>("[data-nav-toggle]")?.getAttribute("aria-expanded")).toBe("true");
    root.querySelector<HTMLButtonElement>("[data-nav-toggle]")!.click();
    expect(root.classList.contains("is-navigation-minimized")).toBe(true);
    controller.setLoading(0.42);
    const progress = root.querySelector<HTMLProgressElement>("progress");
    expect(progress?.value).toBe(42);
    expect(root.querySelector("[data-loading]")?.textContent).toContain("42%");
    controller.setLoading(1);
    expect(root.querySelector("[data-loading]")).toBeNull();
    expect(root.classList.contains("has-hidden-value-card")).toBe(false);
    await vi.advanceTimersByTimeAsync(10000);
    expect(root.classList.contains("has-hidden-value-card")).toBe(true);
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
    const first = dialog.querySelector<HTMLElement>("button[data-close]")!;
    last.focus();
    last.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(first);
    first.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(last);
    controller.openExperience(portfolioData.experience[0].id);
    expect(root.querySelectorAll('[role="dialog"]')).toHaveLength(1);
    expect(dialog.isConnected).toBe(false);
    expect(root.querySelector('[role="dialog"]')?.contains(document.activeElement)).toBe(true);
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
    expect(root.querySelector('[role="dialog"]')?.contains(document.activeElement)).toBe(true);
    root.querySelector<HTMLButtonElement>("[data-previous]")!.click();
    expect(root.querySelector('[role="dialog"]')?.textContent).toContain(portfolioData.projects[0].title);
    expect(root.querySelector('[role="dialog"]')?.contains(document.activeElement)).toBe(true);
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
    forward.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 1, bubbles: true }));
    document.body.dispatchEvent(new PointerEvent("pointerup", { pointerId: 1, bubbles: true }));
    expect(onMove.mock.calls).toEqual([["forward", true], ["forward", false]]);
    forward.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 2, bubbles: true }));
    document.body.dispatchEvent(new PointerEvent("pointercancel", { pointerId: 2, bubbles: true }));
    expect(onMove.mock.calls.slice(-2)).toEqual([["forward", true], ["forward", false]]);
    forward.focus();
    forward.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    document.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter", bubbles: true }));
    expect(onMove.mock.calls.slice(-2)).toEqual([["forward", true], ["forward", false]]);
    forward.dispatchEvent(new KeyboardEvent("keydown", { key: " ", code: "Space", bubbles: true, cancelable: true }));
    document.dispatchEvent(new KeyboardEvent("keyup", { key: " ", code: "Space", bubbles: true }));
    expect(onMove.mock.calls.slice(-2)).toEqual([["forward", true], ["forward", false]]);
    forward.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 3, bubbles: true }));
    controller.dispose();
    expect(onMove.mock.calls.at(-1)).toEqual(["forward", false]);
    document.body.dispatchEvent(new PointerEvent("pointerup", { pointerId: 3, bubbles: true }));
    expect(onMove.mock.calls.at(-1)).toEqual(["forward", false]);
  });

  it("routes browse, pagination, and mobile interaction through host callbacks", () => {
    const onBrowseProjects = vi.fn();
    const onBrowseExperience = vi.fn();
    const onProjectSelect = vi.fn();
    const onInteract = vi.fn();
    controller = new UIController(root, { onBrowseProjects, onBrowseExperience,
      onProjectSelect, onInteract });
    root.querySelector<HTMLButtonElement>("[data-browse-projects]")!.click();
    root.querySelector<HTMLButtonElement>("[data-browse-experience]")!.click();
    root.querySelector<HTMLButtonElement>("[data-interact]")!.click();
    expect(onBrowseProjects).toHaveBeenCalledOnce();
    expect(onBrowseExperience).toHaveBeenCalledOnce();
    expect(onInteract).toHaveBeenCalledOnce();
    controller.openProject(portfolioData.projects[0].id);
    expect(controller.isOverlayOpen).toBe(true);
    expect(root.querySelector(".detail-match")?.textContent).toContain("Relevant for");
    root.querySelector<HTMLButtonElement>("[data-next]")!.click();
    expect(onProjectSelect).toHaveBeenCalledWith(portfolioData.projects[1].id);
  });

  it("runs and stops the guided tour through existing navigation and dialogs", async () => {
    vi.useFakeTimers();
    const onTourNavigate = vi.fn((_zone: string, onArrive: () => void) => { onArrive(); return 0; });
    const onTourFocus = vi.fn((_kind: unknown, _id: unknown, onArrive: () => void) => { onArrive(); return 0; });
    const onTourStart = vi.fn();
    const onTourStop = vi.fn();
    controller = new UIController(root, { onTourStart, onTourNavigate, onTourFocus, onTourStop });
    const tour = root.querySelector<HTMLButtonElement>("[data-tour-toggle]")!;
    expect(root.querySelector<HTMLElement>(".ui-tour-controls")?.hidden).toBe(true);
    tour.click();
    expect(tour.hidden).toBe(true);
    expect(root.querySelector<HTMLButtonElement>("[data-tour-stop]")?.hidden).toBe(false);
    expect(root.querySelector<HTMLElement>("[data-tour-progress]")?.textContent).toMatch(/\d+ \/ \d+/);
    expect(root.classList.contains("is-touring")).toBe(true);
    expect(onTourStart).toHaveBeenCalledOnce();
    expect(onTourNavigate).toHaveBeenCalledWith("plaza", expect.any(Function));
    await vi.advanceTimersByTimeAsync(1);
    expect(onTourFocus).toHaveBeenCalledWith("profile", undefined, expect.any(Function));
    await vi.advanceTimersByTimeAsync(1);
    expect(root.querySelector('[role="dialog"]')?.textContent).toContain(portfolioData.profile.name);
    await vi.advanceTimersByTimeAsync(4201);
    expect(onTourNavigate).toHaveBeenCalledWith("automation-lab", expect.any(Function));
    expect(root.querySelector('[role="dialog"]')?.textContent).toContain("Automation Lab");
    expect(root.querySelector<HTMLElement>(".ui-footer")?.hasAttribute("inert")).toBe(false);
    await vi.advanceTimersByTimeAsync(2001);
    expect(onTourFocus).toHaveBeenCalledWith("capability", portfolioData.skillDomains[0].id, expect.any(Function));
    await vi.advanceTimersByTimeAsync(1);
    expect(root.querySelector('[role="dialog"]')?.textContent).toContain(portfolioData.skillDomains[0].title);
    root.querySelector<HTMLButtonElement>("[data-tour-pause]")!.click();
    expect(root.querySelector<HTMLButtonElement>("[data-tour-pause]")?.textContent).toBe("Resume");
    root.querySelector<HTMLButtonElement>("[data-tour-restart]")!.click();
    expect(onTourNavigate).toHaveBeenLastCalledWith("plaza", expect.any(Function));
    root.querySelector<HTMLButtonElement>("[data-tour-stop]")!.click();
    expect(tour.hidden).toBe(false);
    expect(tour.getAttribute("aria-pressed")).toBe("false");
    expect(root.classList.contains("is-touring")).toBe(false);
    expect(root.querySelector<HTMLElement>(".ui-tour-controls")?.hidden).toBe(true);
    expect(onTourStop).toHaveBeenCalled();
  });


  it("waits for avatar arrival before opening the next tour overlay", async () => {
    vi.useFakeTimers();
    let arriveAtPlaza: (() => void) | undefined;
    const onTourNavigate = vi.fn((_zone: string, onArrive: () => void) => { arriveAtPlaza = onArrive; return 900; });
    const onTourFocus = vi.fn((_kind: unknown, _id: unknown, onArrive: () => void) => { onArrive(); return 0; });
    controller = new UIController(root, { onTourNavigate, onTourFocus });

    root.querySelector<HTMLButtonElement>("[data-tour-toggle]")!.click();

    expect(onTourNavigate).toHaveBeenCalledWith("plaza", expect.any(Function));
    expect(onTourFocus).not.toHaveBeenCalled();
    expect(root.querySelector('[role="dialog"]')).toBeNull();

    arriveAtPlaza?.();
    await vi.advanceTimersByTimeAsync(1);

    expect(onTourFocus).toHaveBeenCalledWith("profile", undefined, expect.any(Function));
    expect(root.querySelector('[role="dialog"]')?.textContent).toContain(portfolioData.profile.name);
  });

  it("finishes the guided tour with email and LinkedIn actions", async () => {
    vi.useFakeTimers();
    controller = new UIController(root, {
      onTourNavigate: (_zone, onArrive) => { onArrive(); return 0; },
      onTourFocus: (_kind, _id, onArrive) => { onArrive(); return 0; },
    });
    root.querySelector<HTMLButtonElement>("[data-tour-toggle]")!.click();
    await vi.advanceTimersByTimeAsync(200_000);
    expect(root.querySelector(".tour-end-overlay")?.textContent).toContain("Tour complete");
    expect(root.querySelector(`a[href="mailto:${portfolioData.profile.email}"]`)).toBeTruthy();
    expect(root.querySelector(`a[href="${portfolioData.profile.linkedin}"]`)).toBeTruthy();
    expect(root.querySelector<HTMLButtonElement>(".tour-end-close")?.hidden).toBe(false);
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
    expect(document.documentElement.classList.contains("fallback-active")).toBe(true);
    expect(document.documentElement.style.overflow).toBe("auto");
  });

  it("keeps the selected day theme when switching to the text fallback", () => {
    localStorage.setItem("krishna-world-theme", "day");
    controller = new UIController(root);
    controller.showFallback("Text portfolio");
    expect(document.documentElement.dataset.theme).toBe("day");
    expect(root.classList.contains("is-fallback")).toBe(true);
  });
});
