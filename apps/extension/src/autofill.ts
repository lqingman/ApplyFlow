import type {
  CandidateProfile,
  FieldFill,
  NormalizedField,
  RememberedAnswer,
} from "@applyproof/shared-types";

export type FieldDecision = {
  field: NormalizedField;
  action: "fill" | "review" | "skip";
  reason: string;
  value?: string;
};

function profileValue(profile: CandidateProfile, fieldId: string) {
  const workAuthorization = {
    authorized: "Authorized to work in Canada",
    requires_sponsorship: "Require sponsorship now or in the future",
    prefer_discuss: "Prefer to discuss",
    decline: "Prefer not to say",
  } as const;
  const values: Record<string, string> = {
    "first-name": profile.identity.firstName,
    "last-name": profile.identity.lastName,
    email: profile.identity.email,
    phone: profile.identity.phone,
    location: profile.identity.location,
    portfolio: profile.links.portfolio,
    school: profile.education.school,
    degree: profile.education.degree,
    "graduation-date": profile.education.graduationDate,
    "start-date": profile.availability.startDate,
    relocation: profile.availability.relocation,
    "work-authorization": workAuthorization[profile.workAuthorization.canada],
    gender: profile.demographics.genderIdentity,
    accuracyConfirmation: "true",
  };
  return values[fieldId];
}

function reviewReason(field: NormalizedField) {
  if (field.kind === "textarea")
    return "This answer needs a grounded draft and your review.";
  return "No verified profile mapping is available for this required field.";
}

function rememberedValue(field: NormalizedField, answers: RememberedAnswer[]) {
  const fingerprint = `${field.label} ${field.options.join(" ")}`;
  const isCanadianAuthorization =
    /\b(?:canada|canadian)\b/i.test(fingerprint) &&
    /\b(?:authori[sz](?:ed|ation)|legally eligible|work permit|sponsorship)\b/i.test(
      fingerprint,
    );
  if (!isCanadianAuthorization) return undefined;
  const answer = answers.find(
    (answer) =>
      answer.canonicalKey === "work_authorization.canada" &&
      answer.scope.country === "CA" &&
      !answer.timeDependent,
  );
  if (!answer) return undefined;

  const exactOption = field.options.find(
    (option) => option.toLowerCase() === answer.value.toLowerCase(),
  );
  if (exactOption) return exactOption;

  const option = (...candidates: string[]) =>
    field.options.find((item) =>
      candidates.some(
        (candidate) => item.trim().toLowerCase() === candidate.toLowerCase(),
      ),
    );
  if (/\bsponsorship\b/i.test(field.label)) {
    if (answer.value === "Authorized to work in Canada")
      return option("No", "No sponsorship required");
    if (answer.value === "Require sponsorship now or in the future")
      return option("Yes", "Sponsorship required");
  }
  if (answer.value === "Authorized to work in Canada")
    return option("Yes", "I am authorized");
  return undefined;
}

export function planAutofill(
  profile: CandidateProfile,
  fields: NormalizedField[],
  rememberedAnswers: RememberedAnswer[] = [],
) {
  const decisions: FieldDecision[] = fields.map((field) => {
    const value =
      profileValue(profile, field.id) ??
      rememberedValue(field, rememberedAnswers);
    if (value !== undefined) {
      if (field.value.trim()) {
        return {
          field,
          action: "review",
          reason: "Existing value preserved. Review it before replacing.",
          value,
        };
      }
      return {
        field,
        action: "fill",
        reason: "Directly mapped from the selected profile.",
        value,
      };
    }

    if (field.kind === "textarea" || field.required) {
      return { field, action: "review", reason: reviewReason(field) };
    }

    return {
      field,
      action: "skip",
      reason: "Optional field has no verified profile mapping.",
    };
  });

  const fills: FieldFill[] = decisions
    .filter(
      (decision): decision is FieldDecision & { value: string } =>
        decision.action === "fill" && decision.value !== undefined,
    )
    .map((decision) => ({
      fieldId: decision.field.id,
      value: decision.value,
    }));

  return { decisions, fills };
}
