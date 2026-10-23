import { app } from "./app";

const port = Number(process.env.PORT || 4000);

const server = app.listen(port, () => {
  const bedrock = process.env.AWS_ACCESS_KEY_ID ? "live" : "replay";
  const ring = process.env.RING_OAUTH_TOKEN ? "live" : "simulator";
  console.log(
    `HearthGuard server listening on http://localhost:${port}  ·  Bedrock ${bedrock}  ·  Ring ${ring}`
  );
  console.log(`MCP Streamable HTTP: http://localhost:${port}/mcp`);
});

function shutdown(signal: string) {
  console.log(`\n${signal} received. Closing HearthGuard.`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 4000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
