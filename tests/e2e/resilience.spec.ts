import { expect, test, type Page } from "@playwright/test";

const pageErrors = new WeakMap<Page, string[]>();

async function ready(page: Page): Promise<void> {
  await page.goto("/");
  await expect(page.locator("[data-loading]")).toHaveCount(0);
  await expect(page.locator("#experience canvas")).toBeVisible();
}

test.beforeEach(({ page }) => {
  const errors: string[] = [];
  pageErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
});

test.afterEach(({ page }) => {
  expect(pageErrors.get(page) ?? [], "uncaught page errors").toEqual([]);
});

test("simulated context loss pauses and restores without replacing the world", async ({ page }) => {
  await ready(page);
  const canvas = page.locator("#experience canvas");
  await expect(canvas).toHaveCount(1);

  await canvas.dispatchEvent("webglcontextlost", { cancelable: true });
  await expect(page.locator("[data-context-prompt]"))
    .toHaveText("3D renderer paused. Restoring the scene when graphics return.");
  await expect(page.locator("#fallback-title")).toHaveCount(0);
  await expect(canvas).toHaveCount(1);

  await canvas.dispatchEvent("webglcontextrestored");
  await expect(page.locator("[data-context-prompt]")).toHaveText("Meet Krishna and choose a path");
  await expect(canvas).toBeVisible();
});

test("direct navigation and browse flows work without canvas interaction", async ({ page }) => {
  await ready(page);
  await page.getByRole("navigation", { name: "Destinations" })
    .getByRole("button", { name: /Evidence Vault/ }).click();
  await expect(page.locator("[data-current-zone]")).toHaveText("Evidence Vault");
  await page.getByRole("button", { name: "Browse projects" }).click();
  await expect(page.getByRole("dialog")).toContainText("Document Quality Automation");
});

test("small viewport controls remain usable and do not overflow", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 700 });
  await ready(page);
  await expect(page.getByRole("button", { name: "Move forward" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Interact" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Text version" })).toBeVisible();
  const viewportFits = await page.evaluate(() =>
    document.documentElement.scrollWidth <= window.innerWidth + 1);
  expect(viewportFits).toBe(true);
});

test("WebGL-disabled launch keeps the complete text portfolio available", async ({ page }) => {
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
