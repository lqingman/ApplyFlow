# ApplyFlow Devpost Submission Copy

This file contains ready-to-paste submission copy. Replace the bracketed placeholders before final submission.

## Elevator pitch

ApplyFlow is an evidence-grounded job application copilot that helps candidates move faster without inventing who they are.

## About the project

## Inspiration

Job applications force candidates to repeat the same facts while also answering open-ended questions under time pressure. Traditional autofill helps with contact details, but generic AI writing tools can quietly exaggerate experience or introduce claims that are not in the applicant's resume. We wanted the speed of automation without giving up control of the truth.

ApplyFlow starts from a simple principle: **evidence before eloquence**. Known facts should be filled deterministically, generated writing should stay grounded in candidate evidence, and the applicant—not the agent—should make the final decision.

## What it does

ApplyFlow is a Chrome Manifest V3 extension with a compact side panel and page-native review experience. An applicant can create an editable local profile, seed it with fictional Maya Chen demo data, or import a Word or text-based PDF resume. The original resume stays in extension-owned IndexedDB, and extracted values remain editable before saving.

After the user clicks **Scan & Autofill**, ApplyFlow:

- detects common form controls and accessible labels;
- fills verified profile facts and explicit choices deterministically;
- preserves every existing non-empty value;
- excludes passwords and other denied sensitive fields;
- attaches the locally saved resume to supported upload controls;
- drafts blank open-ended answers from relevant resume evidence;
- keeps generated answers editable directly in the application page; and
- lets the user add an instruction and regenerate while respecting live character limits.

Cover letters use bounded job-description context plus selected resume evidence. If ApplyFlow cannot safely find the job description, it asks the user to paste it rather than generating without context. Continue, Next, legal consent, and Submit always remain manual actions.

The reliable judging path uses a fictional Northstar Labs application and keyless fixture mode, so no account, personal resume, or API key is required. Workable, BambooHR, and Greenhouse are documented as builder-tested compatibility pilots rather than universal support claims.

## How we built it

The project is a monorepo containing a React and TypeScript Chrome extension, a React/Vite mock application, shared Zod contracts and sample data, and a Python FastAPI service with Pydantic validation. Runtime generation supports a deterministic fixture provider plus optional OpenRouter and Gemini providers behind the same strict response contract. Provider credentials remain on the API server.

The extension scans bounded field metadata instead of sending full-page HTML. Deterministic mappings handle profile facts and explicit choices. Open-ended answers pass through evidence selection, strict structured output, evidence-ID validation, claim checks, and character-limit enforcement before they are inserted through native page events.

We built ApplyFlow collaboratively with Codex using GPT-5.6. Codex accelerated implementation across the extension, API, schemas, documentation, and 129-test regression suite. GPT-5.6 was especially useful when reasoning across browser permissions, privacy boundaries, accessibility semantics, iframe routing, provider schemas, and failures found during real ATS testing. The human builder chose the product scope and safety boundaries, reviewed tradeoffs, manually tested real sites, and made the final product decisions.

## Challenges we ran into

Job application sites rarely behave like simple static forms. During manual pilots we encountered generated identifiers, opaque option values, delayed ARIA comboboxes, masked dates, large storage-oriented character limits, custom country and region controls, and applications embedded in cross-origin Greenhouse frames.

The hardest engineering challenge was expanding compatibility without weakening privacy or safety. ApplyFlow keeps persistent required host access limited to local demo origins, uses temporary `activeTab` access for ordinary pages, and requests the narrowly scoped Greenhouse iframe permission only when a matching embed is detected. It never injects into unrelated iframe origins such as reCAPTCHA.

## Accomplishments that we're proud of

- A complete local workflow that judges can run without an account or model key.
- A clear boundary between deterministic facts and evidence-grounded writing.
- Editable, page-native generation instead of a disconnected chat workflow.
- Local resume import, storage, evidence selection, and explicit attachment.
- Existing-value protection, sensitive-field blocking, and no automatic submission.
- Builder-tested pilots on Workable, BambooHR, and direct and embedded Greenhouse forms.
- 129 passing tests plus formatting, linting, strict TypeScript/Python checks, and production builds.

## What we learned

Reliable browser automation is less about recognizing a field once and more about preserving meaning across accessibility patterns, frameworks, and page boundaries. We also learned that an AI assistant becomes more useful—not less—when its authority is deliberately constrained. Separating deterministic facts, explicit user choices, job context, and resume evidence made the system easier to test and the generated result easier to trust.

## What's next for ApplyFlow

Next steps are deliberate, platform-by-platform compatibility validation; clearer local controls for saved profile and preference data; provider observability and cost controls; and a Chrome Web Store-ready privacy and security review. ApplyFlow will continue to prioritize a small number of reliable integrations over a claim of universal autofill.

## Built with

Use these tags, subject to Devpost's available tag suggestions:

- Chrome Extensions
- Chrome Manifest V3
- Chrome Side Panel API
- React
- TypeScript
- Vite
- Zod
- IndexedDB
- Python
- FastAPI
- Pydantic
- Vitest
- pytest
- OpenAI
- GPT-5.6
- Codex
- OpenRouter
- Gemini

## Try it out links

- Source code: https://github.com/lqingman/ApplyFlow
- Demo video: [ADD PUBLIC YOUTUBE URL]

## Additional information: judge testing instructions

ApplyFlow is a Chrome Manifest V3 extension. The supported judging path is the local Northstar Labs demo on macOS, Windows, or Linux with Chrome 116+, Node.js 20+, npm 10+, and Python 3.12+.

1. Clone https://github.com/lqingman/ApplyFlow and follow the README setup steps.
2. Copy `.env.example` to `.env`. Leave `ANSWER_GENERATION_MODE=fixture`; no API key is needed.
3. Run `npm install`, create `.venv`, and install `apps/api[dev]` as documented.
4. In separate terminals run `npm run dev:web` and `npm run dev:api`.
5. Run `npm run build --workspace @applyflow/extension`.
6. Open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select `apps/extension/dist`.
7. Open `http://localhost:5173`, click the ApplyFlow toolbar icon, and choose **Load Maya demo data**.
8. Click **Scan & Autofill**. Review the deterministic fields and the grounded answers inserted into the page.
9. Focus an open-ended field, add an optional instruction, and regenerate it. Confirm existing values are preserved and ApplyFlow never clicks **Submit application**.

The Northstar application and Maya profile are fictional and require no personal data. Workable, BambooHR, and Greenhouse are compatibility pilots; judges should use Northstar for the repeatable end-to-end path. Text-based `.docx` and `.pdf` resume import is supported; legacy `.doc`, encrypted PDFs, and scanned image-only PDFs without a text layer are intentionally unsupported.

## Plugin or developer-tool installation field

ApplyFlow is an unpacked Chrome Manifest V3 extension for Chrome 116+ on macOS, Windows, and Linux. Build it with `npm run build --workspace @applyflow/extension`, then open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select `apps/extension/dist`. Run the local demo and API using the README instructions. Fixture mode is the recommended judge path and requires no API key or test account.

## Required remaining values

- Public YouTube demo URL: [ADD]
- `/feedback` Codex Session ID: [ADD]
- Confirm every team member has accepted the Devpost invitation: [CHECK]
- Confirm eligibility and accept the Official Rules: [CHECK MANUALLY]
