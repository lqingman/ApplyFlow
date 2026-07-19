import type { FieldFill, FillResult } from "@applyproof/shared-types";

import { findField } from "./scanner";

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

function fillOne(document: Document, fill: FieldFill): FillResult {
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
      (radio) => radio.value.toLowerCase() === fill.value.toLowerCase(),
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
    if (element.value.trim())
      return { fieldId: fill.fieldId, status: "skipped_existing" };
    if (element instanceof HTMLSelectElement) {
      const option = Array.from(element.options).find(
        (item) =>
          item.value.toLowerCase() === fill.value.toLowerCase() ||
          item.text.toLowerCase() === fill.value.toLowerCase(),
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

export function fillDocument(document: Document, fills: FieldFill[]) {
  return fills.map((fill) => fillOne(document, fill));
}
