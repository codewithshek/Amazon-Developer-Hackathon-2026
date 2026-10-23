import type { CareIncident, ScenarioDefinition } from "../../shared/types";
import { shortId, sourceLabel } from "../lib/format";
import { CameraFeed } from "./CameraFeed";
import { PaneHeader } from "./PaneHeader";

interface ThresholdPaneProps {
  incident: CareIncident | null;
  scenario: ScenarioDefinition;
  loading: boolean;
}

export function ThresholdPane({ incident, scenario, loading }: ThresholdPaneProps) {
  const liveWhep = incident?.whep.mode === "live_partner_api";
  const whepLabel = incident ? (liveWhep ? "Live partner WHEP" : "WHEP simulator") : "Awaiting stream";

  return (
    <section className="pane pane--threshold" aria-labelledby="threshold-heading">
      <PaneHeader id="threshold-heading" index="01" title="Threshold" meta="Ring · WHEP" />

      <div className={`threshold-view ${incident ? "is-live" : ""}`}>
        <CameraFeed
          mode={scenario.camera}
          active={Boolean(incident)}
          deviceId={scenario.deviceId}
        />
        <div className="threshold-view__badges">
          <span className={`badge ${liveWhep ? "badge--ok" : "badge--sim"}`}>
            <span className="badge__dot" aria-hidden="true" />
            {liveWhep ? "LIVE WHEP" : "SIMULATED EVENT · PROCEDURAL WHEP"}
          </span>
          <span className="badge badge--mono">{scenario.deviceId}</span>
        </div>
        <span className="threshold-view__corner threshold-view__corner--tl" aria-hidden="true" />
        <span className="threshold-view__corner threshold-view__corner--br" aria-hidden="true" />
      </div>

      <div className="threshold-caption">
        <span className={`live ${incident ? "is-live" : "is-polling"}`}>
          <span className="live__dot" aria-hidden="true" />
          {incident ? "Signal captured" : loading ? "Connecting" : "Listening"}
        </span>
        <span>{scenario.zone}</span>
      </div>

      <div className="evidence-grid" aria-label="What Ring and the household memory reported">
        {scenario.evidence.map((item) => (
          <div className="evidence-cell" key={item.label}>
            <span className="evidence-cell__label">{item.label}</span>
            <span className="evidence-cell__value">{item.value}</span>
          </div>
        ))}
      </div>

      <dl className="spec-list">
        <div className="spec-list__row">
          <dt>Event</dt>
          <dd>{incident ? sourceLabel(incident.source) : "Signed replay"}</dd>
        </div>
        <div className="spec-list__row">
          <dt>Stream</dt>
          <dd className={liveWhep ? "is-ok" : ""}>{whepLabel}</dd>
        </div>
        <div className="spec-list__row">
          <dt>Session</dt>
          <dd className="mono" title={incident?.whep.sessionId}>
            {shortId(incident?.whep.sessionId, 14)}
          </dd>
        </div>
        <div className="spec-list__row">
          <dt>Webhook</dt>
          <dd className="is-ok">HMAC-SHA256</dd>
        </div>
        <div className="spec-list__row">
          <dt>Device</dt>
          <dd className="mono">{scenario.deviceId}</dd>
        </div>
      </dl>

      <p className="pane-note">
        The camera frame is a procedural reconstruction of the WHEP view. In replay mode no
        Ring hardware or partner stream is connected.
      </p>
    </section>
  );
}
