import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { SCENARIOS, SCENARIO_ORDER } from "../../server/scenarios";
import type {
  CareIncident,
  InterventionResult,
  ScenarioDefinition,
  ScenarioId
} from "../../shared/types";
import { formatClock, scenarioLabel } from "../lib/format";
import type { RoomToneController } from "../lib/roomTone";
import type { TvNavigation } from "../lib/useTvNavigation";
import { AmbientCanvas } from "./AmbientCanvas";
import { CompactHud, FullHud } from "./Hud";
import { Glyph } from "./Glyph";

interface TvStageProps {
  incident: CareIncident | null;
  scenario: ScenarioDefinition;
  mode: "studio" | "firetv";
  sound: RoomToneController;
  lastAction: InterventionResult | null;
  executingAction: string | null;
  navigation?: TvNavigation;
  onAction: (id: string) => void;
  onResolve: () => void;
  onRun?: (id: ScenarioId) => void;
  busyScenario?: ScenarioId | null;
}

export function TvStage({
  incident,
  scenario,
  mode,
  sound,
  lastAction,
  executingAction,
  navigation,
  onAction,
  onResolve,
  onRun,
  busyScenario
}: TvStageProps) {
  const [shown, setShown] = useState<CareIncident | null>(incident);
  const [leaving, setLeaving] = useState(false);
  const [clock, setClock] = useState(() => formatClock(new Date()));
  const hudRef = useRef<HTMLDivElement>(null);
  const dimRef = useRef<HTMLDivElement>(null);

  const active = Boolean(shown) && !leaving;

  useEffect(() => {
    const timer = window.setInterval(() => setClock(formatClock(new Date())), 20000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (incident) {
      setShown(incident);
      setLeaving(false);
      return;
    }
    if (!shown) return;
    setLeaving(true);
    const timer = window.setTimeout(() => {
      setShown(null);
      setLeaving(false);
    }, 460);
    return () => window.clearTimeout(timer);
  }, [incident, shown]);

  useEffect(() => {
    if (!shown || leaving) return;
    const layer = hudRef.current;
    const hud = layer?.querySelector<HTMLElement>(".hud");
    if (!layer || !hud) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      if (dimRef.current) dimRef.current.style.opacity = "1";
      return;
    }

    const context = gsap.context(() => {
      gsap.fromTo(
        hud,
        { autoAlpha: 0, y: mode === "firetv" ? 30 : 16, scale: 0.975 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.62, ease: "power3.out" }
      );
      const reveals = hud.querySelectorAll("[data-hud-reveal]");
      if (reveals.length > 0) {
        gsap.fromTo(
          reveals,
          { autoAlpha: 0, y: 12 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.07,
            delay: 0.18,
            ease: "power2.out"
          }
        );
      }
      if (dimRef.current) {
        gsap.fromTo(dimRef.current, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: "power2.out" });
      }
    }, layer);

    return () => context.revert();
  }, [leaving, mode, shown?.id]);

  return (
    <div className={`tv tv--${mode} ${active ? "is-alert" : ""}`}>
      <div className="tv__screen">
        <AmbientCanvas playing={!active} />
        <div className="tv__grade" aria-hidden="true" />
        <div
          ref={dimRef}
          className={`tv__dim ${active ? "is-on" : ""}`}
          aria-hidden="true"
        />

        <header className="tv__chrome">
          <div className="tv__chrome-left">
            {mode === "firetv" ? (
              <a className="tv__exit" href={`/?scenario=${scenario.id}`}>
                <Glyph name="back" size={15} />
                Studio
              </a>
            ) : null}
            <span className="tv__source">
              <span className="live__dot" aria-hidden="true" />
              Fire TV · living room
            </span>
          </div>
          <div className="tv__chrome-right">
            <button
              type="button"
              className={`tv__sound ${sound.enabled ? "is-on" : ""}`}
              onClick={sound.toggle}
              aria-pressed={sound.enabled}
              title="Toggle the generated room tone. It ducks to 20% while a care card is open."
            >
              <Glyph name={sound.enabled ? "sound" : "mute"} size={15} />
              <span>{sound.enabled ? `${sound.level}%` : "Sound off"}</span>
              <span className="tv__meter" aria-hidden="true">
                <i style={{ width: `${sound.level}%` }} />
              </span>
            </button>
            <span className="tv__clock">{clock}</span>
          </div>
        </header>

        <div className={`tv__film ${active ? "is-paused" : ""}`}>
          <span className="tv__kicker">{active ? "Paused for care" : "Now playing · 4K"}</span>
          <h3 className="tv__film-title">The Long Way Home</h3>
          <div className="tv__progress" aria-hidden="true">
            <span />
          </div>
          <span className="tv__runtime">{active ? "00:41:12" : "00:41:12 / 01:48:00"}</span>
        </div>

        {shown ? (
          <div ref={hudRef} className={`hud-layer ${leaving ? "is-leaving" : ""}`}>
            {mode === "firetv" ? (
              <FullHud
                incident={shown}
                scenario={shown.scenario}
                onAction={onAction}
                onResolve={onResolve}
                executingAction={executingAction}
                lastAction={lastAction}
                navigation={navigation}
              />
            ) : (
              <CompactHud
                incident={shown}
                scenario={shown.scenario}
                onAction={onAction}
                onResolve={onResolve}
                executingAction={executingAction}
                lastAction={lastAction}
              />
            )}
          </div>
        ) : null}

        {mode === "firetv" && !shown && !leaving ? (
          <div className="tv__quiet">
            <p className="eyebrow">Night watch · standby</p>
            <h2 className="tv__quiet-title">The house is quiet.</h2>
            <p className="tv__quiet-body">
              Choose a threshold replay to watch the care card arrive on the TV.
            </p>
            <div className="tv__quiet-actions">
              {SCENARIO_ORDER.map((id) => (
                <button
                  key={id}
                  type="button"
                  className="button button--quiet"
                  onClick={() => onRun?.(id)}
                  disabled={busyScenario != null}
                >
                  <span className="mono">{SCENARIOS[id].number}</span>
                  {scenarioLabel(id)}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="tv__scan" aria-hidden="true" />
      </div>
      {mode === "firetv" ? (
        <div className="tv__keyboard-hint">
          <div className="tv__hint-keys">
            <span>↑ ↓ move</span>
            <span>Enter select</span>
            <span>1–3 quick</span>
            <span>Back close</span>
            <span>S sound</span>
          </div>
          <div className="tv__switch" role="group" aria-label="Switch threshold replay">
            {SCENARIO_ORDER.map((id) => (
              <button
                key={id}
                type="button"
                className={scenario.id === id ? "is-active" : ""}
                onClick={() => onRun?.(id)}
                disabled={busyScenario != null}
                aria-pressed={scenario.id === id}
                title={SCENARIOS[id].title}
              >
                <span className="mono">{SCENARIOS[id].number}</span>
                {scenarioLabel(id)}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
