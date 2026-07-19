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

export const evidenceRecordSchema = z.object({
  id: z.string().min(1),
  category: z.enum(["profile", "education", "experience", "project", "skill"]),
  text: z.string().min(1),
  source: z.string().min(1),
});

export type EvidenceRecord = z.infer<typeof evidenceRecordSchema>;

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
