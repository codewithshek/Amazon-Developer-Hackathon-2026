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

---

## Appendix: Autonomous Anti-Gravity Zero-Touch Reference & Blueprints

# skills.md — Master Skill Routing & Installation Manifest for Anti-Gravity

This file tells **Anti-Gravity** exactly which skills from your installed inventory to activate for every engineering task, and provides the exact non-interactive terminal commands to install **Orchestra-Research/AI-research-SKILLs** ([GitHub Repo](https://github.com/orchestra-research/AI-research-SKILLs)) and the official Amazon Hackathon MCP tools ([Hackathon Resources](https://amazonappdev2026.devpost.com/resources)) so Anti-Gravity never lacks a capability.

## 1. Automated Installation Commands for Missing & External Skills

Anti-Gravity must run this block first in the terminal before scaffolding code:

```bash
#!/usr/bin/env bash
set -e

echo "=== [1/4] Installing Orchestra-Research/AI-research-SKILLs (98-Skill Library) ==="
# Official open-source AI research engineering library by Orchestra Research
npx skills add https://github.com/Orchestra-Research/AI-Research-SKILLs -g -y || npx -y @orchestra-research/ai-research-skills

echo "=== [2/4] Installing Official Bee Wearable AI CLI & Agent Skill ==="
# Official Bee developer CLI and agent skill from docs.bee.computer
npm install -g @beecomputer/cli || true
npx skills add beecomputer/bee-skill -g -y || true

echo "=== [3/4] Installing Complementary MCP, BMad & Testing Skills ==="
npx skills add bmad-code-org/BMAD-METHOD --skill bmad -g -y || true
npx skills add anthropics/skills@mcp-builder -g -y || true

echo "=== [4/4] Registering Official Amazon Devices (ADBT) & Ring Appstore MCP Servers ==="
mkdir -p .kiro/settings .cursor
cat << 'EOF' > mcp.config.json
{
  "mcpServers": {
    "vega-devtools-mcp": {
      "command": "npx",
      "args": ["-y", "@amazon-devices/vega-devtools-mcp"]
    },
    "ring-appstore-knowledge-mcp-server": {
      "type": "streamable-http",
      "url": "https://knowledge.appstore-mcp.ring.amazon.dev/mcp"
    }
  }
}
EOF
cp mcp.config.json .kiro/settings/mcp.json
cp mcp.config.json .cursor/mcp.json
echo "=== Skill & MCP Pre-Flight Complete ==="
```

## 2. Complete Inventory Mapping: Your Installed Anti-Gravity Skills -> Exact Project Tasks

Every single group of skills in your Anti-Gravity environment has a deterministic role in building **HearthGuard** to Amazon Principal SDE standards:

### A. Autonomous Execution, Orchestration & Meta-Control Skills
| Installed Skill Name | When Anti-Gravity Must Invoke It | Concrete Action Performed |
| :--- | :--- | :--- |
| `handsfree`, `pilot`, `bmad-build-auto`, `bmad-build` | Entire execution lifecycle (Loops 1–8) | Runs all terminal commands, file writes, test suites, and self-healing fixes continuously without asking the human for confirmation. |
| `concierge`, `masterplan`, `blueprint`, `state-machine` | Initial workspace setup & `PLAN.md` tracking | Orchestrates transitions between the 8 execution loops and tracks milestone completion state. |
| `verification-before-completion`, `proof`, `referee`, `cleared` | End of every milestone gate (Gates 1–6) | Blocks progression to the next milestone until unit tests, TypeScript checks, and E2E assertions output 0 errors. |

### B. Deep Research, Web Recon & Literature Synthesis Skills
| Installed Skill Name | When Anti-Gravity Must Invoke It | Concrete Action Performed |
| :--- | :--- | :--- |
| `deep-research-router`, `bmad-deep-recon`, `deep-research`, `deep-research-199-biotech`, `research`, `research-manager`, `scout` | Phase 0: Spec & API verification | Cross-verifies MCP `2025-11-25` Streamable HTTP transport rules, Ring `api.amazonvision.com` JSON:API webhook payloads, and Vega OS media player guidelines. |
| `firecrawl`, `firecrawl-agent`, `firecrawl-crawl`, `firecrawl-interact`, `firecrawl-map`, `firecrawl-scrape`, `firecrawl-search`, `web-scraping`, `data-scraper-agent`, `agent-browser` | Phase 0: Live doc extraction (if needed) | Scrapes live SDK references from `developer.ring.com`, `docs.bee.computer`, `modelcontextprotocol.io`, and `developer.amazon.com/docs/adbt`. |
| `literature-review`, `notebooklm`, `recall`, `distill` | Phase 0 & Phase 7: Context compression | Distills caretaking (sundowning dementia intervention) and deaf/HoH accessibility standards into concrete system prompts and UI patterns. |

### C. Orchestra-Research / AI-Research-SKILLs & Multimodal AI Engineering Suite
| Installed Skill Name | When Anti-Gravity Must Invoke It | Concrete Action Performed |
| :--- | :--- | :--- |
| `autoresearch`, `brainstorming-research-ideas`, `creative-thinking-for-research` | Phase 1: Agentic reasoning design | Runs a 2-loop hypothesis-test cycle to optimize multi-frame visual intent classification across the 3 emergency threshold scenarios. |
| `compiler`, `rigor-reviewer`, `ml-paper-writing`, `academic-plotting` | Phase 1 & Phase 7: ARA Epistemic Audit | Audits our system claims and benchmark metrics in `RESULTS.md` against ARA Seal Level 2 dimensions (`D1-D6`: Falsifiability, Scope Calibration, Methodological Rigor). |
| `dspy`, `instructor`, `outlines`, `guidance` | Phase 3 (`src/server/bedrockStrandsAgent.ts`) | Enforces strict, schema-validated JSON output from **Amazon Bedrock (`amazon.nova-pro-v1:0`)** so tool calls (`dispatch_firetv_multimodal_hud`, `execute_alexa_threshold_intervention`) never fail parsing. |
| `llava`, `blip-2`, `clip`, `segment-anything`, `whisper`, `long-context` | Phase 3: Multimodal frame & audio pipeline | Guides keyframe extraction (`3 frames @ 640x360`), visual region-of-interest prompting (keys in hand, courier clipboard, insulin cold-chain box), and voice transcript fusion. |
| `vllm`, `sglang`, `llama-cpp`, `tensorrt-llm`, `speculative-decoding`, `flash-attention`, `awq`, `gptq`, `gguf`, `bitsandbytes`, `hqq`, `peft`, `trl-fine-tuning`, `grpo-rl-training`, `openrlhf`, `simpo`, `axolotl`, `llama-factory`, `unsloth`, `ml-training-recipes`, `moe-training`, `knowledge-distillation`, `model-merging`, `model-pruning`, `huggingface-tokenizers`, `sentencepiece` | Phase 3: Edge & Cloud Inference Architecture (`ARCHITECTURE.md`) | Documents the production edge-to-cloud distillation path (distilling Bedrock Nova Pro teacher traces into a quantized 4-bit GGUF/AWQ local Vega OS / Ring Edge vision model for sub-50ms offline inference). |
| `sentence-transformers`, `faiss`, `chroma`, `qdrant`, `pinecone`, `feature-engineering-tabular` | Phase 3 (`src/server/beeContextClient.ts`) | Implements semantic memory retrieval over `bee-cli` spoken facts and household care schedules. |

### D. Product Management, Architecture & Backend Engineering Skills
| Installed Skill Name | When Anti-Gravity Must Invoke It | Concrete Action Performed |
| :--- | :--- | :--- |
| `bmad`, `bmad-agent-pm`, `bmad-agent-analyst`, `bmad-prd`, `bmad-spec`, `openspec-propose`, `to-spec`, `spec-driven-development`, `grill-me`, `grill-with-docs` | Phase 2: Requirement & API Contract Lock | Ensures 100% traceability from `PRD.md` (`FR-01`–`FR-12`) to server endpoints, MCP tools, and UI components. |
| `bmad-architecture`, `bmad-agent-architect`, `architecture-patterns`, `architecture-decision-records`, `microservices-patterns`, `api-design-principles`, `api-and-interface-design`, `codebase-analysis-ycsyyds`, `improve-codebase-architecture`, `setup-ts-deep-modules`, `typescript-advanced-types`, `modern-javascript-patterns` | Phase 2 & Phase 4: Monorepo & Type System Design | Enforces deep TypeScript modules with narrow, strongly typed interfaces across `packages/ring-alexa-mcp-bridge` and `src/server/`. |
| `backend`, `nodejs-backend-patterns`, `async-python-patterns`, `postgresql-table-design`, `microsoft-foundry` | Phase 4 (`src/server/mcpStreamableServer.ts`) | Implements non-blocking SSE streams (`GET /mcp`, `GET /api/events`), JSON-RPC 2.0 request multiplexing (`POST /mcp`), and clean session teardown (`DELETE /mcp`). |
| `auth-implementation-patterns`, `harden`, `gravitas`, `gravitas-highstakes`, `gravitas-typescript`, `gravitas-python` | Phase 2 & Phase 4 (`SECURITY.md` & `hmacVerifier.ts`) | Implements `crypto.timingSafeEqual` for Ring `X-Ring-Signature` HMAC-SHA256 verification, replay timestamp guards, Origin validation, and zero-disk video frame buffers. |

### E. 10-Foot Fire TV UI, Spatial UX, Accessibility & 60fps Motion Design Skills
| Installed Skill Name | When Anti-Gravity Must Invoke It | Concrete Action Performed |
| :--- | :--- | :--- |
| `21st-ai`, `21st-cli-use`, `21st-design-sync`, `21st-registry`, `21st-ui-build`, `21st-ui-explore`, `21st-ui-review`, `superdesign`, `top-design`, `build-design`, `awesome-claude-design`, `awesome-design-md`, `extract-design-system` | Phase 5 (`src/client/`) | Crafts the 3-Pane Split-Screen Judge Command Studio and the 10-Foot Fire TV Glassmorphic Picture-in-Picture HUD. |
| `build-awwwards-quality-sites`, `awwwards-dna-harvester`, `awwwards-3d`, `apple-design`, `emil-design-eng`, `web-design-engineer`, `frontpage`, `hallmark`, `unicorn-studio`, `variant` | Phase 5: Visual Polish & Micro-Interactions | Elevates visual hierarchy, glassmorphism (`backdrop-filter: blur(16px)`), live waveform visualizers, and tactile D-Pad focus rings. |
| `better-ui`, `better-layout`, `better-colors`, `better-typography`, `better-interface`, `explain-interface`, `interface-review`, `nextjs-app-router-patterns`, `vercel-composition-patterns`, `vercel-react-best-practices`, `vercel-react-view-transitions`, `react-bits`, `react-state-management` | Phase 5 (`FireTvTenFootHud.tsx` & `App.tsx`) | Guarantees clean React state composition, zero unnecessary re-renders during live video/SSE streaming, and crisp 10-foot typography (`>=28px` headers on TV view). |
| `better-accessibility`, `accessibility-compliance`, `friction` | Phase 5: Deaf/HoH & Senior Care UX | Enforces WCAG AAA contrast (`11.4:1`), visual ASL/intent badges, clear cognitive phrasing for dementia/sundowning interventions, and zero focus traps. |
| `animate`, `animation-performance`, `animation-vocabulary`, `design-motion-principles`, `find-animation-opportunities`, `improve-animations`, `motion-design`, `motion-showreel`, `review-animations`, `gsap-core`, `gsap-frameworks`, `gsap-performance`, `gsap-plugins`, `gsap-react`, `gsap-scrolltrigger`, `gsap-timeline`, `gsap-utils`, `r3f-animation`, `r3f-fundamentals`, `r3f-geometry`, `r3f-interaction`, `r3f-lighting`, `r3f-loaders`, `r3f-materials`, `r3f-physics`, `r3f-postprocessing`, `r3f-shaders`, `r3f-textures`, `runway` | Phase 5: 60fps TV Overlay & Audio Ducking Choreography | Orchestrates the 380ms `power3.out` GSAP slide-in for the Fire TV PiP HUD, smooth audio-ducking gain ramp (`1.0 -> 0.2`), and pulse animations on active MCP tool calls. |

### F. TDD, Self-Healing Debugging, E2E Playwright QA & Anti-Slop Polish Skills
| Installed Skill Name | When Anti-Gravity Must Invoke It | Concrete Action Performed |
| :--- | :--- | :--- |
| `tdd`, `systematic-debugging`, `sleuth`, `spelunk`, `hotpath`, `hotseat`, `headroom`, `performance-optimization` | Phase 6: Unit & Protocol Testing | Drives red-green-refactor testing for HMAC verification, WHEP SDP negotiation, MCP `2025-11-25` headers, and sub-50ms local event routing. |
| `playwright-ci`, `playwright-cli`, `playwright-core`, `playwright-frontend`, `playwright-pom`, `playwright-qa`, `browser-testing-with-devtools`, `webapp-testing`, `break`, `break-ui`, `roadtest` | Phase 6 (`tests/e2e.spec.ts`) | Runs headless Chromium E2E tests clicking all 3 scenarios, testing Fire TV D-Pad `ArrowRight` + `Enter` focus actions, and asserting zero console errors. |
| `bmad-code-review`, `bmad-eval`, `code-review-and-quality`, `code-simplification`, `janitor`, `polish`, `impeccable`, `humanizer`, `stop-slop`, `unslop`, `not-ai`, `avoid-ai-writing`, `better-writing`, `writing-skills`, `technical-drawing`, `findable`, `deploy-to-vercel` | Phase 7 & Phase 8: Final Polish & Submission | Strips dead code, formats architecture diagrams, removes AI buzzwords from `README.md` and `SUBMISSION_AND_FRICTION_LOG.md`, and verifies one-command startup. |
