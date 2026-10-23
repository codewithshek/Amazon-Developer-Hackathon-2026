import { useCallback, useMemo, useRef } from "react";
import { SCENARIOS } from "../server/scenarios";
import type { ScenarioId } from "../shared/types";
import { CareTimeline } from "./components/CareTimeline";
import { Glyph } from "./components/Glyph";
import { LivingRoomPane } from "./components/LivingRoomPane";
import { Masthead } from "./components/Masthead";
import { McpWire } from "./components/McpWire";
import { Provenance } from "./components/Provenance";
import { ReadingPane } from "./components/ReadingPane";
import { ThresholdPane } from "./components/ThresholdPane";
import { useRoomTone } from "./lib/roomTone";
import { useHearthGuard } from "./lib/useHearthGuard";
import { useTvNavigation } from "./lib/useTvNavigation";

function requestedScenario(): ScenarioId {
  const value = new URLSearchParams(window.location.search).get("scenario");
  return value === "SCN-02" || value === "SCN-03" ? value : "SCN-01";
}

export default function App() {
  const controller = useHearthGuard();
  const initialId = useMemo(requestedScenario, []);
  const activeIncident = controller.activeIncident;
  const scenario = activeIncident?.scenario ?? SCENARIOS[controller.activeId ?? initialId];
  const ducked = Boolean(activeIncident && activeIncident.status === "active");
  const sound = useRoomTone(ducked);
  const roomRef = useRef<HTMLElement | null>(null);

  const handleRun = useCallback(
    (id: ScenarioId) => {
      void controller.runScenario(id);
    },
    [controller.runScenario]
  );

  const handleResolve = useCallback(() => {
    if (!controller.activeIncident) return;
    void controller.resolveActive("Acknowledged from the care console.");
  }, [controller.activeIncident, controller.resolveActive]);

  const handleAction = useCallback(
    (id: string) => {
      void controller.executeAction(id);
    },
    [controller.executeAction]
  );

  const navigation = useTvNavigation({
    count: activeIncident?.scenario.hudActions.length ?? 0,
    onBack: handleResolve,
    enabled: Boolean(activeIncident),
    containerRef: roomRef
  });

  return (
    <div className="studio">
      <Masthead
        activeId={controller.activeId}
        busyScenario={controller.busyScenario}
        capabilities={controller.state?.capabilities ?? null}
        connected={controller.connected}
        sessionId={controller.sessionId}
        sound={sound}
        onRun={handleRun}
      />

      <div className="thesis">
        <p className="thesis__line">
          Ring sees. Bee remembers. Nova reasons. Alexa+ speaks. <em>Fire TV answers.</em>
        </p>
        <p className="thesis__meta">Replay-first · three threshold scenarios</p>
      </div>

      <main id="main" className="console" aria-busy={controller.loading}>
        <ThresholdPane
          incident={activeIncident}
          scenario={scenario}
          loading={controller.loading}
        />
        <ReadingPane
          incident={activeIncident}
          scenario={scenario}
          loading={controller.loading}
          lastAction={controller.lastAction}
          busyScenario={controller.busyScenario}
          onRun={handleRun}
          onResolve={handleResolve}
        />
        <LivingRoomPane
          incident={activeIncident}
          scenario={scenario}
          sound={sound}
          lastAction={controller.lastAction}
          executingAction={controller.executingAction}
          navigation={navigation}
          busyScenario={controller.busyScenario}
          onAction={handleAction}
          onResolve={handleResolve}
          onRun={handleRun}
          containerRef={roomRef}
        />
      </main>

      <section className="ledger" aria-label="Live protocol and care record">
        <McpWire
          entries={controller.wire}
          sessionId={controller.sessionId}
          connected={controller.connected}
          protocol={controller.state?.capabilities.mcpProtocol ?? "2025-11-25"}
          onReset={() => void controller.reset()}
        />
        <CareTimeline entries={controller.timeline} />
      </section>

      <Provenance capabilities={controller.state?.capabilities ?? null} />

      <div className="toast-stack" aria-live="polite">
        {controller.error ? (
          <div className="toast toast--error" role="alert">
            <span className="toast__icon" aria-hidden="true">
              <Glyph name="shield" size={16} />
            </span>
            <p>{controller.error}</p>
            <button type="button" className="toast__close" onClick={controller.clearError}>
              Dismiss
            </button>
          </div>
        ) : null}
        {controller.toast ? (
          <div className="toast" role="status">
            <span className="toast__dot" aria-hidden="true" />
            <p>{controller.toast}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
