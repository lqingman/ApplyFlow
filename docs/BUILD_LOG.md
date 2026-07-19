# GPT-5.6 and Codex Build Log

This log records how ApplyProof was shaped and built with GPT-5.6 and Codex. It is intentionally concrete: each entry identifies the human decision, the work Codex accelerated, and how the result was verified.

Use this document as source material for the README, Devpost description, and demo-video narration. Do not paste private prompts, hidden reasoning, secrets, or personal candidate data here.

## Working method

For every meaningful milestone, record:

- **Goal:** what we were trying to accomplish
- **Human decision:** the product, engineering, or design choice made by the builder
- **Codex contribution:** planning, implementation, testing, debugging, research, or validation accelerated by Codex
- **Why GPT-5.6 helped:** the reasoning or semantic task for which the model was useful
- **Verification:** commands, tests, screenshots, or manual checks proving the result
- **Artifacts:** relevant files and commit hash

## Entries

### 2026-07-18 — Product scope and demo-first roadmap

**Goal:** turn a broad Chrome-extension concept into a project that can be completed and demonstrated reliably during the hackathon.

**Human decision:** build one controlled Northstar Labs application flow using the fictional Maya Chen profile, then polish it before adding resume parsing or broad ATS compatibility.

**Codex contribution:** inspected the initial empty repository, read the complete implementation plan, identified the strongest product narrative, reduced the first release to a vertical demo slice, and wrote the initial README and milestone roadmap.

**Why GPT-5.6 helped:** the planning task required synthesizing product scope, browser safety, model boundaries, test requirements, judging presentation, and implementation order into one coherent sequence.

**Verification:** reviewed the generated documentation for consistency and ran `git diff --check`.

**Artifacts:** `README.md`, `docs/ROADMAP.md`, `docs/BUILD_LOG.md`, and `docs/SUBMISSION_CHECKLIST.md`.

### 2026-07-18 — Phase 1 demo foundation

**Goal:** create a runnable foundation across the Chrome extension, controlled job application, shared contracts, and backend API.

**Human decision:** keep Phase 1 keyless and local, make the mock application comprehensive enough for later safety and scanning tests, and reserve actual profile data and generation behavior for their planned milestones.

**Codex contribution:** scaffolded the npm workspace and Python service; implemented the Manifest V3 side-panel shell, responsive Northstar Labs application, Zod contracts, FastAPI health endpoint, shared quality scripts, and baseline tests; then debugged lint boundaries and verified the rendered application in a browser.

**Why GPT-5.6 helped:** the implementation required keeping browser permissions, accessible form semantics, future field-detection fixtures, cross-language contracts, and demo presentation quality aligned while building three surfaces at once.

**Verification:** `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass. Five baseline tests cover the extension workflow shell, complete mock form, shared schemas, and API response. A browser inspection confirmed 18 inputs, four textareas, one select, two fieldsets, no horizontal overflow, and no console errors. A live request to `/health` returned the expected success payload. The built extension contains a valid MV3 manifest, side-panel entry point, and service worker; unpacked installation and toolbar-click behavior remain pending manual Chrome verification.

**Artifacts:** root workspace configuration, `apps/extension`, `apps/web-demo`, `apps/api`, `packages/shared-types`, `.env.example`, `README.md`, and `docs/ROADMAP.md`.

### 2026-07-18 — Phase 2 page scanning

**Goal:** understand the controlled Northstar Labs application accurately while excluding sensitive fields and unrelated page content.

**Human decision:** make scanning explicitly user-initiated, limit persistent host access to the two local demo origins, inject the scanner only into the active tab, keep the returned payload limited to normalized field metadata, and group radio buttons into one application question rather than exposing implementation-level controls.

**Codex contribution:** implemented native and practical ARIA control detection, prioritized accessible-label extraction, field normalization, a conservative sensitive-field denylist, on-demand Chrome messaging, the side-panel inventory, page highlighting and jump behavior, error and empty states, and unit plus controlled-form integration coverage.

**Why GPT-5.6 helped:** the milestone required reconciling accessibility semantics, browser permission boundaries, sensitive-data filtering, radio-group normalization, extension packaging, and a compact demo UI without expanding into Phase 3 autofill behavior.

**Verification:** `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` pass. Thirteen TypeScript tests plus one API test pass overall; the scanner integration test detects 18 of 18 intended safe mock fields, confirms every field has a useful label, groups both radio fixtures, retains character limits and select options, and excludes the password fixture. A browser-bridge regression test confirms scanning still proceeds when Chrome provides an active tab ID but withholds its URL. Chrome inspection confirmed the live Northstar form exposes the expected accessible controls. Reloading the unpacked extension and manually repeating scan plus jump-to-field remains the final human UI recheck after this build.

**Artifacts:** `apps/extension/src/scanner.ts`, `apps/extension/src/content.ts`, `apps/extension/src/browser.ts`, the Phase 2 side-panel UI and tests, `packages/shared-types`, `README.md`, and `docs/ROADMAP.md`.

### 2026-07-18 — Phase 3 trusted profile and safe autofill

**Goal:** replace the developer-oriented field inventory workflow with a profile-first experience that fills verified data in one action and focuses the user on exceptions.

**Human decision:** require a selected trusted profile before autofill; combine scan and deterministic fill into one primary action; keep resume upload deferred until the controlled demo is stable; preserve existing values; never fill demographics, work authorization, or legal confirmation; and move raw field metadata into optional details.

**Codex contribution:** updated the roadmap around the revised workflow; added a schema-validated Maya Chen profile with evidence records; implemented deterministic classification and mappings, page-safe value insertion, existing-value protection, profile inspection, an outcome summary, and an exception-only review queue; then used live Chrome inspection to find and fix repeated content-script injection that unit DOM tests did not expose.

**Why GPT-5.6 helped:** the work required translating product intent into a coherent state model across profile trust, browser scanning, deterministic mappings, high-risk decisions, UI prioritization, and extension messaging while preserving the boundaries planned for grounded generation in Phase 4.

**Verification:** formatting, linting, type checking, tests, and production builds pass. Twenty-two TypeScript tests plus one API test cover the profile fixture, profile-gated UI, 11 deterministic Northstar mappings, existing-value protection, demographic and legal skips, review routing, blocked-field counts, page insertion, browser messaging, and repeated-injection prevention. The controlled-form integration test confirms all 11 safe mappings fill while work authorization, demographics, and final confirmation remain empty. After rebuilding and reloading the unpacked extension, the builder completed the profile selection and Scan & Autofill workflow in Chrome without errors and accepted the Phase 3 behavior.

**Artifacts:** `packages/sample-data`, shared profile and fill contracts, `apps/extension/src/autofill.ts`, `apps/extension/src/pageFill.ts`, the revised side-panel UI, browser messaging tests, `README.md`, and `docs/ROADMAP.md`.

### 2026-07-18 — Post-demo workflow design

**Goal:** simplify the safe-autofill workflow before expanding from the controlled demo to personal data and real application sites.

**Human decision:** use one editable applicant profile instead of a profile picker; use only `Filled` and `Needs review` for eligible fields, without a second internal taxonomy for blocked, skipped, missing, or unsupported states; exclude denied sensitive fields from the workflow entirely; remember reusable user-confirmed answers by canonical meaning and scope; and introduce online support through tested site pilots rather than claiming universal ATS compatibility.

**Codex contribution:** inspected the Phase 2 scanner, Phase 3 deterministic mappings, extension permissions, result states, and roadmap; explained which behavior currently relies on sensitive-field regexes versus fixed demo-field IDs; reduced the proposed state model to two outcomes with plain-language review explanations; and translated the discussion into sequenced roadmap deliverables, acceptance criteria, README workflow documentation, and explicit website-support boundaries.

**Why GPT-5.6 helped:** the design required aligning a simple user experience with privacy boundaries, semantic field matching, durable versus time-dependent answers, legal confirmations, least-privilege browser access, and an incremental ATS compatibility strategy.

**Verification:** reviewed the documentation against the current implementation so completed Phase 3 behavior remains labeled as current and the newly agreed behavior remains unchecked future work; ran formatting and diff checks for the changed Markdown files.

**Artifacts:** `README.md`, `docs/ROADMAP.md`, and `docs/BUILD_LOG.md`.

### 2026-07-18 — Grounded answer generation design

**Goal:** turn the Phase 4 open-ended-question concept into an implementable, evidence-first workflow with one API contract across keyless demo and live AI modes.

**Human decision:** keep every eligible field in the same two-outcome model; leave AI drafts as `Needs review` until the user explicitly inserts them; show evidence, notes, and character count without answer statuses or confidence scores; return no draft when evidence is insufficient; remember confirmed reusable facts rather than complete company-specific answers; and keep the provider API key exclusively on the backend.

**Codex contribution:** wrote the answer-generation design covering question strategies, evidence and claim rules, review-card behavior, FastAPI request and response shapes, deterministic validation, fixture and live providers, memory and privacy policies, failure behavior, tests, implementation order, and acceptance criteria; then synchronized the README, roadmap, build log, and submission checklist.

**Why GPT-5.6 helped:** the design required reconciling truthful generation, a deliberately minimal state model, data minimization, character and context constraints, reusable candidate memory, reliable keyless judging, and a production-safe provider boundary.

**Verification:** checked current provider guidance for the Responses API, Structured Outputs, and server-side API-key management; reviewed the design against the existing scanner, profile fixtures, shared contracts, and two-outcome workflow decision; then ran Markdown formatting, repository format checks, link checks, and `git diff --check`.

**Artifacts:** `docs/ANSWER_GENERATION_DESIGN.md`, `README.md`, `docs/ROADMAP.md`, `docs/BUILD_LOG.md`, and `docs/SUBMISSION_CHECKLIST.md`.

### 2026-07-18 — Phase 4 grounded answer review implementation

**Goal:** turn the approved evidence-first design into a complete keyless demo path with an optional production-safe live provider.

**Human decision:** support three useful Northstar drafts from confirmed Maya evidence, keep the AI-workflow answer empty until the user confirms reusable facts, and require a separate user action before exact-text insertion.

**Codex contribution:** replaced the placeholder answer taxonomy with shared request and response contracts; added selective evidence routing, deterministic Northstar fixtures, provider-independent validation, the FastAPI endpoint, and an OpenRouter Responses API provider with Structured Outputs and `store: false`; then built editable evidence review cards, character checks, follow-up confirmation, regeneration, existing-value protection, and explicit insertion.

**Why GPT-5.6 helped:** the work required keeping the TypeScript and Pydantic contracts aligned while translating truthfulness rules into deterministic validation, safe failure behavior, provider parity, and a compact two-outcome review experience.

**Verification:** repository formatting, linting, TypeScript and Python type checks, unit and integration tests, and production builds pass. Tests cover three grounded fixture answers, missing AI evidence, duplicate and unavailable evidence IDs, unsafe claim rejection, server-side OpenRouter credentials and strict JSON Schema requests, selective evidence, review-before-fill state transitions, exact-text insertion, and existing-value preservation. The builder reloaded the unpacked extension and verified the three-answer review and insertion workflow in Chrome.

**Artifacts:** shared answer contracts; Maya evidence fixture; `apps/api/app/contracts.py`, `providers.py`, and `validation.py`; the `/v1/answer-drafts` route; extension evidence selection, API client, review UI, and tests; `.env.example`; `README.md`; and `docs/ROADMAP.md`.

## Entry template

Copy this section for the next milestone:

```markdown
### YYYY-MM-DD — Milestone name

**Goal:**

**Human decision:**

**Codex contribution:**

**Why GPT-5.6 helped:**

**Verification:**

**Artifacts:**
```

## Moments worth capturing for the video

Capture short clips or screenshots as the work happens:

1. Codex narrowing the original plan to a demo-first roadmap.
2. Codex implementing a complete vertical slice across extension, demo page, and API.
3. A test or browser check finding a real issue.
4. The human choosing between tradeoffs suggested by Codex.
5. Codex fixing the issue and re-running verification.

The final video should use these as brief supporting evidence. The working ApplyProof demo remains the main subject.
