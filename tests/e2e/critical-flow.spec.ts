import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    indexedDB.deleteDatabase("hanlu");
    localStorage.clear();
  });
});

test("onboarding reaches the first lesson", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start" }).click();
  await expect(page).toHaveURL(/\/learn$/);
  await page.locator('a[href="/unit/hsk1-u01"]').click();
  await page.locator('a[href="/lesson/hsk1-u01-l1"]').click();
  await expect(page.getByText("Lesson 1")).toBeVisible();
});

test("account progress can be exported, imported, and reset", async ({ page }) => {
  await page.goto("/");
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
  await expect(page.getByRole("status")).toHaveText("Progress reset.");
});
