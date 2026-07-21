# ApplyFlow

ApplyFlow is a Chrome extension that turns a resume and candidate profile into a faster job application workflow. It fills repeated profile information, drafts written answers directly inside application forms, and keeps everything editable on the page.

The long-term vision is an application assistant that learns from the user: each confirmed answer can make the next application faster, even when another website asks the same question differently.

## Why ApplyFlow

Job seekers repeatedly enter the same details, rewrite similar answers, and switch between application forms, resumes, and separate writing tools. ApplyFlow brings those steps into one workspace:

- profile and resume information fills in one action;
- written answers use relevant resume experience;
- drafts can be edited or regenerated beside the real question;
- cover letters use the current job description; and
- saved answers can be reused by semantic meaning.

## Current demo

The hackathon demo includes:

- a Chrome Manifest V3 extension with a compact side panel;
- one editable, locally saved `My Profile`;
- Word `.docx` and text-based PDF resume import;
- deterministic autofill for profile details and saved choices;
- local resume storage and attachment;
- page-native AI drafts for open-ended questions and cover letters;
- optional instructions and in-place regeneration;
- live character-limit detection and automatic retry;
- keyless fixture generation for a repeatable judging experience; and
- builder-tested pilots on Workable, BambooHR, and direct and embedded Greenhouse forms.

The included Northstar Labs application and fictional Maya Chen profile provide all sample data needed for the demo.

### Demo flow

1. Open the Northstar Labs application.
2. Open the ApplyFlow extension side panel.
3. Choose **Load Maya demo data** or import a resume.
4. Click **Scan & Autofill**.
5. Review the completed profile fields and generated written answers.
6. Focus an open-ended answer to add an instruction and regenerate it.
7. Complete the final application review and submission.

## How it works

ApplyFlow is a monorepo containing:

- **Chrome extension:** React, TypeScript, Vite, Chrome Manifest V3
- **Demo application:** React and Vite
- **Shared contracts and sample data:** Zod and TypeScript
- **API:** Python, FastAPI, Pydantic
- **Local resume storage:** IndexedDB
- **Generation providers:** keyless fixture mode, OpenRouter, or Gemini

The extension translates labels, accessibility attributes, field metadata, options, and nearby question text into a shared field model. Direct profile facts use deterministic mappings. Written questions are paired with relevant profile and resume evidence before generation, then inserted through native page events so they work with React and custom ATS controls.

The reliable judging path uses the local Northstar application and fixture provider. Workable, BambooHR, and Greenhouse are compatibility pilots that demonstrate the expansion path across real application systems.

More technical detail is available in the [answer-generation design](docs/ANSWER_GENERATION_DESIGN.md), [compatibility matrix](docs/SITE_COMPATIBILITY.md), and [roadmap](docs/ROADMAP.md).

## Future work: adaptive application memory

The next milestone makes ApplyFlow more personalized with every application.

After a candidate completes a new question, a floating **Save this answer?** card will appear beside the field. When several new answers are available, the side panel will collect them in a **New answers to remember** section.

Users will be able to:

- save or skip one suggestion;
- select several suggestions;
- choose **Save selected** or **Save all**;
- search, edit, refresh, or remove remembered answers; and
- reuse an answer when another application asks the same question with different wording.

ApplyFlow will store the question's semantic meaning, selected answer, original wording, source site, confirmation time, and useful context such as country or role. The current product already uses this approach for scoped Canadian work-authorization answers; the future workflow expands it into general application memory.

Broader ATS coverage, additional custom-control patterns, provider observability, and Chrome Web Store distribution are also planned.

## How Codex and GPT-5.6 were used

ApplyFlow was planned and built collaboratively with **Codex using GPT-5.6**.

Codex accelerated:

- implementation across the extension, demo application, FastAPI service, and shared schemas;
- resume import, profile storage, autofill, inline writing, and Greenhouse frame routing;
- browser debugging on Workable, BambooHR, and Greenhouse;
- regression tests, documentation, and submission preparation; and
- the conversion of real ATS issues into reusable compatibility fixtures.

GPT-5.6 helped reason across Chrome permissions, accessibility semantics, custom controls, iframe communication, provider schemas, semantic field matching, and the interaction between page-level assistants and side-panel state.

The human builder chose the product direction, prioritized the application workflows, tested real sites, reviewed tradeoffs, and made the final implementation decisions. The repository currently includes **129 passing tests** across the extension, demo, shared packages, and API.

The detailed collaboration history is recorded in the [build log](docs/BUILD_LOG.md).

## Run locally

### Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- Python 3.12 or newer
- Google Chrome 116 or newer

### Install

```bash
npm install
python3 -m venv .venv
.venv/bin/pip install -e 'apps/api[dev]'
cp .env.example .env
```

### Start the demo

Run the web application and API in separate terminals:

```bash
npm run dev:web
```

```bash
npm run dev:api
```

The demo application runs at `http://localhost:5173`. The API health endpoint is available at `http://127.0.0.1:8000/health`.

Build the Chrome extension:

```bash
npm run build --workspace @applyflow/extension
```

Then:

1. Open `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select `apps/extension/dist`.
5. Open `http://localhost:5173`.
6. Click the ApplyFlow toolbar icon to open the side panel.
7. Load the Maya demo profile and click **Scan & Autofill**.

After rebuilding the extension, click its reload button on `chrome://extensions` and refresh the application page.

### Optional live generation

Fixture mode is the default and requires no model key. For live generation, configure one of the following in `.env`, then restart the API:

```bash
ANSWER_GENERATION_MODE=openrouter
OPENROUTER_API_KEY=your_key
```

or:

```bash
ANSWER_GENERATION_MODE=gemini
GEMINI_API_KEY=your_key
```

Provider credentials remain in the API server environment.

## Verify

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

## Project documentation

- [Project story](docs/PROJECT_STORY.md)
- [Roadmap](docs/ROADMAP.md)
- [Answer-generation design](docs/ANSWER_GENERATION_DESIGN.md)
- [Site compatibility](docs/SITE_COMPATIBILITY.md)
- [GPT-5.6 and Codex build log](docs/BUILD_LOG.md)
- [Submission checklist](docs/SUBMISSION_CHECKLIST.md)

## License

ApplyFlow is available under the [MIT License](LICENSE).
