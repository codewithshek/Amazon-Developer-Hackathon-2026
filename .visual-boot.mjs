import { chromium } from "playwright";
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1200, height: 800 } });
const page = await context.newPage();
const reqs = [];
page.on("request", (r) => {
  if (r.url().includes("/mcp") || r.url().includes("/api/state") || r.url().includes("/api/events")) {
    reqs.push({ method: r.method(), url: r.url(), body: r.postData()?.slice(0, 120) });
  }
});
await page.goto("http://localhost:5173/?empty=1", { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
console.log(JSON.stringify(reqs, null, 2));
console.log("loading text:", await page.locator("body").innerText().then((t) => t.slice(0, 80)));
await browser.close();
