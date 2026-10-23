# @hearthguard/ring-alexa-mcp-bridge

Small, dependency-free primitives for putting a Ring-style threshold in front of
an Alexa+ MCP server.

- `computeRingHmacSignature` / `verifyRingWebhookHmac` — HMAC-SHA256 over
  `<timestamp>.<raw body>`, constant-time comparison, five-minute replay window.
- `negotiateRingWhepSession` — RFC 8829 WHEP offer/answer negotiation with a
  deterministic loopback answer when no partner token is present.
- `buildAlexaMcpCardPayload` — returns MCP `TextContent` plus an
  `application/vnd.alexa.mcp.card+json` embedded resource.

The package is framework-free and runs on Node 20+.

```ts
import {
  computeRingHmacSignature,
  verifyRingWebhookHmac
} from "@hearthguard/ring-alexa-mcp-bridge";

const timestamp = String(Math.floor(Date.now() / 1000));
const signature = computeRingHmacSignature(rawBody, secret, timestamp);
const check = verifyRingWebhookHmac(rawBody, signature, timestamp, secret);
```

> This is the open-source companion to the HearthGuard reference application.
> It is not an official Amazon or Ring SDK. Live Ring calls require partner
> credentials and must be validated against your onboarding documentation.
