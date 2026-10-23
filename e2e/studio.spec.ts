import { expect, test } from "@playwright/test";

const API = "http://localhost:4100";

test.beforeEach(async ({ request }) => {
  const response = await request.post(`${API}/api/demo/reset`);
  expect(response.ok()).toBeTruthy();
});

test("runs the night-exit replay, executes a care action, and closes the incident", async ({
  page
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(String(error)));

  await page.goto("/?empty=1");

  await expect(page.getByRole("heading", { name: "The house is quiet." })).toBeVisible();
  await expect(page.getByText("MCP 2025-11-25").first()).toBeVisible();

  await page
    .locator(".reading-choices")
    .getByRole("button", { name: /Night exit/ })
    .click();

  await expect(page.locator(".reading__title")).toHaveText(
    "Arthur is at the door, holding his keys."
  );
  await expect(page.locator(".hud--compact")).toBeVisible();
  await expect(page.locator(".hud--compact")).toContainText("Arthur is at the door");

  await page.locator(".deck__action").first().click();

  await expect(page.locator(".deck__result")).toContainText(
    "Your dentist visit is Thursday afternoon"
  );
  await expect(page.locator(".action-result__outcome")).toContainText(
    "Calming prompt played in the hallway."
  );

  await page.locator(".deck__resolve").click();

  await expect(page.getByRole("heading", { name: "The house is quiet." })).toBeVisible();
  await expect(page.locator(".hud--compact")).toHaveCount(0);
  await expect(page.getByText("Care note written. The house is quiet.")).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test("Fire TV care card is operable with the D-pad and closes with Back", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(String(error)));

  await page.goto("/?mode=firetv&scenario=SCN-02");

  const hud = page.locator(".hud--full");
  await expect(hud).toBeVisible();
  await expect(hud).toContainText("A courier is at the door. Elena can see every word.");

  const actions = hud.locator("[data-tv-action]");
  await expect(actions).toHaveCount(3);
  await expect(actions.nth(0)).toBeFocused();

  await page.keyboard.press("ArrowDown");
  await expect(actions.nth(1)).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(hud.locator(".hud__result")).toContainText("Elena is on her way");
  await expect(hud.locator(".hud__result")).toContainText(
    "Courier asked to wait. A sixty-second timer is running on the TV."
  );

  await page.keyboard.press("Escape");
  await expect(page.locator(".hud--full")).toHaveCount(0, { timeout: 5000 });
  await expect(page.getByRole("heading", { name: "The house is quiet." })).toBeVisible();

  expect(consoleErrors).toEqual([]);
});

test("number keys quick-select a Fire TV action", async ({ page }) => {
  await page.goto("/?mode=firetv&scenario=SCN-03");

  const hud = page.locator(".hud--full");
  await expect(hud).toBeVisible();
  await expect(hud).toContainText("The insulin is on the porch. The sun is on the insulin.");

  await page.keyboard.press("3");
  await expect(hud.locator(".hud__result")).toContainText("I've paused the TV");
  await expect(hud.locator(".hud__result")).toContainText(
    "Media paused. Porch light on. Lockbox open for pickup."
  );
});
