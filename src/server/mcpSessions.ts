import type { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

/** Live MCP Streamable HTTP sessions, keyed by `Mcp-Session-Id`. */
export const mcpSessions = new Map<string, StreamableHTTPServerTransport>();

export function mcpSessionCount(): number {
  return mcpSessions.size;
}
