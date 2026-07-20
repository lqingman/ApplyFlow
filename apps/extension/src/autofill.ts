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

const yesNoLabels = {
  yes: "Yes",
  no: "No",
  decline: "Prefer not to say",
} as const;

const genderLabels = {
  woman: "Woman",
  man: "Man",
  nonbinary: "Non-binary",
  self_describe: "Self-describe",
  decline: "Prefer not to say",
} as const;

const raceLabels = {
  asian: "Asian",
  black: "Black or African American",
  hispanic_latino: "Hispanic or Latino",
  indigenous: "American Indian or Alaska Native",
  middle_eastern_north_african: "Middle Eastern or North African",
  pacific_islander: "Native Hawaiian or Other Pacific Islander",
  white: "White",
  multiracial: "Two or more races",
  self_describe: "Self-describe",
  decline: "Prefer not to say",
} as const;

function semanticFingerprint(field: NormalizedField) {
  return [
    field.id,
    field.label,
    field.metadata?.name,
    field.metadata?.autocomplete,
    field.metadata?.inputType,
    field.metadata?.questionText,
    ...field.options,
  ]
    .filter(Boolean)
    .join(" ");
}

function semanticProfileValue(
  profile: CandidateProfile,
  field: NormalizedField,
) {
  const primaryEducation = profile.education[0];
  const autocomplete = field.metadata?.autocomplete?.toLowerCase() ?? "";
  const fingerprint = semanticFingerprint(field);
  const matches = (pattern: RegExp) => pattern.test(fingerprint);

  if (autocomplete.split(/\s+/).includes("given-name"))
    return profile.identity.firstName;
  if (autocomplete.split(/\s+/).includes("family-name"))
    return profile.identity.lastName;
  if (autocomplete.split(/\s+/).includes("name"))
    return `${profile.identity.firstName} ${profile.identity.lastName}`;
  if (autocomplete.split(/\s+/).includes("email"))
    return profile.identity.email;
  if (autocomplete.split(/\s+/).includes("tel")) return profile.identity.phone;
  if (autocomplete.split(/\s+/).includes("address-level2"))
    return profile.identity.location;
  if (autocomplete.split(/\s+/).includes("url")) return profile.links.portfolio;

  if (matches(/\b(?:(?:first|given)[-_\s]*name|forename)\b/i))
    return profile.identity.firstName;
  if (matches(/\b(?:last|family|sur)[-_\s]*name\b/i))
    return profile.identity.lastName;
  if (matches(/\b(?:e-?mail|email address)\b/i)) return profile.identity.email;
  if (matches(/\b(?:phone|mobile|telephone|tel)[-_\s]*(?:number)?\b/i))
    return profile.identity.phone;
  if (matches(/\blinked\s*in\b/i)) return profile.links.linkedin;
  if (matches(/\b(?:portfolio|personal website|website url|github)\b/i))
    return profile.links.portfolio;
  if (
    matches(
      /\b(?:current )?(?:city|location|city and (?:province|state))\b/i,
    ) &&
    !matches(/\b(?:preferred|desired|job) location\b/i)
  )
    return profile.identity.location;
  if (matches(/\b(?:school|college|university|institution)\b/i))
    return primaryEducation?.school;
  if (matches(/\b(?:degree|qualification)\b/i)) return primaryEducation?.degree;
  if (
    matches(
      /\b(?:education|school|college|university).{0,40}\bstart(?:ed)?\b/i,
    ) ||
    matches(
      /\bstart(?:ed)?\b.{0,40}\b(?:education|school|college|university)\b/i,
    )
  )
    return primaryEducation?.startDate;
  if (matches(/\b(?:graduation|graduate|degree end|education end)\b/i))
    return primaryEducation?.graduationDate;
  if (matches(/\b(?:available|availability|start work|earliest start)\b/i))
    return profile.availability.startDate;
  if (matches(/\brelocat(?:e|ion|ing)\b/i))
    return profile.availability.relocation;
  return undefined;
}

function profileValue(profile: CandidateProfile, field: NormalizedField) {
  const primaryEducation = profile.education[0];
  const { id } = field;
  const values: Record<string, string | undefined> = {
    "first-name": profile.identity.firstName,
    "last-name": profile.identity.lastName,
    email: profile.identity.email,
    phone: profile.identity.phone,
    location: profile.identity.location,
    portfolio: profile.links.portfolio,
    linkedin: profile.links.linkedin,
    school: primaryEducation?.school,
    degree: primaryEducation?.degree,
    "education-start-date": primaryEducation?.startDate,
    "graduation-date": primaryEducation?.graduationDate,
    "start-date": profile.availability.startDate,
    relocation: profile.availability.relocation,
    accuracyConfirmation: "true",
  };
  if (values[id] !== undefined) return values[id];

  const semanticValue = semanticProfileValue(profile, field);
  if (semanticValue !== undefined) return semanticValue;

  const fingerprint = semanticFingerprint(field);
  const authorization = profile.workAuthorization.canada;
  if (
    id === "work-authorization" ||
    (/\bcanad(?:a|ian)\b/i.test(fingerprint) &&
      /\b(?:authori[sz](?:ed|ation)|legally eligible|eligible to work)\b/i.test(
        fingerprint,
      ) &&
      !/sponsor/i.test(fingerprint))
  ) {
    return yesNoLabels[authorization.authorized];
  }
  if (
    id === "sponsorship" ||
    (/\bcanad(?:a|ian)\b/i.test(fingerprint) &&
      /\bsponsor(?:ship)?\b/i.test(fingerprint))
  ) {
    return yesNoLabels[authorization.sponsorship];
  }

  const demographics = profile.demographics;
  if (/\bgender\b/i.test(fingerprint) && demographics.genderIdentity) {
    return demographics.genderIdentity === "self_describe"
      ? undefined
      : genderLabels[demographics.genderIdentity];
  }
  if (
    /\b(?:race|ethnicity|ethnic)\b/i.test(fingerprint) &&
    demographics.raceEthnicity
  ) {
    return demographics.raceEthnicity === "self_describe"
      ? undefined
      : raceLabels[demographics.raceEthnicity];
  }
  if (/\bdisabilit/i.test(fingerprint) && demographics.disabilityStatus) {
    return yesNoLabels[demographics.disabilityStatus];
  }
  if (
    /\b(?:lgbtq|sexual orientation)\b/i.test(fingerprint) &&
    demographics.lgbtqIdentity
  ) {
    return yesNoLabels[demographics.lgbtqIdentity];
  }
  if (
    /\b(?:veteran|military service)\b/i.test(fingerprint) &&
    demographics.veteranStatus
  ) {
    return demographics.veteranStatus === "yes"
      ? "Veteran"
      : demographics.veteranStatus === "no"
        ? "Not a veteran"
        : "Prefer not to say";
  }
  return undefined;
}

function reviewReason(field: NormalizedField) {
  if (field.kind === "textarea")
    return "This answer needs a grounded draft and your review.";
  return "No verified profile mapping is available for this required field.";
}

function rememberedValue(field: NormalizedField, answers: RememberedAnswer[]) {
  const fingerprint = semanticFingerprint(field);
  const isCanadianAuthorization =
    /\b(?:canada|canadian)\b/i.test(fingerprint) &&
    /\b(?:authori[sz](?:ed|ation)|legally eligible|work permit|sponsorship)\b/i.test(
      fingerprint,
    );
  if (!isCanadianAuthorization) return undefined;
  const canonicalKey = /\bsponsorship\b/i.test(fingerprint)
    ? "work_authorization.canada.sponsorship"
    : "work_authorization.canada.authorized";
  const answer = answers.find(
    (item) =>
      item.canonicalKey === canonicalKey &&
      item.scope.country === "CA" &&
      !item.timeDependent,
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
  if (answer.value === "Yes") return option("Yes", "I am authorized") ?? "Yes";
  if (answer.value === "No")
    return option("No", "No sponsorship required") ?? "No";
  return option("Prefer not to say", "Decline to answer") ?? answer.value;
}

export function planAutofill(
  profile: CandidateProfile,
  fields: NormalizedField[],
  rememberedAnswers: RememberedAnswer[] = [],
) {
  const decisions: FieldDecision[] = fields.map((field) => {
    const value =
      profileValue(profile, field) ?? rememberedValue(field, rememberedAnswers);
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
