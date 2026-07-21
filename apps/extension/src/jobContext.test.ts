import { beforeEach, describe, expect, it } from "vitest";

import { extractJobContext } from "./jobContext";

describe("job context extraction", () => {
  beforeEach(() => {
    document.title = "";
    document.head.innerHTML = "";
    document.body.innerHTML = "";
  });

  it("prefers bounded JobPosting structured data", () => {
    document.head.innerHTML = `
      <script type="application/ld+json">
        {
          "@type": "JobPosting",
          "title": "Platform Engineer",
          "hiringOrganization": { "name": "Example Labs" },
          "description": "<p>Build accessible TypeScript products.</p>"
        }
      </script>
    `;

    expect(extractJobContext(document)).toEqual({
      company: "Example Labs",
      role: "Platform Engineer",
      description: "Build accessible TypeScript products.",
    });
  });

  it("uses explicit visible job containers without collecting the whole form", () => {
    document.body.innerHTML = `
      <header><img alt="Acme Software"></header>
      <main>
        <h1>Frontend Developer</h1>
        <section class="job-description">Work with React and automated testing.</section>
        <label>Government ID <input value="private-value"></label>
      </main>
    `;

    const context = extractJobContext(document);
    expect(context).toEqual({
      company: "Acme Software",
      role: "Frontend Developer",
      description: "Work with React and automated testing.",
    });
    expect(JSON.stringify(context)).not.toContain("private-value");
  });

  it("extracts Greenhouse company and same-page job description", () => {
    document.title = "Job Application for Software Engineer at Fleetworthy";
    document.body.innerHTML = `
      <main class="job-post">
        <div class="job__title"><h1>Software Engineer</h1></div>
        <div class="job__description">
          <p>Build backend microservices using Python and TypeScript.</p>
          <p>Develop REST and GraphQL APIs and automated tests.</p>
        </div>
        <section><h2>Apply for this job</h2><textarea>private answer</textarea></section>
      </main>
    `;

    const context = extractJobContext(document);
    expect(context).toEqual({
      company: "Fleetworthy",
      role: "Software Engineer",
      description:
        "Build backend microservices using Python and TypeScript. Develop REST and GraphQL APIs and automated tests.",
    });
    expect(JSON.stringify(context)).not.toContain("private answer");
  });

  it("extracts the company from the local demo title format", () => {
    document.title = "Junior Software Engineer — Northstar Labs";
    document.body.innerHTML = `<main><h1>Junior Software Engineer</h1></main>`;

    expect(extractJobContext(document)).toEqual({
      company: "Northstar Labs",
      role: "Junior Software Engineer",
    });
  });
});
