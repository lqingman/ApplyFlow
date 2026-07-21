import type { FieldFill, FillResult } from "@applyproof/shared-types";

import {
  addressChoiceMatches,
  type AddressChoiceKind,
} from "./addressNormalization";
import { findField } from "./scanner";

function optionMatches(
  option: string,
  requested: string,
  addressKind: AddressChoiceKind = "generic",
) {
  const candidate = option.trim().toLowerCase();
  const value = requested.trim().toLowerCase();
  if (candidate === value) return true;
  if (
    addressKind !== "generic" &&
    addressChoiceMatches(option, requested, addressKind)
  )
    return true;
  if (value === "yes") return /^yes\b/.test(candidate);
  if (value === "no") return /^no\b/.test(candidate);
  if (value === "prefer not to say")
    return /prefer not|decline|do not wish|don't wish/.test(candidate);
  if (value === "not a veteran")
    return /\bnot\b.*\b(?:protected\s+)?veteran\b/.test(candidate);
  if (value === "veteran")
    return (
      /\bveteran\b/.test(candidate) &&
      !/\bnot\b|prefer not|decline|do not wish|don't wish/.test(candidate)
    );
  if (value === "woman") return /^(?:woman|female)$/.test(candidate);
  if (value === "man") return /^(?:man|male)$/.test(candidate);
  return false;
}

function addressChoiceKind(element: Element): AddressChoiceKind {
  const fingerprint = `${element.id} ${element.getAttribute("name") ?? ""}`;
  if (/country/i.test(fingerprint)) return "country";
  if (/state|province|region/i.test(fingerprint)) return "region";
  return "generic";
}

function waitForNextRender(document: Document, milliseconds = 25) {
  return new Promise<void>((resolve) =>
    (document.defaultView ?? window).setTimeout(resolve, milliseconds),
  );
}

async function findRenderedOption(
  document: Document,
  requested: string,
  addressKind: AddressChoiceKind,
) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const target = Array.from(
      document.querySelectorAll<HTMLElement>(
        '[role="menuitem"], [role="option"]',
      ),
    ).find((option) =>
      optionMatches(option.textContent ?? "", requested, addressKind),
    );
    if (target) return target;
    await waitForNextRender(document);
  }
  return undefined;
}

function activateWithMouse(document: Document, element: HTMLElement) {
  const MouseEventConstructor = document.defaultView?.MouseEvent ?? MouseEvent;
  element.dispatchEvent(
    new MouseEventConstructor("mousedown", { bubbles: true, cancelable: true }),
  );
  element.dispatchEvent(
    new MouseEventConstructor("mouseup", { bubbles: true, cancelable: true }),
  );
  element.click();
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
  const choiceKind = addressChoiceKind(element);
  const selectedLabel =
    toggle.querySelector<HTMLElement>(".fab-SelectToggle__content")
      ?.textContent ?? "";
  if (optionMatches(selectedLabel, fill.value, choiceKind)) {
    return { fieldId: fill.fieldId, status: "skipped_existing" };
  }

  if (toggle.getAttribute("aria-expanded") !== "true") toggle.click();
  const target = await findRenderedOption(document, fill.value, choiceKind);
  if (!target) {
    if (toggle.getAttribute("aria-expanded") === "true") toggle.click();
    return { fieldId: fill.fieldId, status: "unsupported_option" };
  }
  target.click();
  let selected = false;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const currentLabel =
      toggle.querySelector<HTMLElement>(".fab-SelectToggle__content")
        ?.textContent ?? "";
    if (optionMatches(currentLabel, fill.value, choiceKind)) {
      selected = true;
      break;
    }
    await waitForNextRender(document);
  }
  if (!selected) return { fieldId: fill.fieldId, status: "unsupported_option" };
  if (choiceKind === "country") await waitForNextRender(document, 50);
  return { fieldId: fill.fieldId, status: "filled" };
}

function isAriaCombobox(element: HTMLInputElement) {
  return (
    element.getAttribute("role") === "combobox" &&
    element.getAttribute("aria-autocomplete") === "list"
  );
}

function ariaComboboxSelection(element: HTMLInputElement) {
  return (
    element
      .closest<HTMLElement>(".select__control")
      ?.querySelector<HTMLElement>(".select__single-value")?.textContent ??
    element.value
  );
}

async function fillAriaCombobox(
  document: Document,
  element: HTMLInputElement,
  fill: FieldFill,
): Promise<FillResult> {
  if (optionMatches(ariaComboboxSelection(element), fill.value))
    return { fieldId: fill.fieldId, status: "skipped_existing" };

  const control = element.closest<HTMLElement>(".select__control");
  const toggle = control?.querySelector<HTMLButtonElement>(
    'button[aria-label="Toggle flyout"]',
  );
  if (element.getAttribute("aria-expanded") !== "true") {
    activateWithMouse(document, toggle ?? control ?? element);
  }
  const target = await findRenderedOption(document, fill.value, "generic");
  if (!target) return { fieldId: fill.fieldId, status: "unsupported_option" };
  activateWithMouse(document, target);
  for (let attempt = 0; attempt < 12; attempt += 1) {
    if (optionMatches(ariaComboboxSelection(element), fill.value))
      return { fieldId: fill.fieldId, status: "filled" };
    await waitForNextRender(document);
  }
  return { fieldId: fill.fieldId, status: "unsupported_option" };
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
    target.click();
    if (!target.checked) {
      target.checked = true;
      target.dispatchEvent(new Event("input", { bubbles: true }));
      target.dispatchEvent(new Event("change", { bubbles: true }));
    }
    return { fieldId: fill.fieldId, status: "filled" };
  }

  if (element instanceof HTMLInputElement && element.type === "checkbox") {
    if (element.checked)
      return { fieldId: fill.fieldId, status: "skipped_existing" };
    element.click();
    if (!element.checked) {
      element.checked = true;
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));
    }
    return { fieldId: fill.fieldId, status: "filled" };
  }

  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
  ) {
    if (element instanceof HTMLInputElement && isAriaCombobox(element)) {
      return fillAriaCombobox(document, element, fill);
    }
    if (element instanceof HTMLSelectElement && isFabricSelect(element)) {
      return fillFabricSelect(document, element, fill);
    }
    if (element.value.trim())
      return { fieldId: fill.fieldId, status: "skipped_existing" };
    if (element instanceof HTMLSelectElement) {
      const choiceKind = addressChoiceKind(element);
      const option = Array.from(element.options).find(
        (item) =>
          optionMatches(item.value, fill.value, choiceKind) ||
          optionMatches(item.text, fill.value, choiceKind),
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
