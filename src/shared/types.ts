import type {
  AlexaMcpAppCard,
  CareSeverity,
  ScenarioId
} from "../../packages/ring-alexa-mcp-bridge/src/index";

export type { AlexaMcpAppCard, CareSeverity, ScenarioId };

export type CameraMode = "sundown" | "courier" | "coldchain";
export type IncidentStatus = "active" | "resolved";
export type IncidentSource = "demo" | "ring_webhook" | "mcp";

export interface HudAction {
  id: string;
  label: string;
  shortLabel: string;
  dpadKey: "1" | "2" | "3";
  alexaCommand: string;
  spokenResponse: string;
  outcome: string;
}

export interface ScenarioDefinition {
  id: ScenarioId;
  number: "01" | "02" | "03";
  time: string;
  period: "AM" | "PM";
  timestamp: string;
  deviceId: string;
  zone: string;
  eyebrow: string;
  title: string;
  summary: string;
  intent: string;
  camera: CameraMode;
  severity: CareSeverity;
  resident: string;
  beeFact: {
    speaker: string;
    quote: string;
    commitment: string;
    capturedAt: string;
  };
  evidence: Array<{ label: string; value: string }>;
  captions: Array<{ speaker: string; text: string }>;
  spokenAlexaPrompt: string;
  hudActions: HudAction[];
}

export interface BeeMemoryFact {
  id: string;
  timestamp: string;
  speaker: string;
  transcriptSnippet: string;
  extractedCommitment: string;
  source: "bee_cli_live_proxy" | "bee_recorded_session_fixture";
}

export interface AgentTrace {
  scenarioId: ScenarioId;
  modelId: string;
  inferenceMode: "aws_bedrock_live" | "deterministic_recorded_trace";
  latencyMs: number;
  beeMemory: BeeMemoryFact;
  steps: string[];
  card: AlexaMcpAppCard;
}

export interface WhepSummary {
  mode: "live_partner_api" | "simulator_loopback";
  sessionId: string;
  endpoint: string;
}

export interface CareIncident {
  id: string;
  scenarioId: ScenarioId;
  status: IncidentStatus;
  startedAt: string;
  source: IncidentSource;
  scenario: ScenarioDefinition;
  card: AlexaMcpAppCard;
  trace: AgentTrace;
  whep: WhepSummary;
}

export type TimelineKind =
  | "detected"
  | "reasoned"
  | "dispatched"
  | "action"
  | "resolved"
  | "system";

export interface TimelineEntry {
  id: string;
  at: string;
  kind: TimelineKind;
  title: string;
  detail: string;
  scenarioId?: ScenarioId;
}

export interface CapabilityReport {
  mcpProtocol: string;
  mcpSessions: number;
  hmac: "verified" | "unconfigured";
  bedrock: "live" | "replay";
  bee: "proxy" | "fixture";
  whep: "live" | "simulator";
  demoMode: boolean;
}

export interface ServerState {
  incidents: CareIncident[];
  timeline: TimelineEntry[];
  capabilities: CapabilityReport;
  serverTime: string;
}

export interface WireEntry {
  id: string;
  at: string;
  direction: "out" | "in" | "note";
  method: string;
  detail: string;
  status?: number;
  latencyMs?: number;
}

export interface InterventionResult {
  ok: boolean;
  actionId: string;
  spokenResponse: string;
  outcome: string;
  at: string;
}

export interface SseEvent {
  type:
    | "hello"
    | "incident.created"
    | "intervention.executed"
    | "incident.resolved"
    | "hud.dispatched"
    | "timeline.updated"
    | "state.reset";
  at: string;
  data: unknown;
}
