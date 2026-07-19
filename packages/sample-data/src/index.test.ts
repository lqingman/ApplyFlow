import { describe, expect, it } from "vitest";

import { mayaProfile } from "./index";

describe("Maya Chen demo profile", () => {
  it("contains deterministic autofill data and evidence", () => {
    expect(mayaProfile.displayName).toBe("Maya Chen");
    expect(mayaProfile.identity.email).toBe("maya.chen@example.com");
    expect(mayaProfile.evidence).toHaveLength(4);
  });

  it("intentionally omits work authorization and demographics", () => {
    expect(mayaProfile).not.toHaveProperty("workAuthorization");
    expect(mayaProfile).not.toHaveProperty("gender");
  });
});
