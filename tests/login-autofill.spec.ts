import { test, expect } from "@playwright/test";

/**
 * Regression test for the login-dialog bug where a browser / password-manager
 * autofill fills the DOM inputs without firing React's onChange, leaving the
 * controlled state empty. The first submit then failed with
 * "Email and password are required" and only the second submit worked.
 *
 * See tests/login-autofill.spec.ts background: the fix reads the values from
 * the form at submit time instead of relying solely on React state.
 */
test("login succeeds when the fields are autofilled without React onChange", async ({
  page
}) => {
  await page.goto("/");
  await page.getByTitle("Login").click();
  await expect(page.getByRole("heading", { name: "Anmelden" })).toBeVisible();

  // Simulate autofill: set the native input values directly so React's
  // onChange never fires and the component state stays empty.
  await page.evaluate(() => {
    const email = document.querySelector<HTMLInputElement>(
      'input[type="email"]'
    );
    const password = document.querySelector<HTMLInputElement>(
      'input[type="password"]'
    );
    if (email) email.value = "admin@example.com";
    if (password) password.value = "admin@example.com";
  });

  await page.getByRole("button", { name: "Anmelden" }).click();

  // The dialog must close on the FIRST submit.
  await expect(page.getByRole("heading", { name: "Anmelden" })).toBeHidden();
  await expect(page.locator("form p.text-red-600")).toHaveCount(0);
});
