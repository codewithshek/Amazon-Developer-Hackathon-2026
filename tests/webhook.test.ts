import request from "supertest";
import { describe, expect, it } from "vitest";
import {
  computeRingHmacSignature,
  createRingWebhookBody
} from "../packages/ring-alexa-mcp-bridge/src/index";
import { app } from "../src/server/app";

const secret = process.env.RING_WEBHOOK_SECRET || "hearthguard_local_demo_secret_change_me";

describe("Ring ingestion", () => {
  it("runs the signed demo path and returns a verified incident", async () => {
    const response = await request(app).post("/api/demo/trigger/SCN-03");
    expect(response.status).toBe(200);
    expect(response.body.verification.valid).toBe(true);
    expect(response.body.incident.scenarioId).toBe("SCN-03");
    expect(response.body.incident.card.severity).toBe("COLD_CHAIN_CUSTODY");
    expect(response.body.incident.whep.mode).toBe("simulator_loopback");
  });

  it("accepts a correctly signed Ring webhook", async () => {
    const body = JSON.stringify(createRingWebhookBody("SCN-02", "ring_front_door_02"));
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = computeRingHmacSignature(body, secret, timestamp);

    const response = await request(app)
      .post("/api/ring/webhook")
      .set("Content-Type", "application/json")
      .set("X-Ring-Signature", signature)
      .set("X-Ring-Timestamp", timestamp)
      .send(body);

    expect(response.status).toBe(202);
    expect(response.body.accepted).toBe(true);
  });

  it("rejects an unsigned or tampered Ring webhook", async () => {
    const body = JSON.stringify(createRingWebhookBody("SCN-01", "ring_front_door_01"));
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = computeRingHmacSignature(body, secret, timestamp);

    const unsigned = await request(app)
      .post("/api/ring/webhook")
      .set("Content-Type", "application/json")
      .send(body);
    expect(unsigned.status).toBe(401);

    const tampered = await request(app)
      .post("/api/ring/webhook")
      .set("Content-Type", "application/json")
      .set("X-Ring-Signature", signature)
      .set("X-Ring-Timestamp", timestamp)
      .send(`${body} `);
    expect(tampered.status).toBe(401);
  });

  it("exposes health, state and the care timeline", async () => {
    const health = await request(app).get("/api/health");
    expect(health.status).toBe(200);
    expect(health.body.capabilities.mcpProtocol).toBe("2025-11-25");

    const state = await request(app).get("/api/state");
    expect(state.status).toBe(200);
    expect(Array.isArray(state.body.incidents)).toBe(true);

    const timeline = await request(app).get("/api/timeline");
    expect(timeline.status).toBe(200);
    expect(Array.isArray(timeline.body.timeline)).toBe(true);
  });
});
