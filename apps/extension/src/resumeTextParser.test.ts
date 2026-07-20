import { describe, expect, it } from "vitest";

import { parseResumeText } from "./resumeTextParser";

describe("resume text parser", () => {
  it("extracts editable profile facts and evidence from resume text", () => {
    const result = parseResumeText(`
      Maya Chen
      New-grad Software Engineer
      Vancouver, BC
      maya.chen@example.com | +1 604 555 0142 | github.com/mayachen-demo

      EDUCATION
      University of British Columbia
      Bachelor of Science in Computer Science — May 2026

      PROJECTS
      Built an accessible campus navigation app with React, TypeScript, and FastAPI.
      Shipped tested product improvements during a software engineering co-op.
    `);

    expect(result).toMatchObject({
      firstName: "Maya",
      lastName: "Chen",
      headline: "New-grad Software Engineer",
      email: "maya.chen@example.com",
      phone: "+1 604 555 0142",
      location: "Vancouver, BC",
      portfolio: "https://github.com/mayachen-demo",
      school: "University of British Columbia",
      degree: "Bachelor of Science in Computer Science — May 2026",
      graduationDate: "2026-05-01",
    });
    expect(result.evidence).toEqual([
      "Built an accessible campus navigation app with React, TypeScript, and FastAPI.",
      "Shipped tested product improvements during a software engineering co-op.",
    ]);
  });

  it("rejects files whose extraction produced no readable text", () => {
    expect(() => parseResumeText(" \n \n ")).toThrow("No readable text");
  });

  it("does not infer explicit application choices", () => {
    const result = parseResumeText(`
      Jordan Lee
      Software Developer
      jordan@example.com
      Authorized to work in Canada
      Gender: non-binary
    `);

    expect(result).not.toHaveProperty("workAuthorization");
    expect(result).not.toHaveProperty("genderIdentity");
    expect(result).not.toHaveProperty("relocation");
  });
});
