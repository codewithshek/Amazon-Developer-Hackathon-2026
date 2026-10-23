import { LATEST_PROTOCOL_VERSION } from "@modelcontextprotocol/sdk/types.js";
import {
  negotiateRingWhepSession,
  type WhepSessionResult
} from "../../packages/ring-alexa-mcp-bridge/src/index";
import type {
  CareIncident,
  CapabilityReport,
  IncidentSource,
  InterventionResult,
  ScenarioId,
  ServerState,
  TimelineEntry
} from "../shared/types";
import { hasBedrockCredentials, runBedrockStrandsThresholdAgent } from "./bedrockStrandsAgent";
import { careEvents } from "./eventBus";
import { mcpSessionCount } from "./mcpSessions";
import { SCENARIOS } from "./scenarios";
import { addTimeline, clearTimeline, listTimeline } from "./timeline";

const WEBHOOK_SECRET =
  process.env.RING_WEBHOOK_SECRET || "hearthguard_local_demo_secret_change_me";
const RING_API_BASE_URL = process.env.RING_API_BASE_URL || "https://api.amazonvision.com";
const RING_OAUTH_TOKEN = process.env.RING_OAUTH_TOKEN;
const DEMO_MODE = process.env.DEMO_MODE !== "false";

const SDP_OFFER = [
  "v=0",
  "o=- 0 2 IN IP4 127.0.0.1",
  "s=HearthGuard Fire TV",
  "t=0 0",
  "a=group:BUNDLE 0",
  "m=video 9 UDP/TLS/RTP/SAVPF 96",
  "c=IN IP4 0.0.0.0",
  "a=mid:0",
  "a=sendonly",
  "a=rtcp-mux",
  "a=rtpmap:96 H264/90000",
  ""
].join("\r\n");

const incidents = new Map<ScenarioId, CareIncident>();
const inFlight = new Map<ScenarioId, Promise<CareIncident>>();

export function webhookSecret(): string {
  return WEBHOOK_SECRET;
}

export function demoMode(): boolean {
  return DEMO_MODE;
}

export function capabilities(): CapabilityReport {
  return {
    mcpProtocol: LATEST_PROTOCOL_VERSION,
    mcpSessions: mcpSessionCount(),
    hmac: WEBHOOK_SECRET ? "verified" : "unconfigured",
    bedrock: hasBedrockCredentials() ? "live" : "replay",
    bee: process.env.BEE_PROXY_URL ? "proxy" : "fixture",
    whep: RING_OAUTH_TOKEN ? "live" : "simulator",
    demoMode: DEMO_MODE
  };
}

async function negotiateWhep(deviceId: string): Promise<WhepSessionResult> {
  if (RING_OAUTH_TOKEN) {
    try {
      return await negotiateRingWhepSession(deviceId, SDP_OFFER, {
        bearerToken: RING_OAUTH_TOKEN,
        baseUrl: RING_API_BASE_URL,
        timeoutMs: 6000
      });
    } catch {
      // Fall through to the loopback answer; the incident still needs to land.
    }
  }
  return negotiateRingWhepSession(deviceId, SDP_OFFER);
}

export async function processScenario(
  scenarioId: ScenarioId,
  source: IncidentSource = "demo"
): Promise<CareIncident> {
  const running = inFlight.get(scenarioId);
  if (running) return running;

  const task = (async (): Promise<CareIncident> => {
    const scenario = SCENARIOS[scenarioId];
    const whep = await negotiateWhep(scenario.deviceId);
    const trace = await runBedrockStrandsThresholdAgent(scenarioId);

    const incident: CareIncident = {
      id: `inc_${scenarioId.toLowerCase()}_${Date.now().toString(36)}`,
      scenarioId,
      status: "active",
      startedAt: new Date().toISOString(),
      source,
      scenario,
      card: trace.card,
      trace,
      whep: {
        mode: whep.mode,
        sessionId: whep.sessionId,
        endpoint: whep.whepEndpoint
      }
    };

    incidents.set(scenarioId, incident);

    addTimeline(
      "detected",
      `Ring · ${scenario.eyebrow.toLowerCase()} at the threshold`,
      `${scenario.deviceId} · ${source === "ring_webhook" ? "HMAC-verified webhook" : "signed replay webhook"} · WHEP ${whep.mode === "live_partner_api" ? "live" : "simulator"}`
    );
    addTimeline("reasoned", `Nova · ${scenario.intent.toLowerCase()}`, trace.steps[1] ?? trace.steps[0] ?? "Reasoning complete");
    addTimeline(
      "dispatched",
      "Alexa+ · card dispatched to Fire TV",
      `${scenario.hudActions.length} D-pad actions · room tone ducked to 20%`,
      scenarioId
    );

    careEvents.publish("incident.created", incident);
    careEvents.publish("timeline.updated", listTimeline());
    return incident;
  })();

  inFlight.set(scenarioId, task);
  try {
    return await task;
  } finally {
    inFlight.delete(scenarioId);
  }
}

export async function executeIntervention(
  scenarioId: ScenarioId,
  actionId: string
): Promise<InterventionResult> {
  const scenario = SCENARIOS[scenarioId];
  const action = scenario.hudActions.find((candidate) => candidate.id === actionId);
  if (!action) {
    throw new Error(`Unknown action "${actionId}" for ${scenarioId}`);
  }

  let incident = incidents.get(scenarioId);
  if (!incident) incident = await processScenario(scenarioId, "mcp");
  if (incident.status === "resolved") {
    incident = { ...incident, status: "active" };
    incidents.set(scenarioId, incident);
  }

  const at = new Date().toISOString();
  addTimeline("action", `Fire TV · ${action.shortLabel}`, action.outcome, scenarioId);
  careEvents.publish("intervention.executed", {
    incidentId: incident.id,
    scenarioId,
    actionId,
    spokenResponse: action.spokenResponse,
    outcome: action.outcome,
    at
  });
  careEvents.publish("timeline.updated", listTimeline());

  return {
    ok: true,
    actionId,
    spokenResponse: action.spokenResponse,
    outcome: action.outcome,
    at
  };
}

export function dispatchHud(scenarioId: ScenarioId): CareIncident {
  const incident = incidents.get(scenarioId);
  if (!incident) throw new Error(`No active incident for ${scenarioId}`);
  careEvents.publish("hud.dispatched", {
    incidentId: incident.id,
    scenarioId,
    card: incident.card
  });
  return incident;
}

export function resolveIncident(scenarioId: ScenarioId, note?: string): CareIncident {
  const incident = incidents.get(scenarioId);
  if (!incident) throw new Error(`No incident to resolve for ${scenarioId}`);
  if (incident.status === "resolved") return incident;

  const resolved: CareIncident = { ...incident, status: "resolved" };
  incidents.set(scenarioId, resolved);
  addTimeline(
    "resolved",
    `Care note · ${incident.scenario.eyebrow.toLowerCase()} closed`,
    note?.trim() || "Incident acknowledged and closed from the Fire TV.",
    scenarioId
  );
  careEvents.publish("incident.resolved", resolved);
  careEvents.publish("timeline.updated", listTimeline());
  return resolved;
}

export function getState(): ServerState {
  return {
    incidents: [...incidents.values()].sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
    timeline: listTimeline(),
    capabilities: capabilities(),
    serverTime: new Date().toISOString()
  };
}

export function resetDemo(): ServerState {
  incidents.clear();
  inFlight.clear();
  clearTimeline();
  careEvents.publish("state.reset", null);
  return getState();
}

export function getIncident(scenarioId: ScenarioId): CareIncident | undefined {
  return incidents.get(scenarioId);
}

export function getTimeline(): TimelineEntry[] {
  return listTimeline();
}
