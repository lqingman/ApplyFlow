import logging
import math

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .contracts import (
    AnswerDraftRequest,
    AnswerDraftResponse,
    ResumeExtraction,
    ResumeExtractionRequest,
    empty_response,
)
from .providers import configured_provider, resume_based_ai_fallback
from .validation import browser_character_count, validate_draft

logger = logging.getLogger(__name__)
OVER_LIMIT_RETRY_RATIOS = (0.9, 0.8)


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str


app = FastAPI(
    title="ApplyFlow API",
    description="Evidence-grounded job application analysis and answer generation.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_origin_regex=r"chrome-extension://.*",
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse, tags=["system"])
def health() -> HealthResponse:
    return HealthResponse(status="ok", service="applyflow-api", version=app.version)


@app.post(
    "/v1/answer-drafts",
    response_model=AnswerDraftResponse,
    response_model_by_alias=True,
    tags=["answers"],
)
def answer_draft(request: AnswerDraftRequest) -> AnswerDraftResponse:
    try:
        provider = configured_provider()
        candidate = provider.generate(request)
        limit = request.field.max_characters
        for ratio in OVER_LIMIT_RETRY_RATIOS:
            if limit is None or browser_character_count(candidate.draft.strip()) <= limit:
                break
            retry_limit = max(1, math.floor(limit * ratio))
            instruction = (
                f"The previous draft exceeded the field limit. Rewrite it to no more than "
                f"{retry_limit} characters, including spaces, so it stays safely below the "
                f"field's hard maximum of {limit}. Keep only the strongest resume-grounded "
                "details."
            )
            if request.additional_prompt:
                instruction = f"{request.additional_prompt}\n\n{instruction}"
            retry_field = request.field.model_copy(
                update={"max_characters": retry_limit}
            )
            retry_request = request.model_copy(
                update={"field": retry_field, "additional_prompt": instruction}
            )
            candidate = provider.generate(retry_request)
        if not candidate.draft.strip():
            candidate = resume_based_ai_fallback(request) or candidate
        return validate_draft(request, candidate)
    except Exception:
        logger.exception("Answer draft generation failed")
        return empty_response(
            request,
            "Drafting is temporarily unavailable. You can still write this answer manually.",
        )


@app.post(
    "/v1/resume-extractions",
    response_model=ResumeExtraction,
    response_model_by_alias=True,
    tags=["resumes"],
)
def resume_extraction(request: ResumeExtractionRequest) -> ResumeExtraction:
    try:
        return configured_provider().extract_resume(request)
    except Exception:
        logger.exception("AI resume extraction failed; using deterministic baseline")
        return request.baseline.model_copy(
            update={
                "notes": [
                    *request.baseline.notes,
                    "AI extraction was unavailable; deterministic extraction was used.",
                ]
            }
        )
