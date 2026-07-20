import type {
  AnswerDraftResponse,
  NormalizedField,
} from "@applyproof/shared-types";

import { findField, readCharacterLimit } from "./scanner";

type OpenField = HTMLTextAreaElement | HTMLInputElement | HTMLElement;
type Cleanup = () => void;
type MountOptions = { generateBlankFields?: boolean };

const hostAttribute = "data-applyproof-inline-assistant";
let cleanups: Cleanup[] = [];

const assistantStyles = `
  :host { display: block; height: 0; position: relative; z-index: 2147483646; }
  * { box-sizing: border-box; }
  .assistant {
    position: absolute;
    right: 0;
    top: 6px;
    width: min(340px, calc(100vw - 24px));
    color: #20362b;
    font: 13px/1.2 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    opacity: 0;
    pointer-events: none;
    transform: translateY(-3px);
    transition: opacity 140ms ease, transform 140ms ease;
  }
  :host([data-open="true"]) .assistant {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(0);
  }
  .toolbar {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 4px;
    border: 1px solid #c8d6ce;
    border-radius: 9px;
    background: rgba(255, 255, 255, .98);
    box-shadow: 0 8px 22px rgba(23, 67, 47, .15);
  }
  input {
    flex: 1 1 auto;
    min-width: 0;
    height: 32px;
    padding: 0 8px;
    border: 0;
    outline: none;
    color: #23372d;
    background: transparent;
    font: inherit;
  }
  input::placeholder { color: #829087; }
  button {
    display: grid;
    flex: 0 0 32px;
    place-items: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 0;
    border-radius: 7px;
    color: #fff;
    background: #176b4d;
    cursor: pointer;
    transition: background 120ms ease, transform 120ms ease;
  }
  button:hover:not(:disabled) { background: #115b40; }
  button:active:not(:disabled) { transform: scale(.96); }
  button:focus-visible { outline: 2px solid #8bc8aa; outline-offset: 2px; }
  button:disabled { cursor: wait; opacity: .65; }
  button svg { width: 16px; height: 16px; }
  button[data-loading="true"] svg { animation: spin 700ms linear infinite; }
  .status {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
  }
  .status.error {
    right: 0;
    top: calc(100% + 5px);
    width: min(340px, calc(100vw - 24px));
    height: auto;
    padding: 7px 9px;
    margin: 0;
    overflow: visible;
    clip: auto;
    white-space: normal;
    border: 1px solid #e7b7b3;
    border-radius: 7px;
    color: #8d302b;
    background: #fff8f7;
    box-shadow: 0 5px 14px rgba(92, 34, 30, .1);
    font-size: 11px;
    line-height: 1.35;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
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

function mountOne(
  document: Document,
  field: NormalizedField,
  options: MountOptions,
) {
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
    <div class="toolbar">
      <input
        type="text"
        maxlength="1000"
        aria-label="Extra instruction for regenerated answer"
        placeholder="Add an instruction (optional)"
      />
      <button type="button">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M20 11a8 8 0 1 0-2.34 5.66" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <path d="M20 5v6h-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>
    <p class="status" role="status"></p>
  `;
  shadow.append(style, panel);
  element.insertAdjacentElement("afterend", host);

  const prompt = panel.querySelector("input");
  const button = panel.querySelector("button");
  const status = panel.querySelector<HTMLElement>(".status");
  if (!prompt || !button || !status) return;

  const refreshLabel = () => {
    const label = readValue(element).trim()
      ? "Regenerate answer"
      : "Generate answer";
    button.setAttribute("aria-label", label);
    button.setAttribute("title", label);
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
    button.dataset.loading = "true";
    prompt.disabled = true;
    status.classList.remove("error");
    status.textContent = readValue(element).trim()
      ? "Regenerating from verified profile evidence…"
      : "Generating from verified profile evidence…";
    try {
      const liveLimit =
        readCharacterLimit(element, document) ?? field.maxLength;
      const currentField = liveLimit
        ? { ...field, maxLength: liveLimit }
        : field;
      const { response, sources } = await requestDraft(
        currentField,
        prompt.value,
      );
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
      delete button.dataset.loading;
      prompt.disabled = false;
      open();
    }
  });

  // The first Scan & Autofill should complete blank open questions, while
  // preserving any answer already present on the application page.
  if (options.generateBlankFields && !readValue(element).trim()) {
    window.setTimeout(() => button.click(), 0);
  }

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
  options: MountOptions = {},
) {
  disposeInlineAssistants();
  fields.forEach((field) => mountOne(document, field, options));
  return document.querySelectorAll(`[${hostAttribute}]`).length;
}
