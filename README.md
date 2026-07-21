# ApplyFlow

ApplyFlow is a Chrome extension that turns a resume and candidate profile into a reusable application workspace. It combines instant profile autofill with tailored writing directly on the application page, then learns from the answers the applicant chooses to reuse.

> **Hackathon status:** The submission demo is complete and runnable locally. It includes an editable local profile, resume import and storage, smart autofill, evidence-grounded inline answers, cover-letter drafting, resume attachment, and builder-tested pilots on Workable, BambooHR, and Greenhouse.

The Northstar Labs local demo gives judges a complete, repeatable path, while the Workable, BambooHR, and Greenhouse pilots demonstrate how the same workflow expands across real application systems.

## The idea

ApplyFlow helps an applicant:

1. Load a resume or demo profile.
2. Open a job application.
3. Detect and classify its form fields.
4. Fill confirmed personal information deterministically.
5. Draft blank open-ended answers from relevant resume evidence directly into the page.
6. Review and edit the answer in the application field; add an optional instruction before regenerating.

The applicant completes the final review and submission from the application page.

## Product principles

- **Evidence-powered writing.** Resume, profile, and user-confirmed answers give every draft useful personal context.
- **Fast facts, tailored writing.** Direct profile mappings fill instantly, while AI focuses on questions that benefit from writing and adaptation.
- **A profile that keeps learning.** ApplyFlow can turn newly selected answers into reusable knowledge for later applications.
- **Review where the work happens.** Drafts, refinements, and save suggestions appear beside the real application fields.
- **Applicant-owned choices.** Existing answers, profile updates, and final submission stay visible and editable throughout the workflow.
- **Focused context.** ApplyFlow works with the form metadata, job context, and candidate evidence needed for the current application.
- **One evolving workspace.** `My Profile` combines resume data, reusable preferences, and remembered answers; Maya provides ready-to-run demo data.
- **Remember meaning, not wording.** Semantically equivalent questions can reuse the same confirmed answer across different application systems.

## Hackathon demo

The first release delivers one polished end-to-end workflow and a foundation for expanding across applicant tracking systems.

The demo uses:

- **Candidate:** Maya Chen, a fictional new-grad software engineer
- **Company:** Northstar Labs
- **Role:** Junior Software Engineer
- **Environment:** a local mock application and unpacked Chrome extension

### Demo flow

1. Open the Northstar Labs mock application.
2. Open the ApplyFlow side panel and load Maya data into `My Profile`.
3. Run Scan & Autofill to detect the page and insert verified profile fields in one action.
4. See saved authorization, gender, and confirmation choices filled with the other profile fields.
5. See blank open-ended answers generate directly on the application page.
6. Hover or focus an answer, add an optional instruction, and regenerate it in place.
7. Confirm character limits are respected and edit the generated text before continuing.

The demo is successful when a judge can complete this flow immediately with the built-in fictional profile and local services.

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
- Context-aware insertion that keeps existing page answers visible
- Grounded answers for open-ended questions
- Inline Generate and Regenerate controls with optional instructions
- Live character-limit discovery, validation, and automatic over-limit retry
- Privacy-aware field handling

### Future product expansion

- Broader third-party ATS compatibility
- Authentication or multi-user persistence
- Automatic job discovery or submission
- LinkedIn scraping
- Application tracking
- Payments
- Chrome Web Store publishing
- A vector database
- General-purpose reusable answer memory with save suggestions and bulk review

## Architecture

```text
ApplyFlow/
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

Keyless fixture mode supplies deterministic grounded drafts for a reliable presentation, while OpenRouter and Gemini modes exercise the same validated response contract with server-side credentials.

## Page-native workflow

The side panel coordinates `My Profile`, Scan & Autofill, progress, and—next—a compact inbox for newly discovered reusable answers. Page-level assistants handle individual questions while the side panel supports batch actions.

Deterministic values and mapped checkboxes are inserted after the user initiates autofill. Blank textareas receive resume-grounded drafts. Existing deterministic and open-ended values are preserved. Generated answers are reviewed and edited in the page itself, and explicit Regenerate may replace the current open-ended answer.

The complete open-ended-question workflow, API contract, evidence rules, fixture mode, OpenRouter mode, memory policy, and resilient provider behavior are defined in [the grounded answer generation design](docs/ANSWER_GENERATION_DESIGN.md).

New users can start `My Profile` directly with **From resume** or **From scratch**. Import supports Word `.docx` and text-based `.pdf` files up to 10 MB. The extension stores the original document in IndexedDB for later resume attachment, extracts its text locally, and sends the extracted content plus a deterministic baseline to the configured server-side AI provider. Saving the profile keeps useful project and experience details available as evidence for future answers and cover letters. Identity, location, links, education, experience, source-review metadata, and evidence remain editable throughout the workflow. A local deterministic parser keeps profile creation available when the AI provider is offline. Future import expansion can add legacy documents, scanned files, and OCR.

Cover-letter textareas use the same evidence-powered workflow. ApplyFlow reads `JobPosting` structured data or an explicit job-description container; when the page does not expose that context, the inline assistant offers a paste-in area so the user can generate a tailored letter immediately.

## Product workflow

1. The user creates or imports one editable `My Profile` containing stable facts and evidence.
2. ApplyFlow scans an application only after the user initiates the action.
3. Confirmed profile facts, authorization, demographics, applicable remembered answers, and mapped confirmations are filled deterministically.
4. Blank open-ended questions receive a resume-based draft; existing page values are preserved.
5. Explicit Canadian work-authorization and sponsorship choices are stored under separate canonical, country-scoped meanings rather than a site's exact wording.
6. Later semantically equivalent Canadian questions may reuse the matching choice when classification confidence is high.
7. The applicant completes navigation and final submission after reviewing the prepared application.

For example, “Are you legally authorized to work in Canada?” and “Will you require sponsorship?” are stored separately as `work_authorization.canada.authorized` and `work_authorization.canada.sponsorship`, with their source and confirmation time. Later questions with the same meaning can immediately reuse the matching answer.

## Future work: an application memory that grows with the user

After Scan & Autofill, ApplyFlow will recognize newly completed questions and offer to remember the selected answers. A small floating card beside a field can ask **Save this answer?**, while the side panel collects all new suggestions into a **New answers to remember** section.

The user can save or skip each suggestion, select several suggestions, or choose **Save all**. ApplyFlow stores the meaning of each question, the chosen answer, its source, and useful context such as country or role. On a later application, questions with the same meaning can be completed automatically even when the website uses different wording.

The memory stays easy to manage: users can search, edit, refresh, or remove saved answers from `My Profile`. Answers that change over time can return as quick update prompts, turning repeated application work into a progressively faster personalized workflow.

## Website support

Northstar Labs is the complete judging environment. Workable, BambooHR, and Greenhouse are builder-tested pilots that guide the next compatibility milestones. User-initiated active-tab access works across ordinary application pages, and embedded Greenhouse forms add their dedicated permission when detected.

Online support grows one platform at a time. Each pilot contributes reusable field patterns, browser fixes, and regression coverage; the compatibility matrix tracks that progress from exploration to repeatable support.

See the [site compatibility matrix](docs/SITE_COMPATIBILITY.md) for current coverage, platform learnings, access behavior, and upcoming pilots.

## User-owned workflow and data

- Profile facts and preferences come from the applicant's resume, edits, and saved selections.
- Application memory records reusable answers together with their meaning and context.
- Credentials, financial details, and verification fields remain within their dedicated website controls.
- The extension sends focused field, job, and candidate context to the drafting service.
- Drafts stay editable on the application page, and the applicant completes the final submission.

## Roadmap

Development followed a demo-first sequence:

1. **Foundation:** runnable extension shell, API health endpoint, and mock application.
2. **Scan:** detect and normalize fields on the mock page.
3. **Smart autofill:** load Maya's profile and fill verified fields in one action.
4. **Grounded answers:** generate evidence-backed open-ended answers on the page for review and regeneration.
5. **Product workflow expansion:** replaced demo profile selection with one editable profile, added scoped work-authorization memory, resume import and attachment, cover letters, and incremental online pilots.
6. **Submission and demo polish:** package the stable judging path, documentation, and three-minute presentation.
7. **Adaptive application memory:** capture new answers through inline suggestions and a batch side-panel inbox, then reuse them by semantic meaning.

See [the detailed roadmap](docs/ROADMAP.md) for acceptance criteria and sequencing.

## How GPT-5.6 and Codex were used

ApplyFlow was planned and built collaboratively with Codex using GPT-5.6. GPT-5.6 helped reason across product scope, browser security, accessibility, schema design, test failures, and third-party ATS behavior, while the human builder retained product ownership and made the final tradeoffs.

### Where Codex accelerated the workflow

- Converted a broad product plan into a judge-ready vertical slice spanning a Chrome extension, local application, shared TypeScript contracts, and a FastAPI service.
- Implemented and iterated on profile storage, deterministic field mapping, page-native writing controls, strict provider schemas, evidence validation, resume parsing, and cross-frame Greenhouse routing.
- Wrote regression tests alongside the implementation. The final repository has 129 passing tests across extension, demo, shared packages, and API.
- Used browser inspection and failing tests to diagnose real issues including Chrome `activeTab` behavior, Workable's oversized character limit, BambooHR custom address controls, Greenhouse ARIA combobox timing, and embedded Greenhouse iframe routing.
- Turned product principles—grounded writing, visible user choices, focused context, and page-native review—into executable acceptance criteria.
- Maintained the roadmap, compatibility matrix, build log, and submission checklist as the implementation evolved.

### Key decisions made by the human builder

- Build one controlled, repeatable demo before expanding to real ATS pilots.
- Position ApplyFlow around truthfulness and visible evidence, not generic form filling.
- Make every generated answer editable and keep the complete workflow on the application page.
- Use deterministic logic for known facts and reserve model generation for evidence-backed writing.
- Use Workable, BambooHR, and Greenhouse as learning pilots for broader ATS compatibility.
- Complete a coherent end-to-end judging path before expanding into adaptive answer memory.

### How we preserve evidence of the collaboration

- Maintain a dated [build and decision log](docs/BUILD_LOG.md).
- Use milestone commits so the repository history shows how the project evolved.
- Record representative Codex planning, implementation, testing, and browser-validation moments for the demo video.
- Run `/feedback` in the primary Codex project task after the majority of core functionality has been built, then place that Session ID in the Devpost submission form.

The `/feedback` Session ID is submission metadata and does not need to be published in this README.

## Development approach

Each milestone should be a small, demonstrable vertical slice:

1. Inspect the current implementation.
2. Define focused acceptance criteria.
3. Implement one complete end-to-end behavior.
4. Add or update tests.
5. Run formatting, linting, type checks, and tests.
6. Record limitations and follow-up work.
7. Commit the milestone separately.

We prioritize a dependable demo, useful automation, and a product that becomes more personalized with every application.

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

### Run the local demo

Use a separate terminal for each long-running process:

```bash
npm run dev:web
npm run dev:api
```

- Mock application: `http://localhost:5173`
- API health check: `http://127.0.0.1:8000/health`
- API documentation: `http://127.0.0.1:8000/docs`

Build the Chrome extension separately:

```bash
npm run build --workspace @applyflow/extension
```

Then open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select
`apps/extension/dist`. Click the ApplyFlow toolbar action to open its side panel. The optional
`npm run dev:extension` command starts the Vite development server for extension UI development;
it is not required for the local demo workflow above.

With the Northstar Labs application active, choose **Load Maya demo data** if `My Profile` is empty,
then click **Scan & Autofill**. ApplyFlow fills saved profile values, work authorization, gender, and the accuracy
confirmation; keeps existing answers visible; routes the password fixture through its native control;
and starts generating blank open-ended fields directly on the page. Hover or focus an open-ended field
to add an optional instruction and regenerate it. The side panel keeps profile, autofill, and progress
together in one compact workspace. After rebuilding an already loaded unpacked extension, use the
reload button on `chrome://extensions` and refresh the application page before retesting.

For an embedded Greenhouse pilot such as an employer careers page containing a
`job-boards.greenhouse.io` application, keep the employer page active and click **Scan & Autofill**.
Chrome asks once for access to the embedded Greenhouse origin. Granting it lets ApplyFlow scan and
route fields, resume attachment, and inline writing controls inside that frame while retaining job
context from the employer page. Declining leaves the frame untouched and stops the workflow with an
explanation. Additional iframe providers are part of the compatibility expansion roadmap.

Start the API in keyless fixture mode for deterministic demo answers. The AI-workflow question uses
resume project, skill, testing, and accessibility evidence to produce a tailored starting draft
for user review; it does not require a separate confirmation flow. Character constraints are read
from native attributes, custom attributes, ARIA/helper text, and the live field before each request.
If a provider exceeds a known limit, the API automatically retries with progressively smaller generation targets (90%, then 80% of the live limit). The page rechecks the current limit before insertion so every inserted draft fits.

For live OpenRouter generation, set `ANSWER_GENERATION_MODE=openrouter` and provide
`OPENROUTER_API_KEY` only in the API server environment. The default model is
`openai/gpt-4o-mini`. Alternatively, use `ANSWER_GENERATION_MODE=gemini` with a server-only
`GEMINI_API_KEY`; Gemini defaults to `gemini-2.5-flash`. Both keys remain in the server environment.
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
