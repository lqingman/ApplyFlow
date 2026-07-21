import { beforeEach, describe, expect, it, vi } from "vitest";

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
      <fieldset><legend>Race or ethnicity</legend>
        <label><input type="radio" name="race" value="194">Asian</label>
        <label><input type="radio" name="race" value="195">White</label>
      </fieldset>
      <label>Disability status<select id="disability">
        <option value="">Choose</option>
        <option value="201">Yes, I have a disability</option>
        <option value="202">No, I do not have a disability</option>
      </select></label>
    `;
  });

  it("fills blank controls and radio groups", async () => {
    const relocation = document.querySelector<HTMLInputElement>(
      'input[name="relocation"][value="yes"]',
    );
    const relocationClick = vi.fn();
    relocation?.addEventListener("click", relocationClick);
    expect(
      await fillDocument(document, [
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
    expect(relocationClick).toHaveBeenCalledOnce();
    expect(
      document.querySelector<HTMLInputElement>(
        'input[name="accuracyConfirmation"]',
      )?.checked,
    ).toBe(true);
  });

  it("never overwrites an existing value", async () => {
    expect(
      await fillDocument(document, [
        { fieldId: "school", value: "New school" },
      ]),
    ).toEqual([{ fieldId: "school", status: "skipped_existing" }]);
    expect(document.querySelector<HTMLInputElement>("#school")?.value).toBe(
      "Already entered",
    );
  });

  it("matches visible option labels when ATS values are opaque IDs", async () => {
    expect(
      await fillDocument(document, [
        { fieldId: "race", value: "Asian" },
        { fieldId: "disability", value: "No" },
      ]),
    ).toEqual([
      { fieldId: "race", status: "filled" },
      { fieldId: "disability", status: "filled" },
    ]);
    expect(
      document.querySelector<HTMLInputElement>('input[value="194"]'),
    ).toBeChecked();
    expect(
      document.querySelector<HTMLSelectElement>("#disability")?.value,
    ).toBe("202");
  });

  it("fills a BambooHR Fabric select through its visible menu", async () => {
    document.body.innerHTML = `
      <div data-fabric-component="Select">
        <button aria-haspopup="true" aria-expanded="false"><span class="fab-SelectToggle__content">United States</span></button>
        <select id="country" name="countryId.value" aria-hidden="true" readonly>
          <option value="1" selected></option>
        </select>
      </div>
    `;
    const toggle = document.querySelector("button")!;
    toggle.addEventListener("click", () => {
      toggle.setAttribute("aria-expanded", "true");
      window.setTimeout(() => {
        const option = document.createElement("div");
        option.setAttribute("role", "menuitem");
        option.textContent = "Canada";
        option.addEventListener("click", () => {
          document.querySelector(".fab-SelectToggle__content")!.textContent =
            "Canada";
          toggle.setAttribute("aria-expanded", "false");
        });
        document.body.append(option);
      }, 40);
    });

    await expect(
      fillDocument(document, [{ fieldId: "country", value: "Canada" }]),
    ).resolves.toEqual([{ fieldId: "country", status: "filled" }]);
    expect(
      document.querySelector(".fab-SelectToggle__content"),
    ).toHaveTextContent("Canada");
  });

  it("matches Canadian province abbreviations to full ATS option names", async () => {
    document.body.innerHTML = `
      <label>Province<select id="province" name="state.value">
        <option value="">Choose</option>
        <option value="59">British Columbia</option>
        <option value="60">Ontario</option>
      </select></label>
    `;

    await expect(
      fillDocument(document, [{ fieldId: "province", value: "BC" }]),
    ).resolves.toEqual([{ fieldId: "province", status: "filled" }]);
    expect(document.querySelector("#province")).toHaveValue("59");
  });
});
