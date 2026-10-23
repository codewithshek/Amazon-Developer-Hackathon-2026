# skills.md — How the Skill Library Informed This Build

Skills are guidance for the build process, not runtime dependencies. HearthGuard runs with
`npm install` alone; no skill, MCP server, or agent framework is required at runtime.

This file records the skill areas that informed the implementation and the concrete decisions
they shaped. It is not a claim that every installed skill was executed end-to-end.

---

## 1. Environment note

The build environment exposes a large skill library under the user’s Gemini/Anti-Gravity
configuration. The original brief referred to an `Orchestra-Research/AI-research-SKILLs`
collection; that exact collection was **not separately installed** in this environment.
Equivalent research, design, accessibility, and verification skills were available and were
used as guidance.

Skill names and availability vary by environment. The repository does not install or pin any
skill; the code and tests are the reproducible artifact.

---

## 2. Research and protocol grounding

| Skill area | What it informed |
| --- | --- |
| `research`, `scout`, `deep-research`, `deep-research-router` | Verify the MCP `2025-11-25` protocol string, the official SDK transport, and current package versions before writing code |
| `firecrawl-*`, `web-scraping`, `agent-browser` | Consult public protocol/API material; not used as a runtime dependency |
| `architecture-decision-records`, `api-and-interface-design`, `api-design-principles` | Keep the MCP surface separate from the REST demo control plane; define tool inputs and card envelopes explicitly |
| `nodejs-backend-patterns`, `backend`, `typescript-advanced-types` | Express 5 raw-body capture, typed route handlers, shared contracts, strict TypeScript |
| `security`/`harden`, `auth-implementation-patterns` | Timing-safe HMAC, replay window, local-origin policy, honest security gaps |

**Concrete outcomes:** the MCP SDK is the official package (`1.32.1`), not a hand-rolled
JSON-RPC loop; the webhook verifies the raw body; the security doc distinguishes origin
filtering from authentication.

---

## 3. Design and visual direction

| Skill area | What it informed |
| --- | --- |
| `build-awwwards-quality-sites`, `awwwards-dna-harvester`, `top-design` | Editorial composition, a single signature moment, restraint over dashboard density |
| `21st-ui-build`, `21st-ui-review`, `web-design-engineer`, `impeccable` | Three-pane hierarchy, typography pairing, hairline structure, purposeful states |
| `apple-design`, `design-motion-principles`, `motion-design` | Physical arrival of the HUD, interruptible focus, reduced-motion behavior |
| `gsap-core`, `gsap-react`, `gsap-timeline`, `gsap-performance` | GSAP entrance, stagger, room dim; transform/opacity only |
| `accessibility-compliance`, `friction` | Keyboard-complete D-pad flow, visible focus, captions, skip link, AA contrast target |
| `polish`, `humanizer`, `avoid-ai-writing`, `stop-slop` | Remove generic AI phrasing and unsupported claims from the UI and docs |

**Concrete outcomes:** “The Night Watch” direction (warm charcoal, Newsreader + Instrument
Sans + IBM Plex Mono, amber porch light); the TV card’s 320 ms delayed focus; the room dim;
the provenance footer; the measured 5.17:1–16.74:1 ink contrast instead of a fabricated AAA
claim.

The implementation is hand-written CSS and React. No 21st.dev component or template was
vendored into the repository.

---

## 4. Testing and verification

| Skill area | What it informed |
| --- | --- |
| `tdd`, `proof`, `verification-before-completion` | Behavior-first tests; re-run the full suite before claiming completion |
| `playwright-core`, `playwright-qa`, `playwright-frontend`, `webapp-testing` | User-facing locators, isolated servers, focus assertions, trace-on-failure |
| `systematic-debugging`, `sleuth`, `spelunk` | Root-cause the Enter-key double activation and the E2E cross-talk rather than patching symptoms |
| `code-review-and-quality`, `referee`, `cleared` | Separate protocol correctness, interaction correctness, and documentation honesty |

**Concrete outcomes:** isolated E2E ports `4100`/`5273`; `reuseExistingServer: false`; reset in
`beforeEach`; native-control Enter handling; Vitest excludes `e2e/`; no fabricated benchmark
numbers in `RESULTS.md`.

---

## 5. Skills deliberately not used

The following areas were available but were not relevant to this build. They are listed so the
absence is not mistaken for a hidden claim:

- Model training, fine-tuning, quantization, serving, or evaluation skills
  (`peft`, `trl-fine-tuning`, `vllm`, `sglang`, `gguf`, `awq`, etc.).
- 3D/WebGL skills (`r3f-*`, `awwwards-3d`, Three.js pipelines).
- Image generation, video generation, or motion-showreel skills.
- Data engineering, scraping pipelines, or database design skills.
- Cloud deployment skills; this repo has no deployment manifest.

The camera feed is procedural canvas art, not a generated image or a real stream. The room tone
is generated WebAudio, not a licensed recording.

---

## 6. What the skills did not do

- They did not generate the repository automatically.
- They did not install runtime dependencies.
- They did not certify accessibility, security, performance, or Amazon compatibility.
- They did not provide live Ring, Alexa+, Fire TV, Bee, or AWS credentials.
- They did not produce the screenshots in `docs/`; those were captured from the running build.

The distinction matters: the value is in the decisions and the verification, not in a list of
skill names.

---

## 7. Reproducing the build without skills

```bash
npm install
npm test
npm run build
npm run dev
```

The app, tests, and docs are self-contained. If you use a skill-enabled agent to extend the
project, point it at [ARCHITECTURE.md](ARCHITECTURE.md), [DESIGN.md](DESIGN.md), and
[TEST.md](TEST.md) first; those files describe the real contracts and the honest boundaries.
