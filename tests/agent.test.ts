import { describe, expect, it } from "vitest";
import { fetchBeeAmbientContext } from "../src/server/beeContextClient";
import { runBedrockStrandsThresholdAgent } from "../src/server/bedrockStrandsAgent";

describe("HearthGuard reasoning layer", () => {
  it("falls back to a deterministic household memory without a Bee daemon", async () => {
    const fact = await fetchBeeAmbientContext("SCN-01");
    expect(fact.source).toBe("bee_recorded_session_fixture");
    expect(fact.extractedCommitment).toMatch(/dentist/i);
  });

  it("produces a replay trace and a complete Alexa+ card", async () => {
    const trace = await runBedrockStrandsThresholdAgent("SCN-02");
    expect(trace.inferenceMode).toBe("deterministic_recorded_trace");
    expect(trace.modelId).toBe(process.env.BEDROCK_MODEL_ID || "amazon.nova-pro-v1:0");
    expect(trace.card.version).toBe("2025-11-25");
    expect(trace.card.severity).toBe("ACCESSIBILITY_RELAY");
    expect(trace.card.fireTvHudActions).toHaveLength(3);
    expect(trace.card.captions?.length).toBeGreaterThan(0);
    expect(trace.steps).toHaveLength(4);
    expect(trace.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("keeps all three scenarios grounded in a household fact", async () => {
    for (const scenarioId of ["SCN-01", "SCN-02", "SCN-03"] as const) {
      const trace = await runBedrockStrandsThresholdAgent(scenarioId);
      expect(trace.card.beeContextFact.length).toBeGreaterThan(20);
      expect(trace.card.fireTvHudActions.map((action) => action.dpadKey)).toEqual([
        "1",
        "2",
        "3"
      ]);
    }
  });
});
