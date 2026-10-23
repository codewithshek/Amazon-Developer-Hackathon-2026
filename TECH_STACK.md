# TECH_STACK.md — Installed Stack and Configuration

This is the stack that is actually installed and used. Version numbers below are the resolved
versions in the lockfile at the time of the final verification.

---

## 1. Runtime baseline

| Item | Version / requirement |
| --- | --- |
| Node.js | `>=20` declared; verified on `24.22.1` |
| npm | `11.5.2` |
| Module system | ESM (`"type": "module"`) |
| Language | TypeScript `7.0.2`, strict mode |
| OS verified | Windows (win32) |

The project runs as a single Express process plus a Vite dev server. There is no Python
service, database, Docker image, or background worker.

---

## 2. Runtime dependencies

| Package | Installed | Used for |
| --- | ---: | --- |
| `@aws-sdk/client-bedrock-runtime` | `3.1156.0` | Optional `InvokeModelCommand` call to Amazon Nova |
| `@modelcontextprotocol/sdk` | `1.32.1` | MCP server, `StreamableHTTPServerTransport`, tool/resource registration |
| `cors` | `2.8.6` | Permissive CORS on `/api` |
| `express` | `5.3.0` | HTTP server, routes, raw-body capture, static build |
| `gsap` | `3.15.0` | HUD entrance, content reveal, room dim |
| `lucide-react` | `1.61.0` | Icons |
| `react` | `19.3.1` | Client |
| `react-dom` | `19.3.1` | Client |
| `zod` | `4.6.7` | MCP tool input schemas |
| `@fontsource-variable/instrument-sans` | `5.3.0` | UI/body face, self-hosted |
| `@fontsource-variable/newsreader` | `5.3.0` | Display/narrative face, self-hosted |
| `@fontsource/ibm-plex-mono` | `5.3.0` | Telemetry face, self-hosted |

Fonts are bundled from `node_modules`; the app makes no Google Fonts request.

---

## 3. Development dependencies

| Package | Installed | Used for |
| --- | ---: | --- |
| `@playwright/test` | `1.64.1` | Browser E2E |
| `@types/cors` | `2.8.19` | Types |
| `@types/express` | `5.0.6` | Types |
| `@types/node` | `26.6.5` | Types |
| `@types/react` | `19.3.0` | Types |
| `@types/react-dom` | `19.3.0` | Types |
| `@types/supertest` | `7.2.1` | Types |
| `@vitejs/plugin-react` | `6.1.2` | React fast refresh / build |
| `concurrently` | `10.0.6` | `npm run dev` |
| `supertest` | `7.3.1` | HTTP/MCP tests without a listening socket |
| `tsx` | `4.23.15` | TypeScript server execution and watch |
| `typescript` | `7.0.2` | Type check and build |
| `vite` | `8.3.5` | Client dev server and production build |
| `vitest` | `5.0.5` | Unit/protocol tests |

---

## 4. Scripts

| Script | Command | Notes |
| --- | --- | --- |
| `dev` | `concurrently -k -n server,ui "npm:dev:server" "npm:dev:client"` | Both processes, colored names |
| `dev:server` | `tsx watch src/server/index.ts` | Server restart on change |
| `dev:client` | `vite --port 5173 --strictPort` | Fails if 5173 is taken |
| `dev:server:e2e` | `tsx src/server/index.ts` | Used by Playwright on `:4100` |
| `dev:client:e2e` | `vite --port 5273 --strictPort` | Used by Playwright on `:5273` |
| `build` | `tsc --noEmit && vite build` | Type check gates the build |
| `start` | `tsx src/server/index.ts` | Serves `dist/` if present |
| `test` | `vitest run` | 4 files / 19 tests |
| `test:watch` | `vitest` | Watch mode |
| `test:bridge` | `vitest run packages/.../bridge.test.ts` | OSS package only |
| `test:agent` | `vitest run tests/agent.test.ts` | Fallback/reasoning only |
| `test:mcp` | `vitest run tests/mcp.test.ts` | Protocol only |
| `test:e2e` | `playwright test` | Starts isolated servers |

---

## 5. Configuration files

| File | Purpose |
| --- | --- |
| `package.json` | Scripts, dependencies, Node engine |
| `package-lock.json` | Resolved dependency graph |
| `tsconfig.json` | Strict TypeScript, `noUncheckedIndexedAccess`, no emit |
| `vite.config.ts` | React plugin, `:5173`, `/api` + `/mcp` proxy, sourcemaps |
| `vitest.config.ts` | Excludes `e2e/` from Vitest discovery |
| `playwright.config.ts` | Isolated `:4100` / `:5273`, one worker, trace/screenshot/video on failure |
| `.env.example` | Documented optional integration variables |
| `index.html` | Title, description, theme color, skip link |
| `.gitignore` | `node_modules`, `dist`, `.env`, reports, logs |

There is **no** `vega-manifest.toml`, `mcp.config.json`, Dockerfile, or CI workflow in this
repository. The Fire TV surface is a browser simulation, not a Vega OS package.

---

## 6. Optional external integrations

| Integration | Activation | Failure behavior |
| --- | --- | --- |
| Ring-style webhook secret | `RING_WEBHOOK_SECRET` | Uses a public local demo default |
| Ring WHEP | `RING_OAUTH_TOKEN`, `RING_API_BASE_URL` | Loopback SDP answer |
| Bee memory | `BEE_PROXY_URL` | Recorded fixture |
| AWS Bedrock | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `BEDROCK_MODEL_ID` | Recorded spoken sentence |
| Extra MCP origin | `MCP_ALLOWED_ORIGIN` | Only localhost/127.0.0.1 allowed |
| Demo endpoints | `DEMO_MODE=false` disables them | Webhook and MCP remain |

No integration is required to run the demo or the test suite.

---

## 7. Browser APIs used

- Fetch, `EventSource`, `AbortController`
- WebAudio (`AudioContext`, gain, biquad filter, oscillator, buffer source)
- Canvas 2D for the procedural camera and ambient room
- `matchMedia` for reduced motion
- Fullscreen API for the TV surface (`F`)
- Standard keyboard/focus APIs for D-pad navigation

No WebRTC peer connection is created. WHEP negotiation is represented by SDP exchange and a
mode badge; the visible camera feed is canvas art.

---

## 8. What is intentionally absent

| Not present | Why |
| --- | --- |
| AWS Strands SDK | The reasoning function is an explicit local pipeline; the historical name is kept for continuity |
| Alexa+ cloud SDK / skill package | The repo exposes a standards-based MCP server; it does not register an Alexa+ skill |
| Ring Partner SDK | The bridge implements the demo’s HMAC/WHEP contract directly; live partner access is unverified |
| Database / ORM | State is intentionally in memory for a deterministic demo |
| Auth provider | The server is localhost-only and explicitly not production-ready |
| Vega OS tooling | The 10-foot surface is a browser simulation |
| Component library | The UI is hand-built with CSS and a small icon set |

---

## 9. Why these choices

- **Official MCP SDK over a hand-rolled JSON-RPC server.** Session handling, protocol
  versioning, and transport errors are difficult to get right; the SDK keeps the demo honest.
- **Express 5 + Vite 8 + React 19.** Current, small, and fast enough for one process and a
  single-page client. Vite’s proxy keeps the browser on one origin in development.
- **Vitest + Playwright.** Vitest covers pure helpers and HTTP/MCP behavior through
  `supertest`; Playwright covers the focus and keyboard behavior that unit tests cannot.
- **In-memory state.** A database would add setup friction for judges without improving the
  interaction being demonstrated. The limitation is documented rather than hidden.
- **Self-hosted fonts.** Predictable rendering offline and no third-party request.
