import { afterEach, describe, expect, it, vi } from "vitest";

import {
  disposeInlineAssistants,
  mountInlineAssistants,
} from "./inlineAssistant";

const field = {
  id: "project",
  label: "Describe a relevant project.",
  kind: "textarea" as const,
  required: true,
  value: "",
  options: [],
  maxLength: 700,
};

describe("inline writing assistant", () => {
  afterEach(() => {
    disposeInlineAssistants();
    document.body.innerHTML = "";
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("mounts beside an open question and writes a grounded draft into the page", async () => {
    document.body.innerHTML = `
      <label for="project">Describe a relevant project.</label>
      <textarea id="project" maxlength="120"></textarea>
    `;
    const response = {
      fieldId: "project",
      draft: "I built an accessible campus navigation app.",
      evidenceIds: ["project-campus-map"],
      notes: [],
      followUpQuestion: null,
      characterCount: 47,
      fitsLimit: true,
    };
    const sendMessage = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        response,
        sources: ["Demo resume · Projects"],
      })
      .mockResolvedValueOnce(undefined);
    vi.stubGlobal("chrome", { runtime: { sendMessage } });
    const pageField = document.querySelector<HTMLTextAreaElement>("#project");
    const onInput = vi.fn();
    pageField?.addEventListener("input", onInput);

    expect(mountInlineAssistants(document, [field])).toBe(1);
    pageField?.dispatchEvent(new MouseEvent("mouseenter"));
    const host = document.querySelector<HTMLElement>(
      '[data-applyflow-inline-assistant="project"]',
    );
    expect(host?.dataset.open).toBe("true");
    const prompt = host?.shadowRoot?.querySelector("textarea");
    const button = host?.shadowRoot?.querySelector("button");
    if (!prompt || !button)
      throw new Error("Assistant controls were not mounted");
    prompt.value = "Use the campus map project from my resume";
    button.click();

    await vi.waitFor(() =>
      expect(pageField).toHaveValue(
        "I built an accessible campus navigation app.",
      ),
    );
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "APPLYFLOW_GENERATE_INLINE_DRAFT",
        additionalPrompt: "Use the campus map project from my resume",
        field: expect.objectContaining({ id: "project", maxLength: 120 }),
      }),
    );
    expect(onInput).toHaveBeenCalledOnce();
    expect(button).toHaveAccessibleName("Regenerate answer");
    expect(host?.shadowRoot?.querySelector(".heading")).not.toBeInTheDocument();
  });

  it("portals assistants outside flex field wrappers without taking layout space", () => {
    document.body.innerHTML = `
      <div style="display: flex">
        <textarea id="project"></textarea>
      </div>
    `;

    mountInlineAssistants(document, [field]);

    const host = document.querySelector<HTMLElement>(
      '[data-applyflow-inline-assistant="project"]',
    );
    expect(host?.parentElement).toBe(document.body);
    expect(host).toHaveStyle({ left: "12px", top: "12px" });
  });

  it("never mounts a writing assistant on a reCAPTCHA response field", () => {
    document.body.innerHTML = `
      <textarea id="g-recaptcha-response" name="g-recaptcha-response"></textarea>
    `;
    const captchaField = {
      ...field,
      id: "g-recaptcha-response",
      label: "g recaptcha response",
      metadata: { name: "g-recaptcha-response" },
    };

    expect(mountInlineAssistants(document, [captchaField])).toBe(0);
    expect(
      document.querySelector("[data-applyflow-inline-assistant]"),
    ).not.toBeInTheDocument();
  });

  it("positions the portal outside and below the application textarea", () => {
    document.body.innerHTML = `<textarea id="project"></textarea>`;
    const pageField = document.querySelector<HTMLTextAreaElement>("#project");
    vi.spyOn(pageField!, "getBoundingClientRect").mockReturnValue({
      x: 100,
      y: 100,
      top: 100,
      right: 600,
      bottom: 220,
      left: 100,
      width: 500,
      height: 120,
      toJSON: () => ({}),
    });

    mountInlineAssistants(document, [field]);

    const host = document.querySelector<HTMLElement>(
      '[data-applyflow-inline-assistant="project"]',
    );
    expect(host).toHaveStyle({ left: "252px", top: "228px" });
  });

  it("automatically generates blank open questions after the first scan", async () => {
    document.body.innerHTML = `<textarea id="project"></textarea>`;
    const sendMessage = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        response: {
          fieldId: "project",
          draft: "Automatically generated grounded answer.",
          evidenceIds: ["project-campus-map"],
          notes: [],
          followUpQuestion: null,
          characterCount: 40,
          fitsLimit: true,
        },
        sources: ["Demo resume · Projects"],
      })
      .mockResolvedValueOnce(undefined);
    vi.stubGlobal("chrome", { runtime: { sendMessage } });

    mountInlineAssistants(document, [field], { generateBlankFields: true });

    await vi.waitFor(() =>
      expect(document.querySelector("#project")).toHaveValue(
        "Automatically generated grounded answer.",
      ),
    );
    expect(sendMessage).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        type: "APPLYFLOW_GENERATE_INLINE_DRAFT",
        field: expect.objectContaining({ id: "project" }),
      }),
    );
  });

  it("preserves the page answer when evidence is insufficient", async () => {
    document.body.innerHTML = `<textarea id="project">My existing answer</textarea>`;
    vi.stubGlobal("chrome", {
      runtime: {
        sendMessage: vi.fn().mockResolvedValue({
          ok: true,
          response: {
            fieldId: "project",
            draft: "",
            evidenceIds: [],
            notes: ["More evidence is needed."],
            followUpQuestion: "Which confirmed project should be used?",
            characterCount: 0,
            fitsLimit: true,
          },
          sources: [],
        }),
      },
    });

    mountInlineAssistants(document, [field]);
    const host = document.querySelector<HTMLElement>(
      '[data-applyflow-inline-assistant="project"]',
    );
    const button = host?.shadowRoot?.querySelector("button");
    button?.click();

    await vi.waitFor(() =>
      expect(host?.shadowRoot?.querySelector(".status")).toHaveTextContent(
        "Which confirmed project should be used?",
      ),
    );
    expect(document.querySelector("#project")).toHaveValue(
      "My existing answer",
    );
  });

  it("requires a pasted job description before generating a cover letter", async () => {
    document.body.innerHTML = `
      <label for="cover_letter">Cover letter</label>
      <textarea id="cover_letter" maxlength="200000"></textarea>
    `;
    const sendMessage = vi.fn().mockResolvedValue({
      ok: true,
      response: {
        fieldId: "cover_letter",
        draft: "Grounded cover letter",
        evidenceIds: ["resume-source-1"],
        notes: [],
        followUpQuestion: null,
        characterCount: 21,
        fitsLimit: true,
      },
      sources: ["Saved resume · PROJECTS"],
    });
    vi.stubGlobal("chrome", { runtime: { sendMessage } });
    const coverField = { ...field, id: "cover_letter", label: "Cover letter" };

    mountInlineAssistants(document, [coverField], {
      generateBlankFields: true,
      job: { company: "Example Labs", role: "Frontend Engineer" },
    });

    await new Promise((resolve) => window.setTimeout(resolve, 0));
    expect(sendMessage).not.toHaveBeenCalled();
    const host = document.querySelector<HTMLElement>(
      '[data-applyflow-inline-assistant="cover_letter"]',
    );
    expect(host?.shadowRoot?.querySelector(".status")).toHaveTextContent(
      "Job description not found",
    );
    const prompt = host?.shadowRoot?.querySelector("textarea");
    const button = host?.shadowRoot?.querySelector("button");
    if (!prompt || !button) throw new Error("Cover letter controls missing");
    expect(prompt).toHaveAttribute("maxlength", "12000");
    prompt.value = "Build accessible React products and automated tests.";
    button.click();

    await vi.waitFor(() => expect(sendMessage).toHaveBeenCalledOnce());
    expect(sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        manualJobDescription:
          "Build accessible React products and automated tests.",
        field: expect.objectContaining({ maxLength: 200000 }),
      }),
    );
  });

  it("never exposes raw internal validation errors", async () => {
    document.body.innerHTML = `<textarea id="project"></textarea>`;
    vi.stubGlobal("chrome", {
      runtime: {
        sendMessage: vi
          .fn()
          .mockRejectedValue(
            new Error('[{"code":"too_big","path":["field","maxCharacters"]}]'),
          ),
      },
    });
    mountInlineAssistants(document, [field]);
    const host = document.querySelector<HTMLElement>(
      '[data-applyflow-inline-assistant="project"]',
    );
    host?.shadowRoot?.querySelector("button")?.click();

    await vi.waitFor(() =>
      expect(host?.shadowRoot?.querySelector(".status")).toHaveTextContent(
        "ApplyFlow could not generate this answer",
      ),
    );
    expect(host?.shadowRoot?.querySelector(".status")).not.toHaveTextContent(
      "too_big",
    );
  });

  it("restores assistants after a SPA tab recreates the application form", async () => {
    document.body.innerHTML = `
      <main id="tab-content">
        <textarea id="project">My retained answer</textarea>
      </main>
    `;
    const sendMessage = vi.fn();
    vi.stubGlobal("chrome", { runtime: { sendMessage } });

    mountInlineAssistants(document, [field], { generateBlankFields: true });
    expect(
      document.querySelectorAll('[data-applyflow-inline-assistant="project"]'),
    ).toHaveLength(1);

    const tabContent = document.querySelector<HTMLElement>("#tab-content");
    if (!tabContent) throw new Error("Tab content missing");
    tabContent.innerHTML = `<section>Job overview</section>`;
    await vi.waitFor(() =>
      expect(
        document.querySelector('[data-applyflow-inline-assistant="project"]'),
      ).not.toBeInTheDocument(),
    );

    tabContent.innerHTML = `
      <textarea id="project">My retained answer</textarea>
    `;
    await vi.waitFor(() =>
      expect(
        document.querySelectorAll(
          '[data-applyflow-inline-assistant="project"]',
        ),
      ).toHaveLength(1),
    );
    expect(document.querySelector("#project")).toHaveValue(
      "My retained answer",
    );
    expect(sendMessage).not.toHaveBeenCalled();
  });
});
