import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import {
  ALEXA_CARD_MIME,
  buildAlexaMcpCardPayload
} from "../../packages/ring-alexa-mcp-bridge/src/index";
import type { ScenarioId } from "../shared/types";
import { fetchBeeAmbientContext } from "./beeContextClient";
import {
  dispatchHud,
  executeIntervention,
  getIncident,
  getTimeline,
  processScenario,
  resolveIncident
} from "./careEngine";
import { careEvents } from "./eventBus";
import { mcpSessions } from "./mcpSessions";
import { SCENARIOS, SCENARIO_ORDER } from "./scenarios";

const scenarioEnum = z.enum(["SCN-01", "SCN-02", "SCN-03"]);

function createProtocolServer(): McpServer {
  const server = new McpServer({
    name: "hearthguard-alexa-plus-mcp",
    version: "1.0.0"
  });

  server.registerTool(
    "analyze_threshold_event",
    {
      title: "Analyze a threshold event",
      description:
        "Fuse a Ring threshold event with Bee household memory and return an Alexa+ care card with three D-pad actions.",
      inputSchema: {
        scenarioId: scenarioEnum.describe("The replay scenario to analyze.")
      },
      annotations: { readOnlyHint: false, destructiveHint: false }
    },
    async ({ scenarioId }) => {
      const incident = await processScenario(scenarioId as ScenarioId, "mcp");
      const payload = buildAlexaMcpCardPayload(incident.card);
      return { content: payload.content };
    }
  );

  server.registerTool(
    "dispatch_firetv_multimodal_hud",
    {
      title: "Dispatch the Fire TV HUD",
      description:
        "Push the active Alexa+ care card to the 10-foot Fire TV HUD and duck room audio.",
      inputSchema: {
        scenarioId: scenarioEnum.describe("The active incident to display.")
      },
      annotations: { readOnlyHint: false, destructiveHint: false }
    },
    async ({ scenarioId }) => {
      let incident = getIncident(scenarioId as ScenarioId);
      if (!incident) incident = await processScenario(scenarioId as ScenarioId, "mcp");
      dispatchHud(scenarioId as ScenarioId);
      const payload = buildAlexaMcpCardPayload(incident.card);
      return {
        content: [
          {
            type: "text" as const,
            text: `Fire TV HUD dispatched for ${scenarioId}. Room tone ducked to 20%.`
          },
          ...payload.content
        ]
      };
    }
  );

  server.registerTool(
    "execute_alexa_threshold_intervention",
    {
      title: "Execute an Alexa+ intervention",
      description:
        "Run one of the three D-pad actions on the active care card and log the outcome to the care timeline.",
      inputSchema: {
        scenarioId: scenarioEnum.describe("The incident scenario."),
        actionId: z
          .string()
          .min(1)
          .describe("Action id from the card, e.g. calm_redirect or unlock_lockbox.")
      },
      annotations: { readOnlyHint: false, destructiveHint: false }
    },
    async ({ scenarioId, actionId }) => {
      const result = await executeIntervention(scenarioId as ScenarioId, actionId);
      const incident = getIncident(scenarioId as ScenarioId);
      const content: Array<
        | { type: "text"; text: string }
        | {
            type: "resource";
            resource: { uri: string; mimeType: string; text: string };
          }
      > = [
        {
          type: "text",
          text: `Alexa+ voice: “${result.spokenResponse}”\n${result.outcome}`
        }
      ];
      if (incident) {
        content.push(...buildAlexaMcpCardPayload(incident.card).content);
      }
      return { content };
    }
  );

  server.registerTool(
    "sync_bee_ambient_context",
    {
      title: "Sync Bee ambient context",
      description:
        "Read the latest spoken household memory for a scenario from the local Bee proxy, with a recorded fallback.",
      inputSchema: {
        scenarioId: scenarioEnum.describe("The scenario to recall memory for.")
      },
      annotations: { readOnlyHint: true }
    },
    async ({ scenarioId }) => {
      const fact = await fetchBeeAmbientContext(scenarioId as ScenarioId);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(fact, null, 2)
          }
        ]
      };
    }
  );

  server.registerTool(
    "resolve_care_incident",
    {
      title: "Resolve a care incident",
      description:
        "Close an incident with an optional care note and write the resolution to the timeline.",
      inputSchema: {
        scenarioId: scenarioEnum.describe("The incident to close."),
        note: z.string().max(500).optional().describe("Optional care note.")
      },
      annotations: { readOnlyHint: false, destructiveHint: false }
    },
    async ({ scenarioId, note }) => {
      const incident = resolveIncident(scenarioId as ScenarioId, note);
      return {
        content: [
          {
            type: "text" as const,
            text: `Incident ${incident.id} resolved. ${note ?? "Acknowledged from the care console."}`
          }
        ]
      };
    }
  );

  server.registerResource(
    "care-timeline",
    "care://timeline",
    {
      title: "Care timeline",
      description: "Append-only care notes and interventions for the household.",
      mimeType: "application/json"
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(getTimeline(), null, 2)
        }
      ]
    })
  );

  server.registerResource(
    "care-scenarios",
    "care://scenarios",
    {
      title: "Care scenarios",
      description: "The three threshold scenarios available in this demo.",
      mimeType: "application/json"
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(
            SCENARIO_ORDER.map((id) => ({
              id,
              title: SCENARIOS[id].title,
              severity: SCENARIOS[id].severity,
              actions: SCENARIOS[id].hudActions.map((action) => ({
                id: action.id,
                label: action.label,
                dpadKey: action.dpadKey
              }))
            })),
            null,
            2
          )
        }
      ]
    })
  );

  server.registerResource(
    "care-household",
    "care://household",
    {
      title: "Household context",
      description: "Fictional household members and their care preferences.",
      mimeType: "application/json"
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(
            {
              household: "HearthGuard demo home",
              members: [
                {
                  name: "Arthur",
                  age: 78,
                  preferences: ["calm voice", "warm path light", "dentist on Thursday"]
                },
                {
                  name: "Elena",
                  access: "Deaf / hard of hearing",
                  preferences: ["visual intent cards", "Lockbox 2", "captions pinned"]
                }
              ],
              devices: ["ring_front_door_01", "fire_tv_living_room", "hallway_echo"],
              notice: "Fictional data for a deterministic hackathon replay."
            },
            null,
            2
          )
        }
      ]
    })
  );

  return server;
}

function errorBody(message: string) {
  return {
    jsonrpc: "2.0",
    error: { code: -32000, message },
    id: null
  };
}

export async function handleMcpPost(req: Request, res: Response): Promise<void> {
  const headerSession = req.headers["mcp-session-id"];
  const sessionId = Array.isArray(headerSession) ? headerSession[0] : headerSession;

  if (sessionId) {
    const transport = mcpSessions.get(sessionId);
    if (!transport) {
      res.status(404).json(errorBody("Unknown or expired MCP session"));
      return;
    }
    await transport.handleRequest(req, res, req.body);
    return;
  }

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: randomUUID,
    enableJsonResponse: true,
    retryInterval: 2000,
    onsessioninitialized: (newSessionId) => {
      mcpSessions.set(newSessionId, transport);
    },
    onsessionclosed: (closedSessionId) => {
      mcpSessions.delete(closedSessionId);
    }
  });

  const server = createProtocolServer();
  await server.connect(transport);

  const previousClose = transport.onclose;
  const unsubscribe = careEvents.subscribe((event) => {
    if (event.type === "incident.created" || event.type === "intervention.executed") {
      void server.server.sendResourceUpdated({ uri: "care://timeline" }).catch(() => undefined);
    }
  });
  transport.onclose = () => {
    previousClose?.();
    unsubscribe();
  };

  await transport.handleRequest(req, res, req.body);
}

export async function handleMcpGet(req: Request, res: Response): Promise<void> {
  const headerSession = req.headers["mcp-session-id"];
  const sessionId = Array.isArray(headerSession) ? headerSession[0] : headerSession;
  if (!sessionId) {
    res.status(400).json(errorBody("Mcp-Session-Id is required"));
    return;
  }
  const transport = mcpSessions.get(sessionId);
  if (!transport) {
    res.status(404).json(errorBody("Unknown or expired MCP session"));
    return;
  }
  await transport.handleRequest(req, res);
}

export async function handleMcpDelete(req: Request, res: Response): Promise<void> {
  const headerSession = req.headers["mcp-session-id"];
  const sessionId = Array.isArray(headerSession) ? headerSession[0] : headerSession;
  if (!sessionId) {
    res.status(400).json(errorBody("Mcp-Session-Id is required"));
    return;
  }
  const transport = mcpSessions.get(sessionId);
  if (!transport) {
    res.status(404).json(errorBody("Unknown or expired MCP session"));
    return;
  }
  await transport.handleRequest(req, res);
  mcpSessions.delete(sessionId);
}

export const ALEXA_CARD_RESOURCE_MIME = ALEXA_CARD_MIME;
