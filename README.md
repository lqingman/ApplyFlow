# ApplyProof

ApplyProof is a Chrome extension that helps people complete job applications with answers grounded in their actual resume and candidate profile.

Traditional autofill handles contact details. Generic AI can write polished answers, but may exaggerate or invent experience. ApplyProof combines deterministic profile autofill with resume-grounded drafts that are generated and reviewed directly on the application page.

> **Hackathon status:** The submission demo is complete and runnable locally. It includes an editable local profile, resume import and storage, safe autofill, evidence-grounded inline answers, cover-letter drafting, resume attachment, and builder-tested pilots on Workable, BambooHR, and Greenhouse.

The supported judging path is the controlled Northstar Labs local demo. Real-site integrations remain compatibility pilots rather than a claim of universal ATS support.

## The idea

ApplyProof helps an applicant:

1. Load a resume or demo profile.
2. Open a job application.
3. Detect and classify its form fields.
4. Fill confirmed personal information deterministically.
5. Draft blank open-ended answers from relevant resume evidence directly into the page.
6. Review and edit the answer in the application field; add an optional instruction before regenerating.

ApplyProof never submits an application automatically.

## Product principles

- **Evidence before eloquence.** Material claims must trace back to the resume, profile, or an explicit user answer.
- **Deterministic when possible.** Names, email addresses, dates, and direct profile mappings do not need a language model.
- **Explicit profile choices.** Work authorization and gender are filled only from choices saved in the profile, never inferred from a name or resume.
- **Review on the real page.** Generated drafts are starting points that remain editable in the application field.
- **No surprise overwrites.** Existing non-empty fields are preserved unless the user confirms a replacement.
- **No automatic submission.** The user inspects and submits the final application.
- **Minimum page access.** Only normalized form metadata and relevant job context should leave the page.
- **One applicant-owned profile.** The product edits and reuses one `My Profile`; Maya remains seed data for the demo rather than a long-term profile choice.
- **Remember meaning, not wording.** The current scoped memory keeps Canadian work authorization and sponsorship separate and reuses them only when the later question maps confidently to the same concept and country.

## Hackathon demo

The first goal is one reliable, polished workflow—not universal support for every applicant tracking system.

The demo uses:

- **Candidate:** Maya Chen, a fictional new-grad software engineer
- **Company:** Northstar Labs
- **Role:** Junior Software Engineer
- **Environment:** a local mock application and unpacked Chrome extension

### Demo flow

1. Open the Northstar Labs mock application.
2. Open the ApplyProof side panel and load Maya data into `My Profile`.
3. Run Scan & Autofill to detect the page and insert verified profile fields in one action.
4. See saved authorization, gender, and confirmation choices filled with the other profile fields.
5. See blank open-ended answers generate directly on the application page.
6. Hover or focus an answer, add an optional instruction, and regenerate it in place.
7. Confirm character limits are respected and edit the generated text before continuing.

The demo is successful when a judge can complete this flow locally without an account or personal data.

## MVP scope

### Included

- Chrome Manifest V3 extension with a side panel
- Local mock job application
- One locally persisted, editable `My Profile`
- Built-in fictional candidate data for seeding `My Profile`
- Local Word (`.docx`) and text-based PDF resume import with editable extraction results
- Scoped local work-authorization answer memory
- Detection of common inputs, textareas, selects, radio buttons, and accessible labels
- Deterministic mapping for confirmed profile fields
- Safe insertion with existing-value protection
- Grounded answers for open-ended questions
- Inline Generate and Regenerate controls with optional instructions
- Live character-limit discovery, validation, and automatic over-limit retry
- Sensitive-field blocking

### Deliberately outside the submission scope

- Broad third-party ATS compatibility
- Authentication or multi-user persistence
- Automatic job discovery or submission
- LinkedIn scraping
- Application tracking
- Payments
- Chrome Web Store publishing
- A vector database
- General-purpose memory for arbitrary application questions

## Architecture

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
│   ├── DEMO_VIDEO_SCRIPT.md
│   ├── DEVPOST_SUBMISSION.md
│   ├── ROADMAP.md
│   └── SUBMISSION_CHECKLIST.md
└── README.md
```

Stack:

- **Extension and demo:** React, TypeScript, Vite, Zod, Vitest
- **Backend:** Python 3.12, FastAPI, Pydantic, pytest
- **Browser platform:** Chrome Manifest V3 and Side Panel API
- **Model integration:** server-side fixture, OpenRouter Responses API, or Gemini OpenAI-compatible provider with Structured Outputs

The demo remains useful without a model key. Fixture mode supplies deterministic grounded drafts for presentation reliability, while OpenRouter and Gemini modes exercise the same validated response contract with server-side credentials.

## Page-native workflow

The side panel is intentionally compact: it creates, edits, or seeds the single local `My Profile`, starts Scan & Autofill, and reports progress. It does not duplicate an outcome summary, review queue, or complete field inventory.

Deterministic values and mapped checkboxes are inserted after the user initiates autofill. Blank textareas receive resume-grounded drafts. Existing deterministic and open-ended values are preserved. Generated answers are reviewed and edited in the page itself, and explicit Regenerate may replace the current open-ended answer.

The complete open-ended-question workflow, API contract, evidence rules, fixture mode, OpenRouter mode, memory policy, and failure behavior are defined in [the grounded answer generation design](docs/ANSWER_GENERATION_DESIGN.md).

New users can start `My Profile` directly with **From resume** or **From scratch**. Import supports Word `.docx` and text-based `.pdf` files up to 10 MB. The original document is stored only in extension-owned IndexedDB so it can later be attached to an ordinary resume upload field; the original binary is never sent to the ApplyProof API or model provider. During **Import resume**, the extension extracts document text locally and sends that text plus a deterministic baseline to the configured server-side AI provider. When the user saves the imported profile, the extracted text is retained beside the original file in the same local IndexedDB record. This preserves projects and other resume sections that may not map into editable Profile fields. For grounded answers and cover letters, ApplyProof selects only relevant local text snippets as evidence and sends those snippets—not the original binary—to the API and configured provider. Replacing a file through **My resume file** clears extracted text associated with the old file; importing the replacement rebuilds it. Schema-validated identity, city/region, portfolio and LinkedIn links, multiple education and work-experience records, source-review metadata, and evidence remain editable before saving. Work-experience descriptions retain the resume's wording instead of being summarized or rephrased. If AI extraction is unavailable, ApplyProof falls back to the local deterministic result. Legacy `.doc`, encrypted PDFs, and scanned image-only PDFs without a text layer are not supported; OCR is intentionally out of scope.

Cover-letter textareas use the same evidence boundary. ApplyProof first looks for bounded `JobPosting` structured data or an explicit job-description container. If it cannot find a job description, it does not auto-generate the cover letter and asks the user to paste the description into the inline assistant. The pasted description provides job context only; candidate claims must still come from Profile evidence or selected saved-resume snippets.

## Product workflow

1. The user creates or imports one editable `My Profile` containing stable facts and evidence.
2. ApplyProof scans an application only after the user initiates the action.
3. Confirmed profile facts, authorization, demographics, applicable remembered answers, and mapped confirmations are filled deterministically.
4. Blank open-ended questions receive a resume-based draft; existing page values are preserved.
5. Explicit Canadian work-authorization and sponsorship choices are stored under separate canonical, country-scoped meanings rather than a site's exact wording.
6. Later semantically equivalent Canadian questions may reuse the matching choice when classification confidence is high.
7. Continue, Next, and Submit always remain user actions.

For example, “Are you legally authorized to work in Canada?” and “Will you require sponsorship?” are stored separately as `work_authorization.canada.authorized` and `work_authorization.canada.sponsorship`, with their source and confirmation time. Later equivalent Canadian questions may reuse the matching answer. That does not authorize ApplyProof to answer a different country's question, infer immigration status, accept legal terms, or submit the application.

## Website support

The fully supported environment today is the local Northstar Labs application. Workable, BambooHR, and Greenhouse remain builder-tested pilots rather than generally supported integrations. The extension uses user-initiated active-tab access and has persistent required host permissions only for the local demo origins. Embedded Greenhouse forms request the narrowly declared `job-boards.greenhouse.io` optional permission only when such a frame is detected. Other online forms may happen to work, but they are not advertised as supported without compatibility evidence.

Online support is being validated one platform at a time. Workable, BambooHR, and Greenhouse have builder-tested pilots, with regression coverage for the site-specific behavior fixed during those tests. A platform moves from pilot to supported only after it passes the repeatable criteria in the compatibility matrix. Universal ATS support remains out of scope.

See the [site compatibility matrix](docs/SITE_COMPATIBILITY.md) for the tested baseline, unsupported platforms, access model, known limitations, and pilot exit criteria.

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

Development followed a demo-first sequence:

1. **Foundation:** runnable extension shell, API health endpoint, and mock application.
2. **Scan:** detect and normalize fields on the mock page.
3. **Safe autofill:** load Maya's profile and fill verified fields without overwriting values.
4. **Grounded answers:** generate evidence-backed open-ended answers on the page for review and regeneration.
5. **Product workflow expansion:** replaced demo profile selection with one editable profile, added scoped work-authorization memory, resume import and attachment, cover letters, and incremental online pilots.
6. **Submission and demo polish:** package the stable judging path, documentation, and three-minute presentation.

See [the detailed roadmap](docs/ROADMAP.md) for acceptance criteria and sequencing.

## How GPT-5.6 and Codex were used

ApplyProof was planned and built collaboratively with Codex using GPT-5.6. GPT-5.6 helped reason across product scope, browser security, accessibility, schema design, test failures, and third-party ATS behavior, while the human builder retained product ownership and made the final tradeoffs.

### Where Codex accelerated the workflow

- Converted a broad product plan into a judge-ready vertical slice spanning a Chrome extension, local application, shared TypeScript contracts, and a FastAPI service.
- Implemented and iterated on profile storage, deterministic field mapping, page-native writing controls, strict provider schemas, evidence validation, resume parsing, and cross-frame Greenhouse routing.
- Wrote regression tests alongside the implementation. The final repository has 129 passing tests across extension, demo, shared packages, and API.
- Used browser inspection and failing tests to diagnose real issues including Chrome `activeTab` behavior, Workable's oversized character limit, BambooHR custom address controls, Greenhouse ARIA combobox timing, and embedded Greenhouse iframe routing.
- Kept safety requirements—no automatic submission, no unsupported material claims, explicit sensitive choices, existing-value protection, and bounded page access—as executable acceptance criteria.
- Maintained the roadmap, compatibility matrix, build log, and submission checklist as the implementation evolved.

### Key decisions made by the human builder

- Build one controlled, repeatable demo before expanding to real ATS pilots.
- Position ApplyProof around truthfulness and visible evidence, not generic form filling.
- Keep applicants in control by making generated answers editable and leaving navigation and submission manual.
- Use deterministic logic for known facts and reserve model generation for evidence-backed writing.
- Treat Workable, BambooHR, and Greenhouse as builder-tested pilots instead of claiming universal compatibility.
- Stop adding scope once the coherent end-to-end judging path was complete.

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

With the Northstar Labs application active, choose **Load Maya demo data** if `My Profile` is empty,
then click **Scan & Autofill**. ApplyProof fills saved profile values, work authorization, gender, and the accuracy
confirmation; preserves existing answers; blocks the password fixture; and starts generating blank
open-ended fields directly on the page. Hover or focus an open-ended field to add an optional
instruction and regenerate it. The side panel remains compact and does not duplicate a summary,
review queue, or field inventory. After rebuilding an already loaded unpacked extension, use the
reload button on `chrome://extensions` and refresh the application page before retesting.

For an embedded Greenhouse pilot such as an employer careers page containing a
`job-boards.greenhouse.io` application, keep the employer page active and click **Scan & Autofill**.
Chrome asks once for access to the embedded Greenhouse origin. Granting it lets ApplyProof scan and
route fields, resume attachment, and inline writing controls inside that frame while retaining job
context from the employer page. Declining leaves the frame untouched and stops the workflow with an
explanation. Other iframe providers remain unsupported.

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
passes normalized field metadata plus bounded, relevant job context through the extension; it does
not send full-page HTML. Drafting may send selected saved-resume evidence snippets and up to 12,000
characters of extracted or user-pasted job description to the API. Persistent required host access
is limited to the local demo origins (`localhost` and `127.0.0.1`). Greenhouse iframe access is
optional and requested at runtime only after a matching embed is detected. Named real-site
integrations remain compatibility pilots unless the matrix says otherwise.

Before submitting, use the [hackathon submission checklist](docs/SUBMISSION_CHECKLIST.md).

## License

This project is available under the [MIT License](LICENSE).
