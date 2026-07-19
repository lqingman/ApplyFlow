import { describe, expect, it } from "vitest";
import { mayaProfile } from "@applyproof/sample-data";
import type { NormalizedField } from "@applyproof/shared-types";

import { planAutofill } from "./autofill";

function field(
  id: string,
  overrides: Partial<NormalizedField> = {},
): NormalizedField {
  return {
    id,
    label: id,
    kind: "text",
    required: false,
    value: "",
    options: [],
    ...overrides,
  };
}

describe("safe autofill planning", () => {
  it("maps deterministic profile fields", () => {
    const { fills } = planAutofill(mayaProfile, [
      field("first-name"),
      field("email", { kind: "email" }),
      field("school"),
      field("graduation-date", { kind: "date" }),
      field("relocation", { kind: "radio", options: ["Yes", "No"] }),
      field("work-authorization", {
        kind: "select",
        options: [
          "Authorized to work in Canada",
          "Require sponsorship now or in the future",
        ],
      }),
      field("gender", {
        kind: "radio",
        options: ["Woman", "Man", "Non-binary", "Prefer not to say"],
      }),
      field("accuracyConfirmation", { kind: "checkbox", required: true }),
    ]);

    expect(fills).toEqual([
      { fieldId: "first-name", value: "Maya" },
      { fieldId: "email", value: "maya.chen@example.com" },
      { fieldId: "school", value: "University of British Columbia" },
      { fieldId: "graduation-date", value: "2026-05-15" },
      { fieldId: "relocation", value: "yes" },
      {
        fieldId: "work-authorization",
        value: "Authorized to work in Canada",
      },
      { fieldId: "gender", value: "woman" },
      { fieldId: "accuracyConfirmation", value: "true" },
    ]);
  });

  it("preserves existing values and routes open answers to review", () => {
    const { decisions, fills } = planAutofill(mayaProfile, [
      field("email", { value: "existing@example.com" }),
      field("motivation", { kind: "textarea", required: true }),
      field("accuracyConfirmation", { kind: "checkbox", required: true }),
    ]);

    expect(fills).toEqual([{ fieldId: "accuracyConfirmation", value: "true" }]);
    expect(
      decisions.map(({ field: item, action }) => [item.id, action]),
    ).toEqual([
      ["email", "review"],
      ["motivation", "review"],
      ["accuracyConfirmation", "fill"],
    ]);
  });

  it("autofills a saved prefer-not-to-say demographic choice", () => {
    const profile = {
      ...mayaProfile,
      demographics: { genderIdentity: "decline" as const },
    };
    const { fills } = planAutofill(profile, [
      field("gender", { kind: "radio" }),
    ]);

    expect(fills).toEqual([{ fieldId: "gender", value: "decline" }]);
  });
});
