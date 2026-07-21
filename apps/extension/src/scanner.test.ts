import { beforeEach, describe, expect, it } from "vitest";

import {
  countBlockedFields,
  extractFieldLabel,
  findField,
  readCharacterLimit,
  scanDocument,
} from "./scanner";

describe("page scanner", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("extracts labels in accessible priority order", () => {
    document.body.innerHTML = `
      <label for="email">Email address <span aria-hidden="true">*</span></label>
      <input id="email" aria-label="Ignored aria label" placeholder="Ignored placeholder">
      <div id="custom-label">Preferred location</div>
      <div id="location" role="textbox" aria-labelledby="custom-label"></div>
      <span>Portfolio link</span><input id="portfolio" placeholder="https://example.com">
      <input id="nickname" placeholder="Preferred name">
    `;

    expect(extractFieldLabel(document.getElementById("email")!, document)).toBe(
      "Email address",
    );
    expect(
      extractFieldLabel(document.getElementById("location")!, document),
    ).toBe("Preferred location");
    expect(
      extractFieldLabel(document.getElementById("portfolio")!, document),
    ).toBe("Portfolio link");
    expect(
      extractFieldLabel(document.getElementById("nickname")!, document),
    ).toBe("Preferred name");
  });

  it("normalizes native controls and groups radio options", () => {
    document.body.innerHTML = `
      <label>Email address <input id="email" name="email" type="email" required value="maya@example.com"></label>
      <label>Story <textarea id="story" aria-describedby="story-limit"></textarea><small id="story-limit">Maximum 500 characters</small></label>
      <label>Work authorization <select id="authorization" required>
        <option value="" disabled selected>Select one</option><option value="yes">Authorized</option>
      </select></label>
      <fieldset><legend>Open to relocating?</legend>
        <label><input type="radio" name="relocation" value="yes"> Yes</label>
        <label><input type="radio" name="relocation" value="no" checked> No</label>
      </fieldset>
      <label><input type="checkbox" name="confirmation" required> I reviewed this application</label>
    `;

    expect(scanDocument(document)).toEqual([
      {
        id: "email",
        label: "Email address",
        kind: "email",
        required: true,
        value: "maya@example.com",
        options: [],
        metadata: { name: "email", inputType: "email" },
      },
      {
        id: "story",
        label: "Story",
        kind: "textarea",
        required: false,
        value: "",
        options: [],
        maxLength: 500,
      },
      {
        id: "authorization",
        label: "Work authorization",
        kind: "select",
        required: true,
        value: "",
        options: ["Authorized"],
      },
      {
        id: "relocation",
        label: "Open to relocating?",
        kind: "radio",
        required: false,
        value: "no",
        options: ["Yes", "No"],
        metadata: {
          name: "relocation",
          inputType: "radio",
          questionText: "Open to relocating? Yes No",
        },
      },
      {
        id: "confirmation",
        label: "I reviewed this application",
        kind: "checkbox",
        required: true,
        value: "",
        options: [],
        metadata: { name: "confirmation", inputType: "checkbox" },
      },
    ]);
  });

  it("reads live character limits from native, custom, and helper constraints", () => {
    document.body.innerHTML = `
      <textarea id="native" maxlength="300"></textarea>
      <textarea id="custom" data-character-limit="420"></textarea>
      <label>Answer <textarea id="helper"></textarea><small>250 character limit</small></label>
    `;

    expect(readCharacterLimit(document.getElementById("native")!)).toBe(300);
    expect(readCharacterLimit(document.getElementById("custom")!)).toBe(420);
    expect(readCharacterLimit(document.getElementById("helper")!)).toBe(250);
  });

  it("excludes blocked fields without losing safe controls", () => {
    document.body.innerHTML = `
      <label>Password <input id="password" type="password" value="secret-password"></label>
      <label>Social insurance number <input id="sin" value="123-456-789"></label>
      <label>Bank account <input name="bankAccount" value="00012345"></label>
      <div class="question">Government ID number <label>Answer <input id="opaque-sensitive" value="private-id"></label></div>
      <label>First name <input id="first-name"></label>
    `;

    expect(scanDocument(document).map((field) => field.id)).toEqual([
      "first-name",
    ]);
    expect(countBlockedFields(document)).toBe(4);
    expect(JSON.stringify(scanDocument(document))).not.toMatch(
      /secret-password|123-456-789|00012345|private-id/,
    );
  });

  it("never treats bot-challenge response controls as application questions", () => {
    document.body.innerHTML = `
      <textarea id="g-recaptcha-response" name="g-recaptcha-response"></textarea>
      <textarea id="project" aria-label="Project summary"></textarea>
    `;

    expect(scanDocument(document).map((field) => field.id)).toEqual([
      "project",
    ]);
    expect(countBlockedFields(document)).toBe(1);
  });

  it("does not scan navigation or submission controls", () => {
    document.body.innerHTML = `
      <label>First name <input id="first-name"></label>
      <input type="button" id="next" value="Next">
      <input type="submit" id="submit" value="Submit application">
      <button id="continue">Continue</button>
    `;

    expect(scanDocument(document).map((field) => field.id)).toEqual([
      "first-name",
    ]);
  });

  it("supports practical ARIA custom controls", () => {
    document.body.innerHTML = `
      <div id="city-label">Current city</div>
      <div role="combobox" aria-labelledby="city-label" aria-required="true">
        <div role="option">Vancouver</div><div role="option">Toronto</div>
      </div>
      <div role="textbox" aria-label="Project summary" contenteditable="true"></div>
    `;

    const fields = scanDocument(document);

    expect(fields).toMatchObject([
      {
        label: "Current city",
        kind: "select",
        required: true,
        options: ["Vancouver", "Toronto"],
      },
      { label: "Project summary", kind: "text", required: false },
    ]);
    expect(findField(document, fields[0].id)).toHaveAttribute(
      "role",
      "combobox",
    );
  });

  it("treats a Fabric select display value as replaceable profile data", () => {
    document.body.innerHTML = `
      <label for="country">Country</label>
      <div data-fabric-component="Select">
        <button aria-haspopup="true" aria-label="Country United States"><span class="fab-SelectToggle__content">United States</span></button>
        <select id="country" name="countryId.value" aria-hidden="true" readonly required>
          <option value="1" selected></option>
        </select>
      </div>
      <label for="available">Date Available</label>
      <input id="available" placeholder="dd mon yyyy">
    `;

    expect(scanDocument(document)).toMatchObject([
      {
        id: "country",
        label: "Country",
        value: "",
        metadata: { name: "countryId.value" },
      },
      {
        id: "available",
        label: "Date Available",
        metadata: { inputType: "text", placeholder: "dd mon yyyy" },
      },
    ]);
  });
});
