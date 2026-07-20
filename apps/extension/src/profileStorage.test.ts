import { beforeEach, describe, expect, it, vi } from "vitest";
import { mayaProfile } from "@applyproof/sample-data";

import { loadMyProfile, resetMyProfile, saveMyProfile } from "./profileStorage";

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
    set.mockResolvedValue(undefined);
    await expect(saveMyProfile(mayaProfile)).resolves.toEqual(mayaProfile);
    expect(set).toHaveBeenCalledWith({
      "applyproof.myProfile.v1": mayaProfile,
    });

    get.mockResolvedValue({ "applyproof.myProfile.v1": mayaProfile });
    await expect(loadMyProfile()).resolves.toEqual(mayaProfile);
  });

  it("rejects malformed saved data instead of using it for autofill", async () => {
    get.mockResolvedValue({
      "applyproof.myProfile.v1": { id: "broken-profile" },
    });
    await expect(loadMyProfile()).rejects.toThrow("could not be read");
  });

  it("removes only the versioned profile key", async () => {
    remove.mockResolvedValue(undefined);
    await resetMyProfile();
    expect(remove).toHaveBeenCalledWith("applyproof.myProfile.v1");
  });
});
