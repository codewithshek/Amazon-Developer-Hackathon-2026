import { useEffect, useRef } from "react";
import type { WireEntry } from "../../shared/types";
import { formatTimecode, shortId } from "../lib/format";
import { Glyph } from "./Glyph";

interface McpWireProps {
  entries: WireEntry[];
  sessionId: string | null;
  connected: boolean;
  protocol: string;
  onReset: () => void;
}

const directionLabel: Record<WireEntry["direction"], string> = {
  out: "sent",
  in: "received",
  note: "note"
};

export function McpWire({ entries, sessionId, connected, protocol, onReset }: McpWireProps) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = listRef.current;
    if (!element) return;
    const nearBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight < 140;
    if (nearBottom) element.scrollTop = element.scrollHeight;
  }, [entries.length]);

  return (
    <section className="ledger-panel wire" aria-labelledby="wire-heading">
      <header className="ledger-panel__head">
        <div className="ledger-panel__title">
          <span className="section-label section-label--inline">
            <span id="wire-heading">MCP wire</span>
          </span>
          <span className={`live ${connected ? "is-live" : "is-polling"}`}>
            <span className="live__dot" aria-hidden="true" />
            {connected ? "Streamable HTTP" : "Polling fallback"}
          </span>
        </div>
        <div className="ledger-panel__meta">
          <span className="chip chip--mono">{protocol}</span>
          <span className="chip chip--session" title={sessionId ?? undefined}>
            {shortId(sessionId, 10)}
          </span>
          <button type="button" className="icon-button" onClick={onReset} title="Reset the replay">
            <Glyph name="reset" size={14} />
            <span>Reset</span>
          </button>
        </div>
      </header>

      <div className="wire__list" ref={listRef} role="log" aria-live="polite" aria-relevant="additions">
        {entries.length === 0 ? (
          <p className="wire__empty">
            The wire is quiet. Start a replay to watch the MCP handshake and tool calls.
          </p>
        ) : (
          entries.map((entry) => (
            <div className={`wire__row wire__row--${entry.direction}`} key={entry.id}>
              <time className="wire__time" dateTime={entry.at}>
                {formatTimecode(entry.at)}
              </time>
              <span className="wire__dir" aria-label={directionLabel[entry.direction]}>
                {entry.direction === "out" ? "→" : entry.direction === "in" ? "←" : "·"}
              </span>
              <span className="wire__method">{entry.method}</span>
              <span className="wire__detail">{entry.detail}</span>
              {entry.status !== undefined ? (
                <span className={`wire__status ${entry.status >= 400 ? "is-error" : ""}`}>
                  {entry.status}
                </span>
              ) : (
                <span className="wire__status wire__status--none" aria-hidden="true">
                  —
                </span>
              )}
              <span className="wire__latency">
                {entry.latencyMs !== undefined ? `${entry.latencyMs.toFixed(1)} ms` : ""}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
