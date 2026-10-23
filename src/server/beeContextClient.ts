import type { BeeMemoryFact, ScenarioId } from "../shared/types";
import { SCENARIOS } from "./scenarios";

/**
 * Bee's local proxy (`bee proxy`) exposes spoken memory at :8787. The proxy is
 * optional: a recorded household fixture keeps the demo deterministic when the
 * daemon or a physical Bee is not present.
 */
export async function fetchBeeAmbientContext(scenarioId: ScenarioId): Promise<BeeMemoryFact> {
  const scenario = SCENARIOS[scenarioId];
  const fallback: BeeMemoryFact = {
    id: `bee_fact_${scenarioId.toLowerCase()}`,
    timestamp: scenario.beeFact.capturedAt,
    speaker: scenario.beeFact.speaker,
    transcriptSnippet: scenario.beeFact.quote.replace(/[“”]/g, ""),
    extractedCommitment: scenario.beeFact.commitment,
    source: "bee_recorded_session_fixture"
  };

  const proxyUrl = process.env.BEE_PROXY_URL;
  if (!proxyUrl) return fallback;

  try {
    const response = await fetch(`${proxyUrl}?scenario=${encodeURIComponent(scenarioId)}`, {
      signal: AbortSignal.timeout(400),
      headers: { Accept: "application/json" }
    });
    if (!response.ok) return fallback;

    const data = (await response.json()) as Partial<BeeMemoryFact> & {
      facts?: Array<Partial<BeeMemoryFact>>;
    };
    const candidate = data.facts?.[0] ?? data;
    if (
      typeof candidate.extractedCommitment === "string" &&
      candidate.extractedCommitment.trim().length > 0
    ) {
      return {
        id: candidate.id ?? fallback.id,
        timestamp: candidate.timestamp ?? fallback.timestamp,
        speaker: candidate.speaker ?? fallback.speaker,
        transcriptSnippet: candidate.transcriptSnippet ?? fallback.transcriptSnippet,
        extractedCommitment: candidate.extractedCommitment,
        source: "bee_cli_live_proxy"
      };
    }
  } catch {
    // A missing Bee daemon is an expected offline state, not a failure.
  }

  return fallback;
}
