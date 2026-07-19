import { describe, expect, it } from "vitest";

import { mayaProfile } from "./index";

describe("Maya Chen demo profile", () => {
  it("contains deterministic autofill data and evidence", () => {
    expect(mayaProfile.displayName).toBe("Maya Chen");
    expect(mayaProfile.identity.email).toBe("maya.chen@example.com");
    expect(mayaProfile.evidence).toHaveLength(5);
    expect(mayaProfile.evidence.map((record) => record.id)).toContain(
      "interest-accessible-products",
    );
  });

  it("stores user-confirmed authorization and demographic profile values", () => {
    expect(mayaProfile.workAuthorization?.canada).toBe("authorized");
    expect(mayaProfile.demographics?.genderIdentity).toBe("woman");
  });
});
