import type { CareSeverity, IncidentSource, ScenarioId } from "../../shared/types";

export function formatClock(value: string | number | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function formatTimecode(value: string | number | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--:--";
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
}

export function formatStamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date
    .toLocaleString([], {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    })
    .replace(",", " ·");
}

export function shortId(value: string | null | undefined, length = 8): string {
  if (!value) return "pending";
  return value.length > length ? value.slice(0, length) : value;
}

export function severityLabel(severity: CareSeverity): string {
  switch (severity) {
    case "CRITICAL_CARE":
      return "Critical care";
    case "ACCESSIBILITY_RELAY":
      return "Accessibility relay";
    case "COLD_CHAIN_CUSTODY":
      return "Cold-chain custody";
    default:
      return severity;
  }
}

export function severityTone(severity: CareSeverity): "amber" | "cool" | "sage" {
  if (severity === "ACCESSIBILITY_RELAY") return "cool";
  if (severity === "COLD_CHAIN_CUSTODY") return "sage";
  return "amber";
}

export function sourceLabel(source: IncidentSource): string {
  switch (source) {
    case "ring_webhook":
      return "HMAC webhook";
    case "mcp":
      return "MCP tool call";
    default:
      return "Signed replay";
  }
}

export function scenarioLabel(id: ScenarioId): string {
  if (id === "SCN-02") return "Courier relay";
  if (id === "SCN-03") return "Cold chain";
  return "Night exit";
}
