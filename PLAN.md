# PLAN.md — Build Plan, Decisions, and Status

The original PLAN.md was a file-by-file code blueprint. This version records what was
actually built, why the main choices were made, and what remains before a production
deployment.

---

## 1. Status

| Phase | Scope | Status |
| --- | --- | --- |
| 0 | Read the brief, verify protocol/tool versions, install the stack | Done |
| 1 | Bridge package: HMAC, WHEP, card payload, tests | Done |
| 2 | Server: scenarios, Bee/Bedrock fallbacks, care engine, MCP, REST, SSE | Done |
| 3 | Client: Night Watch studio, Fire TV surface, D-pad, room tone | Done |
| 4 | Verification: Vitest, type check, build, Playwright | Done |
| 5 | Documentation rewrite and provenance cleanup | Done |
| 6 | Production hardening, live partner validation, device packaging | Not in scope |

Final measured state: **4 Vitest files / 19 tests**, **3 Playwright tests**, **type check and
build pass**. See [RESULTS.md](RESULTS.md).

---

## 2. What was built, in order

### Phase 0 — Ground the stack

- Read the 11-file brief.
- Confirmed the MCP protocol string `2025-11-25` and the official SDK’s Streamable HTTP
  transport rather than hand-rolling JSON-RPC.
- Chose current versions available in the environment: MCP SDK `1.32.1`, Express `5.3.0`,
  React `19.3.1`, Vite `8.3.5`, TypeScript `7.0.2`, Vitest `5.0.5`, Playwright `1.64.1`,
  GSAP `3.15.0`, Zod `4.6.7`.
- Rejected the blueprint’s fictional `vega-manifest.toml`, `mcp.config.json`, and Strands SDK
  imports because they were not needed to demonstrate the interaction and would have been
  unverifiable.

### Phase 1 — Open-source bridge

`packages/ring-alexa-mcp-bridge`:

- `computeRingHmacSignature` / `verifyRingWebhookHmac` over `<timestamp>.<raw body>`, with
  format checks, a 300 s window, and `crypto.timingSafeEqual`.
- `negotiateRingWhepSession` with injectable `fetchImpl`, bearer auth, `200/201` handling,
  `Location` parsing, and a deterministic loopback.
- `buildAlexaMcpCardPayload` with text + embedded resource + `structuredContent`.
- `createRingWebhookBody` helper for the demo.
- Six tests, MIT license, standalone package metadata.

### Phase 2 — Server

- `scenarios.ts`: three complete scenarios with copy, evidence, captions, Bee facts, and
  actions.
- `beeContextClient.ts`: fixture-first, live proxy only when configured, 400 ms timeout.
- `bedrockStrandsAgent.ts`: optional Nova call, 7 s timeout, recorded fallback, deterministic
  card; latency is local pipeline time.
- `careEngine.ts`: in-flight de-duplication, WHEP choice, incident map, action execution,
  resolution, reset, capability report.
- `timeline.ts`: bounded 120-entry in-memory log.
- `eventBus.ts`: EventEmitter → SSE.
- `mcp.ts`: five tools, three resources, per-session Streamable HTTP transport, local-origin
  policy, resource-update notifications.
- `app.ts`: REST routes, signed demo path, signed webhook path, SSE, security headers,
  static build fallback.
- `index.ts`: `PORT`, graceful shutdown.

### Phase 3 — Client

- `App.tsx`: masthead, thesis, three-pane console, ledger, provenance, toasts.
- `ThresholdPane`, `ReadingPane`, `LivingRoomPane`, `ActionDeck`, `Remote`, `McpWire`,
  `CareTimeline`.
- `CameraFeed` / `AmbientCanvas`: procedural canvas art, no real media.
- `Hud.tsx`: compact studio card + full 10-foot card.
- `TvStage.tsx`: simulated film, dim layer, GSAP entrance, compact/full switch.
- `FireTvPage.tsx`: fullscreen TV surface, `S`/`F` keys.
- `useHearthGuard.ts`: REST boot, MCP initialize/list/call, SSE + polling fallback, auto-run.
- `useTvNavigation.ts`: roving focus, arrows, Enter, 1–3, Escape/Backspace.
- `roomTone.ts`: generated brown noise + hum, ducking, user-gesture start.
- `tokens.css` / `app.css`: Night Watch design system and responsive layout.

### Phase 4 — Verification

- Vitest config excludes `e2e/`.
- Playwright config uses isolated `:4100` / `:5273` and `reuseExistingServer: false`.
- E2E covers studio replay → action → resolve, Fire TV D-pad/Enter/Escape, and number-key
  quick select.
- Manual responsive checks at five viewports.
- Contrast measured for the core ink/accent tokens.

### Phase 5 — Documentation

- Replaced blueprint-era claims and filenames with as-built docs.
- Added `README.md`.
- Added `docs/studio.png` and `docs/firetv.png` from the verified build.
- Corrected security claims (no immutable audit log, no official SDK claims, no zero-disk
  frame pipeline claim since no frames are received at all).

---

## 3. Key decisions

| Decision | Why | Consequence |
| --- | --- | --- |
| Official MCP SDK, not a custom JSON-RPC loop | Session/transport correctness; protocol version is maintained by the SDK | One more dependency; version pinned in the lockfile |
| Replay-first with explicit capability chips | Judges can run it offline; no fake live claims | The demo is not a live Amazon deployment |
| Deterministic card + optional Nova sentence | The interaction stays testable; live AI only changes the voice line | “Live Bedrock” is a narrow claim |
| In-memory state | Zero setup; deterministic resets | No persistence, no multi-user isolation |
| Shared `scenarios.ts` imported by client | One source of truth for copy and actions | The module must stay Node-free |
| Browser Fire TV simulation | No Vega toolchain or device available | The 10-foot interaction is demonstrated, not shipped |
| Isolated E2E ports | Existing dev tabs caused cross-talk | Slightly slower test startup |
| No fabricated benchmark/FPS/AAA claims | Trust is part of the submission | Fewer flashy numbers in the docs |

---

## 4. Problems found and fixed during the build

| Problem | Fix |
| --- | --- |
| MCP protocol version needed to match the SDK | Used `LATEST_PROTOCOL_VERSION` / `2025-11-25`, verified in tests |
| Vitest tried to run Playwright specs | Added `vitest.config.ts` exclude for `e2e/` |
| E2E tests were polluted by an open dev tab | Separate server/Vite ports, `reuseExistingServer: false`, reset in `beforeEach` |
| Global Enter handler hijacked focused native buttons | Enter returns early when the target is a button/link/input; native activation wins |
| HUD focus arrived before the card was visible | 320 ms delayed focus, guarded against focus already outside the card |
| SCN-03 evidence timestamp did not match the scenario time | Corrected to `11:05:33` |
| Low-contrast microtype | Raised `--ink-3` / `--ink-4`; measured 7.35:1 / 5.17:1 |
| Blueprint docs referenced files that do not exist | Rewrote docs around the real tree |
| Blueprint claimed AAA/11.4:1, 60fps, and fake latencies | Removed; documented measured AA-level token contrast and no FPS claim |

---

## 5. Remaining work

### Before a public demo

- [x] README and as-built docs.
- [x] Provenance panel and capability chips.
- [x] Final test/build/E2E run.
- [ ] Optional: record a 3-minute demo video.
- [ ] Optional: deploy a static client + server to a controlled environment with auth.

### Before any production use

1. **Authentication and authorization** for `/mcp` and `/api`; per-caregiver identity.
2. **TLS** and a real origin policy; remove permissive `/api` CORS.
3. **Persistent, tamper-evident audit storage** with retention rules and consent.
4. **Rate limiting**, request size limits beyond the current 256 kB JSON cap, and abuse
   monitoring.
5. **Live Ring partner validation** of the webhook signature and WHEP contract.
6. **Live Bedrock validation** with an IAM role, model entitlement, retries, and timeouts.
7. **Privacy review** for any camera, audio, health, or location data.
8. **Accessibility audit** with screen readers and care recipients.
9. **Fire TV/Vega packaging** if the 10-foot surface is to run on a device.
10. **Clinical and safety review** of every intervention and escalation path.

---

## 6. Risks

| Risk | Impact | Mitigation in this build |
| --- | --- | --- |
| Live Ring contract differs from the demo | Live ingestion would fail | Clearly labelled Ring-style contract; live path isolated |
| Bedrock model access absent | Live voice unavailable | Recorded fallback, chip says replay |
| Bee proxy format differs | Live memory unavailable | Fixture fallback; tolerant top-level/facts parsing |
| In-memory state lost on restart | Demo resets | Deterministic replay; reset endpoint |
| MCP endpoint exposed | Anyone on the network can call tools | Local-origin filter; docs say localhost only |
| Care actions misread as real device control | User harm / trust loss | Simulated actions, provenance footer, no real locks/lights |
| Accessibility gaps | Exclusion | Keyboard-complete core flow; formal audit still needed |

---

## 7. Definition of done for this repository

- The app boots with `npm install && npm run dev`.
- All three scenarios run without credentials.
- The Fire TV surface is operable with arrows, Enter, 1–3, and Escape.
- The MCP server exposes the five tools and three resources.
- Tests, type check, build, and E2E pass.
- The docs describe the real files, real behavior, and real limitations.
- No fabricated benchmark, latency, FPS, or certification claim remains.

That definition is met for the hackathon demo. It is not a production readiness claim.
