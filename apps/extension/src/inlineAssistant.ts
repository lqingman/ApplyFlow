import type {
  AnswerDraftResponse,
  NormalizedField,
} from "@applyproof/shared-types";

import { findField } from "./scanner";

type OpenField = HTMLTextAreaElement | HTMLInputElement | HTMLElement;
type Cleanup = () => void;

const hostAttribute = "data-applyproof-inline-assistant";
let cleanups: Cleanup[] = [];

const assistantStyles = `
  :host { display: block; height: 0; position: relative; z-index: 2147483646; }
  * { box-sizing: border-box; }
  .assistant {
    position: absolute;
    right: 0;
    top: 7px;
    width: min(360px, calc(100vw - 28px));
    padding: 13px;
    border: 1px solid #acd0ba;
    border-radius: 13px;
    color: #20362b;
    background: #ffffff;
    box-shadow: 0 14px 38px rgba(23, 67, 47, 0.2);
    font: 13px/1.4 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    opacity: 0;
    pointer-events: none;
    transform: translateY(-5px);
    transition: opacity 140ms ease, transform 140ms ease;
  }
  :host([data-open="true"]) .assistant {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
  }
  .heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
  .brand { color: #176b4d; font-size: 11px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; }
  .state { color: #708078; font-size: 10px; }
  label { display: grid; gap: 5px; margin-top: 10px; color: #50645a; font-size: 11px; font-weight: 700; }
  textarea {
    width: 100%; min-height: 58px; padding: 8px 9px; resize: vertical;
    border: 1px solid #cfdbd4; border-radius: 8px; outline: none;
    color: #23372d; background: #f9fbfa; font: inherit; font-weight: 400;
  }
  textarea:focus { border-color: #3b8b68; box-shadow: 0 0 0 2px rgba(59, 139, 104, .13); }
  .hint { margin: 4px 0 0; color: #7a8981; font-size: 10px; }
  button {
    width: 100%; margin-top: 10px; padding: 9px 12px; border: 0; border-radius: 9px;
    color: #fff; background: #176b4d; font: inherit; font-weight: 800; cursor: pointer;
  }
  button:disabled { cursor: wait; opacity: .65; }
  .status { min-height: 0; margin: 8px 0 0; color: #62736a; font-size: 10px; }
  .status:empty { display: none; }
  .status.error { color: #9b3b35; }
`;

function readValue(field: OpenField) {
  if (field instanceof HTMLInputElement || field instanceof HTMLTextAreaElement)
    return field.value;
  return field.textContent ?? "";
}

function writeValue(field: OpenField, value: string) {
  if (
    field instanceof HTMLInputElement ||
    field instanceof HTMLTextAreaElement
  ) {
    const prototype =
      field instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
    setter?.call(field, value);
    if (!setter) field.value = value;
  } else {
    field.textContent = value;
  }
  field.dispatchEvent(new Event("input", { bubbles: true }));
  field.dispatchEvent(new Event("change", { bubbles: true }));
}

function isOpenQuestion(
  field: NormalizedField,
  element: Element,
): element is OpenField {
  return (
    field.kind === "textarea" &&
    (element instanceof HTMLTextAreaElement ||
      element instanceof HTMLInputElement ||
      element instanceof HTMLElement)
  );
}

function notifyDraftFilled(fieldId: string, value: string) {
  if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) return;
  void chrome.runtime
    .sendMessage({ type: "APPLYPROOF_INLINE_DRAFT_FILLED", fieldId, value })
    .catch(() => undefined);
}

async function requestDraft(
  field: NormalizedField,
  additionalPrompt: string,
): Promise<{ response: AnswerDraftResponse; sources: string[] }> {
  if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage)
    throw new Error("Open the ApplyProof side panel and scan this page again.");
  const result: unknown = await chrome.runtime.sendMessage({
    type: "APPLYPROOF_GENERATE_INLINE_DRAFT",
    field,
    additionalPrompt,
  });
  const payload = result as {
    ok?: boolean;
    response?: AnswerDraftResponse;
    sources?: string[];
    error?: string;
  };
  if (!payload.ok || !payload.response)
    throw new Error(
      payload.error ?? "ApplyProof could not generate this answer.",
    );
  return { response: payload.response, sources: payload.sources ?? [] };
}

function mountOne(document: Document, field: NormalizedField) {
  const element = findField(document, field.id);
  if (!element || !isOpenQuestion(field, element)) return;

  const host = document.createElement("span");
  host.setAttribute(hostAttribute, field.id);
  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = assistantStyles;
  const panel = document.createElement("section");
  panel.className = "assistant";
  panel.setAttribute(
    "aria-label",
    `ApplyProof writing assistant for ${field.label}`,
  );
  panel.innerHTML = `
    <div class="heading">
      <span class="brand">ApplyProof</span>
      <span class="state">Grounded in your profile</span>
    </div>
    <label>
      Extra instruction (optional)
      <textarea maxlength="1000" placeholder="e.g. Use the campus map project from my resume"></textarea>
    </label>
    <p class="hint">Tell ApplyProof what experience, emphasis, or tone to use.</p>
    <button type="button"></button>
    <p class="status" role="status"></p>
  `;
  shadow.append(style, panel);
  element.insertAdjacentElement("afterend", host);

  const prompt = panel.querySelector("textarea");
  const button = panel.querySelector("button");
  const status = panel.querySelector<HTMLElement>(".status");
  if (!prompt || !button || !status) return;

  const refreshLabel = () => {
    button.textContent = readValue(element).trim()
      ? "Regenerate answer"
      : "Generate answer";
  };
  refreshLabel();

  let closeTimer: number | undefined;
  const open = () => {
    if (closeTimer) window.clearTimeout(closeTimer);
    host.dataset.open = "true";
    refreshLabel();
  };
  const closeLater = () => {
    if (closeTimer) window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => {
      const shadowFocused = shadow.activeElement !== null;
      if (!element.matches(":hover, :focus") && !shadowFocused)
        delete host.dataset.open;
    }, 220);
  };

  element.addEventListener("mouseenter", open);
  element.addEventListener("focus", open);
  element.addEventListener("mouseleave", closeLater);
  element.addEventListener("blur", closeLater);
  panel.addEventListener("mouseenter", open);
  panel.addEventListener("mouseleave", closeLater);
  panel.addEventListener("focusin", open);
  panel.addEventListener("focusout", closeLater);

  button.addEventListener("click", async () => {
    button.disabled = true;
    prompt.disabled = true;
    status.classList.remove("error");
    status.textContent = readValue(element).trim()
      ? "Regenerating from verified profile evidence…"
      : "Generating from verified profile evidence…";
    try {
      const { response, sources } = await requestDraft(field, prompt.value);
      if (!response.draft) {
        status.classList.add("error");
        status.textContent =
          response.followUpQuestion ??
          response.notes[0] ??
          "There is not enough verified profile evidence for this answer.";
        return;
      }
      writeValue(element, response.draft);
      refreshLabel();
      status.textContent = sources.length
        ? `Answer added · Evidence: ${[...new Set(sources)].join(", ")}`
        : "Answer added. Review it before submitting.";
      notifyDraftFilled(field.id, response.draft);
    } catch (error) {
      status.classList.add("error");
      status.textContent =
        error instanceof Error
          ? error.message
          : "ApplyProof could not generate this answer.";
    } finally {
      button.disabled = false;
      prompt.disabled = false;
      open();
    }
  });

  cleanups.push(() => {
    if (closeTimer) window.clearTimeout(closeTimer);
    element.removeEventListener("mouseenter", open);
    element.removeEventListener("focus", open);
    element.removeEventListener("mouseleave", closeLater);
    element.removeEventListener("blur", closeLater);
    host.remove();
  });
}

export function disposeInlineAssistants() {
  cleanups.forEach((cleanup) => cleanup());
  cleanups = [];
}

export function mountInlineAssistants(
  document: Document,
  fields: NormalizedField[],
) {
  disposeInlineAssistants();
  fields.forEach((field) => mountOne(document, field));
  return document.querySelectorAll(`[${hostAttribute}]`).length;
}
