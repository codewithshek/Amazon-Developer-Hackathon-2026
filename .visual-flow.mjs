import { chromium } from "playwright";

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
const page = await context.newPage();
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(String(e)));

await page.goto("http://localhost:5173/?empty=1", { waitUntil: "networkidle" });
await page.waitForTimeout(800);

// Reset server state so the flow is deterministic.
await page.evaluate(() => fetch("/api/demo/reset", { method: "POST" }));
await page.waitForTimeout(400);

// Run scenario 01 from the reading pane.
await page.getByRole("button", { name: /Night exit/i }).first().click();
await page.waitForTimeout(2500);

const afterRun = await page.evaluate(() => ({
  hud: Boolean(document.querySelector(".hud--compact")),
  title: document.querySelector(".reading__title")?.textContent,
  actions: [...document.querySelectorAll(".hud--compact .hud__action")].map((b) => b.textContent?.trim()),
  timeline: [...document.querySelectorAll(".timeline__item")].map((e) => e.textContent?.trim()),
  toast: document.querySelector(".toast")?.textContent?.trim()
}));
console.log("AFTER RUN", JSON.stringify(afterRun, null, 2));

// Click the first care action in the compact HUD preview.
await page.locator(".hud--compact .hud__action").first().click();
await page.waitForTimeout(1600);
const afterAction = await page.evaluate(() => ({
  result: document.querySelector(".reading__voice blockquote")?.textContent?.trim(),
  hudDone: Boolean(document.querySelector(".hud--compact .hud__action.is-done")),
  timeline: [...document.querySelectorAll(".timeline__item")].map((e) => e.textContent?.trim()),
  wire: [...document.querySelectorAll(".wire__row")].map((e) => e.textContent?.trim())
}));
console.log("AFTER ACTION", JSON.stringify(afterAction, null, 2));

// Resolve.
await page.getByRole("button", { name: /Write care note/i }).click();
await page.waitForTimeout(1600);
const afterResolve = await page.evaluate(() => ({
  hud: Boolean(document.querySelector(".hud--compact")),
  title: document.querySelector(".reading__title")?.textContent,
  toast: document.querySelector(".toast")?.textContent?.trim(),
  timelineCount: document.querySelectorAll(".timeline__item").length
}));
console.log("AFTER RESOLVE", JSON.stringify(afterResolve, null, 2));

console.log("ERRORS", JSON.stringify(errors, null, 2));
await page.screenshot({ path: "C:/Users/dabhi/AppData/Local/Temp/opencode/hearthguard-shots/flow-resolved.png", fullPage: true });
await context.close();

// Fire TV keyboard flow.
const tvContext = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const tv = await tvContext.newPage();
const tvErrors = [];
tv.on("console", (m) => { if (m.type() === "error") tvErrors.push(m.text()); });
tv.on("pageerror", (e) => tvErrors.push(String(e)));
await tv.goto("http://localhost:5173/?mode=firetv&scenario=SCN-02", { waitUntil: "networkidle" });
await tv.waitForTimeout(3000);
const focusedBefore = await tv.evaluate(() => document.activeElement?.textContent?.trim());
await tv.keyboard.press("ArrowDown");
await tv.waitForTimeout(200);
const focusedAfter = await tv.evaluate(() => document.activeElement?.textContent?.trim());
await tv.keyboard.press("Enter");
await tv.waitForTimeout(1600);
const tvAfter = await tv.evaluate(() => ({
  focused: document.activeElement?.textContent?.trim(),
  result: document.querySelector(".hud__result")?.textContent?.trim(),
  toast: document.querySelector(".toast")?.textContent?.trim()
}));
console.log("TV FOCUS", JSON.stringify({ focusedBefore, focusedAfter, tvAfter }, null, 2));
console.log("TV ERRORS", JSON.stringify(tvErrors, null, 2));
await tv.screenshot({ path: "C:/Users/dabhi/AppData/Local/Temp/opencode/hearthguard-shots/firetv-action.png" });
await tvContext.close();
await browser.close();
