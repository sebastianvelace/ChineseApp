import { expect, test, type Page } from "@playwright/test";

async function openStable(page: Page) {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem("hanlu-e2e-reset") === "1") return;
    indexedDB.deleteDatabase("hanlu");
    localStorage.clear();
    sessionStorage.setItem("hanlu-e2e-reset", "1");
  });
});

test("onboarding reaches the first lesson", async ({ page }) => {
  await openStable(page);
  await page.getByRole("button", { name: "Start" }).click();
  await expect(page).toHaveURL(/\/learn$/);
  await page.locator('a[href="/unit/hsk1-u01"]').click();
  await page.locator('a[href="/lesson/hsk1-u01-l1"]').click();
  await expect(page.getByText("Lesson 1")).toBeVisible();
});

test("account progress can be exported, imported, and reset", async ({ page }) => {
  await openStable(page);
  await page.getByRole("button", { name: "Start" }).click();
  await expect(page).toHaveURL(/\/learn$/);
  await page.getByRole("link", { name: "Me" }).click();
  await expect(page).toHaveURL(/\/me$/);
  await page.getByRole("button", { name: /Account.*Guest/ }).click();

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export progress" }).click();
  expect((await download).suggestedFilename()).toMatch(/^hanlu-progress-\d{4}-\d{2}-\d{2}\.json$/);

  const imported = JSON.stringify({ format: "hanlu-progress", version: 1, exportedAt: new Date().toISOString(), progress: { onboarded: true, locale: "es" } });
  await page.locator('input[type="file"]').setInputFiles({ name: "progress.json", mimeType: "application/json", buffer: Buffer.from(imported) });
  await expect(page.getByRole("status")).toHaveText("Progreso importado.");

  page.on("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Reiniciar progreso" }).click();
  await expect(page).toHaveURL(/\/onboarding$/);
});

test("production shell reopens the learning page offline", async ({ page, context }) => {
  test.skip(process.env.E2E_PRODUCTION !== "1", "requires the production service worker");
  await openStable(page);
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller), undefined, { timeout: 10_000 });
  await page.getByRole("button", { name: "Start" }).click();
  await expect(page).toHaveURL(/\/learn$/);
  await page.waitForFunction(() => {
    const raw = localStorage.getItem("hanlu-progress-v1");
    return Boolean(raw && JSON.parse(raw).onboarded);
  });
  await page.reload({ waitUntil: "networkidle" });
  await expect(page).toHaveURL(/\/learn$/);
  await page.waitForFunction(async () => {
    const names = await caches.keys();
    if (!names.includes("hanlu-v7")) return false;
    return Boolean(await (await caches.open("hanlu-v7")).match("/learn"));
  });

  await context.setOffline(true);
  await page.goto("/learn");
  await expect(page).toHaveURL(/\/learn$/);
  await expect(page.getByText("汉路", { exact: true })).toBeVisible();
});
