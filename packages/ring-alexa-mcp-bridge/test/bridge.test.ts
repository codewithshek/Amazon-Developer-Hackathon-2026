import { describe, expect, it, vi } from "vitest";
import {
  buildAlexaMcpCardPayload,
  computeRingHmacSignature,
  negotiateRingWhepSession,
  verifyRingWebhookHmac,
  type AlexaMcpAppCard
} from "../src/index";

const secret = "ring_webhook_test_secret_2026";
const body = JSON.stringify({
  data: {
    id: "evt_01",
    type: "motion_detected",
    attributes: {
      device_id: "ring_front_door_01",
      timestamp: new Date().toISOString(),
      classification: "human",
      confidence: 0.99,
      zone: "front_porch"
    }
  }
});

describe("@hearthguard/ring-alexa-mcp-bridge", () => {
  it("accepts an authentic HMAC-SHA256 signature", () => {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = computeRingHmacSignature(body, secret, timestamp);
    expect(verifyRingWebhookHmac(body, signature, timestamp, secret)).toEqual({
      valid: true
    });
  });

  it("rejects a tampered payload and a replayed timestamp", () => {
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = computeRingHmacSignature(body, secret, timestamp);
    expect(verifyRingWebhookHmac(`${body} `, signature, timestamp, secret).valid).toBe(false);

    const staleTimestamp = String(Math.floor(Date.now() / 1000) - 900);
    const staleSignature = computeRingHmacSignature(body, secret, staleTimestamp);
    const stale = verifyRingWebhookHmac(body, staleSignature, staleTimestamp, secret);
    expect(stale.valid).toBe(false);
    expect(stale.reason).toMatch(/replay window/i);
  });

  it("rejects malformed signatures without throwing", () => {
    const timestamp = String(Math.floor(Date.now() / 1000));
    expect(verifyRingWebhookHmac(body, "sha256=nope", timestamp, secret).valid).toBe(false);
    expect(verifyRingWebhookHmac(body, undefined, timestamp, secret).valid).toBe(false);
  });

  it("returns a deterministic WHEP loopback answer without a token", async () => {
    const session = await negotiateRingWhepSession(
      "ring_front_door_01",
      "v=0\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\n"
    );
    expect(session.mode).toBe("simulator_loopback");
    expect(session.whepEndpoint).toContain(
      "https://api.amazonvision.com/v1/devices/ring_front_door_01/media/streaming/whep/sessions"
    );
    expect(session.sdpAnswer).toContain("H264/90000");
  });

  it("uses a live partner response when a token is present", async () => {
    const fetchImpl = vi.fn(async () => {
      return new Response("v=0\r\na=recvonly\r\n", {
        status: 201,
        headers: {
          location: "https://api.amazonvision.com/v1/devices/cam/media/streaming/whep/sessions/whep_live_42"
        }
      });
    }) as unknown as typeof fetch;

    const session = await negotiateRingWhepSession(
      "cam",
      "v=0\r\nm=video 9 UDP/TLS/RTP/SAVPF 96\r\n",
      { bearerToken: "partner_token", fetchImpl }
    );

    expect(session.mode).toBe("live_partner_api");
    expect(session.sessionId).toBe("whep_live_42");
    expect(session.sdpAnswer).toContain("recvonly");
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("builds an Alexa+ card with text and an embedded card resource", () => {
    const card: AlexaMcpAppCard = {
      type: "AlexaMcpAppCard",
      version: "2025-11-25",
      scenarioId: "SCN-01",
      severity: "CRITICAL_CARE",
      title: "Sundowning alert",
      subtitle: "Exit threshold",
      spokenAlexaPrompt: "Let's head back inside.",
      beeContextFact: "The dentist appointment is Thursday.",
      fireTvHudActions: [
        { id: "a1", label: "Calm redirect", dpadKey: "1", alexaCommand: "Speak" }
      ]
    };

    const payload = buildAlexaMcpCardPayload(card);
    expect(payload.content).toHaveLength(2);
    expect(payload.content[1]).toMatchObject({
      type: "resource",
      resource: { mimeType: "application/vnd.alexa.mcp.card+json" }
    });
    expect(payload.structuredContent.card.title).toBe("Sundowning alert");
  });
});
