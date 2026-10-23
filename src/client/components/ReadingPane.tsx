import { SCENARIOS, SCENARIO_ORDER } from "../../server/scenarios";
import type {
  CareIncident,
  InterventionResult,
  ScenarioDefinition,
  ScenarioId
} from "../../shared/types";
import {
  formatStamp,
  scenarioLabel,
  severityLabel,
  severityTone,
  sourceLabel
} from "../lib/format";
import { Glyph } from "./Glyph";
import { PaneHeader } from "./PaneHeader";

interface ReadingPaneProps {
  incident: CareIncident | null;
  scenario: ScenarioDefinition;
  loading: boolean;
  lastAction: InterventionResult | null;
  busyScenario: ScenarioId | null;
  onRun: (id: ScenarioId) => void;
  onResolve: () => void;
}

export function ReadingPane({
  incident,
  scenario,
  loading,
  lastAction,
  busyScenario,
  onRun,
  onResolve
}: ReadingPaneProps) {
  const meta = incident
    ? `${incident.trace.modelId.split(".").slice(-1)[0] ?? "Nova"} · ${
        incident.trace.inferenceMode === "aws_bedrock_live" ? "live" : "recorded trace"
      }`
    : "Nova · replay";

  return (
    <section className="pane pane--reading" aria-labelledby="reading-heading">
      <PaneHeader id="reading-heading" index="02" title="The reading" meta={meta} />

      {loading && !incident ? (
        <div className="reading-skeleton" aria-busy="true" aria-label="Loading the care reading">
          <span className="skeleton skeleton--eyebrow" />
          <span className="skeleton skeleton--title" />
          <span className="skeleton skeleton--title skeleton--short" />
          <span className="skeleton skeleton--line" />
          <span className="skeleton skeleton--line" />
          <span className="skeleton skeleton--line skeleton--short" />
          <span className="skeleton skeleton--block" />
        </div>
      ) : !incident ? (
        <div className="reading-empty">
          <p className="eyebrow">Standby · night watch</p>
          <h3 className="reading-empty__title">The house is quiet.</h3>
          <p className="reading-empty__body">
            No one is at the threshold. Choose a replay to watch Ring vision, Bee memory and
            Alexa+ resolve a care moment together.
          </p>
          <div className="reading-choices">
            {SCENARIO_ORDER.map((id) => {
              const item = SCENARIOS[id];
              const busy = busyScenario === id;
              return (
                <button
                  key={id}
                  type="button"
                  className={`choice ${busy ? "is-busy" : ""}`}
                  onClick={() => onRun(id)}
                  disabled={busyScenario !== null && busyScenario !== id}
                >
                  <span className="choice__num">{item.number}</span>
                  <span className="choice__copy">
                    <strong>{scenarioLabel(id)}</strong>
                    <span>
                      {item.time} {item.period} · {item.eyebrow}
                    </span>
                  </span>
                  <Glyph name="arrow" size={15} />
                </button>
              );
            })}
          </div>
          <p className="reading-empty__note">
            The default replay is the 2:15 AM night exit. Press 1, 2 or 3 on the care card to
            act once it arrives.
          </p>
        </div>
      ) : (
        <article className="reading" key={incident.id}>
          <div className="reading__eyebrow">
            <span className={`severity severity--${severityTone(scenario.severity)}`}>
              {severityLabel(scenario.severity)}
            </span>
            <span className="mono">
              {incident.scenarioId} · {sourceLabel(incident.source)}
            </span>
          </div>

          <h3 className="reading__title">{scenario.title}</h3>
          <p className="reading__summary">{scenario.summary}</p>

          <dl className="reading-facts">
            <div>
              <dt>Resident</dt>
              <dd>{scenario.resident}</dd>
            </div>
            <div>
              <dt>Intent</dt>
              <dd>{scenario.intent}</dd>
            </div>
            <div>
              <dt>Opened</dt>
              <dd>{formatStamp(incident.startedAt)}</dd>
            </div>
          </dl>

          <section className="reading-block memory" aria-labelledby="memory-heading">
            <div className="section-label">
              <span id="memory-heading">Remembered · Bee</span>
              <span>
                {incident.trace.beeMemory.source === "bee_cli_live_proxy"
                  ? "live proxy"
                  : "recorded fixture"}
              </span>
            </div>
            <blockquote className="memory__quote">
              <p>{scenario.beeFact.quote}</p>
              <footer>
                <span>{scenario.beeFact.speaker}</span>
                <time dateTime={scenario.beeFact.capturedAt}>
                  {formatStamp(scenario.beeFact.capturedAt)}
                </time>
              </footer>
            </blockquote>
            <p className="memory__commitment">{scenario.beeFact.commitment}</p>
          </section>

          <section className="reading-block trace" aria-labelledby="trace-heading">
            <div className="section-label">
              <span id="trace-heading">Reasoning trace</span>
              <span
                title="Local pipeline time for this replay. This is not a model benchmark."
              >
                {incident.trace.latencyMs.toFixed(2)} ms pipeline
              </span>
            </div>
            <ol className="trace__list">
              {incident.trace.steps.map((step, index) => {
                const parts = step.split(" · ");
                const actor = parts[0] ?? "Step";
                const text = parts.length > 1 ? parts.slice(1).join(" · ") : step;
                return (
                  <li className="trace__item" key={`${index}-${actor}`}>
                    <span className="trace__index">{String(index + 1).padStart(2, "0")}</span>
                    <span className="trace__actor">{actor}</span>
                    <span className="trace__text">{text}</span>
                  </li>
                );
              })}
            </ol>
          </section>

          <section className="reading-block voice" aria-labelledby="voice-heading">
            <div className="section-label">
              <span id="voice-heading">Alexa+ voice</span>
              <span>spoken response</span>
            </div>
            <blockquote className="voice__quote">
              “{incident.trace.card.spokenAlexaPrompt}”
            </blockquote>
          </section>

          {lastAction ? (
            <div className="action-result" role="status">
              <span className="action-result__icon" aria-hidden="true">
                <Glyph name="check" size={16} />
              </span>
              <div>
                <span className="section-label">
                  <span>Alexa+ · last action</span>
                  <span>{formatStamp(lastAction.at)}</span>
                </span>
                <p className="action-result__voice">“{lastAction.spokenResponse}”</p>
                <p className="action-result__outcome">{lastAction.outcome}</p>
              </div>
            </div>
          ) : null}

          <button type="button" className="button button--quiet reading__resolve" onClick={onResolve}>
            Write care note & close
            <Glyph name="enter" size={15} />
          </button>
        </article>
      )}
    </section>
  );
}
