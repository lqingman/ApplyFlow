import { beforeEach, describe, expect, it } from "vitest";

import { fillDocument } from "./pageFill";

describe("safe page filling", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <label>Email <input id="email" value=""></label>
      <label>School <input id="school" value="Already entered"></label>
      <fieldset><legend>Relocation</legend>
        <label><input type="radio" name="relocation" value="yes">Yes</label>
        <label><input type="radio" name="relocation" value="no">No</label>
      </fieldset>
      <label><input type="checkbox" name="accuracyConfirmation"> Confirm accuracy</label>
    `;
  });

  it("fills blank controls and radio groups", () => {
    expect(
      fillDocument(document, [
        { fieldId: "email", value: "maya.chen@example.com" },
        { fieldId: "relocation", value: "yes" },
        { fieldId: "accuracyConfirmation", value: "true" },
      ]),
    ).toEqual([
      { fieldId: "email", status: "filled" },
      { fieldId: "relocation", status: "filled" },
      { fieldId: "accuracyConfirmation", status: "filled" },
    ]);
    expect(document.querySelector<HTMLInputElement>("#email")?.value).toBe(
      "maya.chen@example.com",
    );
    expect(
      document.querySelector<HTMLInputElement>('input[value="yes"]')?.checked,
    ).toBe(true);
    expect(
      document.querySelector<HTMLInputElement>(
        'input[name="accuracyConfirmation"]',
      )?.checked,
    ).toBe(true);
  });

  it("never overwrites an existing value", () => {
    expect(
      fillDocument(document, [{ fieldId: "school", value: "New school" }]),
    ).toEqual([{ fieldId: "school", status: "skipped_existing" }]);
    expect(document.querySelector<HTMLInputElement>("#school")?.value).toBe(
      "Already entered",
    );
  });
});
