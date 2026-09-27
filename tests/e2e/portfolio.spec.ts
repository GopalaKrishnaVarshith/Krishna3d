import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { portfolioData } from "../../src/data/portfolioData";

const evidenceDir = resolve(".superpowers/sdd/2026-09-24-krishna-three-portfolio/task-10-evidence");
const errors = new WeakMap<Page, string[]>();

async function ready(page: Page): Promise<void> {
  await page.goto("/");
  await expect(page.locator("[data-loading]")).toHaveCount(0);
  await expect(page.locator("#experience canvas")).toBeVisible();
}

async function destination(page: Page, name: string): Promise<void> {
  await page.getByRole("navigation", { name: "Destinations" })
    .getByRole("button", { name: new RegExp(name) }).click();
  await expect(page.locator("[data-current-zone]")).toHaveText(name);
}

async function capture(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  mkdirSync(evidenceDir, { recursive: true });
  await page.screenshot({ path: resolve(evidenceDir, `task-10-${testInfo.project.name}-${name}.png`),
    animations: "disabled", scale: "css" });
}

test.beforeEach(({ page }) => {
  const pageErrors: string[] = [];
  errors.set(page, pageErrors);
  page.on("pageerror", (error) => pageErrors.push(error.message));
});

test.afterEach(({ page }) => {
  expect(errors.get(page) ?? [], "uncaught page errors").toEqual([]);
});

test("loads one rendered world and directly navigates every destination", async ({ page }, testInfo) => {
  await ready(page);
  await expect(page.locator("#experience canvas")).toHaveCount(1);
  await capture(page, testInfo, "arrival-night");
  for (const name of ["Automation Lab", "Evidence Vault", "Regulatory Observatory",
    "Career Experience", "Contact Portal", "Arrival Plaza"]) {
    await destination(page, name);
    if (["Automation Lab", "Evidence Vault", "Career Experience"].includes(name))
      await capture(page, testInfo, name.toLowerCase().replaceAll(" ", "-"));
  }
});

test("daylight and reduced motion persist after reload", async ({ page }, testInfo) => {
  await ready(page);
  await page.getByRole("button", { name: /Switch to day theme/ }).click();
  await page.getByRole("button", { name: "Reduce motion" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "day");
  await expect(page.locator("html")).toHaveAttribute("data-reduced-motion", "true");
  await page.getByRole("button", { name: "Enable sound" }).click();
  await expect(page.getByRole("button", { name: "Mute sound" })).toHaveAttribute("aria-pressed", "true");
  await capture(page, testInfo, "arrival-day-reduced");
  await page.reload();
  await expect(page.locator("[data-loading]")).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("data-theme", "day");
  await expect(page.locator("html")).toHaveAttribute("data-reduced-motion", "true");
  await expect(page.getByRole("button", { name: "Mute sound" })).toHaveAttribute("aria-pressed", "true");
});

test("walk and orbit retain a live character view", async ({ page }, testInfo) => {
  await ready(page);
  if (testInfo.project.name !== "mobile-chromium") {
    const viewport = page.viewportSize()!;
    const startX = viewport.width * 0.52;
    const startY = viewport.height * 0.55;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    for (const [pixels, label] of [[195, "39"], [205, "41"],
      [215, "43"], [225, "45"]] as const) {
      await page.mouse.move(startX + pixels, startY, { steps: 5 });
      await capture(page, testInfo, `seam-${label}-degrees`);
    }
    await page.mouse.up();
  }
  await page.getByRole("button", { name: "Reduce motion" }).click();
  const before = await page.locator("#experience canvas").screenshot();
  if (testInfo.project.name === "mobile-chromium") {
    const forward = page.getByRole("button", { name: "Move forward" });
    await expect(forward).toBeVisible();
    await forward.dispatchEvent("pointerdown", { pointerId: 17 });
    await page.waitForTimeout(900);
    await page.evaluate(() => document.dispatchEvent(new PointerEvent("pointerup", { pointerId: 17 })));
    await expect(page.getByRole("button", { name: "Interact" })).toBeVisible();
  } else {
    await page.keyboard.down("w");
    await page.waitForTimeout(900);
    await page.keyboard.up("w");
  }
  const after = await page.locator("#experience canvas").screenshot();
  expect(after.equals(before), "walking and orbiting should change the rendered world").toBe(false);
  await capture(page, testInfo, "motion-seam");
});

test("Lab and Observatory interaction anchors open grounded capability details", async ({ page }) => {
  await ready(page);
  await destination(page, "Automation Lab");
  await page.keyboard.down("e");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog").getByRole("list", { name: "Skills" })).toBeVisible();
  await page.keyboard.up("e");
  await page.getByRole("button", { name: "Close details" }).click();
  await destination(page, "Regulatory Observatory");
  await page.keyboard.down("e");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog").getByRole("list", { name: "Skills" })).toBeVisible();
  await page.keyboard.up("e");
});

test("guided tour opens destination details and can be stopped", async ({ page }) => {
  test.setTimeout(60_000);
  await ready(page);
  await page.getByRole("button", { name: "Start guided tour" }).click();
  await expect(page.getByRole("button", { name: "Stop guided tour" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("[data-current-zone]")).toHaveText("Automation Lab", { timeout: 30_000 });
  await expect(page.getByRole("dialog").getByRole("heading", { name: "Workflow analysis & product delivery" }))
    .toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Stop guided tour" }).click();
  await expect(page.getByRole("button", { name: "Start guided tour" })).toHaveAttribute("aria-pressed", "false");
});

test("opens the Evidence Vault through world interaction and paginates eleven case studies", async ({ page }, testInfo) => {
  test.setTimeout(210_000);
  await ready(page);
  await destination(page, "Evidence Vault");
  if (testInfo.project.name === "mobile-chromium") {
    await page.getByRole("button", { name: "Interact" }).click();
  } else {
    await page.keyboard.down("e");
  }
  await expect(page.getByRole("dialog")).toBeVisible();
  if (testInfo.project.name !== "mobile-chromium") await page.keyboard.up("e");
  await capture(page, testInfo, "project-overlay");
  await page.getByRole("button", { name: "Close details" }).click();
  await page.getByRole("button", { name: "Browse projects" }).click();
  for (const project of portfolioData.projects) {
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: project.title })).toBeVisible();
    if (project.metrics.length) {
      for (const metric of project.metrics) {
        await expect(dialog.locator("dt")).toContainText([metric.label]);
        await expect(dialog.locator("dd")).toContainText([metric.value]);
      }
      if (project.id === "pharmacovigilance-training-enablement")
        await capture(page, testInfo, "qualified-metrics-overlay");
    }
    await page.getByRole("button", { name: "Next item" }).click({ force: true });
  }
  await expect(page.getByRole("dialog")
    .getByRole("heading", { name: portfolioData.projects[0].title })).toBeVisible();
});

test("opens career roles through world interaction and direct browse", async ({ page }, testInfo) => {
  test.setTimeout(210_000);
  await ready(page);
  await destination(page, "Career Experience");
  if (testInfo.project.name === "mobile-chromium") await page.getByRole("button", { name: "Interact" }).click();
  else await page.keyboard.down("e");
  await expect(page.getByRole("dialog")).toBeVisible();
  if (testInfo.project.name !== "mobile-chromium") await page.keyboard.up("e");
  await page.getByRole("button", { name: "Close details" }).click();
  await page.getByRole("button", { name: "Browse experience" }).click();
  for (const role of portfolioData.experience) {
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: role.role })).toBeVisible();
    await page.getByRole("button", { name: "Next item" }).click({ force: true });
  }
  await capture(page, testInfo, "career-overlay");
});

test("contact links and keyboard focus stay available", async ({ page }) => {
  await ready(page);
  await destination(page, "Contact Portal");
  await expect(page.getByRole("link", { name: "Email" }))
    .toHaveAttribute("href", `mailto:${portfolioData.profile.email}`);
  await expect(page.getByRole("link", { name: /LinkedIn/ }))
    .toHaveAttribute("href", portfolioData.profile.linkedin);
  await page.getByRole("button", { name: "Browse projects" }).focus();
  await expect(page.getByRole("button", { name: "Browse projects" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Browse projects" })).toBeFocused();
});

test("chosen text version contains all work and links", async ({ page }) => {
  await ready(page);
  await page.getByRole("button", { name: "Text version" }).click();
  await expect(page.locator("[data-fallback-project]")).toHaveCount(11);
  await expect(page.locator("[data-fallback-role]")).toHaveCount(8);
  await expect(page.locator("#experience")).toBeHidden();
  await expect(page.locator("#projects")).toBeVisible();
  await expect(page.locator("#contact a[href^='mailto:']")).toBeVisible();
  await page.mouse.wheel(0, 900);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(200);
});

test("unavailable WebGL switches to complete semantic fallback", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext as (...args: unknown[]) => unknown;
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value: function (type: string, ...args: unknown[]) {
        if (type === "webgl" || type === "webgl2" || type === "experimental-webgl") return null;
        return original.call(this, type, ...args);
      },
    });
  });
  await page.goto("/");
  await expect(page.locator("#fallback-title")).toBeVisible();
  await expect(page.locator("[data-fallback-project]")).toHaveCount(11);
  await expect(page.locator("[data-fallback-role]")).toHaveCount(8);
});

test("required portrait asset failure switches to complete semantic fallback", async ({ page }) => {
  await page.route("**/assets/portrait/krishna-portrait.webp", (route) => route.abort());
  await page.goto("/");
  await expect(page.locator("#fallback-title")).toBeVisible();
  await expect(page.locator("[data-fallback-project]")).toHaveCount(11);
  await expect(page.locator("[data-fallback-role]")).toHaveCount(8);
});
