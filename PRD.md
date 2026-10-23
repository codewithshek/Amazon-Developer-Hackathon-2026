# PRD.md — HearthGuard Product Brief (As Built)

**Working title:** HearthGuard (KinSight)  
**Surface:** Browser-based care console + simulated 10-foot Fire TV surface  
**Build:** Amazon Developer Hackathon 2026 reference implementation  
**Status:** Demo-complete; replay-first by design

---

## 1. The problem

A conventional smart-home alert answers “something happened.” It does not answer:

- Is this person safe *right now*?
- What does the household already know that changes the meaning of this event?
- What is the smallest, calmest action that helps?
- How does a Deaf or hard-of-hearing resident receive the same moment without depending on
  audio?
- How does a caregiver see what was done afterward without digging through five apps?

HearthGuard is a prototype of one coordinated care loop across a threshold sensor, spoken
household memory, a reasoning layer, and the room’s largest screen.

This is not a medical device, an emergency dispatch system, or a replacement for a caregiver.
It is an interaction and integration demonstration.

---

## 2. Who it is for

| Person | Context | What they need |
| --- | --- | --- |
| **Arthur, 78** | Aging in place; occasional sundowning; a real dentist appointment on Thursday | A calm voice that corrects a mistaken belief without alarming him; a caregiver check-in if needed |
| **Elena** | Deaf / hard of hearing; watches TV in the living room | A visual relay at the door, captions, and a way to answer without hearing or using a phone |
| **Maya, caregiver** | Nearby but not always in the room | A clear record of what the house did and what still needs a human |
| **A judge / developer** | Evaluating the integration in a few minutes | A deterministic demo with visible protocol work and an honest boundary between live and simulated |

The names and household details are fictional.

---

## 3. Jobs to be done

1. **When a threshold event fires at an inconvenient hour,** help the resident return to safety
   with the least intrusive intervention.
2. **When a visitor needs an answer,** give a Deaf or hard-of-hearing resident a visual,
   remote-friendly way to respond.
3. **When a time-sensitive delivery arrives,** preserve custody before the window closes and
   tell the resident what to do next.
4. **After the moment,** leave a care note that a human can read.

---

## 4. The three scenarios

### SCN-01 — Night exit

- **Time:** 02:15 AM
- **Signal:** Ring-style motion at the front threshold; a person and keys are detected.
- **Memory:** Bee captured Arthur saying his dentist is “at seven in the morning.” The calendar
  says Thursday at 2:00 PM.
- **Care card:** “Arthur is at the door, holding his keys.”
- **Actions:** calm redirect with path lights; caregiver two-way check-in; latch the door and
  log the night.
- **Success:** Arthur is redirected without an alarm; the episode is written to the timeline.

### SCN-02 — Visual relay

- **Time:** 09:20 AM
- **Signal:** Doorbell; a courier with a signature tablet and an optical-lab parcel.
- **Memory:** Elena pre-authorized Lockbox 2 and a visual signature relay.
- **Care card:** “A courier is at the door. Elena can see every word.”
- **Actions:** unlock Lockbox 2 and speak; ask the courier to wait 60 seconds; pin live
  captions.
- **Success:** Elena completes the delivery from the couch without audio or a phone.

### SCN-03 — Cold chain

- **Time:** 11:05 AM
- **Signal:** Package on the porch in direct sun; porch sensor reads 34°C.
- **Memory:** The clinic’s instruction: refrigerate the glargine within 20 minutes.
- **Care card:** “The insulin is on the porch. The sun is on the insulin.”
- **Actions:** chill Lockbox 2 and start a 10-minute timer; ask trusted neighbour Sarah; pause
  the TV, light the porch, open the lockbox.
- **Success:** The parcel is moved into a 4°C lockbox or collected before the window closes.

All three scenarios share the same interaction grammar: evidence → memory → reasoned card →
three actions → spoken outcome → care note.

---

## 5. Functional requirements

Status legend: **Implemented** = code and test/manual evidence exist; **Simulated** =
implemented as a browser/deterministic stand-in; **Unverified** = code path exists but was not
validated against live partner access.

| ID | Requirement | Acceptance criteria | Status / evidence |
| --- | --- | --- | --- |
| **FR-01** | Ring-style HMAC ingestion | `POST /api/ring/webhook` verifies `X-Ring-Signature` over `<timestamp>.<raw body>` in constant time, rejects skew over 300 s, returns 401 on failure and 202 on success | Implemented; bridge + webhook tests |
| **FR-02** | WHEP negotiation | `negotiateRingWhepSession` sends an SDP offer with bearer auth, parses `200/201` + `Location`, and returns a deterministic loopback without a token | Implemented; live partner path **Unverified** |
| **FR-03** | Three deterministic scenarios | All three scenarios are defined in one shared object, render in the studio, and can be triggered from UI/API/MCP | Implemented; agent tests + E2E |
| **FR-04** | MCP `2025-11-25` Streamable HTTP | `/mcp` supports POST/GET/DELETE with `Mcp-Session-Id`, JSON responses, and local-origin CORS | Implemented; MCP tests |
| **FR-05** | Five MCP tools | `analyze_threshold_event`, `dispatch_firetv_multimodal_hud`, `execute_alexa_threshold_intervention`, `sync_bee_ambient_context`, `resolve_care_incident` are listed and callable | Implemented; MCP tests |
| **FR-06** | Card payload | Every analysis returns text plus an embedded resource with the card and three actions | Implemented; MCP + bridge tests |
| **FR-07** | Bedrock Nova optional | With AWS credentials, `InvokeModelCommand` calls Nova for the spoken sentence; without them, a recorded sentence is used and labelled | Implemented; live path **Unverified** |
| **FR-08** | Bee memory optional | A configured proxy is queried with a short timeout; otherwise a recorded fixture is used and labelled | Implemented; fixture test; live proxy unverified |
| **FR-09** | TV stage + audio ducking | The TV stage dims/pauses its simulated film when a card arrives; generated room tone ramps down and the UI reports 20% | Simulated media; WebAudio ducking implemented; no automated audio test |
| **FR-10** | 10-foot HUD + D-pad | Full HUD is keyboard-operable with arrows, Enter, 1–3, Escape/Backspace; focus is visible and auto-focused after 320 ms | Implemented; E2E tests |
| **FR-11** | Deaf/HoH relay | SCN-02 pins a visual card, rotates captions, and offers a Lockbox/caption action set without audio dependence | Simulated; UI/manual + E2E card flow |
| **FR-12** | Fire TV mode | `?mode=firetv` renders a full-viewport TV surface; `?scenario=` selects a card; `S` toggles sound; `F` toggles fullscreen | Implemented; browser simulation, no Vega package |

### Non-functional requirements

| Area | Target | Reality |
| --- | --- | --- |
| Boot | One command after install | `npm run dev` |
| Offline demo | No credentials required | Yes, replay-first |
| Determinism | Same scenario → same card/actions | Yes; only live Nova changes the spoken sentence |
| Type safety | Strict TypeScript, no emit | `tsc --noEmit` passes |
| Accessibility | Keyboard-complete, visible focus, AA text contrast | Implemented for core flows; no formal audit |
| Privacy | No camera frames to the server; no persistent store | True by construction; state is in memory |
| Performance | No stated FPS target | Not profiled; no claim made |

---

## 6. Non-goals

- Diagnosing dementia, deafness, or any medical condition.
- Replacing a caregiver, emergency service, or clinician.
- Controlling real locks, lights, garage doors, or medication storage.
- Registering an Alexa+ skill or shipping a Fire TV/Vega OS app.
- Receiving, recording, or storing real camera or microphone data.
- Multi-tenant accounts, roles, billing, or production authentication.
- A claim of official Ring or Amazon certification.

---

## 7. Experience requirements

1. **Calm at rest.** The quiet state should feel like a house, not an empty dashboard.
2. **One clear card.** The active care card is the brightest, most legible object on the TV.
3. **Three choices, never a menu tree.** The remote user gets three labeled actions and
   numeric shortcuts.
4. **The console explains.** Every card shows evidence, memory, and the spoken line; the wire
   and timeline show what the system did.
5. **No dead ends.** If Bedrock, Bee, WHEP, or SSE is unavailable, the demo still completes.
6. **Honest provenance.** The UI always says which integrations are live, replay, fixture, or
   simulator.

---

## 8. Success criteria for the demo

A first-time viewer can, within three minutes:

1. explain the care loop in one sentence;
2. run one scenario and see the card arrive;
3. execute an action and see the spoken outcome;
4. resolve the incident and see the care note;
5. open the Fire TV surface and operate it with arrow keys + Enter;
6. state which parts are live and which are simulated without being misled.

Technical gates: `npm test`, `npm run build`, and `npm run test:e2e` pass.

---

## 9. Ethical and privacy boundaries

- The household is fictional. No real person’s health data is used.
- The camera view is procedural canvas art. No frames are captured, uploaded, or stored.
- The server keeps incidents and timeline entries in memory only; restart clears them.
- The demo does not make clinical recommendations. “Insulin” is a scenario prop, not advice.
- A production version would need consent, retention limits, access control, audit
  persistence, and a review with the people whose care is being supported.
- The interface avoids sirens, red flashing, and surveillance-style grids. The goal is to
  reduce panic, not amplify it.

---

## 10. Open questions

These are intentionally unresolved for a hackathon prototype:

- What is the correct escalation when the resident refuses the calm redirect?
- Who owns the care note, and for how long should it be retained?
- How should a Deaf resident customize the visual relay for their own language preferences?
- What happens when the network is down and the TV cannot receive the card?
- How should a caregiver override an autonomous action, and how is that consent recorded?
- Which Ring/Alexa+ partner contracts are required for a real deployment?

The current build demonstrates the interaction; it does not pretend to answer these.
