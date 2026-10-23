# WORKFLOW.md — Development, Demo, and Release Workflow

This is the workflow for working on HearthGuard as it exists today. It replaces the original
blueprint’s “zero-human Anti-Gravity” prompt. There is no hidden generation step: the repo is
the deliverable.

---

## 1. First run

```bash
git clone <repository>        # or unzip the project
cd Amazon-Developer-Hackathon
npm install
npm run dev
```

Open **http://localhost:5173**. The API is on **http://localhost:4000**, MCP on
**http://localhost:4000/mcp**.

Expected server log:

```text
HearthGuard server listening on http://localhost:4000  ·  Bedrock replay  ·  Ring simulator
MCP Streamable HTTP: http://localhost:4000/mcp
```

If port 5173 is occupied, Vite fails fast (`strictPort`). Stop the other process or change the
port in `vite.config.ts`.

---

## 2. Daily development loop

1. **Server changes:** `npm run dev:server` (tsx watch) restarts on save.
2. **Client changes:** `npm run dev:client` (Vite HMR).
3. **Both:** `npm run dev`.
4. **Before committing:** `npm test`, `npm run build`, and for UI changes `npm run test:e2e`.

The client imports scenarios from `src/server/scenarios.ts`. That module is intentionally free
of Node imports so the browser can share the definitions. If you add a Node import there, the
client build will break.

### Where to change what

| Change | File |
| --- | --- |
| Scenario copy, timestamps, actions | `src/server/scenarios.ts` |
| Incident lifecycle, capabilities | `src/server/careEngine.ts` |
| Bee fallback/live behavior | `src/server/beeContextClient.ts` |
| Nova prompt/fallback | `src/server/bedrockStrandsAgent.ts` |
| MCP tools/resources | `src/server/mcp.ts` |
| REST routes/webhook | `src/server/app.ts` |
| HMAC/WHEP/card helpers | `packages/ring-alexa-mcp-bridge/src/index.ts` |
| Studio layout | `src/client/App.tsx`, `src/client/components/` |
| TV surface | `src/client/FireTvPage.tsx`, `TvStage.tsx`, `Hud.tsx` |
| D-pad behavior | `src/client/lib/useTvNavigation.ts` |
| Room tone | `src/client/lib/roomTone.ts` |
| Tokens/layout | `src/client/styles/tokens.css`, `app.css` |

---

## 3. Demo workflow

### 3.1 Before the demo

```bash
npm install
npm test
npm run build
npm run dev
```

Then open the studio at `?empty=1` in one tab and the Fire TV surface in another. The demo is
replay-first, so no credentials are needed.

Check:

- masthead shows `Live`, `MCP 2025-11-25`, `HMAC verified`, `Nova replay`, and a session id;
- the provenance footer says what is simulated;
- room tone is off until you click it (autoplay policy).

### 3.2 Three-minute run

1. **Studio at rest.** `?empty=1`. Point out the three panes: threshold, reading, living room.
2. **Run SCN-01.** Click “Night exit” or the `01` scenario button. The signed replay drives
   the care card, the TV dims, and the compact HUD arrives.
3. **Read the reasoning.** Bee remembers the dentist belief; the calendar contradicts it.
   Nova/Bedrock is in replay mode unless credentials are configured.
4. **Execute “Calm redirect.”** The Alexa+ spoken line and outcome appear in the card, action
   deck, wire, and timeline.
5. **Resolve.** Close the card; the care note is written and the house returns to quiet.
6. **Open Fire TV.** Use the masthead link or `?mode=firetv&scenario=SCN-02`.
7. **Show accessibility.** SCN-02’s visual relay: TV ducked, captions, Lockbox 2. Press
   `ArrowDown` then `Enter`; show the result. Press `Escape` to close.
8. **Show cold chain.** `?mode=firetv&scenario=SCN-03`, press `3` for the immediate pickup
   action.
9. **Close on provenance.** Open “What is simulated” and state the boundary plainly.

### 3.3 Reset between runs

- UI: the reset button in the MCP wire header.
- API: `POST /api/demo/reset`.
- Playwright: `beforeEach` does this automatically on `:4100`.

Reset clears incidents and timeline. It does not restart the server or close MCP sessions.

---

## 4. Test workflow

```bash
npm test              # fast; no ports
npm run test:e2e      # browser; isolated ports 4100/5273
npm run build         # type check + production build
```

If E2E fails:

1. Read the Playwright report (`playwright-report/`) and trace.
2. Check that `:4100` and `:5273` are free. The config refuses to reuse an existing server.
3. Reproduce manually at `http://localhost:5273` with the E2E server running.
4. Remember that the HUD auto-focuses after 320 ms; tests wait for visibility before pressing
   keys.

Do not run E2E against the normal dev server. A browser tab left open on `:5173` would create
incidents behind the test, which is why the config uses separate ports.

---

## 5. Optional live integrations

Create `.env` from `.env.example`. Never commit it.

### Ring WHEP

```env
RING_OAUTH_TOKEN=...
RING_API_BASE_URL=https://api.amazonvision.com
```

The server attempts the live negotiation with a 6 s timeout. On failure it uses the
deterministic loopback. The UI badge changes to `LIVE WHEP` only when the negotiation reports
`live_partner_api`.

### AWS Bedrock

```env
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=amazon.nova-pro-v1:0
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

The server calls Nova for the spoken sentence. If the call fails, it silently falls back to
the recorded sentence. Check the masthead chip: `Nova live` vs `Nova replay`.

### Bee

```env
BEE_PROXY_URL=http://127.0.0.1:8787/v1/facts
```

The server appends `?scenario=SCN-0x` and expects either a fact object or `{ facts: [...] }`
with a non-empty `extractedCommitment`. Timeout is 400 ms.

### Demo endpoints off

```env
DEMO_MODE=false
```

`/api/demo/trigger` and `/api/demo/reset` return 403. The signed webhook and MCP remain
available.

---

## 6. Adding a scenario

1. Add the id to `ScenarioId` in `packages/ring-alexa-mcp-bridge/src/index.ts` and
   `src/shared/types.ts` if the union is duplicated there.
2. Add the full definition to `SCENARIOS` in `src/server/scenarios.ts`:
   - `number`, `time`, `period`, `timestamp`, `deviceId`, `zone`, `eyebrow`, `title`,
     `summary`, `intent`, `camera`, `severity`, `resident`;
   - `beeFact`, `evidence`, `captions`, `spokenAlexaPrompt`;
   - three `hudActions` with unique ids and D-pad keys `1–3`.
3. Add the id to `SCENARIO_ORDER` and `isScenarioId`.
4. Update `scenarioEnum` in `src/server/mcp.ts`.
5. Add a camera mode to `CameraMode` and a drawing branch in `CameraCanvas`/`CameraFeed` if
   needed.
6. Add a test case in `tests/agent.test.ts` or a new test file.
7. Run `npm test`, `npm run build`, and `npm run test:e2e`.

The UI reads scenarios from the shared object, so the masthead, reading pane, HUD, and MCP
resources update automatically once the id is accepted by the enum and `SCENARIO_ORDER`.

---

## 7. Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Studio shows “The MCP session could not start” | Server not running, or `/mcp` blocked | Check `http://localhost:4000/api/health`; check the Vite proxy target |
| Masthead says `Polling` | SSE disconnected | Server restart or proxy issue; the client polls state every 4 s |
| `Nova replay` despite credentials | Env not loaded, missing model access, or invalid keys | Check the server process env; look for the replay chip; Bedrock failures are intentionally silent |
| `Bee fixture` despite `BEE_PROXY_URL` | Proxy unreachable, timeout, or missing `extractedCommitment` | Test the URL with `?scenario=SCN-01`; 400 ms timeout is short |
| `WHEP simulator` despite token | Live call failed or token absent | Check `RING_OAUTH_TOKEN`; live partner access is unverified |
| Actions say the session is starting | MCP initialize failed or session was lost | Reload; check `/mcp` origin policy |
| E2E cannot start | Port 4100/5273 occupied, or an old Playwright server | Stop stray processes; rerun |
| `npx tsx` hangs | Known issue in this environment | Use `npm run dev:server` or `.\node_modules\.bin\tsx.cmd` |
| Fonts look wrong | Fontsource imports missing | Ensure `npm install` completed; check `main.tsx` imports |

---

## 8. Release checklist

- [ ] `npm install` from a clean checkout succeeds.
- [ ] `npm test` passes (4 files / 19 tests).
- [ ] `npm run build` passes.
- [ ] `npm run test:e2e` passes (3 tests).
- [ ] Manual check at 1440 × 900 and 390 × 844; no horizontal overflow.
- [ ] Fire TV mode at 1920 × 1080: first action receives focus; ArrowDown/Enter/Escape work.
- [ ] Provenance footer matches the actual runtime (`replay`/`fixture`/`simulator` unless
      configured otherwise).
- [ ] No `.env`, credentials, or generated reports are committed.
- [ ] Documentation counts and file names still match the code.
- [ ] Delete temporary visual-check scripts and screenshots outside `docs/`.

---

## 9. What not to do

- Do not describe the demo as a live Ring/Alexa+/Fire TV deployment.
- Do not add a benchmark number that was not measured in this repo.
- Do not claim WCAG AAA for the whole interface.
- Do not expose `:4000` to a network without reading [SECURITY.md](SECURITY.md).
- Do not commit the local demo secret or AWS keys.
- Do not add a database “for realism” without also documenting the privacy and retention
  implications.
