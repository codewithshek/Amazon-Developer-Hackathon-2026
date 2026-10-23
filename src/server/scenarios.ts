import type { HudAction, ScenarioDefinition, ScenarioId } from "../shared/types";

const action = (
  id: string,
  label: string,
  shortLabel: string,
  dpadKey: HudAction["dpadKey"],
  alexaCommand: string,
  spokenResponse: string,
  outcome: string
): HudAction => ({ id, label, shortLabel, dpadKey, alexaCommand, spokenResponse, outcome });

export const SCENARIOS: Record<ScenarioId, ScenarioDefinition> = {
  "SCN-01": {
    id: "SCN-01",
    number: "01",
    time: "02:15",
    period: "AM",
    timestamp: "2026-10-23T02:15:07.000Z",
    deviceId: "ring_front_door_01",
    zone: "Front threshold · interior",
    eyebrow: "Sundowning · exit risk",
    title: "Arthur is at the door, holding his keys.",
    summary:
      "Ring reports a person at the front threshold at 02:15. A keyring is visible in the detection crop. Bee remembers Arthur saying his dentist was “at seven in the morning” — the calendar says Thursday at 2 PM. HearthGuard answers with a calm voice and a caregiver check-in, not an alarm.",
    intent: "Night exit · gentle redirect",
    camera: "sundown",
    severity: "CRITICAL_CARE",
    resident: "Arthur · 78",
    beeFact: {
      speaker: "Arthur, at dinner",
      quote: "“I need my keys by the door. My dentist is at seven in the morning.”",
      commitment: "Believes an early dentist visit is tomorrow; the calendar says Thursday, 2:00 PM.",
      capturedAt: "2026-10-22T19:42:10Z"
    },
    evidence: [
      { label: "Motion", value: "02:15:07" },
      { label: "Person", value: "0.98" },
      { label: "Keys", value: "detected" },
      { label: "Bee", value: "dentist belief" }
    ],
    captions: [
      { speaker: "Hallway Echo", text: "Arthur, it's two fifteen in the morning." },
      { speaker: "Ring", text: "Person detected at the interior threshold." }
    ],
    spokenAlexaPrompt:
      "Arthur, it's two fifteen in the morning. Your dentist visit is Thursday afternoon — there is plenty of time. Let's leave the keys by the door and go back to the living room.",
    hudActions: [
      action(
        "calm_redirect",
        "Speak a calm redirect",
        "Calm redirect",
        "1",
        "Play a reassuring family reminder on the hallway Echo and raise the warm path lights.",
        "Arthur, it's two fifteen in the morning. Your dentist visit is Thursday afternoon. There's plenty of time. Let's leave the keys by the door and head back to the living room.",
        "Calming prompt played in the hallway. Path lights raised to 20%."
      ),
      action(
        "caregiver_dropin",
        "Open a caregiver check-in",
        "Caregiver check-in",
        "2",
        "Open a two-way audio check-in between the caregiver and the foyer.",
        "Opening a private check-in with the foyer. Maya is on the line.",
        "Two-way audio opened between the caregiver and the foyer."
      ),
      action(
        "night_latch",
        "Latch the door, log the night",
        "Latch + log",
        "3",
        "Verify the smart deadbolt is latched and write a care note to the timeline.",
        "The night latch is secure. I've written this episode to the care timeline for the morning.",
        "Night latch verified. Episode written to the care timeline."
      )
    ]
  },
  "SCN-02": {
    id: "SCN-02",
    number: "02",
    time: "09:20",
    period: "AM",
    timestamp: "2026-10-23T09:20:14.000Z",
    deviceId: "ring_front_door_02",
    zone: "Front door · exterior",
    eyebrow: "Deaf / hard of hearing · visual relay",
    title: "A courier is at the door. Elena can see every word.",
    summary:
      "Ring detects a courier holding a signature tablet. Fire TV does not interrupt the room; it lowers the ambient channel to 20% and pins a high-contrast intent card. Elena answers with three D-pad presses — no phone, no hearing required.",
    intent: "Visual relay · two-way threshold",
    camera: "courier",
    severity: "ACCESSIBILITY_RELAY",
    resident: "Elena · Deaf / HoH",
    beeFact: {
      speaker: "Elena, this morning",
      quote: "“If the optical courier comes while I'm watching TV, Lockbox 2 is fine. I've already signed for it.”",
      commitment: "Pre-authorized courier drop-off in Lockbox 2 with a visual signature relay.",
      capturedAt: "2026-10-23T08:15:00Z"
    },
    evidence: [
      { label: "Ding", value: "09:20:14" },
      { label: "Courier", value: "0.96" },
      { label: "Parcel", value: "optical lab" },
      { label: "TV", value: "ducked to 20%" }
    ],
    captions: [
      { speaker: "Door speaker", text: "Delivery for Elena. I need a signature." },
      { speaker: "Fire TV", text: "Optical lab courier · signature requested." }
    ],
    spokenAlexaPrompt:
      "Hello. Elena has authorized the optical lab delivery for Lockbox 2. Please place the parcel inside and close the lid. A visual confirmation will appear on the living-room screen.",
    hudActions: [
      action(
        "unlock_lockbox",
        "Unlock Lockbox 2 and speak",
        "Unlock + speak",
        "1",
        "Unlock Smart Lockbox 2 and announce the drop-off instructions on the door speaker.",
        "The resident has authorized Lockbox 2. Please place the parcel inside and close the lid. Thank you.",
        "Lockbox 2 unlocked. Drop-off instructions spoken at the door."
      ),
      action(
        "ask_wait",
        "Ask the courier to wait",
        "Ask to wait",
        "2",
        "Ask the courier to wait sixty seconds while Elena comes to the door.",
        "Elena is on her way. Please wait one moment.",
        "Courier asked to wait. A sixty-second timer is running on the TV."
      ),
      action(
        "pin_captions",
        "Pin the live caption banner",
        "Pin captions",
        "3",
        "Pin the live two-way caption transcript on the Fire TV screen.",
        "Live captions are now pinned to the living-room screen.",
        "Live caption banner pinned. Transcript is visible from the couch."
      )
    ]
  },
  "SCN-03": {
    id: "SCN-03",
    number: "03",
    time: "11:05",
    period: "AM",
    timestamp: "2026-10-23T11:05:33.000Z",
    deviceId: "ring_front_door_03",
    zone: "Porch steps · direct sun",
    eyebrow: "Cold chain · medication custody",
    title: "The insulin is on the porch. The sun is on the insulin.",
    summary:
      "A cold-chain parcel is sitting in direct sun. The porch sensor reads 34°C. Bee remembers the clinic's twenty-minute refrigeration window. HearthGuard pre-chills Lockbox 2, starts a pickup timer, and asks the trusted neighbour — before the ice pack gives out.",
    intent: "Cold chain · timed custody",
    camera: "coldchain",
    severity: "COLD_CHAIN_CUSTODY",
    resident: "Arthur · 78",
    beeFact: {
      speaker: "Dr. Patel's clinic, captured via Bee",
      quote: "“Refrigerate the glargine within twenty minutes of porch delivery.”",
      commitment: "Cold-chain biologic must be moved indoors or into a 4°C lockbox within 20 minutes.",
      capturedAt: "2026-10-23T08:05:22Z"
    },
    evidence: [
      { label: "Parcel", value: "11:05:33" },
      { label: "Porch", value: "34°C" },
      { label: "Window", value: "20 min" },
      { label: "Lockbox", value: "4°C" }
    ],
    captions: [
      { speaker: "Alexa+", text: "Your insulin is on the porch. Lockbox 2 is chilled." },
      { speaker: "Ring", text: "Cold-chain parcel · direct sunlight." }
    ],
    spokenAlexaPrompt:
      "Your temperature-sensitive insulin was just delivered to the front porch in direct sunlight. Lockbox 2 has been pre-chilled to four degrees. I've started a ten-minute pickup reminder.",
    hudActions: [
      action(
        "chill_lockbox",
        "Chill Lockbox 2 and set a timer",
        "Chill + timer",
        "1",
        "Set the porch lockbox cooler to 4°C and start a ten-minute pickup reminder.",
        "The insulin is in the shaded lockbox. I've set the cooler to four degrees and a ten-minute pickup reminder.",
        "Lockbox 2 set to 4°C. Ten-minute pickup reminder started."
      ),
      action(
        "neighbour_pickup",
        "Ask Sarah next door",
        "Ask Sarah",
        "2",
        "Send a verified one-time porch pickup request to the trusted neighbour, Sarah.",
        "Sarah has been asked to bring the parcel in. She'll arrive in about six minutes.",
        "Verified pickup request sent to Sarah. ETA six minutes."
      ),
      action(
        "pickup_now",
        "Pause the TV, light the porch",
        "Pickup now",
        "3",
        "Pause Fire TV playback, unlock the lockbox and turn on the porch welcome light.",
        "I've paused the TV and turned on the porch light. The lockbox is open.",
        "Media paused. Porch light on. Lockbox open for pickup."
      )
    ]
  }
};

export const SCENARIO_ORDER: ScenarioId[] = ["SCN-01", "SCN-02", "SCN-03"];

export function isScenarioId(value: unknown): value is ScenarioId {
  return value === "SCN-01" || value === "SCN-02" || value === "SCN-03";
}

export function scenarioForEvent(
  scenarioId: unknown,
  eventType?: string
): ScenarioDefinition {
  if (isScenarioId(scenarioId)) return SCENARIOS[scenarioId];
  if (eventType === "ding") return SCENARIOS["SCN-02"];
  if (eventType === "package_detected") return SCENARIOS["SCN-03"];
  return SCENARIOS["SCN-01"];
}
