# SUBMISSION_AND_FRICTION_LOG.md — Official Submission Kit & Friction Log

This document aligns the HearthGuard project with the official **Build, Ship, Shape: Amazon Developer Hackathon 2026** judging criteria and rules.

---

## 1. Track Selection Matrix & Strategy

| Track / Challenge | Status | Rationale & Code Proof |
| :--- | :---: | :--- |
| **Primary Track: Alexa+** | **SELECTED** | **Strongest, 100% compliant track.** Implements a self-hosted Model Context Protocol (MCP) server over Streamable HTTP (`POST /mcp`, `GET /mcp`, `DELETE /mcp`) on spec `2025-11-25` using `@modelcontextprotocol/sdk`. Exposes 5 tools and 3 resources driving the complete care workflow. The official rules explicitly permit a self-hosted MCP server with a simulated client experience. |
| **Mini-Challenge 1: Open Source** | **SELECTED** | Submits `packages/ring-alexa-mcp-bridge` as a standalone, dependency-free MIT package authored during the hackathon window. Features constant-time HMAC-SHA256 verification and RFC 8829 WHEP negotiation. |
| **Mini-Challenge 2: AWS Builder** | **SELECTED** | Integrates `@aws-sdk/client-bedrock-runtime` (`InvokeModelCommand` targeting `amazon.nova-pro-v1:0`) in `src/server/bedrockStrandsAgent.ts` with offline deterministic replay traces. |
| **Fire TV Track** | *Supporting Component* | **Do NOT claim as primary.** The interface is a browser-based companion simulation, not a packaged Fire OS APK or Vega OS binary. Demonstrates 10-foot spatial UX, D-pad navigation, and WebAudio ducking (100% $\to$ 20%). |
| **Ring Track** | *Supporting Component* | **Do NOT claim as primary.** Webhook signature verification and WHEP loopback are implemented, but live partner access is unverified without enterprise credentials. |
| **Bee Track** | *Supporting Component* | **Do NOT claim as primary.** Uses fixture fallbacks rather than a physical Bee device or Apple Watch runtime. |

---

## 2. Devpost Copy-Paste Submission

### Title & Tagline
- **Project Title:** `HearthGuard (KinSight)`
- **Tagline:** `HearthGuard is an MCP-powered care orchestration prototype that turns simulated doorstep and hallway events into calm, confirmable household actions.`

### What It Does
HearthGuard is an MCP-powered care orchestration prototype that transforms household threshold events into contextual recommendations, accessible visual care cards, and auditable incident outcomes.

Instead of treating every event as a generic motion alert, HearthGuard combines simulated camera events with contextual memory and scenario information. Its MCP tools analyze the event, dispatch a companion care card, execute a selected voice intervention, and record the resolution to an auditable timeline.

### How It Works
HearthGuard runs a self-hosted Model Context Protocol server using Streamable HTTP and protocol version `2025-11-25`. The server exposes:
- **5 MCP Tools:** `analyze_threshold_event`, `sync_bee_ambient_context`, `dispatch_firetv_multimodal_hud`, `execute_alexa_threshold_intervention`, and `resolve_care_incident`.
- **3 MCP Resources:** `care://timeline` (bounded in-memory care log), `care://scenarios` (declarative scenarios), and `care://household` (fictional resident metadata).

A React 19 interface demonstrates the workflow through a household care console and a large-screen companion view (`?mode=firetv`). Users review recommendations, select an action using keyboard remote controls (`ArrowUp/Down`, `Enter`, `1–3`), and inspect the resulting care timeline.

The prototype includes three reproducible scenarios:
1. **Primary: SCN-01 (02:15 AM — Nighttime exit concern):** Resident Arthur (78, memory loss) approaches the front door with keys. HearthGuard cross-references spoken memory with the calendar, catches the contradiction, and offers a gentle hallway voice redirect via Alexa+.
2. **Secondary: SCN-02 (09:20 AM — Deaf/Hard-of-Hearing courier relay):** Elena cannot hear the chime; the screen ducks room audio, highlights captions, and enables 1-touch D-pad dispatch of the lockbox code to Alexa+ at the door.
3. **Supporting: SCN-03 (11:05 AM — Delivery temperature reminder):** Household reminder for a parcel sitting in direct sun on a 34°C porch.

### What Is Implemented vs. Simulated
- **Real Runtime Code:** MCP `2025-11-25` Streamable HTTP server, timing-safe HMAC-SHA256 signature verification (`crypto.timingSafeEqual`), RFC 8829 WHEP negotiation logic, 10-foot D-pad keyboard navigation, WebAudio room-tone ducking (100% $\to$ 20%), and `care://timeline` logging.
- **Simulated / Replay:** Fictional residents (Arthur, Elena), procedural Canvas camera feeds, and deterministic offline Bedrock/Bee fixtures for reliable zero-credential judging.

---

## 3. Demo Video Storyboard (2 Minutes 40 Seconds)

| Time | Segment | What to Show on Screen | What to Say Aloud |
| :--- | :--- | :--- | :--- |
| **0:00–0:20** | **The Problem Hook** | Open `?empty=1`. Point to clean 3-pane console. | *"A household camera can tell you someone is at the door, but it cannot tell you what your household should do next. HearthGuard uses the Model Context Protocol (MCP) to turn raw threshold events into calm, actionable care workflows."* |
| **0:20–1:05** | **Scenario 1: Nighttime Exit Concern** | Click `SCN-01 (02:15 AM)`. Show camera, Bee memory quote, and calendar contradiction. Click `Calm redirect`. Click `Acknowledge & Close`. | *"At 2:15 AM, Arthur walks toward the front door holding car keys. HearthGuard recalls his spoken memory about an early dentist appointment and compares it with his calendar. Seeing the contradiction, AWS Bedrock reasons that Arthur is confused. Over Alexa+ MCP, it plays a gentle hallway redirect and records the care resolution."* |
| **1:05–1:30** | **Scenario 2: Accessibility & 10-Foot View** | Switch to `?mode=firetv&scenario=SCN-02`. Press `ArrowDown`, press `1`, press `Escape`. | *"For resident Elena, who is deaf, a courier at the door automatically ducks television audio and pins high-contrast visual action cards to the screen. Elena uses her remote D-pad to instruct Alexa to speak the lockbox code at the door."* |
| **1:30–2:05** | **Live MCP Protocol Proof** | Scroll to MCP Wire Inspector in studio. Show `Mcp-Session-Id`, `tools/call`, and `care://timeline`. | *"Under the hood, this is powered by a real MCP server on spec 2025-11-25 over Streamable HTTP. Every card interaction executes a real `tools/call` and updates our auditable care timeline."* |
| **2:05–2:40** | **Impact, Honesty & Close** | Point to `SIMULATED EVENT` badge and top status chips. | *"HearthGuard is an open-source, reproducible prototype. The MCP workflow and bridge packages are real runtime code; camera feeds and offline context use deterministic fixtures for judging reliability. Thank you!"* |

---

## 4. Friction Log Entries (+10% Judging Score Bonus)

### Friction 1 — Alexa+ visual card schema is not a public MCP primitive
- **Task attempted:** Return a rich care card with title, severity, evidence tags, and three remote actions from an MCP tool call.
- **What was done:** Registered the tool with `@modelcontextprotocol/sdk` and emitted both human-readable text and an embedded resource with custom media type `application/vnd.alexa.mcp.card+json`.
- **Expected vs. actual:** MCP defines text/resources but no standardized card schema.
- **Severity:** Medium.
- **Workaround:** `buildAlexaMcpCardPayload()` emits both markdown text and the structured card resource.
- **Actionable suggestion:** Publish versioned card and action envelope schemas in the MCP ecosystem.

### Friction 2 — Ring WHEP cannot be validated without enterprise partner access
- **Task attempted:** Exercise real WHEP offer/answer negotiation against `api.amazonvision.com`.
- **What was done:** Implemented `negotiateRingWhepSession` with bearer authentication and an injectable `fetchImpl`.
- **Expected vs. actual:** No partner token is publicly available for solo hackathon developers.
- **Severity:** High for live Ring submission; none for offline demo.
- **Workaround:** Built a deterministic loopback SDP answer and labeled the mode `WHEP · SIMULATED`.
- **Actionable suggestion:** Provide public developer sandbox credentials and mock camera feeds.

### Friction 3 — Fire TV Enter-key double-activation in web runtime
- **Task attempted:** Build a 10-foot HUD with D-pad navigation and remote number shortcuts.
- **What was done:** Created a roving-focus hook with delayed auto-focus (320 ms) and key trapping.
- **Expected vs. actual:** Synthetic D-pad Enter events collided with native button activation, causing double triggers.
- **Severity:** Medium.
- **Workaround:** Suppressed synthetic activation when native controls already held focus.
- **Actionable suggestion:** Provide an official `@amazon-devices/spatial-focus` library for React/Vite.

### Friction 4 — No offline Bedrock emulator in AWS SDK
- **Task attempted:** Test agent reasoning loops without incurring cloud spend or credential requirements in CI.
- **What was done:** Wrapped `InvokeModelCommand` with a 7-second abort timeout and graceful fallback to recorded reasoning traces.
- **Expected vs. actual:** AWS SDK requires live network calls and credentials.
- **Severity:** Medium.
- **Workaround:** Replay fallback engine that keeps card structure deterministic while allowing live Nova text when configured.
- **Actionable suggestion:** Provide a record/replay mock transport in the AWS Bedrock SDK.

### Friction 5 — Browser clients cannot read Mcp-Session-Id without explicit CORS exposure
- **Task attempted:** Establish an MCP Streamable HTTP session from browser `fetch()`.
- **What was done:** Handled `POST /mcp` and issued `Mcp-Session-Id`.
- **Expected vs. actual:** Browsers stripped `Mcp-Session-Id` from response headers because `Access-Control-Expose-Headers` was absent.
- **Severity:** High for web clients.
- **Workaround:** Explicitly exposed `Access-Control-Expose-Headers: Mcp-Session-Id`.
- **Actionable suggestion:** Include the expose header in all official MCP Streamable HTTP documentation examples.
