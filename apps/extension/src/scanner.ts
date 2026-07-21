import type { FieldKind, NormalizedField } from "@applyproof/shared-types";

type ScannableElement =
  HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLElement;

const nativeSelector = "input, textarea, select";
const customSelector =
  '[contenteditable="true"], [role="textbox"], [role="combobox"], [role="listbox"], [role="radio"], [role="checkbox"]';

export const sensitiveFieldPatterns = [
  /password|passcode|pin\b/i,
  /social security|social insurance|\bssn\b|\bsin\b/i,
  /passport|driver.?s licen[cs]e|government id/i,
  /credit card|debit card|card number|\bcvv\b|\bcvc\b/i,
  /bank account|routing number|transit number|swift|\biban\b/i,
  /security question|mother.?s maiden|secret answer/i,
  /captcha|g-recaptcha-response|hcaptcha|cf-turnstile/i,
];

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .replace(/\s+/g, " ")
    .replace(/\s*\*\s*$/, "")
    .trim();
}

function textFromLabel(label: HTMLElement) {
  const clone = label.cloneNode(true) as HTMLElement;
  clone
    .querySelectorAll(
      "input, textarea, select, option, small, [aria-hidden='true']",
    )
    .forEach((node) => node.remove());
  return normalizeText(clone.textContent);
}

function ariaLabelledBy(element: Element, document: Document) {
  const ids = element.getAttribute("aria-labelledby")?.split(/\s+/) ?? [];
  return normalizeText(
    ids
      .map((id) => document.getElementById(id)?.textContent)
      .filter(Boolean)
      .join(" "),
  );
}

function nearbyText(element: Element) {
  const previous = element.previousElementSibling;
  if (previous && !previous.matches("input, textarea, select, button")) {
    const text = normalizeText(previous.textContent);
    if (text && text.length <= 160) return text;
  }

  const legend = element.closest("fieldset")?.querySelector(":scope > legend");
  return normalizeText(legend?.textContent);
}

function questionText(element: Element, label: string) {
  const container = element.closest(
    "fieldset, [role='group'], [role='radiogroup'], [data-question], .question, .field, .form-field",
  );
  if (!container) return undefined;
  const clone = container.cloneNode(true) as HTMLElement;
  clone
    .querySelectorAll(
      "input, textarea, select, option, button, script, style, [aria-hidden='true']",
    )
    .forEach((node) => node.remove());
  const text = normalizeText(clone.textContent);
  if (!text || text === label) return undefined;
  return text.slice(0, 500);
}

function radioGroupLabel(element: Element, document: Document) {
  let container = element.parentElement;
  while (container) {
    if (container.matches("fieldset, [role='group'], [role='radiogroup']")) {
      const legend = normalizeText(
        container.querySelector(":scope > legend")?.textContent,
      );
      const aria =
        ariaLabelledBy(container, document) ||
        normalizeText(container.getAttribute("aria-label"));
      const candidate = legend || aria;
      if (candidate && !/^(?:yes|no|select one)$/i.test(candidate))
        return candidate;
    }
    container = container.parentElement;
  }
  return "";
}

export function extractFieldLabel(element: Element, document: Document) {
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
  ) {
    const associated = Array.from(element.labels ?? [])
      .map((label) => textFromLabel(label))
      .find(Boolean);
    if (associated) return associated;
  }

  const parentLabel = element.closest("label");
  if (parentLabel) {
    const label = textFromLabel(parentLabel);
    if (label) return label;
  }

  const aria =
    ariaLabelledBy(element, document) ||
    normalizeText(element.getAttribute("aria-label"));
  if (aria) return aria;

  const nearby = nearbyText(element);
  if (nearby) return nearby;

  return normalizeText(element.getAttribute("placeholder"));
}

function fieldKind(element: ScannableElement): FieldKind | null {
  if (element instanceof HTMLTextAreaElement) return "textarea";
  if (element instanceof HTMLSelectElement) return "select";
  if (element instanceof HTMLInputElement) {
    const type = element.type.toLowerCase();
    if (
      ["text", "email", "tel", "url", "date", "radio", "checkbox"].includes(
        type,
      )
    ) {
      return type as FieldKind;
    }
    return null;
  }

  const role = element.getAttribute("role");
  if (role === "radio" || role === "checkbox") return role;
  if (role === "combobox" || role === "listbox") return "select";
  if (role === "textbox" || element.getAttribute("contenteditable") === "true")
    return "text";
  return null;
}

function fallbackLabel(element: Element) {
  return normalizeText(element.getAttribute("name") || element.id).replace(
    /[-_]+/g,
    " ",
  );
}

function isSensitive(element: Element, label: string) {
  if (element instanceof HTMLInputElement && element.type === "password")
    return true;
  const fingerprint = [
    label,
    questionText(element, label),
    element.id,
    element.getAttribute("name"),
    element.getAttribute("autocomplete"),
    element.getAttribute("placeholder"),
  ]
    .filter(Boolean)
    .join(" ");
  return sensitiveFieldPatterns.some((pattern) => pattern.test(fingerprint));
}

function isUsable(element: ScannableElement) {
  if (
    element instanceof HTMLInputElement &&
    ["hidden", "submit", "button", "reset", "file", "image"].includes(
      element.type,
    )
  ) {
    return false;
  }
  const isFabricBackingSelect =
    element instanceof HTMLSelectElement &&
    element.matches('[aria-hidden="true"][readonly]') &&
    Boolean(element.closest('[data-fabric-component="Select"]'));
  return (
    !element.hasAttribute("disabled") &&
    (element.getAttribute("aria-hidden") !== "true" || isFabricBackingSelect)
  );
}

function identifier(element: Element, index: number) {
  const existing = element.id || element.getAttribute("name");
  if (existing) return existing;
  const generated = `applyproof-field-${index + 1}`;
  element.setAttribute("data-applyproof-field-id", generated);
  return generated;
}

function optionLabel(input: HTMLInputElement, document: Document) {
  return extractFieldLabel(input, document) || input.value;
}

function customOptions(element: HTMLElement) {
  return Array.from(element.querySelectorAll('[role="option"]'))
    .map((option) => normalizeText(option.textContent))
    .filter(Boolean);
}

function normalizedValue(element: ScannableElement) {
  if (element instanceof HTMLInputElement && element.type === "checkbox") {
    return element.checked ? element.value : "";
  }
  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
  ) {
    if (
      element instanceof HTMLSelectElement &&
      element.matches('[aria-hidden="true"][readonly]') &&
      element.closest('[data-fabric-component="Select"]')
    ) {
      return "";
    }
    return element.value;
  }
  return normalizeText(
    element.getAttribute("aria-valuetext") || element.textContent,
  );
}

function fieldMetadata(element: ScannableElement, label: string) {
  const name = normalizeText(element.getAttribute("name")) || undefined;
  const autocomplete =
    normalizeText(element.getAttribute("autocomplete")) || undefined;
  const inputType =
    element instanceof HTMLInputElement
      ? element.type.toLowerCase()
      : undefined;
  const placeholder =
    normalizeText(element.getAttribute("placeholder")) || undefined;
  const context = questionText(element, label);
  if (!name && !autocomplete && !inputType && !placeholder && !context)
    return undefined;
  return {
    ...(name ? { name } : {}),
    ...(autocomplete ? { autocomplete } : {}),
    ...(inputType ? { inputType } : {}),
    ...(placeholder ? { placeholder } : {}),
    ...(context ? { questionText: context } : {}),
  };
}

function characterLimitFromText(text: string) {
  const match = text.match(
    /(?:maximum|max|limit(?:ed)?(?:\s+to)?|up to)\s*:?\s*(\d{1,5})\s*(?:characters?|chars?)|(\d{1,5})\s*(?:characters?|chars?)\s*(?:maximum|max|limit)/i,
  );
  const value = Number(match?.[1] ?? match?.[2]);
  return Number.isInteger(value) && value > 0 ? value : undefined;
}

function limitContext(element: Element, document: Document) {
  const describedBy = (element.getAttribute("aria-describedby") ?? "")
    .split(/\s+/)
    .map((id) => document.getElementById(id)?.textContent ?? "")
    .join(" ");
  return [
    describedBy,
    element.nextElementSibling?.textContent ?? "",
    element.parentElement?.textContent ?? "",
  ].join(" ");
}

export function readCharacterLimit(
  element: Element,
  document: Document = element.ownerDocument,
) {
  const nativeLimit =
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement
      ? element.maxLength
      : Number(element.getAttribute("maxlength"));
  if (Number.isInteger(nativeLimit) && nativeLimit > 0) return nativeLimit;

  for (const attribute of [
    "data-maxlength",
    "data-max-length",
    "data-character-limit",
    "aria-maxlength",
  ]) {
    const value = Number(element.getAttribute(attribute));
    if (Number.isInteger(value) && value > 0) return value;
  }

  return characterLimitFromText(limitContext(element, document));
}

export function scanDocument(document: Document): NormalizedField[] {
  const candidates = Array.from(
    document.querySelectorAll<ScannableElement>(
      `${nativeSelector}, ${customSelector}`,
    ),
  );
  const fields: NormalizedField[] = [];
  const radioNames = new Set<string>();

  candidates.forEach((element, index) => {
    if (
      !isUsable(element) ||
      (!element.matches(nativeSelector) && element.closest(nativeSelector))
    )
      return;

    const kind = fieldKind(element);
    if (!kind) return;

    let label = extractFieldLabel(element, document) || fallbackLabel(element);
    if (!label || isSensitive(element, label)) return;

    if (
      element instanceof HTMLInputElement &&
      kind === "radio" &&
      element.name
    ) {
      if (radioNames.has(element.name)) return;
      radioNames.add(element.name);
      const group = Array.from(
        document.querySelectorAll<HTMLInputElement>(
          'input[type="radio"][name]',
        ),
      ).filter((radio) => radio.name === element.name);
      label = radioGroupLabel(element, document) || label;
      const metadata = fieldMetadata(element, label);
      fields.push({
        id: element.name,
        label,
        kind,
        required: group.some((radio) => radio.required),
        value: group.find((radio) => radio.checked)?.value ?? "",
        options: group.map((radio) => optionLabel(radio, document)),
        ...(metadata ? { metadata } : {}),
      });
      return;
    }

    const options =
      element instanceof HTMLSelectElement
        ? Array.from(element.options)
            .filter((option) => !option.disabled && Boolean(option.value))
            .map((option) => normalizeText(option.textContent))
        : element instanceof HTMLElement
          ? customOptions(element)
          : [];

    const metadata = fieldMetadata(element, label);
    const field: NormalizedField = {
      id: identifier(element, index),
      label,
      kind,
      required:
        element.hasAttribute("required") ||
        element.getAttribute("aria-required") === "true",
      value: normalizedValue(element),
      options,
      ...(metadata ? { metadata } : {}),
    };

    const maxLength = readCharacterLimit(element, document);
    if (maxLength) field.maxLength = maxLength;

    fields.push(field);
  });

  return fields;
}

export function countBlockedFields(document: Document) {
  return Array.from(
    document.querySelectorAll<ScannableElement>(
      `${nativeSelector}, ${customSelector}`,
    ),
  ).filter((element) => {
    if (!isUsable(element)) return false;
    const kind = fieldKind(element);
    if (
      !kind &&
      !(element instanceof HTMLInputElement && element.type === "password")
    )
      return false;
    const label =
      extractFieldLabel(element, document) || fallbackLabel(element);
    return isSensitive(element, label);
  }).length;
}

export function findField(document: Document, fieldId: string) {
  return (
    document.getElementById(fieldId) ||
    Array.from(
      document.querySelectorAll<HTMLElement>(
        "[name], [data-applyproof-field-id]",
      ),
    ).find(
      (element) =>
        element.getAttribute("name") === fieldId ||
        element.getAttribute("data-applyproof-field-id") === fieldId,
    ) ||
    null
  );
}
