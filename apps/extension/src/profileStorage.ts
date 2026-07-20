import {
  candidateProfileSchema,
  type CandidateProfile,
} from "@applyproof/shared-types";

const PROFILE_STORAGE_KEY = "applyproof.myProfile.v1";

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
  await localStorageArea().set({ [PROFILE_STORAGE_KEY]: validated });
  return validated;
}

export async function resetMyProfile() {
  await localStorageArea().remove(PROFILE_STORAGE_KEY);
}
