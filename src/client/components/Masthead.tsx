import { SCENARIOS, SCENARIO_ORDER } from "../../server/scenarios";
import type { CapabilityReport, ScenarioId } from "../../shared/types";
import { shortId } from "../lib/format";
import { scenarioLabel } from "../lib/format";
import type { RoomToneController } from "../lib/roomTone";
import { Glyph } from "./Glyph";

interface MastheadProps {
  activeId: ScenarioId | null;
  busyScenario: ScenarioId | null;
  capabilities: CapabilityReport | null;
  connected: boolean;
  sessionId: string | null;
  sound: RoomToneController;
  onRun: (id: ScenarioId) => void;
}

export function Masthead({
  activeId,
  busyScenario,
  capabilities,
  connected,
  sessionId,
  sound,
  onRun
}: MastheadProps) {
  const protocol = capabilities?.mcpProtocol ?? "2025-11-25";
  const hmac = capabilities?.hmac ?? "verified";
  const bedrock = capabilities?.bedrock ?? "replay";
  const fireTvHref = `?mode=firetv${activeId ? `&scenario=${activeId}` : ""}`;

  return (
    <header className="masthead">
      <a className="brand" href="/" aria-label="HearthGuard home">
        <span className="brand__mark" aria-hidden="true">
          <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M7.5 18 20 7.5 32.5 18" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M11 17v16h18V17" strokeLinecap="round" />
            <path d="M16.5 27h7" strokeLinecap="round" />
            <circle cx="20" cy="24.5" r="2.6" fill="currentColor" stroke="none" />
          </svg>
        </span>
        <span className="brand__type">
          <span className="brand__name">HearthGuard</span>
          <span className="brand__sub">Night watch · care console</span>
        </span>
      </a>

      <div className="masthead__status" aria-label="System status">
        <span className={`live ${connected ? "is-live" : "is-polling"}`}>
          <span className="live__dot" aria-hidden="true" />
          {connected ? "Live" : "Polling"}
        </span>
        <span className="chip chip--mono" title={`Model Context Protocol ${protocol}`}>
          MCP {protocol}
        </span>
        <span className={`chip ${hmac === "verified" ? "chip--ok" : "chip--warn"}`}>
          <Glyph name="shield" size={12} />
          {hmac === "verified" ? "HMAC verified" : "HMAC unset"}
        </span>
        <span className={`chip ${bedrock === "live" ? "chip--ok" : ""}`}>
          Nova {bedrock === "live" ? "live" : "replay"}
        </span>
        <span className="chip chip--session" title={sessionId ?? "MCP session not established"}>
          session {shortId(sessionId, 7)}
        </span>
      </div>

      <div className="masthead__actions">
        <nav className="scenarios" aria-label="Threshold replays">
          {SCENARIO_ORDER.map((id) => {
            const scenario = SCENARIOS[id];
            const busy = busyScenario === id;
            return (
              <button
                key={id}
                type="button"
                className={`scenario ${activeId === id ? "is-active" : ""} ${busy ? "is-busy" : ""}`}
                onClick={() => onRun(id)}
                aria-pressed={activeId === id}
                aria-label={`Run ${scenario.number}: ${scenario.title}`}
                title={scenario.title}
                disabled={busyScenario !== null && busyScenario !== id}
              >
                <span className="scenario__num">{scenario.number}</span>
                <span className="scenario__meta">
                  <span className="scenario__label">{scenarioLabel(id)}</span>
                  <span className="scenario__time">
                    {scenario.time} {scenario.period}
                  </span>
                </span>
                {busy ? <span className="scenario__pulse" aria-hidden="true" /> : null}
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          className={`sound ${sound.enabled ? "is-on" : ""}`}
          onClick={sound.toggle}
          aria-pressed={sound.enabled}
          title="A generated WebAudio room tone. It ducks to 20% when a care card arrives. No recording is streamed."
        >
          <Glyph name={sound.enabled ? "sound" : "mute"} size={16} />
          <span className="sound__label">Room tone</span>
          <span className="sound__level">{sound.enabled ? `${sound.level}%` : "off"}</span>
          <span className="sound__bars" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        </button>

        <a className="button button--firetv" href={fireTvHref} target="_blank" rel="noreferrer">
          Fire TV
          <Glyph name="external" size={14} />
        </a>
      </div>
    </header>
  );
}
