# ApplyFlow Inline Answer Generation Design

**Status:** Implemented inline drafting with adaptive answer memory planned next

**Roadmap milestone:** Phase 4, revised after browser workflow testing

**Last updated:** 2026-07-21

## Purpose

ApplyFlow completes application fields from a saved candidate profile, drafts open-ended answers from resume evidence, and evolves toward remembering new user-selected answers. The primary interaction happens on the application page, with the side panel coordinating profile and memory across applications.

After the user clicks **Scan & Autofill**, the extension fills mapped fields, drafts written responses, and prepares reusable-answer suggestions. The applicant reviews the prepared application and completes navigation and submission.

## Final product decisions

1. One user action starts scanning, deterministic autofill, checkbox selection, and first-draft generation for blank open-ended fields.
2. Open-ended drafts are generated directly into the application page, not into side-panel review cards.
3. Hovering or focusing an open-ended field reveals an inline ApplyFlow assistant with an optional instruction and a Generate or Regenerate action.
4. A user instruction may select a resume project, emphasis, or tone. It is an instruction, not evidence for a new factual claim.
5. The user reviews and edits the generated text in the application field itself.
6. The current side panel contains profile selection, Scan & Autofill, and compact progress text. The next version adds a focused inbox for reusable-answer suggestions and batch save actions.
7. Canadian work eligibility and sponsorship are separate required profile choices. Voluntary self-identification answers are optional; every stored value is explicit and may be `Prefer not to say`.
8. The accuracy-confirmation checkbox joins the autofill workflow, followed by applicant review and submission.
9. Existing page values stay visible during autofill. Regeneration or a confirmed replacement updates an open-ended answer.
10. Provider keys remain on the FastAPI server.

## User workflow

```text
Select saved profile
        |
        v
Click Scan & Autofill
        |
        +--> Scan eligible fields and character constraints
        |
        +--> Fill saved profile values and mapped checkboxes
        |
        +--> Mount inline assistants beside open-ended fields
        |
        +--> Generate drafts for blank open-ended fields
        |
        v
Review and edit answers on the application page
        |
        +--> Hover/focus a field
        +--> Add an optional instruction
        +--> Regenerate in place
        |
        v
Applicant reviews and submits
```

Page-native inputs remain the main editing surface, while the side panel becomes the cross-application home for profile and answer memory.

## Profile-driven deterministic fields

The controlled profile contains stable identity, contact, education, links, availability, work authorization, and demographic choices.

Current Northstar mappings include:

- identity and contact fields;
- education and portfolio fields;
- start date and relocation preference;
- `work-authorization` from `profile.workAuthorization.canada.authorized`;
- `sponsorship` from `profile.workAuthorization.canada.sponsorship`;
- `gender` from `profile.demographics.genderIdentity`;
- supported race/ethnicity, disability, LGBTQ+, and veteran questions from their explicit demographic values;
- `accuracyConfirmation`, checked after the user initiates autofill.

Profile schemas model work eligibility, sponsorship, and optional self-identification as separate reusable choices. Each saved selection becomes structured profile context that can map across different application wording.

Checkbox filling sets the real DOM `checked` property and dispatches `input` and `change` events so React and ATS forms observe the update.

## Open-ended field detection and inline UI

The current inline workflow targets scanned `textarea` fields.

After scanning, the content script mounts an isolated Shadow DOM assistant beside each open-ended field. The assistant is visible when the field is hovered or focused and contains:

- ApplyFlow identity and grounded-profile context;
- an optional extra-instruction textarea;
- Generate or Regenerate;
- progress, evidence-source, follow-up, or provider-error text.

On the first scan, every blank open-ended field starts generation automatically. Existing answers remain visible and can be refined through the inline assistant.

Generated text is written through the native input setter, followed by bubbling `input` and `change` events. This updates both the visible field and framework-managed form state.

## Adaptive answer-memory experience

The next product milestone turns completed applications into reusable knowledge. After Scan & Autofill and while the user edits the page, ApplyFlow identifies answered questions that are not yet represented in `My Profile` or the reusable-answer store.

### Inline save card

An eligible field can show a lightweight floating card beside the application control:

- **Save this answer?** with a short preview of the question and selected answer;
- **Save** to add it immediately to application memory;
- **Skip** to dismiss the current suggestion; and
- a visible meaning or category such as `relocation`, `salary expectation`, or `work authorization`.

The card appears after the answer is complete, not while the user is still typing or choosing an option. Saving provides immediate feedback and marks the answer as available for future applications.

### Side-panel memory inbox

When several new answers are available, the side panel shows a **New answers to remember** section. Each suggestion includes the question, answer, source site, reusable meaning, and relevant context. The user can:

- save or skip one suggestion;
- select several suggestions;
- choose **Save selected**; or
- choose **Save all** to add every displayed suggestion in one action.

Inline and side-panel actions update the same suggestion state. Saving a floating card removes that item from the batch inbox; a batch save updates the corresponding page cards.

### Semantic memory model

ApplyFlow stores reusable meaning rather than relying on exact website wording. A remembered-answer record includes:

- a semantic key and human-readable category;
- the selected or written answer;
- the original question wording;
- source site and confirmation time;
- relevant scope such as country, role, employment type, or company; and
- refresh metadata for answers that evolve over time.

Questions with equivalent meaning can reuse the same answer across different ATS platforms. Duplicate suggestions merge into the existing record, and a newly confirmed value can refresh it. `My Profile` provides search, edit, refresh, and remove controls so application memory remains a useful, evolving part of the product.

### Suggestion lifecycle

```text
New completed field
        |
        v
Classify reusable meaning and context
        |
        +--> Floating Save this answer? card
        |
        +--> Side-panel New answers to remember inbox
        |
        v
Save one / Save selected / Save all
        |
        v
Reusable answer becomes available on later applications
```

## Evidence selection

Profile evidence supplies the candidate story, while job context tailors that story to the company, role, and requirements.

After an imported resume is saved, its locally extracted text remains in extension-owned IndexedDB beside the original binary. ApplyFlow converts relevant lines from that text into bounded evidence records at generation time. This allows project and other resume sections that were not mapped into editable Profile fields to support drafts while preserving evidence-ID validation. The original Word or PDF binary is never sent for drafting.

Known demo questions use deterministic strategies:

| Question class   | Preferred resume evidence                                   |
| ---------------- | ----------------------------------------------------------- |
| Motivation       | Product interest plus a relevant project                    |
| Relevant project | Relevant project record                                     |
| Strengths        | Education, experience, and skills                           |
| AI workflow      | Project, co-op, skills, testing, and accessibility records  |
| Cover letter     | Relevant saved-resume snippets plus job-description context |

AI-workflow questions receive a resume-based starting draft that the user can personalize, save, and reuse as part of the growing application memory.

When the user supplies an extra instruction, the request may include up to twenty verified profile evidence records so the provider can follow instructions such as “use the campus map project.” The backend validates returned evidence IDs against that supplied profile context.

## Character-limit handling

Character constraints are enforced at three layers.

### 1. Scan-time discovery

The scanner reads limits from:

- native `maxlength`;
- custom attributes such as `data-maxlength`, `data-max-length`, `data-character-limit`, and `aria-maxlength`;
- `aria-describedby` text;
- nearby helper text such as “Maximum 500 characters” or “250 character limit.”

### 2. Generate-time refresh

Every Generate or Regenerate action re-reads the current field rather than relying only on the initial scan. This supports dynamic ATS forms that reveal or change a limit after interaction.

The live value is sent as `field.maxCharacters`. Supported API limits are 1–20,000 characters. Sites sometimes use very large values such as 200,000 as storage ceilings rather than desired response lengths; ApplyFlow safely caps those values at the API maximum before request validation.

### 3. Backend validation and retry

The backend recalculates the returned draft length using the browser's UTF-16 counting behavior. If the provider exceeds the known limit, ApplyFlow retries with focused generation targets at 90% and then 80% of the live limit, keeping the strongest relevant details.

If the final result is still too long, validation returns an explanatory refinement prompt. The content script rechecks the refreshed live limit immediately before insertion so every inserted answer fits the field.

## Additional prompt behavior

The optional inline prompt is sent as `additionalPrompt`, trimmed, and limited to 1,000 characters.

It may guide:

- which resume project to use;
- which skill or experience to emphasize;
- concision or tone;
- how to structure the answer.

Candidate facts continue to come from profile and resume evidence, while the instruction controls emphasis, structure, and tone.

For a cover-letter field, ApplyFlow first looks for `JobPosting` structured data or an explicit job-description container. When the page does not expose a description, the inline control invites the user to paste one, creating the context needed for a tailored cover letter.

## API boundary

```text
Chrome page/content script
        |
        | APPLYFLOW_GENERATE_INLINE_DRAFT
        v
Extension side panel
        |
        | POST /v1/answer-drafts
        v
FastAPI validation layer
        |
        +--> FixtureProvider
        +--> OpenRouterProvider
        +--> GeminiProvider
```

The page does not receive provider credentials. The side panel builds the request from the selected profile, selected locally stored resume snippets, bounded job context, field metadata, live limit, and optional instruction.

## Request contract

`POST /v1/answer-drafts`

```json
{
  "field": {
    "id": "project",
    "question": "Describe a relevant project.",
    "maxCharacters": 500
  },
  "job": {
    "company": "Northstar Labs",
    "role": "Junior Software Engineer",
    "requirements": [
      "React",
      "TypeScript",
      "accessibility",
      "automated testing"
    ],
    "description": "Build accessible products with React and TypeScript."
  },
  "evidence": [
    {
      "id": "project-campus-map",
      "category": "project",
      "text": "Built an accessible campus navigation app with React, TypeScript, and FastAPI.",
      "source": "Demo resume · Projects"
    }
  ],
  "additionalPrompt": "Emphasize the accessibility decisions."
}
```

`additionalPrompt` and `maxCharacters` are optional.

## Response contract

```json
{
  "fieldId": "project",
  "draft": "I built an accessible campus navigation app using React and TypeScript.",
  "evidenceIds": ["project-campus-map"],
  "notes": [],
  "followUpQuestion": null,
  "characterCount": 71,
  "fitsLimit": true
}
```

The backend, not the model, calculates `characterCount` and `fitsLimit`.

## Providers

### Fixture mode

Fixture mode is deterministic and requires no network key. It supports the controlled Northstar questions and remains useful for unit tests and offline demos.

### OpenRouter mode

OpenRouter mode uses the server-side Responses API with `store: false` and strict JSON Schema output. `ProviderDraft` forbids additional properties so its generated schema includes `additionalProperties: false`, which strict OpenRouter requests require.

Environment variables:

```env
ANSWER_GENERATION_MODE=openrouter
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=openai/gpt-4o-mini
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

Changing `.env` requires a full API process restart; Uvicorn file reload does not re-import changed environment variables.

### Gemini mode

Gemini mode uses the OpenAI-compatible Chat Completions endpoint with structured output. A 429 means the configured project or model quota is exhausted. Provider exceptions are logged server-side while the extension receives a safe drafting-unavailable note.

Environment variables:

```env
ANSWER_GENERATION_MODE=gemini
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
```

## Validation

The backend validates every provider result:

1. The returned field ID matches the request.
2. Every evidence ID was supplied by the extension.
3. Company names do not drift to another employer.
4. Leadership, numerical, and technology claims are supported.
5. Character count is recalculated.
6. A known character limit is respected, with one retry when needed.
7. Invalid structured output is rejected.

Resume-based process answers can describe review, testing, and verification practices using the tools and results represented in the profile.

## Resilient workflow behavior

| Failure                                         | Behavior                                                                      |
| ----------------------------------------------- | ----------------------------------------------------------------------------- |
| API unavailable                                 | Keep the page value unchanged and show a retryable inline error               |
| Missing provider key                            | Log the server configuration error and show drafting unavailable              |
| Provider timeout, quota, or network error       | Preserve page text and show drafting unavailable                              |
| Invalid structured output                       | Keep the current page text and request a fresh structured result              |
| First result exceeds a known limit              | Retry with a target at 90% of the live limit                                  |
| First retry still exceeds the limit             | Retry with a target at 80% of the live limit                                  |
| Final result still exceeds the limit            | Return no draft and show the limit note                                       |
| More candidate context would improve the answer | Return the strongest resume-based draft or ask one focused follow-up question |
| Existing deterministic value                    | Preserve it during Scan & Autofill                                            |
| Existing open-ended value                       | Do not auto-generate; allow explicit Regenerate                               |

## Data and workflow ownership

- Provider keys stay in `.env` or a deployment secret manager.
- OpenRouter requests set `store: false`.
- The original resume binary and complete IndexedDB record remain local.
- The extension sends only selected Profile/saved-resume evidence snippets and the bounded current job context required for drafting.
- Extracted resume text is stored only after an explicit Import resume and Save My Profile flow. Replacing the original without importing clears the old extracted text.
- Production logs should contain exceptions and provider metadata, not raw resumes or generated drafts.
- The applicant reviews the prepared application and completes navigation and submission.

## Test coverage

Automated tests cover:

- deterministic profile mappings, including authorization, gender, and confirmation checkboxes;
- true DOM checkbox selection and framework events;
- inline assistant mounting, automatic first generation, regeneration, and existing-value preservation;
- optional prompt propagation and expanded evidence selection;
- cover-letter job-description extraction and manual fallback;
- locally stored resume-text evidence selection, including project sections;
- safe handling of site limits above 20,000 without exposing schema errors;
- native, custom-attribute, ARIA, and helper-text character limits;
- live-limit refresh immediately before generation;
- progressively tighter backend retries for an over-limit provider result;
- strict provider schemas and evidence-ID validation;
- fixture, OpenRouter, and Gemini request shapes;
- production extension builds.

## Current acceptance criteria

- One Scan & Autofill action fills all mapped profile fields and checkboxes.
- Blank open-ended questions begin generating on the application page.
- Existing answers stay visible and can be refined through a confirmed action.
- Hover or focus reveals an inline Regenerate control and optional instruction.
- Generated drafts are editable in the real application field.
- AI-workflow questions receive a resume-based draft rather than requiring a profile follow-up flow.
- Known character limits are sent to the provider and enforced with progressively tighter retries.
- Work authorization, gender, and accuracy confirmation fill from the current profile/workflow rules.
- The side panel coordinates profile, progress, and the planned reusable-answer inbox.
- The applicant completes final review and submission.
- New answers can surface as inline and side-panel save suggestions.
- Save one, Save selected, and Save all actions create reusable semantic memory records.
