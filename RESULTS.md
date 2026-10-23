# RESULTS.md — Measured Verification and Requirement Traceability

This file records only results that can be reproduced from the repository. It does not
contain latency benchmarks, FPS scores, or automated accessibility grades. The UI’s
“Nova · … ms” line is **local pipeline time for that incident**, not a benchmark.

---

## 1. Verification environment

| Item | Value |
| --- | --- |
| Date of final run | 2026-10-23 |
| OS | Windows (win32) |
| Node.js | 24.22.1 |
| npm | 11.5.2 |
| TypeScript | 7.0.2 |
| Vitest | 5.0.5 |
| Playwright | 1.64.1 |
| Browser | Desktop Chrome, viewport 1440 × 900 for E2E |

All commands below were run from the repository root after `npm install`.

---

## 2. Automated results

### 2.1 Unit and protocol tests

```text
npm test

Test Files  4 passed (4)
Tests       19 passed (19)
Duration    3.83 s
```

| File | Tests | What it proves |
| --- | ---: | --- |
| `packages/ring-alexa-mcp-bridge/test/bridge.test.ts` | 6 | Authentic HMAC accepted; tampered payload and stale timestamp rejected; malformed headers rejected without throwing; WHEP loopback; simulated live WHEP response; card payload shape |
| `tests/agent.test.ts` | 3 | Bee fixture fallback; recorded trace and complete card; all three scenarios have grounded facts and D-pad keys `1–3` |
| `tests/mcp.test.ts` | 6 | MCP `2025-11-25` initialization and `Mcp-Session-Id`; five tools; `care://timeline`; card resource; intervention + resolution; DELETE teardown and old-session rejection; non-local origin rejected |
| `tests/webhook.test.ts` | 4 | Signed demo path; correctly signed webhook returns `202`; unsigned/tampered webhook returns `401`; health/state/timeline endpoints |

### 2.2 Type check and production build

```text
npm run build

tsc --noEmit
vite v8.3.5
✓ 47 modules transformed
dist/assets/index-*.js   363.27 kB │ gzip: 117.03 kB
dist/assets/index-*.css   49.13 kB │ gzip:  10.29 kB
✓ built in 1.38 s
```

The build command runs the type checker first. A failing type check fails the command.

### 2.3 End-to-end tests

```text
npm run test:e2e

Running 3 tests using 1 worker
ok 1  studio replay, action, resolution
ok 2  Fire TV D-pad + Enter + Back
ok 3  number-key quick select

3 passed (28.4 s)
```

The E2E configuration starts an isolated server on `:4100` and Vite on `:5273` with
`reuseExistingServer: false`. This prevents a browser tab left open on the normal dev server
from creating incidents during the test. The first two tests collect console errors and
page errors and assert the arrays are empty.

### 2.4 Contrast measurements

Measured relative to the main console surface `#0b0a08`:

| Token | Hex | Contrast |
| --- | --- | ---: |
| `--ink` | `#f3ebdf` | 16.74:1 |
| `--ink-2` | `#cdc2b2` | 11.27:1 |
| `--ink-3` | `#a89c8c` | 7.35:1 |
| `--ink-4` | `#8a8177` | 5.17:1 |
| `--amber` | `#f0a45c` | 9.58:1 |
| `--amber-bright` | `#ffc182` | 12.44:1 |
| `--sage` | `#9bb7a1` | 9.12:1 |
| `--ok` | `#8fb59a` | 8.71:1 |
| `--cool` | `#9fc0c7` | 10.21:1 |
| `--coral` | `#e08a6f` | 7.57:1 |

These values support WCAG AA for normal text on this surface. They are **not** a claim that
every element, image, or state in the app has been audited to AAA. Some small text uses
`--ink-4`; at 5.17:1 it passes AA but not AAA.

### 2.5 Manual responsive pass

The UI was checked at 1600 × 1000, 1440 × 900, 390 × 844, 1920 × 1080, and a 1920 × 1080
Fire TV viewport. No horizontal overflow was observed. These were visual checks, not
automated visual-regression tests.

---

## 3. Capability traceability

| Capability | Implementation | Evidence |
| --- | --- | --- |
| Ring-style HMAC ingestion | `packages/ring-alexa-mcp-bridge/src/index.ts`, `src/server/app.ts` | bridge + webhook tests; `POST /api/ring/webhook` |
| 300-second replay window | `verifyRingWebhookHmac` | bridge test rejects a 900-second-old signature |
| WHEP negotiation | `negotiateRingWhepSession` + `careEngine.ts` | bridge loopback/live-response tests; `whep.mode` in every incident |
| MCP `2025-11-25` Streamable HTTP | `src/server/mcp.ts` with official SDK `1.32.1` | `tests/mcp.test.ts` initialization, tools, resources, DELETE |
| Five MCP tools | `src/server/mcp.ts` | `tools/list` assertion and tool-call tests |
| Three MCP resources | `src/server/mcp.ts` | `care://timeline` read test; scenario/household resources registered |
| Card as text + embedded resource | `buildAlexaMcpCardPayload` | MCP test asserts custom media type and three actions |
| Bedrock Nova optional live path | `src/server/bedrockStrandsAgent.ts` | replay tests; live path requires credentials and is not exercised in CI |
| Bee proxy optional path | `src/server/beeContextClient.ts` | fixture fallback test; live proxy requires `BEE_PROXY_URL` |
| Three deterministic scenarios | `src/server/scenarios.ts` | agent test loops all three; UI auto-run and E2E |
| Fire TV 10-foot HUD | `src/client/FireTvPage.tsx`, `TvStage.tsx`, `Hud.tsx` | E2E D-pad and number-key tests |
| D-pad / numeric / Back keys | `src/client/lib/useTvNavigation.ts` | E2E focus, Enter, Escape, quick-select |
| Room-tone ducking | `src/client/lib/roomTone.ts` | manual browser check; no automated audio assertion |
| SSE state updates | `src/server/app.ts`, `useHearthGuard.ts` | studio E2E observes card, action result, and resolution |
| Bounded care timeline | `src/server/timeline.ts` | webhook test; max 120 entries in code |
| Responsive studio | `src/client/styles/app.css` | manual viewport pass |

---

## 4. What was not verified

These are deliberate limitations, not hidden failures:

- **Live Ring partner access.** The WHEP live path is implemented and can be selected with
  `RING_OAUTH_TOKEN`, but no partner credentials were used here. The live call shape is
  therefore unverified against Amazon’s current onboarding contract.
- **Live AWS Bedrock invocation.** The Nova path is implemented with
  `InvokeModelCommand`, but CI and the recorded demo run in replay mode. No model latency or
  answer quality is claimed.
- **Live Bee hardware.** The proxy fallback is tested; a physical Bee or a running
  `bee proxy` was not part of the verification environment.
- **Physical Fire TV / Vega OS.** The 10-foot surface is a browser simulation. No device
  package, Vega manifest, or remote-control hardware was tested.
- **Alexa+ cloud integration.** The repo provides an MCP server; it does not register with
  an Alexa+ account or invoke a physical Echo.
- **Screen-reader audit.** Semantic landmarks, labels, focus handling, and a skip link are
  present, but no NVDA/JAWS/VoiceOver certification was performed.
- **Performance profiling.** No FPS target or frame-budget claim is made. Motion uses
  transform/opacity and honors `prefers-reduced-motion`, but it was not profiled on TV
  hardware.
- **Load, soak, or concurrency testing.** State is in memory and intended for a single
  demo process.

---

## 5. Reproduce this file

```bash
npm install
npm test
npm run build
npm run test:e2e
```

If you change dependencies or scenarios, update the counts and sizes above rather than
carrying forward stale numbers.
