import { useEffect, useRef } from "react";
import type { TimelineEntry } from "../../shared/types";
import { formatTimecode } from "../lib/format";

interface CareTimelineProps {
  entries: TimelineEntry[];
}

export function CareTimeline({ entries }: CareTimelineProps) {
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const element = listRef.current;
    if (!element) return;
    element.scrollTop = element.scrollHeight;
  }, [entries.length]);

  return (
    <section className="ledger-panel timeline" aria-labelledby="timeline-heading">
      <header className="ledger-panel__head">
        <div className="ledger-panel__title">
          <span className="section-label section-label--inline">
            <span id="timeline-heading">Care timeline</span>
          </span>
          <span className="chip chip--tiny">{entries.length} notes</span>
        </div>
        <div className="ledger-panel__meta">
          <span className="mono">care://timeline</span>
        </div>
      </header>

      <ol className="timeline__list" ref={listRef}>
        {entries.length === 0 ? (
          <li className="timeline__empty">
            Nothing written yet. A care note appears here when an incident is detected,
            dispatched, acted on, or closed.
          </li>
        ) : (
          entries.map((entry) => (
            <li className={`timeline__item timeline__item--${entry.kind}`} key={entry.id}>
              <span className="timeline__rail" aria-hidden="true">
                <span className="timeline__dot" />
              </span>
              <time className="timeline__time" dateTime={entry.at}>
                {formatTimecode(entry.at)}
              </time>
              <div className="timeline__body">
                <h3 className="timeline__title">{entry.title}</h3>
                <p className="timeline__detail">{entry.detail}</p>
              </div>
              {entry.scenarioId ? (
                <span className="chip chip--tiny timeline__scenario">{entry.scenarioId}</span>
              ) : null}
            </li>
          ))
        )}
      </ol>
    </section>
  );
}
