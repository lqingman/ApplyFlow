# Grounded Answer Generation Design

**Status:** Approved design; implementation not started  
**Owner:** ApplyProof  
**Last updated:** 2026-07-18  
**Roadmap milestone:** Phase 4

## Purpose

This document defines how ApplyProof prepares answers for open-ended job-application questions without inventing candidate experience or inserting AI-written text without review.

The first controlled questions are:

- Why are you interested in this role?
- Describe a relevant project.
- How do you use AI in your development workflow?
- What makes you a strong candidate?

The design covers both a deterministic keyless demo and a live OpenAI-backed mode. It does not implement either mode.

## Product invariants

1. Every eligible application field has exactly one workflow outcome: `Filled` or `Needs review`.
2. An open-ended field remains `Needs review` while a draft is generated, displayed, or edited.
3. An open-ended field becomes `Filled` only after the user explicitly inserts the reviewed text into the page.
4. Drafts have evidence and notes, not a separate status or confidence taxonomy.
5. Missing evidence produces an empty draft and a focused follow-up question, never fabricated content.
6. Existing page text is never silently replaced.
7. Character limits are enforced before insertion.
8. Sensitive denied fields never enter this workflow and their values are never sent to the backend or model.
9. ApplyProof never accepts legal terms or submits an application.

## Current state

Phase 3 detects textareas and routes them to review, but does not generate content. The FastAPI service currently exposes only a health endpoint. The shared `answerStatusSchema` and `AnswerDraft.status` field are pre-design placeholders and should be removed or replaced when Phase 4 is implemented; they are not part of the approved product model.

## User experience

### Primary flow

```text
Scan open-ended field
        ↓
Field is Needs review
        ↓
User requests a draft
        ↓
ApplyProof selects relevant profile evidence and limited job context
        ↓
Fixture provider or live AI provider returns a structured draft
        ↓
User reviews evidence, notes, length, and editable text
        ↓
User clicks Fill answer
        ↓
ApplyProof inserts the exact reviewed text
        ↓
Field is Filled
```

Generating a draft does not count as filling a field. Editing a draft does not count as filling a field. Only successful insertion into the application page changes the outcome to `Filled`.

### Review card

Each open-ended question has one review card containing:

- the normalized question;
- the page-provided character limit, when present;
- an editable draft, or an empty editor when evidence is insufficient;
- the exact profile evidence records used;
- plain-language notes about missing support, possible overclaiming, or required user input;
- a live character count;
- one optional follow-up question;
- `Regenerate` and `Fill answer` actions.

The card does not display `generated`, `unsupported`, a confidence score, or another answer status. Those concepts do not create additional workflow states.

### Insufficient evidence

When the available records cannot support a truthful answer:

- return an empty draft;
- identify what information is missing in a note;
- ask one focused follow-up question;
- keep the field as `Needs review`;
- allow the user to answer manually;
- offer to save reusable facts or preferences to `My Profile` only after explicit confirmation.

Example for “How do you use AI in your development workflow?” when the profile contains no AI-usage evidence:

> How do you use AI, and what steps do you take to verify its output?

## Question strategies

| Question family  | Required inputs                                                                    | Draft strategy                                                                           | When evidence is missing                                                                  |
| ---------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Role motivation  | Company, role, relevant job requirements, confirmed candidate interests            | Connect one or two real candidate interests or experiences to specific role attributes   | Ask what interests the user most: product, mission, technical work, or growth opportunity |
| Relevant project | One relevant project record, supported technologies, candidate contribution        | Describe the project, supported contribution, technologies, problem, and role relevance  | Ask for the project, personal contribution, or outcome that is absent                     |
| AI workflow      | User-confirmed AI tools, use cases, verification practices, and privacy boundaries | Explain actual use and how outputs are checked                                           | Return no draft and ask how the user uses and verifies AI                                 |
| Strong candidate | Job requirements plus supported education, experience, projects, and skills        | Synthesize two or three supported matches without inventing personality traits or impact | Ask for the missing strength or rely only on the evidence that exists                     |

## Evidence and claim policy

### Allowed sources

A material statement may come only from:

- a structured fact in `My Profile`;
- a profile evidence record;
- an explicit answer the user confirmed;
- limited job context taken from the current application.

Job context supports statements about the company and role. It cannot support a claim about the candidate.

### Material claims

Names, employers, schools, degrees, technologies, responsibilities, leadership, team size, dates, quantities, performance improvements, awards, and outcomes are material claims. Each material candidate claim must map to at least one evidence record.

The generator must not infer or embellish:

- leadership or ownership;
- numerical impact;
- team size;
- years of experience;
- technologies not present in evidence;
- legal or immigration status;
- personality traits stated as facts;
- company enthusiasm that the user has not expressed.

### Evidence display

The response returns evidence IDs, and the extension resolves those IDs to the exact records shown in the review card. The model does not create evidence excerpts or source labels. If a returned ID is not present in the request, the backend rejects the response.

## Architecture

```text
Job application page
        ↓ normalized question and constraints
Chrome extension
        ↓ question + limited job context + selected structured evidence
FastAPI POST /v1/answer-drafts
        ↓ provider interface
Fixture provider ─────────────── Live OpenAI provider
        │                         ↓ Responses API + Structured Outputs
        └──────── structured AnswerDraftResponse ────────┘
                                  ↓
                         Review card in extension
                                  ↓ explicit user action
                         Exact-text page insertion
```

The Chrome extension never calls OpenAI directly. The API key exists only in the FastAPI environment or a deployment secret manager. It must not be bundled into extension code, returned to the browser, written to the repository, or logged.

## Generation modes

### Fixture mode

`ANSWER_GENERATION_MODE=fixture`

- requires no model key;
- serves deterministic drafts for the Northstar questions;
- returns the same response contract as live mode;
- uses only Maya's fixture evidence;
- is the default for the reliable hackathon demo and automated tests;
- must not pretend to support arbitrary questions.

### Live mode

`ANSWER_GENERATION_MODE=live`

- requires `OPENAI_API_KEY` on the FastAPI server;
- uses the OpenAI Responses API;
- requests Structured Outputs matching the backend response schema;
- sets `store: false` for application-generation requests;
- reads the model name from server configuration rather than hard-coding it in the extension;
- validates the model response again with Pydantic before returning it.

OpenAI recommends the Responses API for new projects, and Structured Outputs can constrain model responses to a supplied JSON Schema. OpenAI also recommends keeping API keys out of source code and providing them through environment variables or secret management.

## ApplyProof API contract

The following is ApplyProof's own backend contract, not the raw OpenAI request shape.

### Endpoint

`POST /v1/answer-drafts`

### Request

```json
{
  "field": {
    "id": "relevant-project",
    "question": "Describe a relevant project.",
    "maxCharacters": 700
  },
  "job": {
    "company": "Northstar Labs",
    "role": "Junior Software Engineer",
    "requirements": ["React", "TypeScript", "accessibility"]
  },
  "evidence": [
    {
      "id": "project-campus-map",
      "category": "project",
      "text": "Built an accessible campus navigation app with React, TypeScript, and FastAPI.",
      "source": "Demo resume · Projects"
    }
  ]
}
```

Rules:

- send normalized field metadata, not full-page HTML;
- send only job context relevant to the question;
- send only structured candidate evidence needed for the draft;
- never send values from denied sensitive fields;
- reject empty questions, invalid limits, duplicate evidence IDs, or oversized payloads.

### Response with a draft

```json
{
  "fieldId": "relevant-project",
  "draft": "I built an accessible campus navigation app using React, TypeScript, and FastAPI. The project focused on making navigation information easier to use through an accessible interface, which is relevant to Northstar Labs' product work.",
  "evidenceIds": ["project-campus-map"],
  "notes": ["No measurable project outcome is recorded."],
  "followUpQuestion": null,
  "characterCount": 232,
  "fitsLimit": true
}
```

### Response without enough evidence

```json
{
  "fieldId": "ai-workflow",
  "draft": "",
  "evidenceIds": [],
  "notes": ["Your profile does not yet contain evidence about AI usage."],
  "followUpQuestion": "How do you use AI, and how do you verify its output?",
  "characterCount": 0,
  "fitsLimit": true
}
```

There is deliberately no answer `status` or `confidence` property.

## Prompt contract

The live provider instructions must require the model to:

- use only the supplied candidate evidence for candidate claims;
- use job context only for company and role statements;
- avoid unsupported leadership, quantities, outcomes, technologies, and legal conclusions;
- keep the answer specific and concise;
- respect the character limit;
- return evidence IDs exactly as supplied;
- return an empty draft and one focused follow-up question when evidence is insufficient;
- avoid mentioning the evidence system, model, prompt, or review process in the candidate-facing draft.

The prompt must not ask the model to reveal chain-of-thought. The product displays evidence and concise notes, not hidden reasoning.

## Deterministic validation

The backend validates every fixture and live response before it reaches the extension:

1. Parse against the response schema.
2. Confirm `fieldId` matches the request.
3. Confirm every evidence ID was supplied in the request.
4. Recalculate `characterCount`; do not trust the model's count.
5. Confirm the draft fits the page limit.
6. Check company and role names for context mismatches.
7. Run conservative checks for unsupported numbers, leadership language, team size, and unreferenced technologies.
8. If validation fails, return an empty draft with a plain-language note rather than unsafe text.

The extension performs the character-limit and existing-value checks again immediately before insertion.

## Memory policy for open-ended answers

ApplyProof remembers reusable facts and preferences, not complete tailored answers by default.

Good candidates for explicit profile updates include:

- how the user uses and verifies AI;
- the user's actual project contribution;
- supported project outcomes;
- technical interests;
- preferred work themes or environments.

Complete answers containing a company name, role name, or job-specific motivation are application artifacts. They are not silently reused on another application. A later similar question receives a new draft from confirmed facts and the new job context, and remains `Needs review` until the user fills it.

## Privacy and retention

- The extension sends only the current question, its constraints, limited job context, and selected evidence.
- The backend must not log raw resumes, profile evidence, questions, or generated drafts in production logs.
- Operational logs may contain request IDs, timings, provider mode, token usage, and error categories.
- Live OpenAI requests use `store: false`.
- Profile-memory writes are a separate explicit user action; generating or filling a draft does not automatically change `My Profile`.
- The privacy UI must let the user inspect and delete locally remembered facts and preferences.

## Failure behavior

| Failure                               | User behavior                                                                                  |
| ------------------------------------- | ---------------------------------------------------------------------------------------------- |
| API key absent in live mode           | Keep the field `Needs review`; explain that live drafting is unavailable; allow manual editing |
| Network error, timeout, or rate limit | Keep the field `Needs review`; preserve any user text; offer retry                             |
| Model refusal                         | Keep the field `Needs review`; show a neutral note; allow manual editing                       |
| Invalid structured response           | Reject it; keep the field `Needs review`; offer retry                                          |
| Unsupported or insufficient evidence  | Return no draft and ask one follow-up question                                                 |
| Character limit exceeded              | Do not insert; offer a shorter regeneration or manual edit                                     |
| Page value changed after drafting     | Do not overwrite; show the current value and require a new explicit decision                   |
| Field no longer exists                | Keep the review card and explain that the page field is unavailable                            |

## Testing strategy

### Contract tests

- request and response schema validation;
- no answer status or confidence field;
- evidence IDs must be a subset of request evidence;
- empty draft requires a note or follow-up question;
- deterministic character-count validation.

### Fixture tests

- the relevant-project fixture uses only `project-campus-map`;
- the AI-workflow fixture returns no draft when AI evidence is absent;
- no fixture invents leadership, metrics, team size, or unsupported technologies;
- every fixture respects its page limit.

### Provider tests

- mock the OpenAI client; do not require a network call in the default test suite;
- verify the live provider uses the Responses API, Structured Outputs, and `store: false`;
- verify provider errors become safe review explanations;
- keep optional live smoke tests separate and explicitly enabled.

### Extension tests

- all open-ended questions begin as `Needs review`;
- generating and editing a draft does not change the field outcome;
- `Fill answer` inserts exactly the reviewed text and changes the outcome to `Filled`;
- existing values and page changes are preserved;
- failed insertion remains `Needs review`;
- no automatic generation, insertion, or submission occurs on page load.

## Phase 4 implementation order

1. Replace the placeholder answer-status contract with the request and response schemas in this document.
2. Add the FastAPI provider interface and deterministic fixture provider.
3. Build one end-to-end relevant-project review card and insertion flow.
4. Add deterministic validation and negative claim fixtures.
5. Add the live OpenAI provider behind server configuration.
6. Add the remaining Northstar question strategies and missing-evidence follow-ups.
7. Add tests, manual Chrome verification, and build-log evidence.

## Acceptance criteria

- At least three Northstar answers can be drafted, reviewed, edited, and inserted.
- Every eligible open-ended field is always either `Filled` or `Needs review`.
- No AI-generated text is inserted without a user action.
- Every material candidate claim is supported by displayed evidence.
- Missing AI-workflow evidence produces no fabricated draft.
- Every inserted answer respects the page character limit.
- Fixture mode completes the demo without an API key.
- Live mode keeps the API key on the server and returns the same contract as fixture mode.
- Provider or validation failures leave the field in `Needs review` and preserve user text.
- Final legal confirmation and submission remain manual.

## Official OpenAI references

- [Responses API migration guide](https://developers.openai.com/api/docs/guides/migrate-to-responses)
- [Structured model outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [Production best practices and API-key handling](https://developers.openai.com/api/docs/guides/production-best-practices)
