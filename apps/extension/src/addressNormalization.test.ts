import { describe, expect, it } from "vitest";

import { addressChoiceMatches } from "./addressNormalization";
import {
  canonicalCountryName,
  canonicalRegionName,
} from "./profileAddressNormalization";

describe("address normalization", () => {
  it("canonicalizes common country codes without confusing field contexts", () => {
    expect(canonicalCountryName("CA")).toBe("Canada");
    expect(canonicalCountryName("U.S.A.")).toBe("United States");
    expect(addressChoiceMatches("Canada", "CAN", "country")).toBe(true);
  });

  it("matches Canadian province abbreviations and full names", () => {
    expect(canonicalRegionName("BC")).toBe("British Columbia");
    expect(canonicalRegionName("Québec")).toBe("Quebec");
    expect(addressChoiceMatches("British Columbia", "B.C.", "region")).toBe(
      true,
    );
  });
});
