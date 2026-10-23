# TEST.md — Test Inventory and Commands

HearthGuard uses two layers:

1. **Vitest** for pure helpers, the bridge package, HTTP routes, and the MCP server via
   `supertest` (no listening socket).
2. **Playwright** for the browser flows that matter: studio replay → action → resolution,
   Fire TV D-pad/Enter/Back, and number-key quick select.

The suite is intentionally small and behavior-focused. There is no coverage percentage
target and no snapshot farm.

---

## 1. Commands

```bash
npm test              # all Vitest files (4 files / 19 tests)
npm run test:watch    # Vitest watch mode
npm run test:bridge   # bridge package only
npm run test:agent    # Bee/Bedrock fallback and card tests
npm run test:mcp      # MCP protocol tests
npm run test:e2e      # Playwright (3 tests, isolated ports)
npx tsc --noEmit      # type check
npm run build         # type check + production build
```

Measured final run (2026-10-23, Node 24.22.1):

```text
Vitest:     4 files passed, 19 tests passed, 3.83 s
Playwright: 3 tests passed, 28.4 s
Build:      passed, 47 modules, 1.38 s
```

---

## 2. Vitest configuration

`vitest.config.ts` excludes `e2e/` so Playwright specs are not discovered by Vitest. Without
that exclusion, Vitest would try to run `@playwright/test` files in the wrong runner.

The tests import the Express `app` directly and use `supertest`. That means:

- no port is opened for unit/protocol tests;
- route middleware, raw-body capture, HMAC verification, MCP session handling, and error
  handlers are exercised in the real app;
- tests share module state. The MCP tests initialize their own sessions; the webhook tests
  trigger scenarios. They pass in the current order and are not parallelized across files by
  default in a way that would make the timeline assertions brittle.

---

## 3. `packages/ring-alexa-mcp-bridge/test/bridge.test.ts` — 6 tests

**File under test:** `packages/ring-alexa-mcp-bridge/src/index.ts`

| Test | Assertion |
| --- | --- |
| Authentic HMAC | `verifyRingWebhookHmac` returns exactly `{ valid: true }` |
| Tampered payload + stale timestamp | Appending a space invalidates the digest; a 900-second-old timestamp is rejected with a replay-window reason |
| Malformed signatures | `sha256=nope` and missing signature return invalid without throwing |
| WHEP loopback | No token → `simulator_loopback`, endpoint contains the device path, SDP contains `H264/90000` |
| Simulated live WHEP | Injected `fetchImpl` returns `201` + `Location`; mode is `live_partner_api`, session id parsed, SDP preserved |
| Card payload | Two content blocks; second is a resource with `application/vnd.alexa.mcp.card+json`; structured card title preserved |

---

## 4. `tests/agent.test.ts` — 3 tests

**Files under test:** `beeContextClient.ts`, `bedrockStrandsAgent.ts`, `scenarios.ts`

| Test | Assertion |
| --- | --- |
| Bee fixture fallback | With no proxy, source is `bee_recorded_session_fixture`; the SCN-01 commitment mentions the dentist |
| Recorded trace + card | SCN-02 returns `deterministic_recorded_trace`, the configured model id, card version `2025-11-25`, severity `ACCESSIBILITY_RELAY`, three actions, at least one caption, four trace steps, non-negative latency |
| All scenarios grounded | Each scenario’s card has a Bee fact longer than 20 characters and D-pad keys exactly `["1","2","3"]` |

The tests do **not** call live Bedrock or a live Bee daemon. Those paths require credentials
and are explicitly out of scope for CI.

---

## 5. `tests/mcp.test.ts` — 6 tests

**File under test:** `src/server/mcp.ts` through `src/server/app.ts`

Helper `initializeSession()` sends a JSON-RPC `initialize` with protocol `2025-11-25` and
returns the `Mcp-Session-Id`.

| Test | Assertion |
| --- | --- |
| Initialize | HTTP 200, session header present, `Access-Control-Expose-Headers` contains `Mcp-Session-Id`, protocol and server name match |
| Tools + timeline | `tools/list` contains the five tool names; `resources/list` contains `care://timeline`; `resources/read` returns JSON text |
| Analyze tool | `analyze_threshold_event` for SCN-02 returns text containing `ACCESSIBILITY_RELAY` and a card resource with three actions |
| Execute + resolve | `execute_alexa_threshold_intervention` returns “Alexa+ voice”; `resolve_care_incident` returns “resolved” |
| DELETE teardown | DELETE returns 200; reusing the old session id returns 404 |
| Origin rejection | `Origin: https://evil.example` returns 403 |

The test sends both `Accept: application/json, text/event-stream` and
`MCP-Protocol-Version: 2025-11-25`, matching the client.

---

## 6. `tests/webhook.test.ts` — 4 tests

**Files under test:** `src/server/app.ts`, `src/server/careEngine.ts`,
`packages/ring-alexa-mcp-bridge/src/index.ts`

| Test | Assertion |
| --- | --- |
| Signed demo path | `POST /api/demo/trigger/SCN-03` returns 200, verification valid, incident SCN-03, severity `COLD_CHAIN_CUSTODY`, WHEP `simulator_loopback` |
| Correctly signed webhook | Computes signature over `<timestamp>.<body>`, posts to `/api/ring/webhook`, expects 202 and `accepted: true` |
| Unsigned/tampered webhook | Unsigned → 401; signed body plus a trailing space → 401 |
| Health/state/timeline | `/api/health` reports protocol `2025-11-25`; state incidents is an array; timeline is an array |

The second test sends the body as a string with `Content-Type: application/json`. The
`express.json` raw-body verifier captures exactly those bytes; that is what the HMAC covers.

---

## 7. Playwright E2E — 3 tests

**Config:** `playwright.config.ts`

- Test dir: `e2e/`
- Single worker, no parallelism
- Desktop Chrome viewport `1440 × 900`
- Timeout 45 s; expect timeout 10 s
- Trace, screenshot, and video retained only on failure
- `webServer` starts `npm run dev:server:e2e` on `:4100` and
  `npm run dev:client:e2e` on `:5273`
- `reuseExistingServer: false` for both, so a tab left open on the normal dev server cannot
  pollute the run

`beforeEach` posts `/api/demo/reset` on `:4100` to guarantee a quiet house.

### 7.1 Studio replay → action → resolution

`e2e/studio.spec.ts:10`

1. Collect console errors and page errors.
2. Visit `/?empty=1`.
3. Assert the quiet-state heading and the `MCP 2025-11-25` chip.
4. Click the “Night exit” choice in `.reading-choices`.
5. Assert the reading title and the compact HUD copy.
6. Click the first `.deck__action`.
7. Assert the Alexa+ response and outcome text.
8. Click `.deck__resolve`.
9. Assert the quiet-state heading returns, the compact HUD is gone, and the care-note toast
   appears.
10. Assert no console/page errors.

### 7.2 Fire TV D-pad + Enter + Back

`e2e/studio.spec.ts:53`

1. Collect console/page errors.
2. Visit `/?mode=firetv&scenario=SCN-02`.
3. Assert the full HUD and its title.
4. Assert three `[data-tv-action]` elements and that the first is focused (after the 320 ms
   auto-focus).
5. Press `ArrowDown`; assert the second action is focused.
6. Press `Enter`; assert the result panel contains the Alexa+ response and the “Courier asked
   to wait…” outcome.
7. Press `Escape`; assert the HUD unmounts and the quiet-state heading returns.
8. Assert no console/page errors.

### 7.3 Number-key quick select

`e2e/studio.spec.ts:86`

1. Visit `/?mode=firetv&scenario=SCN-03`.
2. Assert the full HUD and title.
3. Press `3`; assert the result panel contains “I’ve paused the TV” and the outcome
   “Media paused. Porch light on. Lockbox open for pickup.”

This test does not collect console errors; the first two do.

---

## 8. What the suite does not cover

- Live Ring WHEP or official Ring signature compatibility.
- Live Bedrock invocation, model quality, or latency.
- Live Bee proxy or physical Bee hardware.
- A physical Fire TV, Vega OS, remote control, or audio ducking on real media.
- Alexa+ cloud registration or a physical Echo.
- Screen-reader behavior, automated axe checks, or keyboard traps outside the tested flow.
- Visual regression or pixel diffs.
- Load, soak, concurrency, or multi-user isolation.
- Persistence across restart.

Those gaps are reflected in [RESULTS.md](RESULTS.md) and [SECURITY.md](SECURITY.md).

---

## 9. Adding a test

- Put pure/server tests in `tests/*.test.ts`; they will be picked up by Vitest.
- Put browser flows in `e2e/*.spec.ts`; they will be picked up by Playwright.
- Do not put Playwright imports in `tests/`; `vitest.config.ts` only excludes `e2e/`.
- If a test needs a clean server, call `/api/demo/reset` in `beforeEach`.
- If a test depends on a specific scenario, trigger it explicitly; do not rely on the
  auto-run timer.
- Prefer user-visible roles/text over CSS classes, except where the class is the stable
  contract for the HUD action row (`.deck__action`, `[data-tv-action]`).
