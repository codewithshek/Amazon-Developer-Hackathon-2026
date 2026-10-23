import type {
  CareIncident,
  InterventionResult,
  ScenarioDefinition
} from "../../shared/types";
import { severityLabel, severityTone } from "../lib/format";
import type { TvNavigation } from "../lib/useTvNavigation";
import { Glyph } from "./Glyph";

interface ActionDeckProps {
  incident: CareIncident;
  scenario: ScenarioDefinition;
  navigation: TvNavigation;
  executingAction: string | null;
  lastAction: InterventionResult | null;
  onAction: (id: string) => void;
  onResolve: () => void;
}

export function ActionDeck({
  incident,
  scenario,
  navigation,
  executingAction,
  lastAction,
  onAction,
  onResolve
}: ActionDeckProps) {
  return (
    <div className="deck" aria-label="Alexa+ care card actions">
      <div className="deck__head">
        <span className="section-label section-label--inline">
          <span>Alexa+ care card</span>
        </span>
        <span className={`severity severity--${severityTone(scenario.severity)} severity--small`}>
          {severityLabel(scenario.severity)}
        </span>
      </div>

      <div className="deck__actions">
        {scenario.hudActions.map((action, index) => {
          const focused = navigation.index === index;
          const executing = executingAction === action.id;
          const done = lastAction?.actionId === action.id;
          return (
            <button
              key={action.id}
              ref={navigation.registerAction(index)}
              type="button"
              className={`deck__action ${focused ? "is-active" : ""} ${done ? "is-done" : ""}`}
              onFocus={() => navigation.setIndex(index)}
              onClick={() => onAction(action.id)}
              disabled={executingAction !== null}
              aria-label={`${action.label}. ${action.outcome}`}
            >
              <span className="deck__key">{action.dpadKey}</span>
              <span className="deck__copy">
                <strong>{action.label}</strong>
                <span>{action.outcome}</span>
              </span>
              <span className="deck__state" aria-hidden="true">
                {executing ? (
                  <span className="spinner" />
                ) : done ? (
                  <Glyph name="check" size={15} />
                ) : (
                  <Glyph name="chevron" size={14} />
                )}
              </span>
            </button>
          );
        })}
      </div>

      {lastAction ? (
        <div className="deck__result" role="status" aria-live="polite">
          <span className="deck__result-label">Alexa+</span>
          <p>“{lastAction.spokenResponse}”</p>
        </div>
      ) : (
        <p className="deck__hint">
          {incident.status === "resolved"
            ? "This incident is closed. Run a replay to open a new care card."
            : "Arrow keys move · Enter selects · Back closes the card"}
        </p>
      )}

      <div className="deck__foot">
        <button type="button" className="button button--quiet deck__resolve" onClick={onResolve}>
          Care note & close
          <Glyph name="enter" size={14} />
        </button>
        <span className="deck__meta mono">
          {incident.card.fireTvHudActions.length} actions · {incident.card.version}
        </span>
      </div>
    </div>
  );
}
