import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/server/app";

const PROTOCOL = "2025-11-25";

async function initializeSession() {
  const response = await request(app)
    .post("/mcp")
    .set("Accept", "application/json, text/event-stream")
    .set("Content-Type", "application/json")
    .send({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: PROTOCOL,
        capabilities: {},
        clientInfo: { name: "vitest-alexa-plus-client", version: "1.0.0" }
      }
    });

  return {
    response,
    sessionId: response.headers["mcp-session-id"] as string | undefined
  };
}

describe("Alexa+ MCP 2025-11-25 Streamable HTTP server", () => {
  it("initializes a stateful session and exposes Mcp-Session-Id", async () => {
    const { response, sessionId } = await initializeSession();
    expect(response.status).toBe(200);
    expect(sessionId).toBeTruthy();
    expect(response.headers["access-control-expose-headers"]).toContain("Mcp-Session-Id");
    expect(response.body.result.protocolVersion).toBe(PROTOCOL);
    expect(response.body.result.serverInfo.name).toBe("hearthguard-alexa-plus-mcp");
  });

  it("lists the five care tools and reads the timeline resource", async () => {
    const { sessionId } = await initializeSession();
    expect(sessionId).toBeTruthy();

    const tools = await request(app)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Mcp-Session-Id", sessionId!)
      .set("MCP-Protocol-Version", PROTOCOL)
      .send({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });

    expect(tools.status).toBe(200);
    const names = tools.body.result.tools.map((tool: { name: string }) => tool.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "analyze_threshold_event",
        "dispatch_firetv_multimodal_hud",
        "execute_alexa_threshold_intervention",
        "sync_bee_ambient_context",
        "resolve_care_incident"
      ])
    );

    const resources = await request(app)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Mcp-Session-Id", sessionId!)
      .set("MCP-Protocol-Version", PROTOCOL)
      .send({ jsonrpc: "2.0", id: 3, method: "resources/list", params: {} });

    expect(resources.status).toBe(200);
    expect(
      resources.body.result.resources.map((resource: { uri: string }) => resource.uri)
    ).toContain("care://timeline");

    const read = await request(app)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Mcp-Session-Id", sessionId!)
      .set("MCP-Protocol-Version", PROTOCOL)
      .send({
        jsonrpc: "2.0",
        id: 4,
        method: "resources/read",
        params: { uri: "care://timeline" }
      });

    expect(read.status).toBe(200);
    expect(read.body.result.contents[0].text).toContain("[");
  });

  it("executes analyze_threshold_event and returns a card resource", async () => {
    const { sessionId } = await initializeSession();
    const call = await request(app)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Mcp-Session-Id", sessionId!)
      .set("MCP-Protocol-Version", PROTOCOL)
      .send({
        jsonrpc: "2.0",
        id: 5,
        method: "tools/call",
        params: {
          name: "analyze_threshold_event",
          arguments: { scenarioId: "SCN-02" }
        }
      });

    expect(call.status).toBe(200);
    const content = call.body.result.content as Array<{
      type: string;
      text?: string;
      resource?: { mimeType: string; text: string };
    }>;
    expect(content[0]?.text).toContain("ACCESSIBILITY_RELAY");
    expect(content[1]?.resource?.mimeType).toBe("application/vnd.alexa.mcp.card+json");
    expect(JSON.parse(content[1]!.resource!.text).fireTvHudActions).toHaveLength(3);
  });

  it("executes a D-pad intervention and resolves the incident", async () => {
    const { sessionId } = await initializeSession();
    const execute = await request(app)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Mcp-Session-Id", sessionId!)
      .set("MCP-Protocol-Version", PROTOCOL)
      .send({
        jsonrpc: "2.0",
        id: 6,
        method: "tools/call",
        params: {
          name: "execute_alexa_threshold_intervention",
          arguments: { scenarioId: "SCN-01", actionId: "calm_redirect" }
        }
      });

    expect(execute.status).toBe(200);
    expect(execute.body.result.content[0].text).toContain("Alexa+ voice");

    const resolve = await request(app)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Mcp-Session-Id", sessionId!)
      .set("MCP-Protocol-Version", PROTOCOL)
      .send({
        jsonrpc: "2.0",
        id: 7,
        method: "tools/call",
        params: {
          name: "resolve_care_incident",
          arguments: { scenarioId: "SCN-01", note: "Arthur is back in the living room." }
        }
      });

    expect(resolve.status).toBe(200);
    expect(resolve.body.result.content[0].text).toContain("resolved");
  });

  it("terminates the session with DELETE and rejects the old id", async () => {
    const { sessionId } = await initializeSession();
    const deleted = await request(app)
      .delete("/mcp")
      .set("Mcp-Session-Id", sessionId!)
      .set("MCP-Protocol-Version", PROTOCOL);

    expect(deleted.status).toBe(200);

    const after = await request(app)
      .post("/mcp")
      .set("Accept", "application/json, text/event-stream")
      .set("Mcp-Session-Id", sessionId!)
      .set("MCP-Protocol-Version", PROTOCOL)
      .send({ jsonrpc: "2.0", id: 8, method: "tools/list", params: {} });

    expect(after.status).toBe(404);
  });

  it("rejects a non-local browser origin", async () => {
    const response = await request(app)
      .post("/mcp")
      .set("Origin", "https://evil.example")
      .set("Accept", "application/json, text/event-stream")
      .send({ jsonrpc: "2.0", id: 9, method: "tools/list", params: {} });

    expect(response.status).toBe(403);
  });
});
