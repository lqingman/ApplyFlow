import {
  resumeExtractionRequestSchema,
  resumeExtractionSchema,
  type ResumeExtraction,
} from "@applyflow/shared-types";

const apiBaseUrl = import.meta.env.VITE_API_URL ?? "http://127.0.0.1:8000";

export async function extractResumeWithAi(
  text: string,
  baseline: ResumeExtraction,
): Promise<ResumeExtraction> {
  try {
    resumeExtractionRequestSchema.parse({ text, baseline });
    const request = {
      text,
      baseline: {
        firstName: baseline.firstName ?? null,
        lastName: baseline.lastName ?? null,
        email: baseline.email ?? null,
        phone: baseline.phone ?? null,
        location: baseline.location ?? null,
        portfolio: baseline.portfolio ?? null,
        linkedin: baseline.linkedin ?? null,
        education: baseline.education.map((entry) => ({
          ...entry,
          startDate: entry.startDate ?? null,
          graduationDate: entry.graduationDate ?? null,
        })),
        experience: baseline.experience.map((entry) => ({
          ...entry,
          location: entry.location ?? null,
          startDate: entry.startDate ?? null,
          endDate: entry.endDate ?? null,
          description: entry.description ?? null,
        })),
        evidence: baseline.evidence,
        reviews: baseline.reviews,
        notes: baseline.notes,
      },
    };
    const response = await fetch(`${apiBaseUrl}/v1/resume-extractions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!response.ok)
      throw new Error(`Resume extraction returned ${response.status}.`);
    return resumeExtractionSchema.parse(await response.json());
  } catch {
    return {
      ...baseline,
      notes: [
        ...baseline.notes,
        "AI extraction was unavailable; deterministic extraction was used.",
      ],
    };
  }
}
