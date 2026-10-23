import { existsSync } from "node:fs";
import path from "node:path";
import cors from "cors";
import express, {
  type ErrorRequestHandler,
  type NextFunction,
  type Request,
  type Response
} from "express";
import {
  computeRingHmacSignature,
  verifyRingWebhookHmac,
  type RingWebhookEvent
} from "../../packages/ring-alexa-mcp-bridge/src/index";
import type { ScenarioId } from "../shared/types";
import {
  capabilities,
  demoMode,
  getState,
  getTimeline,
  processScenario,
  resetDemo,
  webhookSecret
} from "./careEngine";
import { careEvents } from "./eventBus";
import { handleMcpDelete, handleMcpGet, handleMcpPost } from "./mcp";
import { isScenarioId, SCENARIOS, SCENARIO_ORDER, scenarioForEvent } from "./scenarios";

type RawRequest = Request & { rawBody?: string };

const LOCAL_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
const EXTRA_ORIGIN = process.env.MCP_ALLOWED_ORIGIN;

function originAllowed(origin: string | undefined, host?: string): boolean {
  if (!origin) return true;
  if (LOCAL_ORIGIN.test(origin)) return true;
  if (EXTRA_ORIGIN === "*" || (EXTRA_ORIGIN && origin === EXTRA_ORIGIN)) return true;
  if (host) {
    try {
      const parsed = new URL(origin);
      if (parsed.host === host) return true;
    } catch {
      // ignore malformed URL
    }
  }
  return false;
}

export function createApp() {
  const app = express();
  app.disable("x-powered-by");

  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    next();
  });

  app.use("/api", cors());

  app.use(
    express.json({
      limit: "256kb",
      verify: (req, _res, buffer) => {
        (req as RawRequest).rawBody = buffer.toString("utf8");
      }
    })
  );

  // MCP is intentionally local-first: allow localhost clients, reject
  // arbitrary web origins, and expose the session header to browser JS.
  app.use("/mcp", (req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (!originAllowed(origin, req.headers.host)) {
      res.status(403).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Origin is not allowed to access this MCP server" },
        id: null
      });
      return;
    }
    if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Accept, Mcp-Session-Id, Last-Event-ID, MCP-Protocol-Version"
    );
    res.setHeader("Access-Control-Expose-Headers", "Mcp-Session-Id");
    res.setHeader("Access-Control-Max-Age", "600");
    if (req.method === "OPTIONS") {
      res.status(204).end();
      return;
    }
    next();
  });

  app.post("/mcp", async (req, res, next) => {
    try {
      await handleMcpPost(req, res);
    } catch (error) {
      next(error);
    }
  });
  app.get("/mcp", async (req, res, next) => {
    try {
      await handleMcpGet(req, res);
    } catch (error) {
      next(error);
    }
  });
  app.delete("/mcp", async (req, res, next) => {
    try {
      await handleMcpDelete(req, res);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      service: "hearthguard",
      version: "1.0.0",
      now: new Date().toISOString(),
      capabilities: capabilities()
    });
  });

  app.get("/api/state", (_req, res) => {
    res.json(getState());
  });

  app.get("/api/timeline", (_req, res) => {
    res.json({ timeline: getTimeline() });
  });

  app.get("/api/scenarios", (_req, res) => {
    res.json({
      scenarios: SCENARIO_ORDER.map((id) => SCENARIOS[id])
    });
  });

  app.post("/api/demo/trigger/:scenarioId", async (req, res, next) => {
    try {
      if (!demoMode()) {
        res.status(403).json({ error: "Demo endpoints are disabled." });
        return;
      }
      const scenarioId = req.params.scenarioId;
      if (!isScenarioId(scenarioId)) {
        res.status(404).json({ error: "Unknown scenario" });
        return;
      }

      // Exercise the same signed-ingestion path as a live Ring webhook.
      const body = JSON.stringify({
        data: {
          id: `evt_demo_${Date.now().toString(36)}`,
          type: scenarioId === "SCN-02" ? "ding" : "motion_detected",
          attributes: {
            device_id: SCENARIOS[scenarioId].deviceId,
            timestamp: new Date().toISOString(),
            classification: scenarioId === "SCN-03" ? "package" : "human",
            confidence: 0.98,
            zone: "front_threshold_interior",
            scenario_id: scenarioId
          }
        }
      });
      const timestamp = String(Math.floor(Date.now() / 1000));
      const signature = computeRingHmacSignature(body, webhookSecret(), timestamp);
      const verification = verifyRingWebhookHmac(body, signature, timestamp, webhookSecret());
      if (!verification.valid) {
        res.status(500).json({ error: "Demo signature self-check failed" });
        return;
      }

      const incident = await processScenario(scenarioId, "demo");
      res.json({
        incident,
        verification: {
          algorithm: "HMAC-SHA256",
          valid: true,
          replayWindowSeconds: 300
        }
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/ring/webhook", async (req, res, next) => {
    try {
      const rawBody =
        (req as RawRequest).rawBody ??
        (typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {}));
      const check = verifyRingWebhookHmac(
        rawBody,
        req.get("X-Ring-Signature"),
        req.get("X-Ring-Timestamp"),
        webhookSecret()
      );
      if (!check.valid) {
        res.status(401).json({ error: check.reason ?? "Invalid webhook signature" });
        return;
      }

      const event = req.body as RingWebhookEvent;
      if (!event?.data?.attributes?.device_id) {
        res.status(422).json({ error: "Malformed Ring event payload" });
        return;
      }

      const scenario = scenarioForEvent(
        event.data.attributes.scenario_id,
        event.data.type
      );
      const incident = await processScenario(scenario.id, "ring_webhook");
      res.status(202).json({
        accepted: true,
        eventId: event.data.id,
        incidentId: incident.id
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/events", (req, res) => {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no"
    });
    res.write("retry: 2500\n\n");

    const send = (payload: unknown) => {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };

    send({ type: "hello", at: new Date().toISOString(), data: getState() });

    const unsubscribe = careEvents.subscribe((event) => send(event));
    const keepAlive = setInterval(() => {
      res.write(": hearthguard-keepalive\n\n");
    }, 15000);

    req.on("close", () => {
      clearInterval(keepAlive);
      unsubscribe();
      res.end();
    });
  });

  app.post("/api/demo/reset", (_req, res) => {
    if (!demoMode()) {
      res.status(403).json({ error: "Demo endpoints are disabled." });
      return;
    }
    res.json(resetDemo());
  });

  app.use((req, res, next) => {
    const dist = path.resolve(process.cwd(), "dist");
    const indexHtml = path.join(dist, "index.html");
    if (
      req.method === "GET" &&
      existsSync(indexHtml) &&
      !req.path.startsWith("/api") &&
      !req.path.startsWith("/mcp")
    ) {
      express.static(dist)(req, res, () => res.sendFile(indexHtml));
      return;
    }
    next();
  });

  const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    if (res.headersSent) return;
    const status =
      typeof error === "object" && error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
    res.status(status).json({
      error: status === 500 ? "Internal server error" : String(error.message ?? error)
    });
  };
  app.use(errorHandler);

  return app;
}

export const app = createApp();
