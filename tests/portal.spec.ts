import { test, expect } from "@playwright/test";

test("modal renders into the managed portal root", async ({ page }) => {
  await page.goto("/");
  await page.getByTitle("Login").click();

  await expect(page.getByRole("heading", { name: "Anmelden" })).toBeVisible();

  const portalRoot = page.locator("#portal-root");
  await expect(portalRoot).toHaveCount(1);
  await expect(
    portalRoot.getByRole("heading", { name: "Anmelden" })
  ).toBeVisible();
});
