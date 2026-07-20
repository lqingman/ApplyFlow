import { beforeEach, describe, expect, it } from "vitest";
import { mayaProfile } from "@applyproof/sample-data";

import { planAutofill } from "./autofill";
import { fillDocument } from "./pageFill";
import { scanDocument } from "./scanner";

describe("ordinary online HTML form compatibility", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("classifies and fills fields with opaque IDs from semantic HTML metadata", () => {
    document.body.innerHTML = `
      <form>
        <label>Legal given name <input id="q_101" autocomplete="given-name"></label>
        <label>Legal surname <input id="q_102" autocomplete="family-name"></label>
        <label>Contact <input id="q_103" name="candidate_email" type="email"></label>
        <label>Mobile <input id="q_104" name="mobile_number" type="tel"></label>
        <div class="form-field"><span>Current city and province</span><input id="q_105" name="applicant_location"></div>
        <label>LinkedIn profile <input id="q_106" name="social_link"></label>
        <label>University or institution <input id="q_107" name="education[school]"></label>
        <label>Qualification <input id="q_108" name="education[degree]"></label>
        <div class="question"><label>When did your university education start?</label><input id="q_109" type="date"></div>
        <label>Expected graduation date <input id="q_110" type="date"></label>
        <label>Are you legally eligible to work in Canada?
          <select id="q_111"><option value="">Choose</option><option>Yes</option><option>No</option></select>
        </label>
        <label>Will you require employment sponsorship in Canada?
          <select id="q_112"><option value="">Choose</option><option>Yes</option><option>No</option></select>
        </label>
        <button type="submit">Submit application</button>
      </form>
    `;

    const fields = scanDocument(document);
    const plan = planAutofill(mayaProfile, fields);
    const results = fillDocument(document, plan.fills);

    expect(results).toHaveLength(12);
    expect(results.every((result) => result.status === "filled")).toBe(true);
    expect(document.getElementById("q_101")).toHaveValue("Maya");
    expect(document.getElementById("q_102")).toHaveValue("Chen");
    expect(document.getElementById("q_103")).toHaveValue(
      "maya.chen@example.com",
    );
    expect(document.getElementById("q_105")).toHaveValue("Vancouver, BC");
    expect(document.getElementById("q_107")).toHaveValue(
      "University of British Columbia",
    );
    expect(document.getElementById("q_111")).toHaveValue("Yes");
    expect(document.getElementById("q_112")).toHaveValue("No");
    expect(document.querySelector("button")).toHaveTextContent(
      "Submit application",
    );
  });

  it("discovers fields added by a client-rendered next step on a later scan", () => {
    document.body.innerHTML = `
      <div id="step"><label>Email <input name="contact_email" type="email"></label></div>
    `;

    expect(scanDocument(document).map((field) => field.id)).toEqual([
      "contact_email",
    ]);

    document.getElementById("step")!.innerHTML = `
      <label>Phone number <input name="candidate_phone" type="tel"></label>
      <label>Portfolio website <input name="portfolio_url" type="url"></label>
    `;

    expect(scanDocument(document).map((field) => field.id)).toEqual([
      "candidate_phone",
      "portfolio_url",
    ]);
  });
});
