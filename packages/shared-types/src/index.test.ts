import { describe, expect, it } from "vitest";

import { answerDraftSchema, normalizedFieldSchema } from "./index";

describe("shared contracts", () => {
  it("accepts normalized form metadata", () => {
    expect(
      normalizedFieldSchema.parse({
        id: "email",
        label: "Email address",
        kind: "email",
        required: true,
        value: "",
      }),
    ).toMatchObject({ options: [] });
  });

  it("rejects confidence outside the supported range", () => {
    expect(() =>
      answerDraftSchema.parse({
        fieldId: "motivation",
        answer: "A grounded answer",
        status: "generated",
        evidenceIds: ["project-1"],
        confidence: 1.5,
        warnings: [],
      }),
    ).toThrow();
  });
});
