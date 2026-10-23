import type { CapabilityReport } from "../../shared/types";
import { Glyph } from "./Glyph";

interface ProvenanceProps {
  capabilities: CapabilityReport | null;
}

export function Provenance({ capabilities }: ProvenanceProps) {
  const whep = capabilities?.whep ?? "simulator";
  const bedrock = capabilities?.bedrock ?? "replay";
  const bee = capabilities?.bee ?? "fixture";
  const hmac = capabilities?.hmac ?? "verified";

  return (
    <footer className="site-foot">
      <div className="site-foot__brand">
        <span className="brand__mark brand__mark--small" aria-hidden="true">
          <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M7.5 18 20 7.5 32.5 18" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M11 17v16h18V17" strokeLinecap="round" />
            <circle cx="20" cy="24.5" r="2.6" fill="currentColor" stroke="none" />
          </svg>
        </span>
        <div>
          <strong>HearthGuard</strong>
          <span>Night watch · Amazon Developer Hackathon 2026</span>
        </div>
      </div>

      <div className="site-foot__caps" aria-label="Integration status">
        <span className="cap">
          <i className="cap__dot" aria-hidden="true" />
          MCP {capabilities?.mcpProtocol ?? "2025-11-25"}
        </span>
        <span className={`cap ${hmac === "verified" ? "is-ok" : "is-warn"}`}>
          <i className="cap__dot" aria-hidden="true" />
          HMAC {hmac}
        </span>
        <span className={`cap ${whep === "live" ? "is-ok" : "is-sim"}`}>
          <i className="cap__dot" aria-hidden="true" />
          Ring WHEP {whep}
        </span>
        <span className={`cap ${bedrock === "live" ? "is-ok" : "is-sim"}`}>
          <i className="cap__dot" aria-hidden="true" />
          Bedrock {bedrock}
        </span>
        <span className={`cap ${bee === "proxy" ? "is-ok" : "is-sim"}`}>
          <i className="cap__dot" aria-hidden="true" />
          Bee {bee}
        </span>
      </div>

      <details className="provenance">
        <summary>
          What is simulated
          <Glyph name="chevron" size={13} />
        </summary>
        <div className="provenance__panel">
          <p className="provenance__intro">
            This build is replay-first by design. The protocol work is real; the household and
            the camera frames are not.
          </p>
          <dl className="provenance__list">
            <div>
              <dt>Ring webhook</dt>
              <dd>
                HMAC-SHA256 signing and the 300-second replay window are exercised on every
                replay. Demo events are signed by the local server, not by Ring.
              </dd>
            </div>
            <div>
              <dt>Ring WHEP</dt>
              <dd>
                A real WHEP negotiation helper is included. Without a partner token it returns a
                deterministic loopback answer and the UI draws a procedural frame.
              </dd>
            </div>
            <div>
              <dt>AWS Bedrock</dt>
              <dd>
                Nova is called only when AWS credentials are present. Otherwise the UI labels a
                recorded trace. The latency shown is local pipeline time, not a benchmark.
              </dd>
            </div>
            <div>
              <dt>Bee memory</dt>
              <dd>
                A live proxy is used when BEE_PROXY_URL is set; otherwise the quote is a
                recorded fixture. It is never presented as a live capture.
              </dd>
            </div>
            <div>
              <dt>Fire TV &amp; Alexa+</dt>
              <dd>
                The 10-foot surface is a browser simulation of a Fire TV HUD. The MCP server
                speaks Streamable HTTP; no physical Echo or Fire TV device is invoked.
              </dd>
            </div>
            <div>
              <dt>Room tone</dt>
              <dd>
                Generated in the browser with WebAudio and ducked while a care card is open.
                No licensed recording is streamed.
              </dd>
            </div>
          </dl>
          <p className="provenance__note">
            Arthur and Elena are fictional. Run locally with <code>npm install</code> then{" "}
            <code>npm run dev</code>; the server listens on <code>:4000</code> and Vite on{" "}
            <code>:5173</code>.
          </p>
        </div>
      </details>
    </footer>
  );
}
