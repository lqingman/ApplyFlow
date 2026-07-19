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
    ]);

    expect(fills).toEqual([
      { fieldId: "first-name", value: "Maya" },
      { fieldId: "email", value: "maya.chen@example.com" },
      { fieldId: "school", value: "University of British Columbia" },
      { fieldId: "graduation-date", value: "2026-05-15" },
      { fieldId: "relocation", value: "yes" },
    ]);
  });

  it("preserves existing values and routes exceptions", () => {
    const { decisions, fills } = planAutofill(mayaProfile, [
      field("email", { value: "existing@example.com" }),
      field("work-authorization", { kind: "select", required: true }),
      field("motivation", { kind: "textarea", required: true }),
      field("gender", { kind: "radio" }),
      field("accuracyConfirmation", { kind: "checkbox", required: true }),
    ]);

    expect(fills).toEqual([]);
    expect(
      decisions.map(({ field: item, action }) => [item.id, action]),
    ).toEqual([
      ["email", "review"],
      ["work-authorization", "review"],
      ["motivation", "review"],
      ["gender", "skip"],
      ["accuracyConfirmation", "review"],
    ]);
  });
});
