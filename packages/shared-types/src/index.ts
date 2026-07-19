import { z } from "zod";

export const answerStatusSchema = z.enum([
  "verified",
  "generated",
  "needs_review",
  "unsupported",
]);

export type AnswerStatus = z.infer<typeof answerStatusSchema>;

export const fieldKindSchema = z.enum([
  "text",
  "email",
  "tel",
  "url",
  "date",
  "textarea",
  "select",
  "radio",
  "checkbox",
]);

export type FieldKind = z.infer<typeof fieldKindSchema>;

export const normalizedFieldSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  kind: fieldKindSchema,
  required: z.boolean(),
  value: z.string(),
  options: z.array(z.string()).default([]),
  maxLength: z.number().int().positive().optional(),
});

export type NormalizedField = z.infer<typeof normalizedFieldSchema>;

export const pageScanSchema = z.object({
  fields: z.array(normalizedFieldSchema),
  blockedCount: z.number().int().nonnegative().default(0),
});

export type PageScan = z.infer<typeof pageScanSchema>;

export const fieldFillSchema = z.object({
  fieldId: z.string().min(1),
  value: z.string(),
});

export type FieldFill = z.infer<typeof fieldFillSchema>;

export const fillResultSchema = z.object({
  fieldId: z.string().min(1),
  status: z.enum([
    "filled",
    "skipped_existing",
    "not_found",
    "unsupported_option",
  ]),
});

export type FillResult = z.infer<typeof fillResultSchema>;

export const pageFillResultSchema = z.object({
  results: z.array(fillResultSchema),
});

export const evidenceRecordSchema = z.object({
  id: z.string().min(1),
  category: z.enum(["profile", "education", "experience", "project", "skill"]),
  text: z.string().min(1),
  source: z.string().min(1),
});

export type EvidenceRecord = z.infer<typeof evidenceRecordSchema>;

export const candidateProfileSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  headline: z.string().min(1),
  identity: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    phone: z.string().min(1),
    location: z.string().min(1),
  }),
  links: z.object({
    portfolio: z.string().url(),
  }),
  education: z.object({
    school: z.string().min(1),
    degree: z.string().min(1),
    graduationDate: z.string().min(1),
  }),
  availability: z.object({
    startDate: z.string().min(1),
    relocation: z.enum(["yes", "no"]),
  }),
  evidence: z.array(evidenceRecordSchema),
});

export type CandidateProfile = z.infer<typeof candidateProfileSchema>;

export const answerDraftSchema = z.object({
  fieldId: z.string().min(1),
  answer: z.string(),
  status: answerStatusSchema,
  evidenceIds: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  warnings: z.array(z.string()),
});

export type AnswerDraft = z.infer<typeof answerDraftSchema>;

export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  service: z.literal("applyproof-api"),
  version: z.string(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
