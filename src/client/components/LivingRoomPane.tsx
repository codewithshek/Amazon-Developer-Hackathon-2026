import type { RefObject } from "react";
import type {
  CareIncident,
  InterventionResult,
  ScenarioDefinition,
  ScenarioId
} from "../../shared/types";
import { SCENARIOS, SCENARIO_ORDER } from "../../server/scenarios";
import { scenarioLabel } from "../lib/format";
import type { RoomToneController } from "../lib/roomTone";
import type { TvNavigation } from "../lib/useTvNavigation";
import { ActionDeck } from "./ActionDeck";
import { PaneHeader } from "./PaneHeader";
import { Remote } from "./Remote";
import { TvStage } from "./TvStage";

interface LivingRoomPaneProps {
  incident: CareIncident | null;
  scenario: ScenarioDefinition;
  sound: RoomToneController;
  lastAction: InterventionResult | null;
  executingAction: string | null;
  navigation: TvNavigation;
  busyScenario: ScenarioId | null;
  onAction: (id: string) => void;
  onResolve: () => void;
  onRun: (id: ScenarioId) => void;
  containerRef?: RefObject<HTMLElement | null>;
}

export function LivingRoomPane({
  incident,
  scenario,
  sound,
  lastAction,
  executingAction,
  navigation,
  busyScenario,
  onAction,
  onResolve,
  onRun,
  containerRef
}: LivingRoomPaneProps) {
  return (
    <section ref={containerRef} className="pane pane--room" aria-labelledby="room-heading">
      <PaneHeader id="room-heading" index="03" title="The living room" meta="Fire TV · 10-ft" />

      <TvStage
        incident={incident}
        scenario={scenario}
        mode="studio"
        sound={sound}
        lastAction={lastAction}
        executingAction={executingAction}
        onAction={onAction}
        onResolve={onResolve}
        onRun={onRun}
        busyScenario={busyScenario}
      />

      {incident ? (
        <div className="room-grid">
          <ActionDeck
            incident={incident}
            scenario={incident.scenario}
            navigation={navigation}
            executingAction={executingAction}
            lastAction={lastAction}
            onAction={onAction}
            onResolve={onResolve}
          />
          <Remote navigation={navigation} sound={sound} onBack={onResolve} />
        </div>
      ) : (
        <div className="room-grid room-grid--idle">
          <div className="room-idle">
            <p className="section-label section-label--inline">
              <span>Living room · standby</span>
            </p>
            <h3 className="room-idle__title">The screen is waiting.</h3>
            <p className="room-idle__body">
              Start a replay above. The room tone ducks, the film pauses, and the care card
              enters the top-right corner of the TV.
            </p>
            <div className="room-idle__actions">
              {SCENARIO_ORDER.map((id) => (
                <button
                  key={id}
                  type="button"
                  className="button button--quiet"
                  onClick={() => onRun(id)}
                  disabled={busyScenario !== null}
                >
                  <span className="mono">{SCENARIOS[id].number}</span>
                  {scenarioLabel(id)}
                </button>
              ))}
            </div>
          </div>
          <Remote navigation={navigation} sound={sound} onBack={onResolve} disabled />
        </div>
      )}
    </section>
  );
}
