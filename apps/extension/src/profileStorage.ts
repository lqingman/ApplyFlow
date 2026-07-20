import {
  candidateProfileSchema,
  type CandidateProfile,
  rememberedAnswersSchema,
  type RememberedAnswer,
} from "@applyproof/shared-types";

const PROFILE_STORAGE_KEY = "applyproof.myProfile.v1";
const ANSWERS_STORAGE_KEY = "applyproof.reusableAnswers.v1";

const authorizationLabels: Record<
  CandidateProfile["workAuthorization"]["canada"],
  string
> = {
  authorized: "Authorized to work in Canada",
  requires_sponsorship: "Require sponsorship now or in the future",
  prefer_discuss: "Prefer to discuss",
  decline: "Prefer not to say",
};

type LocalStorageArea = Pick<
  chrome.storage.StorageArea,
  "get" | "set" | "remove"
>;

function localStorageArea(): LocalStorageArea {
  if (typeof chrome === "undefined" || !chrome.storage?.local) {
    throw new Error("Local profile storage is unavailable in this browser.");
  }
  return chrome.storage.local;
}

export async function loadMyProfile(): Promise<CandidateProfile | null> {
  const stored = await localStorageArea().get(PROFILE_STORAGE_KEY);
  const value = stored[PROFILE_STORAGE_KEY];
  if (value === undefined) return null;
  const parsed = candidateProfileSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error(
      "Your saved profile could not be read. Reset it locally and create it again.",
    );
  }
  return parsed.data;
}

export async function saveMyProfile(profile: CandidateProfile) {
  const validated = candidateProfileSchema.parse(profile);
  const existingAnswers = await loadRememberedAnswers();
  const prior = existingAnswers.find(
    (answer) => answer.canonicalKey === "work_authorization.canada",
  );
  const value = authorizationLabels[validated.workAuthorization.canada];
  const authorizationAnswer: RememberedAnswer = {
    canonicalKey: "work_authorization.canada",
    value,
    source: "explicit_profile_choice",
    confirmedAt:
      prior?.value === value ? prior.confirmedAt : new Date().toISOString(),
    scope: { country: "CA" },
    timeDependent: false,
  };
  const rememberedAnswers = rememberedAnswersSchema.parse([
    ...existingAnswers.filter(
      (answer) => answer.canonicalKey !== authorizationAnswer.canonicalKey,
    ),
    authorizationAnswer,
  ]);
  await localStorageArea().set({
    [PROFILE_STORAGE_KEY]: validated,
    [ANSWERS_STORAGE_KEY]: rememberedAnswers,
  });
  return validated;
}

export async function loadRememberedAnswers(): Promise<RememberedAnswer[]> {
  const stored = await localStorageArea().get(ANSWERS_STORAGE_KEY);
  const value = stored[ANSWERS_STORAGE_KEY];
  if (value === undefined) return [];
  const parsed = rememberedAnswersSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error("Saved application preferences could not be read.");
  }
  return parsed.data;
}

export async function resetMyProfile() {
  await localStorageArea().remove([PROFILE_STORAGE_KEY, ANSWERS_STORAGE_KEY]);
}
