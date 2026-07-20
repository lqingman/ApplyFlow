import re

from .contracts import (
    AnswerDraftRequest,
    AnswerDraftResponse,
    ProviderDraft,
    ResumeExtraction,
    ResumeExtractionRequest,
    empty_response,
)

LEADERSHIP_PATTERN = re.compile(r"\b(led|managed|supervised|owned)\b", re.IGNORECASE)
NUMBER_PATTERN = re.compile(r"\b\d+(?:\.\d+)?%?\b")
TECHNOLOGIES = {
    "react",
    "typescript",
    "javascript",
    "python",
    "fastapi",
    "django",
    "node",
    "aws",
    "docker",
    "kubernetes",
}
COMPANY_PATTERN = re.compile(r"\b(?:at|with|for)\s+([A-Z][\w&.-]*(?:\s+[A-Z][\w&.-]*)*\s+Labs)\b")


def _normalized_resume_text(value: str) -> str:
    without_bullet_prefixes = re.sub(r"(?m)^\s*[-*•●▪◦‣⁃]+\s*", "", value)
    return re.sub(r"\s+", " ", without_bullet_prefixes).strip()


def preserve_verbatim_experience_descriptions(
    request: ResumeExtractionRequest, candidate: ResumeExtraction
) -> ResumeExtraction:
    """Reject AI-written experience prose while retaining exact resume text."""
    source = _normalized_resume_text(request.text)
    baseline_by_role = {
        (entry.company.casefold(), entry.title.casefold()): entry
        for entry in request.baseline.experience
    }
    changed = False
    experience = []
    for entry in candidate.experience:
        description = entry.description
        if not description or _normalized_resume_text(description) in source:
            experience.append(entry)
            continue

        baseline = baseline_by_role.get((entry.company.casefold(), entry.title.casefold()))
        replacement = baseline.description if baseline else None
        if replacement and _normalized_resume_text(replacement) not in source:
            replacement = None
        experience.append(entry.model_copy(update={"description": replacement}))
        changed = True

    if not changed:
        return candidate
    return candidate.model_copy(
        update={
            "experience": experience,
            "notes": [
                *candidate.notes,
                "AI-rephrased work descriptions were replaced with verbatim resume text.",
            ],
        }
    )


def validate_draft(request: AnswerDraftRequest, candidate: ProviderDraft) -> AnswerDraftResponse:
    if candidate.field_id != request.field.id:
        return empty_response(request, "The generated draft did not match this application field.")

    supplied = {record.id for record in request.evidence}
    if not set(candidate.evidence_ids).issubset(supplied):
        return empty_response(
            request, "The generated draft referenced unavailable profile evidence."
        )

    draft = candidate.draft.strip()
    if not draft:
        notes = candidate.notes or ["There is not enough confirmed evidence for a draft."]
        return AnswerDraftResponse(
            fieldId=request.field.id,
            draft="",
            evidenceIds=[],
            notes=notes,
            followUpQuestion=candidate.follow_up_question,
            characterCount=0,
            fitsLimit=True,
        )

    mentioned_companies = set(COMPANY_PATTERN.findall(draft))
    if mentioned_companies and mentioned_companies != {request.job.company}:
        return empty_response(request, "The generated draft used a different company name.")

    evidence_text = " ".join(record.text for record in request.evidence)
    support_text = f"{evidence_text} {' '.join(request.job.requirements)}"
    if LEADERSHIP_PATTERN.search(draft) and not LEADERSHIP_PATTERN.search(evidence_text):
        return empty_response(request, "The draft included an unsupported leadership claim.")
    unsupported_numbers = set(NUMBER_PATTERN.findall(draft)) - set(
        NUMBER_PATTERN.findall(evidence_text)
    )
    if unsupported_numbers:
        return empty_response(request, "The draft included an unsupported numerical claim.")
    used_technologies = {name for name in TECHNOLOGIES if name in draft.lower()}
    supported_technologies = {name for name in TECHNOLOGIES if name in support_text.lower()}
    if not used_technologies.issubset(supported_technologies):
        return empty_response(request, "The draft included a technology absent from the evidence.")

    count = len(draft)
    fits_characters = (
        request.field.max_characters is None
        or count <= request.field.max_characters
    )
    if not fits_characters:
        return empty_response(request, "The generated draft exceeded this field's character limit.")
    return AnswerDraftResponse(
        fieldId=request.field.id,
        draft=draft,
        evidenceIds=candidate.evidence_ids,
        notes=candidate.notes,
        followUpQuestion=candidate.follow_up_question,
        characterCount=count,
        fitsLimit=True,
    )
