import { describe, expect, it } from "vitest";
import { mayaProfile } from "@applyflow/sample-data";
import type { NormalizedField } from "@applyflow/shared-types";

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
      field("preferred-name"),
      field("email", { kind: "email" }),
      field("school"),
      field("education-start-date", { kind: "date" }),
      field("graduation-date", { kind: "date" }),
      field("relocation", { kind: "radio", options: ["Yes", "No"] }),
      field("work-authorization", {
        kind: "select",
        options: ["Yes", "No"],
      }),
      field("sponsorship", {
        label: "Will you now or in the future require sponsorship?",
        kind: "select",
        options: ["Yes", "No"],
      }),
      field("gender", {
        kind: "radio",
        options: ["Woman", "Man", "Non-binary", "Prefer not to say"],
      }),
      field("accuracyConfirmation", { kind: "checkbox", required: true }),
    ]);

    expect(fills).toEqual([
      { fieldId: "first-name", value: "Maya" },
      { fieldId: "preferred-name", value: "May" },
      { fieldId: "email", value: "maya.chen@example.com" },
      { fieldId: "school", value: "University of British Columbia" },
      { fieldId: "education-start-date", value: "2022-09-01" },
      { fieldId: "graduation-date", value: "2026-05-15" },
      { fieldId: "relocation", value: "yes" },
      {
        fieldId: "work-authorization",
        value: "Yes",
      },
      { fieldId: "sponsorship", value: "No" },
      { fieldId: "gender", value: "Woman" },
      { fieldId: "accuracyConfirmation", value: "true" },
    ]);
  });

  it("maps preferred-name questions without replacing the legal first name", () => {
    const { fills } = planAutofill(mayaProfile, [
      field("legal-name", { label: "Legal given name" }),
      field("nickname", {
        label: "What name do you go by?",
        metadata: { autocomplete: "given-name" },
      }),
      field("chosen-name", { label: "Chosen name" }),
      field("preferred-first", { label: "Preferred first name" }),
    ]);

    expect(fills).toEqual([
      { fieldId: "legal-name", value: "Maya" },
      { fieldId: "nickname", value: "May" },
      { fieldId: "chosen-name", value: "May" },
      { fieldId: "preferred-first", value: "May" },
    ]);
  });

  it("leaves a preferred-name question blank when none is saved", () => {
    const profile = {
      ...mayaProfile,
      identity: { ...mayaProfile.identity, preferredName: undefined },
    };
    const { fills } = planAutofill(profile, [
      field("nickname", {
        label: "Preferred name",
        metadata: { autocomplete: "given-name" },
      }),
    ]);

    expect(fills).toEqual([]);
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

    expect(fills).toEqual([{ fieldId: "gender", value: "Prefer not to say" }]);
  });

  it("maps explicitly saved voluntary answers by question meaning", () => {
    const { fills } = planAutofill(mayaProfile, [
      field("question-101", {
        label: "Race or ethnicity",
        kind: "radio",
        options: ["Asian", "Black or African American", "White"],
      }),
      field("question-102", {
        label: "Disability status",
        kind: "select",
        options: ["Yes", "No", "Prefer not to say"],
      }),
      field("question-103", {
        label: "Veteran or military service status",
        kind: "radio",
        options: ["Veteran", "Not a veteran", "Prefer not to say"],
      }),
    ]);

    expect(fills).toEqual([
      { fieldId: "question-101", value: "Asian" },
      { fieldId: "question-102", value: "No" },
      { fieldId: "question-103", value: "Not a veteran" },
    ]);
  });

  it("autofills an explicit prefer-not-to-say authorization choice", () => {
    const profile = {
      ...mayaProfile,
      workAuthorization: {
        canada: {
          authorized: "decline" as const,
          sponsorship: "decline" as const,
        },
      },
    };
    const { fills } = planAutofill(profile, [
      field("work-authorization", { kind: "select" }),
    ]);

    expect(fills).toEqual([
      { fieldId: "work-authorization", value: "Prefer not to say" },
    ]);
  });

  it("reuses a scoped answer only for a high-confidence equivalent question", () => {
    const remembered = [
      {
        canonicalKey: "work_authorization.canada.authorized",
        value: "Yes",
        source: "explicit_profile_choice" as const,
        confirmedAt: "2026-07-19T20:00:00.000Z",
        scope: { country: "CA" },
        timeDependent: false,
      },
    ];
    const { fills } = planAutofill(
      mayaProfile,
      [
        field("eligibility-question", {
          label: "Are you legally authorized to work in Canada?",
          kind: "select",
          options: ["Yes", "No"],
        }),
        field("us-eligibility", {
          label: "Are you legally authorized to work in the United States?",
          kind: "select",
        }),
      ],
      remembered,
    );

    expect(fills).toEqual([{ fieldId: "eligibility-question", value: "Yes" }]);
  });

  it("maps split BambooHR address fields and its masked availability date", () => {
    const { fills } = planAutofill(mayaProfile, [
      field("street", {
        label: "Address",
        metadata: { name: "streetAddress.value" },
      }),
      field("city", { label: "City", metadata: { name: "city.value" } }),
      field("state", {
        label: "State",
        kind: "select",
        metadata: { name: "state.value" },
      }),
      field("zip", { label: "ZIP", metadata: { name: "zip.value" } }),
      field("country", {
        label: "Country",
        kind: "select",
        metadata: { name: "countryId.value" },
      }),
      field("available", {
        label: "Date Available",
        metadata: { placeholder: "dd mon yyyy", inputType: "text" },
      }),
    ]);

    expect(fills).toEqual([
      { fieldId: "street", value: "1234 Demo Street" },
      { fieldId: "city", value: "Vancouver" },
      { fieldId: "state", value: "British Columbia" },
      { fieldId: "zip", value: "V6B 1A1" },
      { fieldId: "country", value: "Canada" },
      { fieldId: "available", value: "03 Aug 2026" },
    ]);
  });

  it("uses a Canadian authorization question to scope a nearby sponsorship question", () => {
    const { fills } = planAutofill(mayaProfile, [
      field("customQuestionAnswers.yes_no_359", {
        label: "Are you legally authorized to work in Canada?",
        kind: "radio",
        options: ["Yes", "No"],
      }),
      field("customQuestionAnswers.yes_no_360", {
        label:
          "Will you now or in the future require sponsorship for employment visa status?",
        kind: "radio",
        options: ["Yes", "No"],
      }),
    ]);

    expect(fills).toEqual([
      { fieldId: "customQuestionAnswers.yes_no_359", value: "Yes" },
      { fieldId: "customQuestionAnswers.yes_no_360", value: "No" },
    ]);
  });

  it("maps relocation consent to commute and recognizes legally entitled wording", () => {
    const { fills } = planAutofill(mayaProfile, [
      field("question_8437472006", {
        label: "Are you able to commute to our office in Edmonton, AB?",
        required: true,
      }),
      field("question_8437473006", {
        label: "Are you legally entitled to work in Canada?",
        kind: "select",
        required: true,
        options: ["Yes", "No"],
      }),
    ]);

    expect(fills).toEqual([
      { fieldId: "question_8437472006", value: "Yes" },
      { fieldId: "question_8437473006", value: "Yes" },
    ]);
  });
});
