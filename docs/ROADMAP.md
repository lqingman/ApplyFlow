# ApplyProof Roadmap

This roadmap turns the product plan into a demo-first build sequence. Every milestone must leave the project in a runnable, explainable state.

## How to track progress

- Mark a deliverable `[x]` when its implementation exists.
- Mark an acceptance criterion `[x]` only after it has been tested or manually verified.
- A phase is complete only when all of its deliverables and acceptance criteria are checked.
- Add verification details to `docs/BUILD_LOG.md` before closing a phase.
- If scope changes, update this roadmap instead of silently skipping an item.

### Progress summary

| Phase                             | Status      |
| --------------------------------- | ----------- |
| 1. Demo foundation                | Complete    |
| 2. Page scanning                  | Complete    |
| 3. Demo profile and safe autofill | Complete    |
| 4. Grounded answer review         | Not started |
| 5. Claim verification and audit   | Not started |
| 6. Hackathon polish               | Not started |
| 7. Post-demo productization       | Deferred    |

## Definition of the first demo

A judge can install the unpacked extension, open the local Northstar Labs application, select the Maya Chen profile, scan the form, fill safe fields, inspect three grounded answers, see one unsupported claim rejected, review a high-risk field, and run a final audit.

No account, personal resume, production deployment, or automatic submission is required.

## Phase 1 — Demo foundation

**Goal:** prove that all three application surfaces can run locally.

### Deliverables

- [x] Monorepo workspace and shared scripts
- [x] Manifest V3 extension shell
- [x] Chrome side panel with placeholder Profile, Analyze, Review, and Audit states
- [x] Northstar Labs mock application containing all target field types
- [x] FastAPI service with a health endpoint
- [x] Shared core data contracts
- [x] Environment example and setup instructions

### Acceptance criteria

- [x] The extension can be loaded unpacked in Chrome.
- [x] Clicking the extension opens the side panel.
- [x] The mock application runs locally and displays the complete demo form.
- [x] The API health endpoint returns successfully.
- [x] Linting, type checking, and baseline tests pass.

## Phase 2 — Page scanning

**Goal:** accurately understand the controlled demo form without collecting unrelated page content.

### Deliverables

- [x] Detection for `input`, `textarea`, `select`, radio groups, and practical custom controls
- [x] Label extraction using associated labels, parent labels, ARIA attributes, nearby text, then placeholders
- [x] Normalized field metadata
- [x] Sensitive-field denylist
- [x] Side-panel field inventory
- [x] Page highlighting and jump-to-field behavior

### Acceptance criteria

- [x] At least 90% of intended mock fields are detected.
- [x] Every detected field has a useful label.
- [x] Password and other blocked fields are excluded.
- [x] Scanning sends normalized metadata rather than the full page.
- [x] Label extraction and normalization have unit tests.

## Phase 3 — Demo profile and safe autofill

**Goal:** let the user choose a trusted profile, scan and safely autofill the application in one action, then focus only on exceptions requiring review.

### Deliverables

- [x] Maya Chen profile with resume-like evidence records
- [x] Profile selection, summary, and inspection UI
- [x] Combined Scan & Autofill primary action that requires a selected profile
- [x] Rule-based field classification for known demo fields
- [x] Deterministic mappings for identity, contact, education, links, location, relocation, and availability
- [x] Existing-value protection
- [x] Explicit skip behavior for demographic and high-risk fields
- [x] Autofill result summary for filled, review-required, skipped, and blocked fields
- [x] Review queue that surfaces only exceptions and manual decisions
- [x] Full detected-field inventory moved into optional details

### Acceptance criteria

- [x] Name, email, phone, school, degree, graduation date, GitHub URL, and location map correctly.
- [x] Non-empty fields are not overwritten without confirmation.
- [x] Optional demographics remain unfilled.
- [x] Work authorization is visibly marked `needs_review`.
- [x] Filling occurs only after a user action.
- [x] Autofill cannot run until the user selects a profile.
- [x] Scan results prioritize the outcome summary and review queue instead of raw field metadata.
- [x] Reload the unpacked extension and verify the complete workflow in Chrome.

## Phase 4 — Grounded answer review

**Goal:** demonstrate useful AI assistance without hiding uncertainty or evidence.

### Deliverables

- [ ] Lightweight evidence selection from structured candidate records
- [ ] Structured answer-generation contract
- [ ] Answers tailored to the Northstar Labs role
- [ ] Character-limit enforcement
- [ ] Review cards showing answer, status, evidence excerpts, confidence, warnings, edit, and fill actions
- [ ] Deterministic fixture mode for a reliable keyless demo

### Initial questions

- Why are you interested in this role?
- Describe a relevant project.
- How do you use AI in your development workflow?
- What makes you a strong candidate?

### Acceptance criteria

- [ ] At least three answers can be reviewed and inserted.
- [ ] Every material generated answer cites candidate evidence.
- [ ] Answers use the correct company and role names.
- [ ] Character limits are respected.
- [ ] Generated text is never inserted without user review and action.
- [ ] Missing evidence produces `needs_review` or `unsupported`, not fabrication.

## Phase 5 — Claim verification and application audit

**Goal:** make truthfulness and review—not text generation—the memorable feature.

### Deliverables

- [ ] Material-claim extraction and evidence checks
- [ ] Conservative replacement suggestions
- [ ] Unsupported leadership and numerical-impact test cases
- [ ] Checks for blank required fields, length violations, context mismatches, conflicting values, repeated generic answers, and review-required fields
- [ ] Transparent rule-based readiness score
- [ ] Issue list with jump-to-field actions

### Acceptance criteria

- [ ] “I led a team of ten engineers” is flagged when the profile does not support it.
- [ ] Invented metrics and technologies are flagged.
- [ ] Supported technical claims pass.
- [ ] Missing required fields and length violations reduce readiness predictably.
- [ ] The UI explains every deduction from the readiness score.

## Phase 6 — Hackathon polish

**Goal:** make the complete story easy to understand and difficult to break during judging.

### Deliverables

- [ ] Cohesive visual design and status language
- [ ] Loading, empty, error, and offline states
- [ ] Seed/reset demo controls
- [ ] Automated unit and integration coverage for the critical path
- [ ] Fresh-machine setup validation
- [ ] Three-minute demo script and backup recording
- [ ] Architecture and model-usage documentation

### Acceptance criteria

- [ ] The full demo completes without editing source code or supplying personal data.
- [ ] Resetting restores the initial demo state.
- [ ] The primary path works repeatedly in a clean Chrome profile.
- [ ] A new contributor can follow the README to run all services.
- [ ] The demo fits within three minutes.

## Phase 7 — Post-demo productization

These items begin only after the controlled demo is stable. The product workflow has been narrowed to one applicant-owned profile rather than a profile picker, two user-visible field outcomes rather than four, and gradual online-site support rather than a claim of universal ATS compatibility.

### 7A — Single editable profile and answer memory

- [ ] Replace profile selection with one persistent `My Profile`
- [ ] Add create, inspect, edit, save, and local reset controls for that profile
- [ ] Keep “Load Maya demo data” as a demo seeding action, not a second selectable profile
- [ ] Add plain-text and PDF resume import with editable extraction results
- [ ] Separate stable profile facts from user-confirmed application preferences
- [ ] Store reusable answers under canonical keys such as `work_authorization.canada`
- [ ] Record the answer source, confirmation time, and applicable country or scope
- [ ] Reuse a saved answer only when the new question maps to the same canonical meaning with high confidence
- [ ] Re-review time-dependent preferences such as start date, salary, and relocation when context changes
- [ ] Never remember or autofill passwords, verification codes, government identifiers, financial data, or per-application legal attestations
- [ ] Add local privacy controls for viewing, editing, exporting, and deleting saved data

### 7B — Simplified field workflow

- [ ] Show only `Filled` and `Needs review` as primary user-facing field outcomes
- [ ] Treat profile facts and high-confidence remembered answers as eligible for user-initiated autofill
- [ ] Route unknown questions, first-time decisions, conflicts, ambiguous options, and failed insertions to `Needs review`
- [ ] Keep `blocked_sensitive`, `optional_unmapped`, `not_found`, and `unsupported_control` as internal reason codes for safety, diagnostics, and audit
- [ ] Remove `Skipped` and `Blocked` from the primary outcome summary
- [ ] Optionally disclose ignored sensitive fields in privacy details without exposing their values
- [ ] Require a fresh user action for legal accuracy confirmations and final submission on every application

### 7C — Online application pilot

- [ ] Preserve least-privilege, user-initiated access to the active application tab
- [ ] Validate ordinary online HTML forms before claiming third-party site support
- [ ] Pilot one selected ATS, then add platforms individually using regression fixtures
- [ ] Improve semantic field classification using labels, names, IDs, autocomplete metadata, types, options, and surrounding question text
- [ ] Add more robust accessible custom-control, dynamic-form, multi-step, and iframe support
- [ ] Document an explicit supported-site matrix and known limitations
- [ ] Do not claim universal ATS support without compatibility evidence

### 7D — Operational readiness

- [ ] Evaluation datasets for classification and claim verification
- [ ] Model-provider configuration, observability, cost controls, and failure handling
- [ ] Security and privacy review
- [ ] Chrome Web Store readiness

### Acceptance criteria

- [ ] Returning users can autofill without selecting a profile on every application.
- [ ] Editing `My Profile` changes subsequent deterministic fills.
- [ ] A first-time work-authorization answer requires review; a later semantically equivalent question can reuse the confirmed scoped answer.
- [ ] Existing page values are never silently overwritten.
- [ ] The primary UI contains only `Filled` and `Needs review`; internal safety reasons remain inspectable for debugging and audit.
- [ ] Final legal confirmation and submission always require a fresh user action.
- [ ] Each advertised online site passes a repeatable scan, fill, review, and no-submit test.

## Explicit non-goals for the hackathon

- Automatic application submission
- Automatic job discovery
- Universal ATS support
- Applicant tracking dashboard
- LinkedIn scraping
- Email automation
- Cover-letter documents
- Authentication, billing, or recruiter analytics
- Full vector-search infrastructure

## Suggested build order within each phase

Prefer a thin end-to-end behavior over isolated layers. For example, Phase 2 should first scan one text input and show it in the side panel, then expand field coverage. Phase 4 should first generate one fully evidenced answer and insert it safely, then add the remaining questions.

At the end of every phase:

- run formatter, linter, type checker, unit tests, and relevant integration tests;
- manually repeat the demo path;
- update the README if commands or behavior changed;
- add a dated entry to `docs/BUILD_LOG.md` describing the human decisions and Codex contribution;
- save a short screenshot or clip when the milestone demonstrates a useful Codex-assisted planning, implementation, debugging, or verification moment;
- record known limitations; and
- create one descriptive milestone commit.
