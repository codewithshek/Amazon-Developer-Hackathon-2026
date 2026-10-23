# ARCHITECTURE.md — Runtime, Protocols, and State

HearthGuard is a single Node process plus a React client. There is no database, queue, or
cloud control plane in the default demo. The architecture is deliberately small enough to run
on one laptop and honest enough to show where a production system would need more.

---

## 1. System at a glance

```text
┌───────────────────────────── Browser ─────────────────────────────┐
│ React studio (:5173 dev / :4000 prod)                             │
│  ├─ useHearthGuard: REST state + SSE + MCP session                │
│  ├─ ThresholdPane: procedural Ring-style camera canvas            │
│  ├─ ReadingPane: care narrative, evidence, action deck            │
│  ├─ LivingRoomPane: TV preview, compact HUD, remote               │
│  └─ FireTvPage: full 10-foot HUD                                  │
└───────────────┬───────────────────────────────┬───────────────────┘
                │ REST /api                     │ MCP /mcp
                ▼                               ▼
┌───────────────────────────── Express 5 (:4000) ───────────────────┐
│ app.ts        routes, HMAC ingestion, static dist, security hdrs  │
│ mcp.ts        MCP server, 5 tools, 3 resources, session transports│
│ careEngine.ts incident lifecycle, capabilities, WHEP choice       │
│ timeline.ts   bounded in-memory log (120 entries)                 │
│ eventBus.ts   EventEmitter → SSE /api/events                      │
└───────┬───────────────────┬───────────────────┬───────────────────┘
        │ optional          │ optional          │ always
        ▼                   ▼                   ▼
  Ring WHEP API       Bee proxy/fixture    Recorded scenario
  (partner token)     (BEE_PROXY_URL)      + deterministic card
        │                   │
        └──────────┬────────┘
                   ▼
          AWS Bedrock Nova
          (only with AWS creds)
```

The browser is the only client included in the repository. It uses REST for replay control and
state, SSE for live updates, and MCP for care actions and resolution. This split is intentional:
the MCP surface is the integration contract; REST is the demo control plane.

---

## 2. Runtime topology

| Process | Port | Responsibility |
| --- | ---: | --- |
| Express server | `4000` | REST, MCP, SSE, optional static `dist/` |
| Vite dev server | `5173` | Client HMR; proxies `/api` and `/mcp` to `4000` |
| Playwright server | `4100` | Isolated E2E API/MCP |
| Playwright Vite | `5273` | Isolated E2E client |

`npm run dev` starts the first two with `concurrently`. `npm start` runs the server only; if
`dist/index.html` exists, unknown non-API GET routes fall back to it.

The client never talks to `:4000` directly in development. Vite proxies `/api` and `/mcp`
using `VITE_API_TARGET` (default `http://localhost:4000`). In production the same origin
serves both.

---

## 3. Threshold sequence

### 3.1 Demo replay path

1. The browser calls `POST /api/demo/trigger/:scenarioId`.
2. The server checks `DEMO_MODE`.
3. It builds a Ring-style event body, computes an HMAC signature with the configured secret,
   and verifies it in-process. This exercises the same signing helpers used by the live
   webhook route, but it does **not** send an HTTP request to `/api/ring/webhook`.
4. `processScenario()` runs:
   - `negotiateWhep(deviceId)` attempts a live WHEP session if `RING_OAUTH_TOKEN` exists;
     otherwise it returns a deterministic loopback SDP answer.
   - `runBedrockStrandsThresholdAgent()` fetches Bee memory, optionally calls Nova, and builds
     the deterministic card.
   - The incident is stored in the `incidents` map, keyed by scenario id.
   - Three timeline entries are appended: detected, reasoned, dispatched.
   - `incident.created` and `timeline.updated` are published on the care event bus.
5. The response contains the incident and a verification summary.
6. SSE pushes the same incident to any open browser tab.

### 3.2 Signed webhook path

`POST /api/ring/webhook` is the production-shaped ingestion route:

1. `express.json` captures the raw body in `req.rawBody`.
2. `verifyRingWebhookHmac(rawBody, X-Ring-Signature, X-Ring-Timestamp, secret)` checks:
   - both headers exist;
   - the signature matches `sha256=<64 hex>`;
   - the timestamp is a 9–12 digit epoch value;
   - `|now - timestamp| ≤ 300 s`;
   - the digest matches in constant time.
3. Invalid requests return `401`.
4. A payload without `data.attributes.device_id` returns `422`.
5. `scenarioForEvent()` selects a scenario from `scenario_id`, then `ding`, then
   `package_detected`, then defaults to `SCN-01`.
6. `processScenario(..., "ring_webhook")` runs and the route returns `202`.

The signature contract (`X-Ring-Signature`, `X-Ring-Timestamp`, `sha256=`) is the demo’s
Ring-style contract. It is not asserted to be the current official Ring Partner API
signature scheme.

---

## 4. MCP surface

### 4.1 Transport

`src/server/mcp.ts` uses the official `@modelcontextprotocol/sdk` (`1.32.1`) with
`StreamableHTTPServerTransport`.

- **Protocol version:** `2025-11-25` (`LATEST_PROTOCOL_VERSION`).
- **POST `/mcp`:** without `Mcp-Session-Id`, creates a transport with a UUID session id and
  connects a new `McpServer`. With a known session id, reuses that transport. Unknown id
  returns `404`.
- **GET `/mcp`:** requires a session id and delegates to the transport for server-to-client
  messages.
- **DELETE `/mcp`:** delegates to the transport, then removes the session from the in-memory
  map.
- **Response mode:** POST uses `enableJsonResponse: true`; the client accepts both JSON and
  `text/event-stream` bodies.
- **Session storage:** `mcpSessions` is a `Map<string, StreamableHTTPServerTransport>` in
  memory. Sessions do not survive a restart. There is no explicit TTL.
- **Resource updates:** the server listens for `incident.created` and
  `intervention.executed` and calls `sendResourceUpdated({ uri: "care://timeline" })`.
  The SDK advertises tools/resources `listChanged` capabilities, not a resource `subscribe`
  capability. The browser client does not rely on these notifications; it uses SSE for UI
  updates.

### 4.2 Origin policy

`/mcp` is local-first:

- Requests with no `Origin` are allowed (native MCP clients, curl).
- `http://localhost:*` and `http://127.0.0.1:*` are allowed.
- An exact `MCP_ALLOWED_ORIGIN` may be added.
- Any other browser origin receives `403`.
- Allowed origins are echoed in `Access-Control-Allow-Origin`; the route does **not** use `*`.
- `Access-Control-Expose-Headers` includes `Mcp-Session-Id`.
- Allowed request headers include `MCP-Protocol-Version`, `Last-Event-ID`, and
  `Mcp-Session-Id`.

This is not authentication. A non-browser client that can reach the port can call the tools.

### 4.3 Tools

| Tool | Input | Behavior |
| --- | --- | --- |
| `analyze_threshold_event` | `scenarioId` | `processScenario(..., "mcp")`, then text + embedded card |
| `dispatch_firetv_multimodal_hud` | `scenarioId` | Ensures an incident, publishes `hud.dispatched`, returns status text + card |
| `execute_alexa_threshold_intervention` | `scenarioId`, `actionId` | Looks up the action, reopens a resolved incident if needed, logs the action, returns the spoken response and card |
| `sync_bee_ambient_context` | `scenarioId` | Returns the Bee fact JSON, live or fixture |
| `resolve_care_incident` | `scenarioId`, `note?` | Closes the incident and writes the timeline |

All tools are registered with the MCP SDK’s `registerTool`, including JSON Schema input
shapes and annotations. `sync_bee_ambient_context` is marked read-only; the others are
marked non-destructive but mutating.

### 4.4 Resources

| URI | Shape |
| --- | --- |
| `care://timeline` | Array of timeline entries |
| `care://scenarios` | Three scenario summaries with actions and D-pad keys |
| `care://household` | Fictional members, preferences, device ids, and a notice |

### 4.5 Card envelope

The card is an `AlexaMcpAppCard` with:

```text
type, version, scenarioId, severity, title, subtitle,
spokenAlexaPrompt, beeContextFact, evidence[], captions[],
fireTvHudActions[{ id, label, dpadKey, alexaCommand, spokenResponse, outcome }]
```

`buildAlexaMcpCardPayload()` returns:

1. a `text` content block with severity, title, subtitle, and spoken prompt;
2. an embedded `resource` block at `care://interventions/scn-0x` with media type
   `application/vnd.alexa.mcp.card+json`;
3. a `structuredContent.card` field.

The media type and card schema are local demo conventions, not an official Alexa+ schema.

---

## 5. HTTP API

| Route | Notes |
| --- | --- |
| `GET /api/health` | `ok`, service, version, time, capabilities |
| `GET /api/state` | Incidents sorted newest first, timeline, capabilities, server time |
| `GET /api/timeline` | `{ timeline }` |
| `GET /api/scenarios` | Full scenario definitions |
| `POST /api/demo/trigger/:id` | 403 if `DEMO_MODE=false`; 404 for unknown id |
| `POST /api/demo/reset` | 403 if disabled; clears incidents, in-flight map, timeline |
| `POST /api/ring/webhook` | HMAC-verified; `401` invalid, `422` malformed, `202` accepted |
| `GET /api/events` | SSE: `hello` snapshot, then bus events; 15 s keepalive |

Security headers on every response: `X-Content-Type-Options: nosniff`,
`Referrer-Policy: no-referrer`, `X-Frame-Options: SAMEORIGIN`. JSON bodies are limited to
256 kB. `/api` uses permissive CORS for local development.

---

## 6. State model

```ts
incidents: Map<ScenarioId, CareIncident>   // one incident per scenario
inFlight: Map<ScenarioId, Promise<...>>    // de-duplicates concurrent triggers
timeline: TimelineEntry[]                  // max 120, in memory
mcpSessions: Map<string, Transport>        // live MCP sessions
```

Important consequences:

- There is **no persistence**. Restarting the server clears incidents, timeline, and MCP
  sessions.
- There is **one incident per scenario id**. Re-running a scenario replaces its incident and
  appends new timeline entries.
- `executeIntervention` on a resolved incident reopens it in the map and logs the action; it
  does not publish a new `incident.created` event.
- `resolveIncident` is idempotent for an already-resolved incident.
- `resetDemo` clears incidents, in-flight work, and the timeline. It does not clear MCP
  sessions or close SSE connections.
- Timeline is append-only until the 120-entry cap or a reset. It is not an immutable audit
  log and does not record the MCP session id.

---

## 7. Reasoning and fallback layers

### 7.1 Bee

`fetchBeeAmbientContext(scenarioId)`:

1. Builds a fixture from `SCENARIOS[scenarioId].beeFact`.
2. If `BEE_PROXY_URL` is unset, returns the fixture immediately.
3. Otherwise fetches `${BEE_PROXY_URL}?scenario=SCN-0x` with `AbortSignal.timeout(400)`.
4. Accepts either a top-level fact or `facts[0]`, requiring a non-empty
   `extractedCommitment`.
5. Returns source `bee_cli_live_proxy` on success, otherwise the fixture.

### 7.2 Bedrock Nova

`runBedrockStrandsThresholdAgent(scenarioId)`:

1. Fetches Bee memory.
2. If `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are both set, calls
   `BedrockRuntimeClient.InvokeModelCommand` with `BEDROCK_MODEL_ID` (default
   `amazon.nova-pro-v1:0`) in `AWS_REGION` (default `us-east-1`).
3. The prompt asks for one spoken intervention of at most 55 words, using the scenario and
   Bee commitment.
4. The command has a 7-second abort timeout. A returned sentence is trimmed and capped at
   420 characters.
5. On missing text or any error, the scenario’s recorded `spokenAlexaPrompt` is used and the
   mode is `deterministic_recorded_trace`.
6. The card structure, actions, evidence, and captions are always deterministic. Only the
   spoken sentence changes in live mode.
7. `latencyMs` measures the whole local function, including the Bee lookup, not just the
   Bedrock round trip.

There is **no Strands SDK dependency**. The function name is historical; the implementation is
a small explicit pipeline.

### 7.3 WHEP

`negotiateWhep(deviceId)`:

- With `RING_OAUTH_TOKEN`, calls `negotiateRingWhepSession` with a 6 s timeout. On error it
  falls through.
- Without a token, or after a live failure, returns the deterministic loopback SDP answer.
- The incident records `mode`, `sessionId`, and `endpoint`. No media is connected and no
  frames are sent to the server.

---

## 8. Client architecture

`src/client/lib/useHearthGuard.ts` is the single controller.

**Boot**

1. `GET /api/state`.
2. MCP `initialize` with protocol `2025-11-25` and client name `hearthguard-firetv-sim`.
3. Store `Mcp-Session-Id`; send `notifications/initialized`.
4. `tools/list` and log it to the wire.

**Live updates**

`EventSource("/api/events")` receives the `hello` snapshot and subsequent events. If SSE
fails, the client polls `/api/state` every 4 s until SSE reconnects.

**User actions**

- Scenario button → `POST /api/demo/trigger/:id`.
- Action → MCP `tools/call` `execute_alexa_threshold_intervention`.
- Close/resolve → MCP `tools/call` `resolve_care_incident`.
- Reset → `POST /api/demo/reset`.

**Auto-run**

After boot, unless `?empty=1`, the client waits 850 ms and runs `SCN-01`, `SCN-02`, or
`SCN-03` from `?scenario=`. A ref guards against double runs in React strict mode.

**Surfaces**

- `App.tsx` renders the studio.
- `FireTvPage.tsx` renders the TV surface.
- `TvStage.tsx` owns the TV chrome, simulated film, HUD entrance, and compact/full HUD
  switch.
- `useTvNavigation` owns roving focus, number shortcuts, Enter, and Back.

The client never imports server runtime code. It imports the `SCENARIOS` object from
`src/server/scenarios.ts` as a type-safe shared fixture; that module has no Node imports.

---

## 9. Security boundaries

See [SECURITY.md](SECURITY.md) for the full model. The short version:

- Ingress is protected by HMAC only on `/api/ring/webhook`.
- `/mcp` is local-origin-filtered but unauthenticated.
- `/api` has no auth and permissive CORS.
- There is no TLS, rate limiting, tenancy, or persistent audit trail.
- The demo is intended for localhost.

---

## 10. Failure modes

| Failure | Behavior |
| --- | --- |
| Bedrock credentials missing | Recorded spoken response; UI chip says `Nova replay` |
| Bedrock call fails/timeouts | Silent fallback to recorded response |
| Bee proxy missing/timeouts | Fixture fact; UI says `Bee fixture` |
| WHEP token missing | Loopback SDP; UI says `WHEP simulator` |
| WHEP live call fails | Loopback SDP |
| MCP session lost/restart | Client logs handshake failure; replay still works, actions report that the session is starting |
| SSE disconnected | UI shows `Polling`; state polls every 4 s |
| Unknown scenario/action | REST `404` or MCP tool error |
| Resolve with no incident | MCP tool error; UI does not call it without an active incident |
| `DEMO_MODE=false` | Replay/reset routes return `403`; webhook and MCP remain available |

---

## 11. Build and deployment shape

- `npm run build` runs `tsc --noEmit` then `vite build` to `dist/`.
- `npm start` runs `tsx src/server/index.ts`, listens on `PORT` (default 4000), and serves
  `dist/` for non-API GET routes.
- No container, IaC, or cloud deployment manifest is included.
- The server handles `SIGINT`/`SIGTERM` with a 4 s forced-exit fallback.

For a production deployment you would need at minimum: authentication on `/mcp` and `/api`,
TLS, persistent storage, rate limiting, a real Ring partner contract, an AWS IAM role instead
of static keys, and a privacy review for any camera or health data.
