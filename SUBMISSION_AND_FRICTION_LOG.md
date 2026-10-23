# SUBMISSION_AND_FRICTION_LOG.md — Submission Copy and Observed Friction

This file is a working submission kit, not a claim that any particular prize, track, or bonus
has been awarded. The friction entries describe what was actually encountered while building
this repository. They are not official Amazon partner feedback.

---

## 1. Submission copy

**Project title:** HearthGuard (KinSight)  
**Tagline:** A cross-device care concierge that turns a threshold event into a calm, accessible
next step on the largest screen in the room.

**Short description:**

> HearthGuard connects a Ring-style threshold event, spoken household memory, an Alexa+ MCP
> server, AWS Bedrock Nova, and a 10-foot Fire TV care card. It is built for the moments when a
> normal alert is too late: a parent at the door at 2:15 AM, a courier at the door of a Deaf
> resident, or medication sitting in the sun. The demo is replay-first: the protocol work is
> real, the household and camera frames are fictional, and the UI says so.

**Built with:**

- Alexa+ MCP `2025-11-25` Streamable HTTP via `@modelcontextprotocol/sdk`
- Ring-style HMAC-SHA256 webhook verification and WHEP SDP negotiation
- AWS Bedrock Nova (`amazon.nova-pro-v1:0`) with a recorded fallback
- Bee-compatible spoken-memory proxy with a fixture fallback
- React 19 + Vite 8 + TypeScript 7
- GSAP, WebAudio, Canvas 2D
- Vitest + Playwright

**Track fit:**

- **Alexa+ / MCP:** the local MCP server is the action surface; five tools and three resources
  are exposed over Streamable HTTP.
- **Ring:** signed ingestion and a WHEP negotiation helper are first-class, with a clear
  partner-token boundary.
- **Fire TV:** a browser-simulated 10-foot HUD with D-pad, numeric shortcuts, captions, and
  audio ducking.
- **AWS:** an optional Nova path, with the replay fallback visible in the UI.
- **Open source:** `packages/ring-alexa-mcp-bridge` is a standalone MIT package with tests.

No claim is made that this build is an official Amazon, Ring, Alexa+, or Fire TV integration.

---

## 2. Demo script (about 3 minutes)

| Time | Beat |
| --- | --- |
| 0:00 | Open the studio at `?empty=1`. “Ring sees. Bee remembers. Nova reasons. Alexa+ speaks. Fire TV answers.” |
| 0:20 | Run SCN-01. The threshold pane, reading pane, and living-room TV update together. |
| 0:45 | Point at the Bee quote and the calendar contradiction. Explain that this is why the card is a calm redirect, not an alarm. |
| 1:05 | Execute “Calm redirect.” Show the Alexa+ line, outcome, wire entry, timeline entry. |
| 1:25 | Close the card. The care note is written; the house returns to quiet. |
| 1:40 | Open Fire TV mode for SCN-02. Show the TV dim, the visual relay, captions, and Lockbox 2. |
| 2:05 | Press `ArrowDown`, then `Enter`. Show the result. Press `Escape`. |
| 2:20 | Switch to SCN-03. Press `3` for the immediate pickup action. |
| 2:35 | Open “What is simulated.” State the boundary: WHEP is loopback without a token, Bedrock is replay without credentials, Bee is a fixture, Fire TV is a browser simulation. |
| 2:50 | Close on the one-command boot and the test results. |

Backup if the network is unavailable: the entire demo is local and replay-first. No network
call is required.

---

## 3. Friction log

These entries record implementation friction, not formal partner escalations. Each includes
the workaround that is actually in the repository.

### Friction 1 — Alexa+ visual card schema is not a public MCP primitive

- **Task attempted:** Return a rich care card with title, severity, evidence, captions, and
  three remote actions from an MCP tool call.
- **What was done:** Used the official MCP SDK `registerTool` and returned a text block plus an
  embedded resource.
- **Expected vs. actual:** The public MCP specification defines text/resource content and
  structured output; it does not define an Alexa+ visual card schema with action semantics.
  This build defines its own `AlexaMcpAppCard` shape and a demo media type,
  `application/vnd.alexa.mcp.card+json`.
- **Severity:** Medium for integration; low for this demo.
- **Workaround:** `buildAlexaMcpCardPayload()` emits both human-readable text and the embedded
  card resource, so a generic MCP client still gets a usable response.
- **Suggestion:** Publish versioned card/action types and a local preview tool for Alexa+ MCP
  surfaces so builders do not have to invent an envelope.

### Friction 2 — Ring WHEP cannot be validated without partner access

- **Task attempted:** Exercise a real WHEP offer/answer exchange against
  `api.amazonvision.com`.
- **What was done:** Implemented `negotiateRingWhepSession` with bearer auth, `200/201`
  handling, `Location` parsing, timeout, and an injectable `fetchImpl` for tests.
- **Expected vs. actual:** No partner token was available in this environment, so the live
  exchange could not be verified. The demo uses a deterministic loopback SDP answer and labels
  the mode `WHEP · SIMULATED`.
- **Severity:** High for a live Ring submission; none for the offline demo.
- **Workaround:** Token-gated live path plus loopback; the UI never presents loopback as live.
- **Suggestion:** Provide a sandbox device/token and a documented replay fixture so builders
  can validate SDP negotiation before partner onboarding.

### Friction 3 — Fire TV focus and overlay behavior in a browser simulation

- **Task attempted:** Build a 10-foot HUD with D-pad navigation, numeric shortcuts, and a Back
  action over a playing surface.
- **What was done:** Built a roving-focus hook, auto-focused the first action after 320 ms,
  trapped arrow keys in the HUD on the TV surface, and handled Escape/Backspace.
- **Expected vs. actual:** A global Enter handler initially hijacked activation when a native
  button already had focus, causing double activation. Rapid focus changes during the HUD
  entrance also needed a guard so the card did not steal focus from a control the viewer had
  already reached.
- **Severity:** Medium.
- **Workaround:** Enter returns early for native controls; auto-focus checks whether focus is
  already outside the HUD; arrows wrap through exactly three actions.
- **Suggestion:** A small, documented TV focus-boundary component would save every web-based
  TV builder from reimplementing this.

### Friction 4 — No offline Bedrock emulator; replay fallback must be explicit

- **Task attempted:** Develop and test the threshold agent without spending cloud credits or
  requiring model access on every run.
- **What was done:** Wrapped `InvokeModelCommand` behind a credential check, added a 7 s abort
  timeout, and fall back to the scenario’s recorded spoken sentence on any failure.
- **Expected vs. actual:** There is no bundled local emulator for Nova in this stack. A
  deterministic fallback is necessary for CI and for judges without AWS credentials.
- **Severity:** Low–medium.
- **Workaround:** The card structure is always deterministic; only the spoken sentence changes
  in live mode. The masthead chip says `Nova live` or `Nova replay`.
- **Suggestion:** A record/replay transport option in the AWS SDK would make agent tests
  portable and cheap.

### Friction 5 — Browser clients need `Mcp-Session-Id` exposed

- **Task attempted:** Initialize an MCP Streamable HTTP session from browser `fetch()` and read
  the session id from the response.
- **What was done:** Added `Access-Control-Expose-Headers: Mcp-Session-Id` on `/mcp`, plus
  allowed headers for `MCP-Protocol-Version`, `Last-Event-ID`, and `Mcp-Session-Id`.
- **Expected vs. actual:** Without the expose header, browser JavaScript cannot read
  `Mcp-Session-Id`, so the next request cannot continue the session. This is easy to miss when
  testing with curl only.
- **Severity:** High for browser-based MCP clients.
- **Workaround:** Explicit CORS exposure; tested by the MCP initialization test.
- **Suggestion:** Put the expose header in every Streamable HTTP browser example and starter.

---

## 4. What this submission does not claim

- No live Ring partner validation.
- No live Bedrock benchmark or model-quality claim.
- No physical Fire TV, Vega OS, or remote-control testing.
- No Alexa+ cloud registration or physical Echo invocation.
- No FPS, latency, or WCAG AAA certification.
- No claim that the local MCP server is authenticated or production-ready.

The honest boundary is also visible in the app’s **What is simulated** footer and in
[SECURITY.md](SECURITY.md).

---

## 5. Suggested Devpost fields

**Inspiration:** Caregivers do not need another alert; they need the next safe step. The three
scenarios came from the gap between what a sensor sees and what a household already knows.

**What it does:** Turns a threshold event into a reasoned care card with three remote actions,
spoken Alexa+ confirmation, and a written care note, with a 10-foot surface for the room.

**How we built it:** Express + official MCP SDK + React/Vite, with a standalone MIT bridge for
HMAC/WHEP/card helpers. The demo is replay-first so it runs without credentials.

**Challenges:** Visual card schema, partner-token WHEP validation, TV focus behavior, and
making the replay/live boundary visible rather than hiding it.

**Accomplishments:** A complete three-scenario loop, real MCP Streamable HTTP sessions, a
keyboard-complete TV surface, and a test suite that covers the protocol and the interaction.

**What we learned:** The hard part of care technology is not detection; it is deciding what
*not* to do, and making the system’s uncertainty legible.

**What’s next:** Live partner validation, authenticated MCP, persistent audit storage, and
accessibility research with the people the system is meant to support.
