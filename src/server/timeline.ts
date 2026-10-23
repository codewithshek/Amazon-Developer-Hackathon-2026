import type { ScenarioId, TimelineEntry, TimelineKind } from "../shared/types";

const MAX_ENTRIES = 120;
const entries: TimelineEntry[] = [];

export function addTimeline(
  kind: TimelineKind,
  title: string,
  detail: string,
  scenarioId?: ScenarioId
): TimelineEntry {
  const entry: TimelineEntry = {
    id: `tl_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    at: new Date().toISOString(),
    kind,
    title,
    detail,
    scenarioId
  };
  entries.push(entry);
  if (entries.length > MAX_ENTRIES) entries.splice(0, entries.length - MAX_ENTRIES);
  return entry;
}

export function listTimeline(): TimelineEntry[] {
  return [...entries];
}

export function clearTimeline(): void {
  entries.length = 0;
}
