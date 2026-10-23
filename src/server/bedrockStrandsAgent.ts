import {
  BedrockRuntimeClient,
  InvokeModelCommand
} from "@aws-sdk/client-bedrock-runtime";
import type { AlexaMcpAppCard, AgentTrace, ScenarioId } from "../shared/types";
import { fetchBeeAmbientContext } from "./beeContextClient";
import { SCENARIOS } from "./scenarios";

export const DEFAULT_MODEL_ID = process.env.BEDROCK_MODEL_ID || "amazon.nova-pro-v1:0";

export function hasBedrockCredentials(): boolean {
  return Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
}

function buildCard(scenarioId: ScenarioId, spokenAlexaPrompt: string, beeContextFact: string): AlexaMcpAppCard {
  const scenario = SCENARIOS[scenarioId];
  return {
    type: "AlexaMcpAppCard",
    version: "2025-11-25",
    scenarioId,
    severity: scenario.severity,
    title: scenario.title,
    subtitle: scenario.summary.split(". ")[0] + ".",
    spokenAlexaPrompt,
    beeContextFact,
    evidence: scenario.evidence,
    captions: scenario.captions,
    fireTvHudActions: scenario.hudActions.map(({ id, label, dpadKey, alexaCommand, spokenResponse, outcome }) => ({
      id,
      label,
      dpadKey,
      alexaCommand,
      spokenResponse,
      outcome
    }))
  };
}

function safeLiveSentence(text: string): string {
  return text
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 420);
}

async function invokeNova(
  scenarioId: ScenarioId,
  beeContext: string
): Promise<string | undefined> {
  const scenario = SCENARIOS[scenarioId];
  const client = new BedrockRuntimeClient({
    region: process.env.AWS_REGION || "us-east-1"
  });

  const prompt = [
    "You are HearthGuard, a calm care concierge speaking through an Alexa+ device.",
    "Write one short spoken intervention (max 55 words) for this threshold moment.",
    "Be specific, warm, and non-alarming. Do not mention cameras, models, or monitoring.",
    `Situation: ${scenario.title} ${scenario.summary}`,
    `Household memory: ${beeContext}`,
    "Return only the sentence to speak."
  ].join("\n");

  const command = new InvokeModelCommand({
    modelId: DEFAULT_MODEL_ID,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      messages: [{ role: "user", content: [{ text: prompt }] }],
      inferenceConfig: {
        max_new_tokens: 180,
        temperature: 0.2,
        top_p: 0.9
      }
    })
  });

  const response = await client.send(command, {
    abortSignal: AbortSignal.timeout(7000)
  });

  const decoded = JSON.parse(new TextDecoder().decode(response.body)) as {
    output?: { message?: { content?: Array<{ text?: string }> } };
  };
  const text = decoded.output?.message?.content?.[0]?.text;
  return text ? safeLiveSentence(text) : undefined;
}

export async function runBedrockStrandsThresholdAgent(
  scenarioId: ScenarioId
): Promise<AgentTrace> {
  const startedAt = performance.now();
  const scenario = SCENARIOS[scenarioId];
  const beeMemory = await fetchBeeAmbientContext(scenarioId);
  let inferenceMode: AgentTrace["inferenceMode"] = "deterministic_recorded_trace";
  let spoken = scenario.spokenAlexaPrompt;

  if (hasBedrockCredentials()) {
    try {
      const live = await invokeNova(scenarioId, beeMemory.extractedCommitment);
      if (live) {
        spoken = live;
        inferenceMode = "aws_bedrock_live";
      }
    } catch {
      // Entitlement, region, or network failure: keep the demo usable.
      inferenceMode = "deterministic_recorded_trace";
    }
  }

  const latencyMs = Math.round((performance.now() - startedAt) * 100) / 100;
  const steps = [
    `Bee · recalled ${beeMemory.source === "bee_cli_live_proxy" ? "live proxy" : "recorded"} memory — “${beeMemory.extractedCommitment}”`,
    `Nova · fused Ring threshold + household memory (${inferenceMode === "aws_bedrock_live" ? "live" : "recorded trace"}, ${latencyMs} ms)`,
    `Policy · selected a ${scenario.severity === "CRITICAL_CARE" ? "gentle redirect" : scenario.severity === "ACCESSIBILITY_RELAY" ? "visual relay" : "timed custody"} response`,
    "Alexa+ · built a card with three D-pad actions for the Fire TV"
  ];

  return {
    scenarioId,
    modelId: DEFAULT_MODEL_ID,
    inferenceMode,
    latencyMs,
    beeMemory,
    steps,
    card: buildCard(scenarioId, spoken, beeMemory.extractedCommitment)
  };
}
