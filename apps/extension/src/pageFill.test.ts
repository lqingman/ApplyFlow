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

  it("matches canonical veteran answers to Greenhouse disclosure wording", async () => {
    document.body.innerHTML = `
      <select id="not-veteran">
        <option value="">Select</option>
        <option value="not-protected">I am not a protected veteran</option>
      </select>
      <select id="protected-veteran">
        <option value="">Select</option>
        <option value="protected">I identify as one or more of the classifications of a protected veteran</option>
      </select>
      <select id="decline-veteran">
        <option value="">Select</option>
        <option value="decline">I don't wish to answer</option>
      </select>
    `;

    await expect(
      fillDocument(document, [
        { fieldId: "not-veteran", value: "Not a veteran" },
        { fieldId: "protected-veteran", value: "Veteran" },
        { fieldId: "decline-veteran", value: "Prefer not to say" },
      ]),
    ).resolves.toEqual([
      { fieldId: "not-veteran", status: "filled" },
      { fieldId: "protected-veteran", status: "filled" },
      { fieldId: "decline-veteran", status: "filled" },
    ]);
    expect(document.querySelector("#not-veteran")).toHaveValue("not-protected");
    expect(document.querySelector("#protected-veteran")).toHaveValue(
      "protected",
    );
    expect(document.querySelector("#decline-veteran")).toHaveValue("decline");
  });

  it("selects an option from a delayed React ARIA combobox", async () => {
    document.body.innerHTML = `
      <label id="authorization-label" for="authorization">Are you legally entitled to work in Canada?</label>
      <div class="select__control">
        <div class="select__value-container">
          <input id="authorization" type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-labelledby="authorization-label" value="">
        </div>
        <button type="button" aria-label="Toggle flyout">Open</button>
      </div>
    `;
    const combobox =
      document.querySelector<HTMLInputElement>("#authorization")!;
    const toggle = document.querySelector<HTMLButtonElement>(
      'button[aria-label="Toggle flyout"]',
    )!;
    toggle.addEventListener("mousedown", () => {
      combobox.setAttribute("aria-expanded", "true");
      window.setTimeout(() => {
        const option = document.createElement("div");
        option.setAttribute("role", "option");
        option.textContent = "Yes";
        option.addEventListener("mousedown", () => {
          const selected = document.createElement("div");
          selected.className = "select__single-value";
          selected.textContent = "Yes";
          document.querySelector(".select__value-container")!.prepend(selected);
          combobox.setAttribute("aria-expanded", "false");
        });
        document.body.append(option);
      }, 40);
    });

    await expect(
      fillDocument(document, [{ fieldId: "authorization", value: "Yes" }]),
    ).resolves.toEqual([{ fieldId: "authorization", status: "filled" }]);
    expect(combobox).toHaveValue("");
    expect(document.querySelector(".select__single-value")).toHaveTextContent(
      "Yes",
    );
  });
});
