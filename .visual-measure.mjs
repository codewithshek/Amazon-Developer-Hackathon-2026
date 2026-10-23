import { chromium } from "playwright";

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await context.newPage();
await page.goto("http://localhost:5173/?empty=1", { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
const boxes = await page.evaluate(() => {
  const sel = [".masthead", ".thesis", ".console", ".pane--threshold", ".pane--reading", ".pane--room", ".ledger", ".site-foot", ".provenance"];
  const out = {};
  for (const s of sel) {
    const el = document.querySelector(s);
    if (!el) continue;
    const r = el.getBoundingClientRect();
    out[s] = { top: Math.round(r.top + window.scrollY), height: Math.round(r.height), width: Math.round(r.width) };
  }
  out.page = { height: document.documentElement.scrollHeight, width: document.documentElement.scrollWidth };
  return out;
});
await page.screenshot({ path: "C:/Users/dabhi/AppData/Local/Temp/opencode/hearthguard-shots/studio-1920.png", fullPage: true });
console.log(JSON.stringify(boxes, null, 2));
await context.close();
await browser.close();
