export type ResumeAttachmentResult = {
  status: "attached" | "not_found" | "skipped_existing" | "unsupported";
};

function fieldFingerprint(input: HTMLInputElement) {
  const labels = Array.from(input.labels ?? [])
    .map((label) => label.textContent ?? "")
    .join(" ");
  const parentText = input.parentElement?.textContent ?? "";
  const nearbyText = parentText.length <= 300 ? parentText : "";
  return [
    labels,
    nearbyText,
    input.id,
    input.name,
    input.accept,
    input.getAttribute("aria-label"),
    input.getAttribute("title"),
    input.getAttribute("data-testid"),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

const resumePattern = /\b(?:resume|résumé|cv|curriculum vitae)\b/i;
const otherDocumentPattern = /\b(?:cover[- ]?letter|portfolio|transcript)\b/i;

function acceptsResume(input: HTMLInputElement, file: File) {
  if (!input.accept.trim()) return true;
  const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
  return input.accept
    .toLowerCase()
    .split(",")
    .map((value) => value.trim())
    .some(
      (value) =>
        value === "*/*" ||
        value === "application/*" ||
        value === extension ||
        value === file.type.toLowerCase() ||
        (value === "application/pdf" && extension === ".pdf") ||
        (value.includes("wordprocessingml") && extension === ".docx"),
    );
}

function explicitlyAcceptsResumeDocument(input: HTMLInputElement) {
  return /(?:\.pdf|\.docx|application\/pdf|wordprocessingml)/i.test(
    input.accept,
  );
}

export function attachResumeFile(
  document: Document,
  file: File,
): ResumeAttachmentResult {
  const compatible = Array.from(
    document.querySelectorAll<HTMLInputElement>('input[type="file"]'),
  ).filter((input) => !input.disabled && acceptsResume(input, file));
  const candidates = compatible.filter((input) =>
    resumePattern.test(fieldFingerprint(input)),
  );
  const unambiguousFallback = compatible.filter((input) => {
    const fingerprint = fieldFingerprint(input);
    return (
      explicitlyAcceptsResumeDocument(input) &&
      !otherDocumentPattern.test(fingerprint)
    );
  });
  const input =
    candidates[0] ??
    (unambiguousFallback.length === 1 ? unambiguousFallback[0] : undefined);
  if (!input) return { status: "not_found" };
  if (input.files?.length) return { status: "skipped_existing" };
  if (typeof DataTransfer === "undefined") return { status: "unsupported" };

  try {
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    return { status: "attached" };
  } catch {
    return { status: "unsupported" };
  }
}
