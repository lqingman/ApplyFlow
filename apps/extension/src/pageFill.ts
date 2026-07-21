import type { FieldFill, FillResult } from "@applyproof/shared-types";

import { findField } from "./scanner";

function optionMatches(option: string, requested: string) {
  const candidate = option.trim().toLowerCase();
  const value = requested.trim().toLowerCase();
  if (candidate === value) return true;
  if (value === "yes") return /^yes\b/.test(candidate);
  if (value === "no") return /^no\b/.test(candidate);
  if (value === "prefer not to say")
    return /prefer not|decline|do not wish|don't wish/.test(candidate);
  if (value === "woman") return /^(?:woman|female)$/.test(candidate);
  if (value === "man") return /^(?:man|male)$/.test(candidate);
  return false;
}

function setNativeValue(
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  value: string,
) {
  const prototype =
    element instanceof HTMLInputElement
      ? HTMLInputElement.prototype
      : element instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLSelectElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(prototype, "value")?.set;
  setter?.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

function isFabricSelect(element: HTMLSelectElement) {
  return (
    element.matches('[aria-hidden="true"][readonly]') &&
    Boolean(element.closest('[data-fabric-component="Select"]'))
  );
}

async function fillFabricSelect(
  document: Document,
  element: HTMLSelectElement,
  fill: FieldFill,
): Promise<FillResult> {
  const container = element.closest<HTMLElement>(
    '[data-fabric-component="Select"]',
  );
  const toggle = container?.querySelector<HTMLButtonElement>(
    'button[aria-haspopup="true"]',
  );
  if (!toggle) return { fieldId: fill.fieldId, status: "unsupported_option" };
  const selectedLabel =
    toggle.querySelector<HTMLElement>(".fab-SelectToggle__content")
      ?.textContent ?? "";
  if (optionMatches(selectedLabel, fill.value)) {
    return { fieldId: fill.fieldId, status: "skipped_existing" };
  }

  toggle.click();
  await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
  const target = Array.from(
    document.querySelectorAll<HTMLElement>(
      '[role="menuitem"], [role="option"]',
    ),
  ).find((option) => optionMatches(option.textContent ?? "", fill.value));
  if (!target) {
    if (toggle.getAttribute("aria-expanded") === "true") toggle.click();
    return { fieldId: fill.fieldId, status: "unsupported_option" };
  }
  target.click();
  await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
  return { fieldId: fill.fieldId, status: "filled" };
}

async function fillOne(
  document: Document,
  fill: FieldFill,
): Promise<FillResult> {
  const element = findField(document, fill.fieldId);
  if (!(element instanceof HTMLElement))
    return { fieldId: fill.fieldId, status: "not_found" };

  if (element instanceof HTMLInputElement && element.type === "radio") {
    const group = Array.from(
      document.querySelectorAll<HTMLInputElement>('input[type="radio"][name]'),
    ).filter((radio) => radio.name === element.name);
    if (group.some((radio) => radio.checked))
      return { fieldId: fill.fieldId, status: "skipped_existing" };
    const target = group.find(
      (radio) =>
        optionMatches(radio.value, fill.value) ||
        optionMatches(
          radio.labels?.[0]?.textContent ??
            radio.parentElement?.textContent ??
            "",
          fill.value,
        ),
    );
    if (!target) return { fieldId: fill.fieldId, status: "unsupported_option" };
    target.checked = true;
    target.dispatchEvent(new Event("input", { bubbles: true }));
    target.dispatchEvent(new Event("change", { bubbles: true }));
    return { fieldId: fill.fieldId, status: "filled" };
  }

  if (element instanceof HTMLInputElement && element.type === "checkbox") {
    if (element.checked)
      return { fieldId: fill.fieldId, status: "skipped_existing" };
    element.checked = true;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    return { fieldId: fill.fieldId, status: "filled" };
  }

  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
  ) {
    if (element instanceof HTMLSelectElement && isFabricSelect(element)) {
      return fillFabricSelect(document, element, fill);
    }
    if (element.value.trim())
      return { fieldId: fill.fieldId, status: "skipped_existing" };
    if (element instanceof HTMLSelectElement) {
      const option = Array.from(element.options).find(
        (item) =>
          optionMatches(item.value, fill.value) ||
          optionMatches(item.text, fill.value),
      );
      if (!option)
        return { fieldId: fill.fieldId, status: "unsupported_option" };
      setNativeValue(element, option.value);
    } else {
      setNativeValue(element, fill.value);
    }
    return { fieldId: fill.fieldId, status: "filled" };
  }

  if (element.textContent?.trim())
    return { fieldId: fill.fieldId, status: "skipped_existing" };
  element.textContent = fill.value;
  element.dispatchEvent(new Event("input", { bubbles: true }));
  return { fieldId: fill.fieldId, status: "filled" };
}

export async function fillDocument(document: Document, fills: FieldFill[]) {
  const orderedFills = fills.map((fill, index) => ({ fill, index }));
  orderedFills.sort((left, right) => {
    const leftElement = findField(document, left.fill.fieldId);
    const rightElement = findField(document, right.fill.fieldId);
    const isCountry = (element: Element | null) =>
      /country/i.test(
        `${element?.id ?? ""} ${element?.getAttribute("name") ?? ""}`,
      );
    return Number(isCountry(rightElement)) - Number(isCountry(leftElement));
  });
  const results: FillResult[] = Array.from({ length: fills.length });
  for (const { fill, index } of orderedFills) {
    results[index] = await fillOne(document, fill);
  }
  return results;
}
