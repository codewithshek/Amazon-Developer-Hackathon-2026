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

---

## Appendix: Autonomous Anti-Gravity Zero-Touch Reference & Blueprints

# PLAN.md — Complete File-by-File Implementation Plan & Code Blueprints for Anti-Gravity

Follow these 10 atomic tasks in exact order. Every core module's production implementation is specified below so you can write, test, and verify the entire project with zero ambiguity.

## Task 1: Create Root `LICENSE` (MIT) and Open-Source Package `packages/ring-alexa-mcp-bridge/src/index.ts`
Write `packages/ring-alexa-mcp-bridge/src/index.ts` with timing-safe Ring HMAC-SHA256 verification, RFC 8829 WHEP SDP negotiation, and Alexa+ MCP Apps Card builder:

```typescript
import crypto from 'node:crypto';

export interface RingWebhookEvent {
  data: {
    id: string;
    type: 'motion_detected' | 'ding' | 'person_detected';
    attributes: {
      device_id: string;
      timestamp: string;
      classification: 'human' | 'package' | 'vehicle' | 'animal';
      confidence: number;
      zone: string;
      scenario_id?: 'SCN-01' | 'SCN-02' | 'SCN-03';
    };
  };
}

export function computeRingHmacSignature(rawBody: string, secret: string, timestamp: string): string {
  const payload = `${timestamp}.${rawBody}`;
  const hex = crypto.createHmac('sha256', secret).update(payload, 'utf8').digest('hex');
  return `sha256=${hex}`;
}

export function verifyRingWebhookHmac(
  rawBody: string,
  signatureHeader: string | undefined,
  timestampHeader: string | undefined,
  secret: string,
  maxSkewSeconds = 300
): { valid: boolean; reason?: string } {
  if (!signatureHeader || !timestampHeader) {
    return { valid: false, reason: 'Missing X-Ring-Signature or X-Ring-Timestamp header' };
  }
  const ts = Number(timestampHeader);
  if (Number.isNaN(ts) || Math.abs(Math.floor(Date.now() / 1000) - ts) > maxSkewSeconds) {
    return { valid: false, reason: 'Webhook timestamp outside allowable 300s replay window' };
  }
  const expected = computeRingHmacSignature(rawBody, secret, timestampHeader);
  const expectedBuf = Buffer.from(expected, 'utf8');
  const receivedBuf = Buffer.from(signatureHeader, 'utf8');
  if (expectedBuf.length !== receivedBuf.length || !crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
    return { valid: false, reason: 'HMAC-SHA256 digest mismatch' };
  }
  return { valid: true };
}

export interface WhepSessionResult {
  sessionId: string;
  whepEndpoint: string;
  sdpAnswer: string;
  mode: 'live_ava_api' | 'simulator_loopback';
}

export async function negotiateRingWhepSession(
  deviceId: string,
  sdpOffer: string,
  bearerToken?: string
): Promise<WhepSessionResult> {
  const whepEndpoint = `https://api.amazonvision.com/v1/devices/${encodeURIComponent(deviceId)}/media/streaming/whep/sessions`;
  if (bearerToken && bearerToken !== 'SIMULATOR_TOKEN') {
    const res = await fetch(whepEndpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        'Content-Type': 'application/sdp',
      },
      body: sdpOffer,
    });
    if (res.status === 201) {
      const sdpAnswer = await res.text();
      const location = res.headers.get('location') || `${whepEndpoint}/live-session`;
      return { sessionId: location.split('/').pop() || 'live-session', whepEndpoint: location, sdpAnswer, mode: 'live_ava_api' };
    }
  }
  // Deterministic WHEP Simulator Loopback for zero-hardware hackathon judging
  return {
    sessionId: `whep_sim_${deviceId}_${Date.now()}`,
    whepEndpoint,
    sdpAnswer: `v=0\r\no=- ${Date.now()} 2 IN IP4 127.0.0.1\r\ns=RingAVA-WHEP-Sim\r\nt=0 0\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\na=rtpmap:96 H264/90000\r\na=sendonly\r\n`,
    mode: 'simulator_loopback',
  };
}

export interface AlexaMcpAppCard {
  type: 'AlexaMcpAppCard';
  version: '2025-11-25';
  scenarioId: string;
  severity: 'CRITICAL_CARE' | 'ACCESSIBILITY_RELAY' | 'COLD_CHAIN_CUSTODY';
  title: string;
  subtitle: string;
  spokenAlexaPrompt: string;
  beeContextFact: string;
  fireTvHudActions: Array<{
    id: string;
    label: string;
    dpadKey: '1' | '2' | '3';
    alexaCommand: string;
  }>;
}

export function buildAlexaMcpCardPayload(card: AlexaMcpAppCard) {
  return {
    content: [
      {
        type: 'text',
        text: `[${card.severity}] ${card.title}: ${card.subtitle} | Alexa+ Action: "${card.spokenAlexaPrompt}"`,
      },
      {
        type: 'resource',
        resource: {
          uri: `care://interventions/${card.scenarioId.toLowerCase()}`,
          mimeType: 'application/vnd.alexa.mcp.card+json',
          text: JSON.stringify(card, null, 2),
        },
      },
    ],
  };
}
```

## Task 2: Create `src/server/beeContextClient.ts` (Bee Wearable AI Proxy Connector)
Queries `http://127.0.0.1:8787/v1/facts` (`bee proxy` CLI server documented at `docs.bee.computer`) with automatic fallback to realistic spoken memory facts for each scenario:

```typescript
export interface BeeMemoryFact {
  id: string;
  timestamp: string;
  speaker: string;
  transcriptSnippet: string;
  extractedCommitment: string;
  source: 'bee_cli_live_proxy' | 'bee_recorded_session_fixture';
}

const FALLBACK_BEE_FACTS: Record<string, BeeMemoryFact> = {
  'SCN-01': {
    id: 'bee_fact_sundown_01',
    timestamp: '2026-10-22T19:42:10Z',
    speaker: 'Arthur (Resident, 78)',
    transcriptSnippet: 'I need to make sure my car keys are by the door so I do not miss my 7 AM dentist cleaning tomorrow.',
    extractedCommitment: 'Resident believes dentist appointment is early morning; actual appointment is Thursday at 2:00 PM.',
    source: 'bee_recorded_session_fixture',
  },
  'SCN-02': {
    id: 'bee_fact_deaf_relay_02',
    timestamp: '2026-10-23T09:15:00Z',
    speaker: 'Elena (Resident, Deaf/HoH)',
    transcriptSnippet: 'Expecting certified optical lab courier today; authorize smart lockbox #2 drop-off if I am in the living room.',
    extractedCommitment: 'Pre-authorized courier drop-off in Lockbox #2 with digital signature relay.',
    source: 'bee_recorded_session_fixture',
  },
  'SCN-03': {
    id: 'bee_fact_insulin_03',
    timestamp: '2026-10-23T08:05:22Z',
    speaker: 'Dr. Patel Clinic Call (Captured via Bee Wearable)',
    transcriptSnippet: 'Your glargine insulin refill ships via cold-pack courier today; refrigerate within 20 minutes of porch drop-off.',
    extractedCommitment: 'Cold-chain biologic delivery requires immediate indoor transfer or shaded Peltier lockbox activation.',
    source: 'bee_recorded_session_fixture',
  },
};

export async function fetchBeeAmbientContext(scenarioId: string): Promise<BeeMemoryFact> {
  const beeProxyUrl = process.env.BEE_PROXY_URL || 'http://127.0.0.1:8787/v1/facts';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 350);
    const res = await fetch(`${beeProxyUrl}?scenario=${encodeURIComponent(scenarioId)}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (res.ok) {
      const data = await res.json();
      if (data && data.extractedCommitment) {
        return { ...data, source: 'bee_cli_live_proxy' };
      }
    }
  } catch {
    // Graceful fallback when local `bee proxy` daemon is not running on judge machine
  }
  return FALLBACK_BEE_FACTS[scenarioId] || FALLBACK_BEE_FACTS['SCN-01'];
}
```

## Task 3: Create `src/server/bedrockStrandsAgent.ts` (AWS Bedrock Nova Pro + Strands Agent Loop)
Imports `@aws-sdk/client-bedrock-runtime` (`BedrockRuntimeClient`, `InvokeModelCommand` calling `amazon.nova-pro-v1:0`) and fuses Ring WHEP visual telemetry + Bee wearable memory into a structured `AlexaMcpAppCard`:

```typescript
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { AlexaMcpAppCard } from '../../packages/ring-alexa-mcp-bridge/src/index.js';
import { fetchBeeAmbientContext, BeeMemoryFact } from './beeContextClient.js';

export interface StrandsAgentExecutionTrace {
  scenarioId: 'SCN-01' | 'SCN-02' | 'SCN-03';
  modelId: string;
  inferenceMode: 'aws_bedrock_live' | 'deterministic_recorded_trace';
  latencyMs: number;
  beeMemory: BeeMemoryFact;
  card: AlexaMcpAppCard;
  steps: string[];
}

const DETERMINISTIC_CARDS: Record<'SCN-01' | 'SCN-02' | 'SCN-03', Omit<AlexaMcpAppCard, 'beeContextFact'>> = {
  'SCN-01': {
    type: 'AlexaMcpAppCard',
    version: '2025-11-25',
    scenarioId: 'SCN-01',
    severity: 'CRITICAL_CARE',
    title: '2:15 AM Sundowning Exit Alert — Front Threshold',
    subtitle: 'Arthur (78) detected walking toward front exit in sleepwear holding car keys.',
    spokenAlexaPrompt: 'Hi Dad, it is 2:15 in the morning. Your dentist appointment with Dr. Lin is on Thursday afternoon, so you have plenty of time to rest. Let us head back to the living room.',
    fireTvHudActions: [
      {
        id: 'act_calm_redirect',
        label: 'Alexa+ Hallway Calming Redirect',
        dpadKey: '1',
        alexaCommand: 'Play reassuring family reminder on Hallway Echo & turn on warm amber path lights',
      },
      {
        id: 'act_two_way_dropin',
        label: 'Open Caregiver PiP Audio Drop-In',
        dpadKey: '2',
        alexaCommand: 'Connect Fire TV microphone to Front Foyer Echo Show',
      },
      {
        id: 'act_lock_deadbolt',
        label: 'Engage Night Latch & Log Care Note',
        dpadKey: '3',
        alexaCommand: 'Verify smart deadbolt locked and log resolved sundowning episode to Care Timeline',
      },
    ],
  },
  'SCN-02': {
    type: 'AlexaMcpAppCard',
    version: '2026-11-25' as any,
    scenarioId: 'SCN-02',
    severity: 'ACCESSIBILITY_RELAY',
    title: 'Deaf / HoH Threshold Concierge — Courier at Front Door',
    subtitle: 'Optical courier holding signature tablet & parcel; spoken audio transcribed visually.',
    spokenAlexaPrompt: 'Hello! The resident has authorized drop-off via Fire TV. Please place the parcel inside Smart Lockbox #2—the door is unlocking now.',
    fireTvHudActions: [
      {
        id: 'act_unlock_lockbox',
        label: 'Unlock Lockbox #2 & Speak via Alexa+',
        dpadKey: '1',
        alexaCommand: 'Unlock Smart Lockbox #2 and announce drop-off instructions on Ring Doorbell speaker',
      },
      {
        id: 'act_request_wait',
        label: 'Ask Courier to Wait 60 Seconds',
        dpadKey: '2',
        alexaCommand: 'Announce at front door: Resident is coming to the door, please wait one moment',
      },
      {
        id: 'act_visual_transcript',
        label: 'Expand Full ASL / Live Caption Banner',
        dpadKey: '3',
        alexaCommand: 'Pin live two-way caption transcript on Fire TV 10-foot screen',
      },
    ],
  },
  'SCN-03': {
    type: 'AlexaMcpAppCard',
    version: '2025-11-25',
    scenarioId: 'SCN-03',
    severity: 'COLD_CHAIN_CUSTODY',
    title: 'Cold-Chain Biologic Alert — Insulin Package in Direct Sun',
    subtitle: 'Thermal cold-pack pharmacy parcel detected on porch steps (34°C surface exposure).',
    spokenAlexaPrompt: 'Attention: Your temperature-sensitive insulin refill was just delivered to the front porch in direct sunlight. Cooling Lockbox #2 has been pre-chilled.',
    fireTvHudActions: [
      {
        id: 'act_chilled_lockbox',
        label: 'Activate Peltier Lockbox & Notify Phone',
        dpadKey: '1',
        alexaCommand: 'Set Porch Lockbox cooler to 4°C and set 10-minute pickup reminder on Alexa+',
      },
      {
        id: 'act_neighbor_assist',
        label: 'Ask Trusted Neighbor (Sarah) via Alexa+',
        dpadKey: '2',
        alexaCommand: 'Send verified one-time porch pickup request to caregiver contact',
      },
      {
        id: 'act_acknowledge_pickup',
        label: 'Picking Up Now (Pause Fire TV)',
        dpadKey: '3',
        alexaCommand: 'Pause Fire TV media playback and turn on porch welcome light',
      },
    ],
  },
};

export async function runBedrockStrandsThresholdAgent(
  scenarioId: 'SCN-01' | 'SCN-02' | 'SCN-03'
): Promise<StrandsAgentExecutionTrace> {
  const start = Date.now();
  const beeMemory = await fetchBeeAmbientContext(scenarioId);
  const baseCard = DETERMINISTIC_CARDS[scenarioId] || DETERMINISTIC_CARDS['SCN-01'];
  const modelId = process.env.BEDROCK_MODEL_ID || 'amazon.nova-pro-v1:0';

  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    try {
      const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });
      const prompt = `Analyze threshold scenario ${scenarioId} with Bee wearable context: "${beeMemory.extractedCommitment}". Return 1-sentence spoken Alexa+ intervention.`;
      const command = new InvokeModelCommand({
        modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          messages: [{ role: 'user', content: [{ text: prompt }] }],
          inferenceConfig: { max_new_tokens: 160, temperature: 0.1 },
        }),
      });
      const response = await client.send(command);
      const decoded = JSON.parse(new TextDecoder().decode(response.body));
      const liveText = decoded?.output?.message?.content?.[0]?.text;
      return {
        scenarioId,
        modelId,
        inferenceMode: 'aws_bedrock_live',
        latencyMs: Date.now() - start,
        beeMemory,
        card: {
          ...baseCard,
          version: '2025-11-25',
          spokenAlexaPrompt: liveText || baseCard.spokenAlexaPrompt,
          beeContextFact: beeMemory.extractedCommitment,
        },
        steps: [
          '1. Ingested HMAC-verified Ring Partner API webhook & negotiated WHEP SDP stream',
          `2. Synced ambient spoken memory from Bee Wearable CLI (${beeMemory.source})`,
          `3. Executed live Amazon Bedrock (${modelId}) Strands Agent multimodal reasoning`,
          '4. Dispatched MCP 2025-11-25 Card & 10-Foot Fire TV PiP HUD overlay',
        ],
      };
    } catch {
      // Fall through cleanly to deterministic replay trace if credentials lack Bedrock model entitlement
    }
  }

  return {
    scenarioId,
    modelId,
    inferenceMode: 'deterministic_recorded_trace',
    latencyMs: Math.max(18, Date.now() - start),
    beeMemory,
    card: {
      ...baseCard,
      version: '2025-11-25',
      beeContextFact: beeMemory.extractedCommitment,
    },
    steps: [
      '1. Ingested HMAC-verified Ring Partner API webhook & negotiated WHEP SDP stream',
      `2. Synced ambient spoken memory from Bee Wearable CLI (${beeMemory.source})`,
      `3. Executed AWS Strands Agent reasoning with Amazon Bedrock (${modelId} replay trace)`,
      '4. Dispatched MCP 2025-11-25 Card & 10-Foot Fire TV PiP HUD overlay',
    ],
  };
}
```

## Task 4: Create `src/server/mcpStreamableServer.ts` (Alexa+ MCP `2025-11-25` Streamable HTTP Server)
Implements `POST /mcp`, `GET /mcp`, and `DELETE /mcp` with `Mcp-Session-Id` header management, `Access-Control-Expose-Headers: Mcp-Session-Id`, `POST /api/ring/webhook`, and `GET /api/events` SSE real-time device sync.

## Task 5–10: Build the 3-Pane Client (`src/client/App.tsx`), Run Tests (`TEST.md`), and Populate `RESULTS.md`
Follow the exact test suites in `TEST.md` and verify zero errors before completion.
