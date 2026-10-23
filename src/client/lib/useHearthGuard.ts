import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  CareIncident,
  InterventionResult,
  ScenarioId,
  ServerState,
  TimelineEntry,
  WireEntry
} from "../../shared/types";
import {
  fetchState,
  mcpRequest,
  parseSseEvent,
  resetDemo,
  triggerScenario,
  wireEntry
} from "./api";

const PROTOCOL = "2025-11-25";

function upsertIncident(state: ServerState, incident: CareIncident): ServerState {
  const incidents = [
    incident,
    ...state.incidents.filter((existing) => existing.scenarioId !== incident.scenarioId)
  ].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  return { ...state, incidents };
}

function replaceIncident(state: ServerState, incident: CareIncident): ServerState {
  return {
    ...state,
    incidents: state.incidents.map((existing) =>
      existing.scenarioId === incident.scenarioId ? incident : existing
    )
  };
}

export interface HearthGuardController {
  state: ServerState | null;
  activeIncident: CareIncident | null;
  activeId: ScenarioId | null;
  sessionId: string | null;
  wire: WireEntry[];
  lastAction: InterventionResult | null;
  busyScenario: ScenarioId | null;
  executingAction: string | null;
  error: string | null;
  toast: string | null;
  connected: boolean;
  loading: boolean;
  runScenario: (scenarioId: ScenarioId) => Promise<void>;
  executeAction: (actionId: string) => Promise<void>;
  resolveActive: (note?: string) => Promise<void>;
  reset: () => Promise<void>;
  clearError: () => void;
  timeline: TimelineEntry[];
  autoRan: boolean;
}

export function useHearthGuard(): HearthGuardController {
  const [state, setState] = useState<ServerState | null>(null);
  const [activeId, setActiveId] = useState<ScenarioId | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [wire, setWire] = useState<WireEntry[]>([]);
  const [lastAction, setLastAction] = useState<InterventionResult | null>(null);
  const [busyScenario, setBusyScenario] = useState<ScenarioId | null>(null);
  const [executingAction, setExecutingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [autoRan, setAutoRan] = useState(false);

  const sessionRef = useRef<string | null>(null);
  const activeIdRef = useRef<ScenarioId | null>(null);
  const requestId = useRef(1);
  const started = useRef(false);
  const autoStarted = useRef(false);

  const logWire = useCallback((entry: WireEntry) => {
    setWire((previous) => [...previous.slice(-59), entry]);
  }, []);

  const activeIncident = useMemo(
    () => state?.incidents.find((incident) => incident.scenarioId === activeId) ?? null,
    [state, activeId]
  );

  const refresh = useCallback(async () => {
    const next = await fetchState();
    setState(next);
    return next;
  }, []);

  const runScenario = useCallback(
    async (scenarioId: ScenarioId) => {
      setBusyScenario(scenarioId);
      setError(null);
      try {
        const result = await triggerScenario(scenarioId);
        setState((previous) =>
          previous
            ? upsertIncident(previous, result.incident)
            : {
                incidents: [result.incident],
                timeline: [],
                capabilities: {
                  mcpProtocol: PROTOCOL,
                  mcpSessions: 0,
                  hmac: "verified",
                  bedrock: "replay",
                  bee: "fixture",
                  whep: "simulator",
                  demoMode: true
                },
                serverTime: new Date().toISOString()
              }
        );
        setActiveId(scenarioId);
        activeIdRef.current = scenarioId;
        setLastAction(null);
        setToast(`${scenarioId} · signed replay verified · HUD dispatched`);
        logWire(
          wireEntry(
            "note",
            "ring.webhook",
            `HMAC-SHA256 verified · WHEP ${result.incident.whep.mode === "live_partner_api" ? "live" : "simulator"} · ${result.incident.trace.inferenceMode === "aws_bedrock_live" ? "Bedrock live" : "Bedrock replay"}`
          )
        );
        void refresh().catch(() => undefined);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not run the replay.");
      } finally {
        setBusyScenario(null);
      }
    },
    [logWire, refresh]
  );

  const executeAction = useCallback(
    async (actionId: string) => {
      const incident = state?.incidents.find(
        (candidate) => candidate.scenarioId === activeIdRef.current
      );
      if (!incident || !sessionRef.current) {
        setError("The MCP session is still starting. Try again in a moment.");
        return;
      }
      const action = incident.scenario.hudActions.find((candidate) => candidate.id === actionId);
      if (!action) {
        setError("That action is not part of this care card.");
        return;
      }

      setExecutingAction(actionId);
      setError(null);
      const id = requestId.current++;
      logWire(
        wireEntry(
          "out",
          "tools/call",
          `execute_alexa_threshold_intervention · ${incident.scenarioId} · ${actionId}`
        )
      );

      try {
        const response = await mcpRequest(sessionRef.current, {
          jsonrpc: "2.0",
          id,
          method: "tools/call",
          params: {
            name: "execute_alexa_threshold_intervention",
            arguments: { scenarioId: incident.scenarioId, actionId }
          }
        });
        if (!response.json || response.json.error) {
          throw new Error(response.json?.error?.message ?? "MCP tool call failed.");
        }
        logWire(
          wireEntry(
            "in",
            "tools/call",
            `${action.shortLabel} · Alexa+ voice returned`,
            response.status,
            response.latencyMs
          )
        );
        setLastAction({
          ok: true,
          actionId,
          spokenResponse: action.spokenResponse,
          outcome: action.outcome,
          at: new Date().toISOString()
        });
        setToast(action.outcome);
        void refresh().catch(() => undefined);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "The intervention failed.");
        logWire(wireEntry("note", "tools/call", "Intervention failed", 500));
      } finally {
        setExecutingAction(null);
      }
    },
    [logWire, refresh, state]
  );

  const resolveActive = useCallback(
    async (note = "Acknowledged from the Fire TV.") => {
      const scenarioId = activeIdRef.current;
      if (!scenarioId) return;
      if (!sessionRef.current) {
        setActiveId(null);
        activeIdRef.current = null;
        return;
      }
      const id = requestId.current++;
      logWire(wireEntry("out", "tools/call", `resolve_care_incident · ${scenarioId}`));
      try {
        const response = await mcpRequest(sessionRef.current, {
          jsonrpc: "2.0",
          id,
          method: "tools/call",
          params: {
            name: "resolve_care_incident",
            arguments: { scenarioId, note }
          }
        });
        if (response.json?.error) throw new Error(response.json.error.message);
        logWire(
          wireEntry("in", "tools/call", "Care note written to care://timeline", response.status, response.latencyMs)
        );
        setToast("Care note written. The house is quiet.");
        setLastAction(null);
        setActiveId(null);
        activeIdRef.current = null;
        void refresh().catch(() => undefined);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "Could not close the incident.");
      }
    },
    [logWire, refresh]
  );

  const reset = useCallback(async () => {
    setError(null);
    try {
      const next = await resetDemo();
      setState(next);
      setActiveId(null);
      activeIdRef.current = null;
      setLastAction(null);
      setToast("Replay cleared. The house is quiet.");
      logWire(wireEntry("note", "demo.reset", "In-memory incidents and timeline cleared"));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not reset the demo.");
    }
  }, [logWire]);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 4600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    let cancelled = false;
    const boot = async () => {
      try {
        const initial = await fetchState();
        if (!cancelled) {
          setState(initial);
          setLoading(false);
        }
      } catch (caught) {
        if (!cancelled) {
          setError(caught instanceof Error ? caught.message : "Could not reach the HearthGuard server.");
          setLoading(false);
        }
      }

      const id = requestId.current++;
      logWire(wireEntry("out", "initialize", "protocolVersion 2025-11-25 · hearthguard-firetv-sim"));
      try {
        const response = await mcpRequest(null, {
          jsonrpc: "2.0",
          id,
          method: "initialize",
          params: {
            protocolVersion: PROTOCOL,
            capabilities: {},
            clientInfo: { name: "hearthguard-firetv-sim", version: "1.0.0" }
          }
        });
        if (response.json?.error) throw new Error(response.json.error.message);
        if (response.sessionId) {
          sessionRef.current = response.sessionId;
          setSessionId(response.sessionId);
        }
        logWire(
          wireEntry(
            "in",
            "initialize",
            `session ${response.sessionId?.slice(0, 8) ?? "unknown"} · tools + resources ready`,
            response.status,
            response.latencyMs
          )
        );

        await mcpRequest(response.sessionId, {
          jsonrpc: "2.0",
          method: "notifications/initialized"
        });
        logWire(wireEntry("note", "notifications/initialized", "Client ready"));

        const tools = await mcpRequest(response.sessionId, {
          jsonrpc: "2.0",
          id: requestId.current++,
          method: "tools/list",
          params: {}
        });
        const toolNames = (
          tools.json?.result as { tools?: Array<{ name: string }> } | undefined
        )?.tools?.map((tool) => tool.name);
        logWire(
          wireEntry(
            "in",
            "tools/list",
            toolNames ? `${toolNames.length} tools · ${toolNames.join(", ")}` : "Tool list received",
            tools.status,
            tools.latencyMs
          )
        );
      } catch (caught) {
        logWire(
          wireEntry(
            "note",
            "initialize",
            caught instanceof Error ? caught.message : "MCP handshake failed",
            500
          )
        );
        setError("The MCP session could not start. The replay still works, but D-pad actions need it.");
      }
    };

    void boot();

    return () => {
      cancelled = true;
    };
  }, [logWire]);

  useEffect(() => {
    if (loading || autoStarted.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("empty") === "1") {
      autoStarted.current = true;
      return;
    }
    const requested = params.get("scenario");
    const scenarioId: ScenarioId =
      requested === "SCN-02" || requested === "SCN-03" ? requested : "SCN-01";
    autoStarted.current = true;
    const timeout = window.setTimeout(() => {
      void runScenario(scenarioId).then(() => setAutoRan(true));
    }, 850);
    return () => window.clearTimeout(timeout);
  }, [loading, runScenario]);

  useEffect(() => {
    let source: EventSource | null = null;
    let poll: number | null = null;

    const connect = () => {
      source = new EventSource("/api/events");
      source.onopen = () => {
        setConnected(true);
        if (poll) {
          window.clearInterval(poll);
          poll = null;
        }
      };
      source.onerror = () => {
        setConnected(false);
        if (!poll) {
          poll = window.setInterval(() => {
            void refresh().catch(() => undefined);
          }, 4000);
        }
      };
      source.onmessage = (event) => {
        const parsed = parseSseEvent(event);
        if (!parsed) return;
        switch (parsed.type) {
          case "hello": {
            const next = parsed.data as ServerState;
            setState(next);
            setLoading(false);
            break;
          }
          case "incident.created": {
            const incident = parsed.data as CareIncident;
            setState((previous) => (previous ? upsertIncident(previous, incident) : previous));
            setActiveId((previous) => previous ?? incident.scenarioId);
            activeIdRef.current = activeIdRef.current ?? incident.scenarioId;
            break;
          }
          case "incident.resolved": {
            const incident = parsed.data as CareIncident;
            setState((previous) => (previous ? replaceIncident(previous, incident) : previous));
            break;
          }
          case "intervention.executed": {
            const payload = parsed.data as {
              scenarioId: ScenarioId;
              actionId: string;
              spokenResponse: string;
              outcome: string;
              at: string;
            };
            setLastAction({
              ok: true,
              actionId: payload.actionId,
              spokenResponse: payload.spokenResponse,
              outcome: payload.outcome,
              at: payload.at
            });
            break;
          }
          case "timeline.updated": {
            const timeline = parsed.data as TimelineEntry[];
            setState((previous) => (previous ? { ...previous, timeline } : previous));
            break;
          }
          case "state.reset": {
            void refresh().catch(() => undefined);
            break;
          }
          default:
            break;
        }
      };
    };

    connect();

    return () => {
      source?.close();
      if (poll) window.clearInterval(poll);
    };
  }, [refresh]);

  return {
    state,
    activeIncident,
    activeId,
    sessionId,
    wire,
    lastAction,
    busyScenario,
    executingAction,
    error,
    toast,
    connected,
    loading,
    runScenario,
    executeAction,
    resolveActive,
    reset,
    clearError,
    timeline: state?.timeline ?? [],
    autoRan
  };
}
