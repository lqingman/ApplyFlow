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
      '[data-applyproof-inline-assistant="project"]',
    );
    expect(host?.dataset.open).toBe("true");
    const prompt = host?.shadowRoot?.querySelector("input");
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
        type: "APPLYPROOF_GENERATE_INLINE_DRAFT",
        additionalPrompt: "Use the campus map project from my resume",
        field: expect.objectContaining({ id: "project", maxLength: 120 }),
      }),
    );
    expect(onInput).toHaveBeenCalledOnce();
    expect(button).toHaveAccessibleName("Regenerate answer");
    expect(host?.shadowRoot?.querySelector(".heading")).not.toBeInTheDocument();
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
        type: "APPLYPROOF_GENERATE_INLINE_DRAFT",
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
      '[data-applyproof-inline-assistant="project"]',
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

  it("refreshes a live word limit before regeneration", async () => {
    document.body.innerHTML = `
      <textarea id="project" aria-describedby="project-limit">Existing answer</textarea>
      <small id="project-limit">Maximum 60 words</small>
    `;
    const sendMessage = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        response: {
          fieldId: "project",
          draft: "A concise grounded answer.",
          evidenceIds: ["project-campus-map"],
          notes: [],
          followUpQuestion: null,
          characterCount: 26,
          fitsLimit: true,
        },
        sources: [],
      })
      .mockResolvedValueOnce(undefined);
    vi.stubGlobal("chrome", { runtime: { sendMessage } });

    mountInlineAssistants(document, [field]);
    document
      .querySelector<HTMLElement>(
        '[data-applyproof-inline-assistant="project"]',
      )
      ?.shadowRoot?.querySelector<HTMLButtonElement>("button")
      ?.click();

    await vi.waitFor(() =>
      expect(sendMessage).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          field: expect.objectContaining({ maxWords: 60 }),
        }),
      ),
    );
  });
});
