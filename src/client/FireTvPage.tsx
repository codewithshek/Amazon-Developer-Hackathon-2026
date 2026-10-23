import { useCallback, useEffect, useMemo } from "react";
import { SCENARIOS } from "../server/scenarios";
import type { ScenarioId } from "../shared/types";
import { Glyph } from "./components/Glyph";
import { TvStage } from "./components/TvStage";
import { useRoomTone } from "./lib/roomTone";
import { useHearthGuard } from "./lib/useHearthGuard";
import { useTvNavigation } from "./lib/useTvNavigation";

function requestedScenario(): ScenarioId {
  const value = new URLSearchParams(window.location.search).get("scenario");
  return value === "SCN-02" || value === "SCN-03" ? value : "SCN-01";
}

export function FireTvPage() {
  const controller = useHearthGuard();
  const initialId = useMemo(requestedScenario, []);
  const activeIncident = controller.activeIncident;
  const scenario = activeIncident?.scenario ?? SCENARIOS[controller.activeId ?? initialId];
  const sound = useRoomTone(Boolean(activeIncident && activeIncident.status === "active"));

  const handleResolve = useCallback(() => {
    if (!controller.activeIncident) return;
    void controller.resolveActive("Acknowledged from the Fire TV.");
  }, [controller.activeIncident, controller.resolveActive]);

  const handleRun = useCallback(
    (id: ScenarioId) => {
      void controller.runScenario(id);
    },
    [controller.runScenario]
  );

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
    force: true
  });

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable)
      ) {
        return;
      }
      if (event.key.toLowerCase() === "s") {
        event.preventDefault();
        sound.toggle();
      }
      if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        if (document.fullscreenElement) {
          void document.exitFullscreen().catch(() => undefined);
        } else {
          void document.documentElement.requestFullscreen().catch(() => undefined);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sound.toggle]);

  return (
    <div className="firetv">
      <TvStage
        incident={activeIncident}
        scenario={scenario}
        mode="firetv"
        sound={sound}
        lastAction={controller.lastAction}
        executingAction={controller.executingAction}
        navigation={navigation}
        onAction={handleAction}
        onResolve={handleResolve}
        onRun={handleRun}
        busyScenario={controller.busyScenario}
      />

      <div className="firetv__toast-stack" aria-live="polite">
        {controller.error ? (
          <div className="toast toast--error toast--tv" role="alert">
            <span className="toast__icon" aria-hidden="true">
              <Glyph name="shield" size={18} />
            </span>
            <p>{controller.error}</p>
            <button type="button" className="toast__close" onClick={controller.clearError}>
              Dismiss
            </button>
          </div>
        ) : null}
        {controller.toast ? (
          <div className="toast toast--tv" role="status">
            <span className="toast__dot" aria-hidden="true" />
            <p>{controller.toast}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
