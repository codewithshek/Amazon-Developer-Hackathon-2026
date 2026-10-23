import { useEffect, useState } from "react";
import type {
  CareIncident,
  InterventionResult,
  ScenarioDefinition
} from "../../shared/types";
import { severityLabel, severityTone } from "../lib/format";
import type { TvNavigation } from "../lib/useTvNavigation";
import { CameraFeed } from "./CameraFeed";
import { Glyph } from "./Glyph";

interface HudProps {
  incident: CareIncident;
  scenario: ScenarioDefinition;
  onAction: (id: string) => void;
  onResolve: () => void;
  executingAction: string | null;
  lastAction: InterventionResult | null;
  navigation?: TvNavigation;
}

function useCaption(scenario: ScenarioDefinition): { speaker: string; text: string } | null {
  const [index, setIndex] = useState(0);
  const count = scenario.captions.length;

  useEffect(() => {
    setIndex(0);
    if (count < 2) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, 4800);
    return () => window.clearInterval(timer);
  }, [count, scenario.id]);

  return scenario.captions[index] ?? scenario.captions[0] ?? null;
}

function HudResult({ lastAction }: { lastAction: InterventionResult }) {
  return (
    <div className="hud__result" role="status" aria-live="polite">
      <span className="hud__result-icon" aria-hidden="true">
        <Glyph name="check" size={16} />
      </span>
      <div>
        <span className="hud__result-label">Alexa+ · intervention complete</span>
        <p>“{lastAction.spokenResponse}”</p>
        <span className="hud__result-outcome">{lastAction.outcome}</span>
      </div>
    </div>
  );
}

export function CompactHud({
  incident,
  scenario,
  onAction,
  onResolve,
  executingAction,
  lastAction
}: HudProps) {
  return (
    <div className="hud hud--compact" role="region" aria-label="Alexa+ care card preview">
      <header className="hud__head">
        <span className="hud__tag">
          <span className="live__dot" aria-hidden="true" />
          Care card
        </span>
        <span className="badge badge--sim" style={{ fontSize: "0.72rem", padding: "2px 7px" }}>
          SIMULATED EVENT
        </span>
        <button
          type="button"
          className="hud__close"
          onClick={onResolve}
          aria-label="Close the care card"
          title="Close the care card"
        >
          <Glyph name="back" size={13} />
        </button>
      </header>

      <div className="hud__compact-top">
        <div className="hud__thumb">
          <CameraFeed mode={scenario.camera} active deviceId={scenario.deviceId} />
        </div>
        <div className="hud__compact-copy">
          <p className={`hud__eyebrow hud__eyebrow--${severityTone(scenario.severity)}`}>
            {severityLabel(scenario.severity)}
          </p>
          <h3 className="hud__title">{scenario.title}</h3>
        </div>
      </div>

      <div className="hud__actions hud__actions--compact">
        {scenario.hudActions.map((action) => {
          const executing = executingAction === action.id;
          const done = lastAction?.actionId === action.id;
          return (
            <button
              key={action.id}
              type="button"
              tabIndex={-1}
              className={`hud__action hud__action--compact ${done ? "is-done" : ""}`}
              onClick={() => onAction(action.id)}
              disabled={executingAction !== null}
              aria-label={action.label}
              title={action.label}
            >
              <span className="hud__key">{action.dpadKey}</span>
              <span className="hud__action-copy">{action.shortLabel}</span>
              <span className="hud__action-state" aria-hidden="true">
                {executing ? <span className="spinner" /> : done ? <Glyph name="check" size={13} /> : null}
              </span>
            </button>
          );
        })}
      </div>

      <p className="hud__hint">
        WHEP {incident.whep.mode === "live_partner_api" ? "live" : "sim"} · D-pad ready
      </p>
    </div>
  );
}

export function FullHud({
  incident,
  scenario,
  onAction,
  onResolve,
  executingAction,
  lastAction,
  navigation
}: HudProps) {
  const caption = useCaption(scenario);
  const focusIndex = navigation?.focusIndex;

  // A 10-foot surface should open with a visible, real focus target. Only take
  // focus if the viewer has not already moved to a control outside the card.
  useEffect(() => {
    if (!focusIndex) return;
    const focusFirst = () => {
      const active = document.activeElement;
      const outside =
        active instanceof HTMLElement &&
        active !== document.body &&
        !active.closest(".hud--full");
      if (!outside && !active?.closest("[data-tv-action]")) {
        focusIndex(0);
      }
    };

    const timers = [
      window.setTimeout(focusFirst, 50),
      window.setTimeout(focusFirst, 250),
      window.setTimeout(focusFirst, 450),
      window.setTimeout(focusFirst, 750),
      window.setTimeout(focusFirst, 1100)
    ];
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [focusIndex, incident.id]);

  return (
    <div className="hud hud--full" role="region" aria-label="Alexa+ care card">
      <header className="hud__head">
        <span className="hud__tag">
          <span className="live__dot" aria-hidden="true" />
          Live · Alexa+ care card
        </span>
        <span className="badge badge--sim" style={{ marginLeft: "auto", marginRight: "0.8rem", fontSize: "0.75rem", padding: "2px 8px" }}>
          SIMULATED EVENT
        </span>
        <button type="button" className="hud__close" onClick={onResolve} aria-label="Close the care card">
          <Glyph name="back" size={15} />
          Back
        </button>
      </header>

      <div className="hud__feed" data-hud-reveal>
        <CameraFeed mode={scenario.camera} active deviceId={scenario.deviceId} />
        <span className="hud__feed-badge">
          {incident.whep.mode === "live_partner_api" ? "LIVE WHEP" : "WHEP · SIMULATED"}
        </span>
        <span className="hud__feed-time">02:15:07</span>
      </div>

      <div className="hud__body" data-hud-reveal>
        <p className={`hud__eyebrow hud__eyebrow--${severityTone(scenario.severity)}`}>
          {severityLabel(scenario.severity)} · {scenario.zone}
        </p>
        <h2 className="hud__title">{scenario.title}</h2>
        <p className="hud__summary">{scenario.summary.split(". ")[0]}.</p>
        {caption ? (
          <p className="hud__caption">
            <span>{caption.speaker}</span> “{caption.text}”
          </p>
        ) : null}
      </div>

      <div className="hud__actions" data-hud-reveal>
        {scenario.hudActions.map((action, index) => {
          const focused = navigation?.index === index;
          const executing = executingAction === action.id;
          const done = lastAction?.actionId === action.id;
          return (
            <button
              key={action.id}
              ref={navigation?.registerAction(index)}
              type="button"
              tabIndex={focused ? 0 : -1}
              data-tv-action
              className={`hud__action ${focused ? "is-focused" : ""} ${done ? "is-done" : ""}`}
              onFocus={() => navigation?.setIndex(index)}
              onClick={() => onAction(action.id)}
              disabled={executingAction !== null}
            >
              <span className="hud__key">{action.dpadKey}</span>
              <span className="hud__action-copy">
                <strong>{action.label}</strong>
                <span>{action.outcome}</span>
              </span>
              <span className="hud__action-state" aria-hidden="true">
                {executing ? <span className="spinner" /> : done ? <Glyph name="check" size={18} /> : <Glyph name="chevron" size={16} />}
              </span>
            </button>
          );
        })}
      </div>

      {lastAction ? (
        <HudResult lastAction={lastAction} />
      ) : (
        <p className="hud__hint" data-hud-reveal>
          Arrow keys move · Enter selects · 1–3 quick select · Back closes
        </p>
      )}
    </div>
  );
}
