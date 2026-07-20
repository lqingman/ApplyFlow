import { beforeEach, describe, expect, it, vi } from "vitest";
import { mayaProfile } from "@applyproof/sample-data";

import {
  loadMyProfile,
  loadRememberedAnswers,
  resetMyProfile,
  saveMyProfile,
} from "./profileStorage";

describe("local My Profile storage", () => {
  const get = vi.fn();
  const set = vi.fn();
  const remove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("chrome", { storage: { local: { get, set, remove } } });
  });

  it("returns null when no profile has been created", async () => {
    get.mockResolvedValue({});
    await expect(loadMyProfile()).resolves.toBeNull();
  });

  it("validates profiles before saving and after loading", async () => {
    get.mockResolvedValue({});
    set.mockResolvedValue(undefined);
    await expect(saveMyProfile(mayaProfile)).resolves.toEqual(mayaProfile);
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        "applyproof.myProfile.v1": mayaProfile,
        "applyproof.reusableAnswers.v1": [
          expect.objectContaining({
            canonicalKey: "work_authorization.canada",
            value: "Authorized to work in Canada",
            source: "explicit_profile_choice",
            scope: { country: "CA" },
            timeDependent: false,
          }),
        ],
      }),
    );

    get.mockResolvedValue({ "applyproof.myProfile.v1": mayaProfile });
    await expect(loadMyProfile()).resolves.toEqual(mayaProfile);
  });

  it("rejects malformed saved data instead of using it for autofill", async () => {
    get.mockResolvedValue({
      "applyproof.myProfile.v1": { id: "broken-profile" },
    });
    await expect(loadMyProfile()).rejects.toThrow("could not be read");
  });

  it("removes only the versioned ApplyProof data keys", async () => {
    remove.mockResolvedValue(undefined);
    await resetMyProfile();
    expect(remove).toHaveBeenCalledWith([
      "applyproof.myProfile.v1",
      "applyproof.reusableAnswers.v1",
    ]);
  });

  it("loads schema-validated reusable answers separately from profile facts", async () => {
    const answer = {
      canonicalKey: "work_authorization.canada",
      value: "Authorized to work in Canada",
      source: "explicit_profile_choice",
      confirmedAt: "2026-07-19T20:00:00.000Z",
      scope: { country: "CA" },
      timeDependent: false,
    };
    get.mockResolvedValue({ "applyproof.reusableAnswers.v1": [answer] });

    await expect(loadRememberedAnswers()).resolves.toEqual([answer]);
  });
});
