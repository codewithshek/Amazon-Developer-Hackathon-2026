import crypto from "node:crypto";

export const ALEXA_CARD_MIME = "application/vnd.alexa.mcp.card+json" as const;

export type ScenarioId = "SCN-01" | "SCN-02" | "SCN-03";
export type CareSeverity =
  | "CRITICAL_CARE"
  | "ACCESSIBILITY_RELAY"
  | "COLD_CHAIN_CUSTODY";

export interface RingWebhookEvent {
  data: {
    id: string;
    type: "motion_detected" | "ding" | "person_detected" | "package_detected";
    attributes: {
      device_id: string;
      timestamp: string;
      classification: "human" | "package" | "vehicle" | "animal";
      confidence: number;
      zone: string;
      scenario_id?: ScenarioId;
      [key: string]: unknown;
    };
  };
}

export interface AlexaMcpCardAction {
  id: string;
  label: string;
  dpadKey: "1" | "2" | "3";
  alexaCommand: string;
  spokenResponse?: string;
  outcome?: string;
}

export interface AlexaMcpAppCard {
  type: "AlexaMcpAppCard";
  version: "2025-11-25";
  scenarioId: string;
  severity: CareSeverity;
  title: string;
  subtitle: string;
  spokenAlexaPrompt: string;
  beeContextFact: string;
  evidence?: Array<{ label: string; value: string }>;
  captions?: Array<{ speaker: string; text: string }>;
  fireTvHudActions: AlexaMcpCardAction[];
}

export interface AlexaMcpCardPayload {
  content: Array<
    | { type: "text"; text: string }
    | {
        type: "resource";
        resource: {
          uri: string;
          mimeType: typeof ALEXA_CARD_MIME;
          text: string;
        };
      }
  >;
  structuredContent: { card: AlexaMcpAppCard };
}

export function computeRingHmacSignature(
  rawBody: string,
  secret: string,
  timestamp: string
): string {
  const payload = `${timestamp}.${rawBody}`;
  const hex = crypto.createHmac("sha256", secret).update(payload, "utf8").digest("hex");
  return `sha256=${hex}`;
}

/**
 * Verify a Ring-style webhook in constant time.
 *
 * The signature covers `<timestamp>.<raw body>`, which prevents a captured
 * payload from being re-used after the replay window has elapsed.
 */
export function verifyRingWebhookHmac(
  rawBody: string,
  signatureHeader: string | undefined,
  timestampHeader: string | undefined,
  secret: string,
  maxSkewSeconds = 300
): { valid: boolean; reason?: string } {
  if (!signatureHeader || !timestampHeader) {
    return { valid: false, reason: "Missing X-Ring-Signature or X-Ring-Timestamp header" };
  }
  if (!/^sha256=[a-f0-9]{64}$/i.test(signatureHeader)) {
    return { valid: false, reason: "Malformed X-Ring-Signature header" };
  }
  const timestamp = Number(timestampHeader);
  if (!Number.isFinite(timestamp) || !/^\d{9,12}$/.test(timestampHeader)) {
    return { valid: false, reason: "Invalid X-Ring-Timestamp header" };
  }
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (Math.abs(nowSeconds - timestamp) > maxSkewSeconds) {
    return { valid: false, reason: "Webhook timestamp outside the 300s replay window" };
  }
  const expected = computeRingHmacSignature(rawBody, secret, timestampHeader);
  const expectedBuffer = Buffer.from(expected, "utf8");
  const receivedBuffer = Buffer.from(signatureHeader, "utf8");
  if (
    expectedBuffer.length !== receivedBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  ) {
    return { valid: false, reason: "HMAC-SHA256 digest mismatch" };
  }
  return { valid: true };
}

export interface WhepSessionOptions {
  bearerToken?: string;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export interface WhepSessionResult {
  sessionId: string;
  whepEndpoint: string;
  sdpAnswer: string;
  mode: "live_partner_api" | "simulator_loopback";
}

export class WhepNegotiationError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = "WhepNegotiationError";
  }
}

const SIMULATOR_TOKEN = "SIMULATOR_TOKEN";

function loopbackAnswer(deviceId: string): WhepSessionResult {
  const sessionId = `whep_sim_${deviceId}_${Date.now().toString(36)}`;
  const endpoint = `https://api.amazonvision.com/v1/devices/${encodeURIComponent(
    deviceId
  )}/media/streaming/whep/sessions`;
  return {
    sessionId,
    whepEndpoint: endpoint,
    sdpAnswer: [
      "v=0",
      "o=- 0 2 IN IP4 127.0.0.1",
      "s=HearthGuard WHEP loopback",
      "t=0 0",
      "a=group:BUNDLE 0",
      "m=video 9 UDP/TLS/RTP/SAVPF 96",
      "c=IN IP4 0.0.0.0",
      "a=rtcp:9 IN IP4 0.0.0.0",
      "a=ice-ufrag:hearth",
      "a=ice-pwd:guardloopback000000000000",
      "a=fingerprint:sha-256 00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF",
      "a=setup:active",
      "a=mid:0",
      "a=recvonly",
      "a=rtcp-mux",
      "a=rtpmap:96 H264/90000",
      "a=fmtp:96 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=42e01f",
      ""
    ].join("\r\n"),
    mode: "simulator_loopback"
  };
}

/**
 * Negotiate an RFC 8829 WHEP session. Without a real partner token the
 * function returns a deterministic loopback answer so the UI and tests can
 * run with zero hardware and zero cloud credentials.
 */
export async function negotiateRingWhepSession(
  deviceId: string,
  sdpOffer: string,
  bearerTokenOrOptions: string | WhepSessionOptions = {}
): Promise<WhepSessionResult> {
  const options: WhepSessionOptions =
    typeof bearerTokenOrOptions === "string"
      ? { bearerToken: bearerTokenOrOptions }
      : bearerTokenOrOptions;

  if (!deviceId.trim()) throw new Error("deviceId is required");
  if (!sdpOffer.includes("v=0")) throw new Error("A valid SDP offer is required");

  const baseUrl = (options.baseUrl ?? "https://api.amazonvision.com").replace(/\/+$/, "");
  const endpoint = `${baseUrl}/v1/devices/${encodeURIComponent(
    deviceId
  )}/media/streaming/whep/sessions`;

  if (!options.bearerToken || options.bearerToken === SIMULATOR_TOKEN) {
    return loopbackAnswer(deviceId);
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const signal =
    typeof AbortSignal !== "undefined" && "timeout" in AbortSignal
      ? AbortSignal.timeout(options.timeoutMs ?? 8000)
      : undefined;

  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.bearerToken}`,
      "Content-Type": "application/sdp",
      Accept: "application/sdp"
    },
    body: sdpOffer,
    signal
  });

  if (response.status !== 201 && response.status !== 200) {
    throw new WhepNegotiationError(
      `WHEP negotiation failed with HTTP ${response.status}`,
      response.status
    );
  }

  const sdpAnswer = await response.text();
  const location = response.headers.get("location");
  const resolvedLocation = location ? new URL(location, endpoint).toString() : endpoint;
  const sessionId =
    response.headers.get("x-whep-session-id") ??
    resolvedLocation.split("/").filter(Boolean).pop() ??
    crypto.randomUUID();

  return {
    sessionId,
    whepEndpoint: resolvedLocation,
    sdpAnswer,
    mode: "live_partner_api"
  };
}

export function buildAlexaMcpCardPayload(card: AlexaMcpAppCard): AlexaMcpCardPayload {
  return {
    content: [
      {
        type: "text",
        text: `[${card.severity}] ${card.title}: ${card.subtitle} | Alexa+ action: "${card.spokenAlexaPrompt}"`
      },
      {
        type: "resource",
        resource: {
          uri: `care://interventions/${card.scenarioId.toLowerCase()}`,
          mimeType: ALEXA_CARD_MIME,
          text: JSON.stringify(card, null, 2)
        }
      }
    ],
    structuredContent: { card }
  };
}

export function createRingWebhookBody(
  scenarioId: ScenarioId,
  deviceId: string,
  overrides: Partial<RingWebhookEvent["data"]["attributes"]> = {}
): RingWebhookEvent {
  return {
    data: {
      id: `evt_${Date.now().toString(36)}`,
      type: scenarioId === "SCN-02" ? "ding" : "motion_detected",
      attributes: {
        device_id: deviceId,
        timestamp: new Date().toISOString(),
        classification: scenarioId === "SCN-03" ? "package" : "human",
        confidence: 0.98,
        zone: "front_threshold_interior",
        scenario_id: scenarioId,
        ...overrides
      }
    }
  };
}
