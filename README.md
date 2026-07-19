# ApplyProof

ApplyProof is a Chrome extension that helps people complete job applications with answers grounded in their actual resume and candidate profile.

Traditional autofill handles contact details. Generic AI can write polished answers, but may exaggerate or invent experience. ApplyProof combines deterministic profile autofill with resume-grounded drafts that are generated and reviewed directly on the application page.

> **Project status:** Phase 4 inline answer generation complete. One Scan & Autofill action fills saved profile fields and checkboxes, then generates blank open-ended answers on the page. Hover or focus reveals an optional instruction and Regenerate action.

The current build is a controlled local demo. The confirmed product direction is one editable applicant profile, page-native review, and gradual validation on real application sites after the local workflow is stable.

## The idea

ApplyProof should help an applicant:

1. Load a resume or demo profile.
2. Open a job application.
3. Detect and classify its form fields.
4. Fill confirmed personal information deterministically.
5. Draft blank open-ended answers from relevant resume evidence directly into the page.
6. Review and edit the answer in the application field; add an optional instruction before regenerating.
7. Audit the application for missing fields, inconsistencies, unsupported claims, and length violations.

ApplyProof never submits an application automatically.

## Product principles

- **Evidence before eloquence.** Material claims must trace back to the resume, profile, or an explicit user answer.
- **Deterministic when possible.** Names, email addresses, dates, and direct profile mappings do not need a language model.
- **Explicit profile choices.** Work authorization and gender are filled only from choices saved in the profile, never inferred from a name or resume.
- **Review on the real page.** Generated drafts are starting points that remain editable in the application field.
- **No surprise overwrites.** Existing non-empty fields are preserved unless the user confirms a replacement.
- **No automatic submission.** The user inspects and submits the final application.
- **Minimum page access.** Only normalized form metadata and relevant job context should leave the page.
- **One applicant-owned profile.** The product should edit and reuse one `My Profile`; Maya remains seed data for the demo rather than a long-term profile choice.
- **Remember meaning, not wording.** A reviewed answer may be reused only when a later question maps confidently to the same scoped concept.

## Hackathon demo

The first goal is one reliable, polished workflow—not universal support for every applicant tracking system.

The demo uses:

- **Candidate:** Maya Chen, a fictional new-grad software engineer
- **Company:** Northstar Labs
- **Role:** Junior Software Engineer
- **Environment:** a local mock application and unpacked Chrome extension

### Target demo flow

1. Open the Northstar Labs mock application.
2. Open the ApplyProof side panel and choose Maya's demo profile.
3. Run Scan & Autofill to detect the page and insert verified profile fields in one action.
4. See saved authorization, gender, and confirmation choices filled with the other profile fields.
5. See blank open-ended answers generate directly on the application page.
6. Hover or focus an answer, add an optional instruction, and regenerate it in place.
7. Confirm character limits are respected and edit the generated text before continuing.
8. Run a transparent readiness audit when that milestone is complete.

The demo is successful when a judge can complete this flow locally without an account or personal data.

## MVP scope

### Included

- Chrome Manifest V3 extension with a side panel
- Local mock job application
- Built-in fictional candidate profile and evidence records
- Detection of common inputs, textareas, selects, radio buttons, and accessible labels
- Deterministic mapping for confirmed profile fields
- Safe insertion with existing-value protection
- Grounded answers for open-ended questions
- Inline Generate and Regenerate controls with optional instructions
- Live character-limit discovery, validation, and automatic over-limit retry
- Sensitive-field blocking
- Unsupported-claim checks
- Rule-based final application audit

### Deferred until the demo works

- Resume PDF upload and extraction
- A persistent, editable `My Profile` and local answer memory
- Validated online forms and selected ATS integrations
- Broad third-party ATS compatibility
- Authentication or multi-user persistence
- Automatic job discovery or submission
- LinkedIn scraping
- Application tracking
- Cover-letter generation
- Payments
- Chrome Web Store publishing
- A vector database

## Planned architecture

```text
ApplyProof/
├── apps/
│   ├── extension/       # Manifest V3 extension and side-panel UI
│   ├── web-demo/        # Northstar Labs mock job application
│   └── api/             # FastAPI analysis and generation endpoints
├── packages/
│   ├── shared-types/    # Shared contracts and validation schemas
│   └── sample-data/     # Maya profile, evidence, and job fixture
├── docs/
│   ├── ANSWER_GENERATION_DESIGN.md
│   ├── BUILD_LOG.md
│   ├── ROADMAP.md
│   └── SUBMISSION_CHECKLIST.md
└── README.md
```

Planned stack:

- **Extension and demo:** React, TypeScript, Vite, Zod, Vitest
- **Backend:** Python 3.12, FastAPI, Pydantic, pytest
- **Browser platform:** Chrome Manifest V3 and Side Panel API
- **Model integration:** server-side fixture, OpenRouter Responses API, or Gemini OpenAI-compatible provider with Structured Outputs

The demo should remain useful without a model key where practical. Deterministic fields, safety behavior, scanning, and auditing should still work, while sample generated answers may be supplied as fixtures for presentation reliability.

## Page-native workflow

The side panel is intentionally compact: it selects the profile, starts Scan & Autofill, and reports progress. It does not duplicate an outcome summary, review queue, or complete field inventory.

Deterministic values and mapped checkboxes are inserted after the user initiates autofill. Blank textareas receive resume-grounded drafts. Existing deterministic and open-ended values are preserved. Generated answers are reviewed and edited in the page itself, and explicit Regenerate may replace the current open-ended answer.

The complete open-ended-question workflow, API contract, evidence rules, fixture mode, OpenRouter mode, memory policy, and failure behavior are defined in [the grounded answer generation design](docs/ANSWER_GENERATION_DESIGN.md).

## Confirmed product workflow after the demo

1. The user creates or imports one editable `My Profile` containing stable facts and evidence.
2. ApplyProof scans an application only after the user initiates the action.
3. Confirmed profile facts, authorization, demographics, applicable remembered answers, and mapped confirmations are filled deterministically.
4. Blank open-ended questions receive a resume-based draft; existing page values are preserved.
5. When the user confirms a reusable answer, ApplyProof stores it under a canonical, scoped meaning rather than the site's exact wording.
6. Later semantically equivalent questions may reuse that answer when classification confidence is high.
7. Time-dependent preferences can be reviewed again. Continue, Next, and Submit always remain user actions.

For example, a confirmed answer to “Are you legally authorized to work in Canada?” may be stored as `work_authorization.canada` with its source and confirmation time. A later equivalent Canadian work-eligibility question may reuse it. That does not authorize ApplyProof to answer a different country's question, infer immigration status, accept legal terms, or submit the application.

## Website support

The supported and tested environment today is the local Northstar Labs application. The extension uses user-initiated active-tab access and has persistent host permissions only for the local demo origins. Simple online forms may happen to work, but they are not yet an advertised capability.

Online support will be introduced as a compatibility pilot: validate ordinary HTML forms first, then selected ATS platforms one at a time. Each advertised site must pass repeatable tests covering semantic field classification, custom controls, dynamic and multi-step forms, iframe boundaries, existing-value protection, inline drafting, live limits, and the guarantee that ApplyProof never submits automatically. Universal ATS support remains out of scope.

## Safety boundaries

ApplyProof must not:

- click a final Submit button;
- accept legal terms;
- infer work authorization or demographic answers that are absent from the saved profile;
- fill passwords, government identifiers, payment fields, banking fields, or security questions;
- make legal or immigration conclusions;
- send unrelated page content to the backend; or
- expose hidden prompts or model reasoning.

## Roadmap

Development follows a demo-first sequence:

1. **Foundation:** runnable extension shell, API health endpoint, and mock application.
2. **Scan:** detect and normalize fields on the mock page.
3. **Safe autofill:** load Maya's profile and fill verified fields without overwriting values.
4. **Grounded answers:** generate evidence-backed open-ended answers on the page for review and regeneration.
5. **Verification and audit:** detect unsupported claims and calculate application readiness using transparent rules.
6. **Demo polish:** improve UI, resilience, documentation, and the three-minute presentation.
7. **Post-demo expansion:** replace demo profile selection with one editable profile, add scoped answer memory, then validate online sites incrementally.

See [the detailed roadmap](docs/ROADMAP.md) for acceptance criteria and sequencing.

## How GPT-5.6 and Codex were used

ApplyProof is being planned and built collaboratively with Codex. We use GPT-5.6 for the work that benefits from broad reasoning and semantic understanding, while keeping product ownership and final decisions with the human builder.

### Where Codex accelerated the workflow

- Read the original long-form product plan and converted it into a narrower, judge-ready vertical slice.
- Inspected the new repository before proposing implementation work.
- Created the initial README and phased roadmap from the planning conversation.
- Made safety requirements—no automatic submission, no unsupported material claims, explicit profile choices, and page-native review—acceptance criteria rather than informal intentions.
- Identified features that should be deterministic and moved expensive or risky features, such as broad ATS support and vector search, after the demo milestone.

As implementation progresses, this section will be updated with concrete examples of code generation, debugging, test creation, browser verification, and design iteration.

### Key decisions made by the human builder

- Build the controlled demo first, then polish it before expanding scope.
- Position ApplyProof around truthfulness and visible evidence, not generic form filling.
- Keep applicants in control by making generated answers editable and leaving navigation and submission manual.
- Optimize the hackathon build for one coherent end-to-end experience.

### How we preserve evidence of the collaboration

- Maintain a dated [build and decision log](docs/BUILD_LOG.md).
- Use milestone commits so the repository history shows how the project evolved.
- Record representative Codex planning, implementation, testing, and browser-validation moments for the demo video.
- Run `/feedback` in the primary Codex project task after the majority of core functionality has been built, then place that Session ID in the Devpost submission form.

The `/feedback` Session ID is submission metadata and does not need to be published in this README.

## Development approach

Each milestone should be a small, demonstrable vertical slice:

1. Inspect the current implementation.
2. Define the milestone's narrow acceptance criteria.
3. Implement the smallest complete behavior.
4. Add or update tests.
5. Run formatting, linting, type checks, and tests.
6. Record limitations and follow-up work.
7. Commit the milestone separately.

We prioritize a dependable demo, conservative behavior, and clear evidence over feature count.

## Getting started

### Prerequisites

- Node.js 20 or newer and npm 10 or newer
- Python 3.12 or newer
- Google Chrome 116 or newer for the Side Panel API

### Install

```bash
npm install
python3 -m venv .venv
.venv/bin/pip install -e 'apps/api[dev]'
cp .env.example .env
```

### Run the local surfaces

Use a separate terminal for each process:

```bash
npm run dev:web
npm run dev:extension
npm run dev:api
```

- Mock application: `http://localhost:5173`
- API health check: `http://127.0.0.1:8000/health`
- API documentation: `http://127.0.0.1:8000/docs`

For Chrome, build the extension with `npm run build --workspace @applyproof/extension`, open
`chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select
`apps/extension/dist`. Click the ApplyProof toolbar action to open its side panel.

With the Northstar Labs application active, select **Use Maya demo profile**, then click **Scan &
Autofill**. ApplyProof fills saved profile values, work authorization, gender, and the accuracy
confirmation; preserves existing answers; blocks the password fixture; and starts generating blank
open-ended fields directly on the page. Hover or focus an open-ended field to add an optional
instruction and regenerate it. The side panel remains compact and does not duplicate a summary,
review queue, or field inventory. After rebuilding an already loaded unpacked extension, use the
reload button on `chrome://extensions` and refresh the application page before retesting.

Start the API in keyless fixture mode for deterministic demo answers. The AI-workflow question uses
resume project, skill, testing, and accessibility evidence to produce a conservative starting draft
for user review; it does not require a separate confirmation flow. Character constraints are read
from native attributes, custom attributes, ARIA/helper text, and the live field before each request.
If a provider still exceeds a known limit, the API retries once with the exact maximum.

For live OpenRouter generation, set `ANSWER_GENERATION_MODE=openrouter` and provide
`OPENROUTER_API_KEY` only in the API server environment. The default model is
`openai/gpt-4o-mini`. Alternatively, use `ANSWER_GENERATION_MODE=gemini` with a server-only
`GEMINI_API_KEY`; Gemini defaults to `gemini-2.5-flash`. The extension never reads either key.
`npm run dev:api` loads the ignored root `.env`. After changing `.env`, fully stop and restart the
API process because Uvicorn file reload does not reload environment variables.

### Verify

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

The API scripts expect the project-local `.venv` created by the install steps. The extension and
mock application contain no model dependency or secrets. Scanning runs only after a user action and
passes normalized field metadata through the extension; it does not send full-page HTML or page copy
to the API. Persistent host access is limited to the local demo origins (`localhost` and
`127.0.0.1`). Real application sites are not yet supported or advertised; they will be added through
the compatibility pilot described above.

Before submitting, use the [hackathon submission checklist](docs/SUBMISSION_CHECKLIST.md).

## License

License to be decided before public distribution.
