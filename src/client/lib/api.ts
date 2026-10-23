import type {
  CareIncident,
  InterventionResult,
  ScenarioId,
  ServerState,
  SseEvent,
  WireEntry
} from "../../shared/types";

export interface TriggerResponse {
  incident: CareIncident;
  verification: {
    algorithm: string;
    valid: boolean;
    replayWindowSeconds: number;
  };
}

export interface McpResponse<T = unknown> {
  status: number;
  sessionId: string | null;
  json: {
    jsonrpc: "2.0";
    id: number | string | null;
    result?: T;
    error?: { code: number; message: string; data?: unknown };
  } | null;
  latencyMs: number;
  rawText: string;
}

function parseSseJson(text: string): unknown {
  const dataLines = text
    .split(/\r?\n/)
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trim());
  if (dataLines.length === 0) return null;
  try {
    return JSON.parse(dataLines[dataLines.length - 1]!);
  } catch {
    return null;
  }
}

async function parseMcpBody(response: Response): Promise<McpResponse["json"]> {
  const text = await response.text();
  if (!text.trim()) return null;
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("text/event-stream")) {
    return parseSseJson(text) as McpResponse["json"];
  }
  try {
    return JSON.parse(text) as McpResponse["json"];
  } catch {
    const sse = parseSseJson(text);
    return sse as McpResponse["json"];
  }
}

export async function fetchState(): Promise<ServerState> {
  const response = await fetch("/api/state", { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`State request failed (${response.status})`);
  return (await response.json()) as ServerState;
}

export async function triggerScenario(scenarioId: ScenarioId): Promise<TriggerResponse> {
  const response = await fetch(`/api/demo/trigger/${scenarioId}`, {
    method: "POST",
    headers: { Accept: "application/json" }
  });
  const body = (await response.json()) as TriggerResponse & { error?: string };
  if (!response.ok) throw new Error(body.error ?? `Replay failed (${response.status})`);
  return body;
}

export async function resetDemo(): Promise<ServerState> {
  const response = await fetch("/api/demo/reset", { method: "POST" });
  if (!response.ok) throw new Error(`Reset failed (${response.status})`);
  return (await response.json()) as ServerState;
}

export async function mcpRequest<T = unknown>(
  sessionId: string | null,
  payload: {
    jsonrpc: "2.0";
    id?: number | string;
    method: string;
    params?: unknown;
  }
): Promise<McpResponse<T>> {
  const started = performance.now();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream"
  };
  if (sessionId) {
    headers["Mcp-Session-Id"] = sessionId;
    headers["MCP-Protocol-Version"] = "2025-11-25";
  }

  const response = await fetch("/mcp", {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });

  const json = await parseMcpBody(response);
  return {
    status: response.status,
    sessionId: response.headers.get("Mcp-Session-Id"),
    json: json as McpResponse<T>["json"],
    latencyMs: Math.round((performance.now() - started) * 10) / 10,
    rawText: json ? "" : await response.text().catch(() => "")
  };
}

export function wireEntry(
  direction: WireEntry["direction"],
  method: string,
  detail: string,
  status?: number,
  latencyMs?: number
): WireEntry {
  return {
    id: `wire_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    at: new Date().toISOString(),
    direction,
    method,
    detail,
    status,
    latencyMs
  };
}

export function parseSseEvent(event: MessageEvent<string>): SseEvent | null {
  try {
    return JSON.parse(event.data) as SseEvent;
  } catch {
    return null;
  }
}

export function interventionFromAction(
  scenarioId: ScenarioId,
  actionId: string,
  spokenResponse: string,
  outcome: string
): InterventionResult {
  return {
    ok: true,
    actionId,
    spokenResponse,
    outcome,
    at: new Date().toISOString()
  };
}
