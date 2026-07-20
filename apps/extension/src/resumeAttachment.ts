export type ResumeAttachmentResult = {
  status: "attached" | "not_found" | "skipped_existing" | "unsupported";
};

function fieldFingerprint(input: HTMLInputElement) {
  const labels = Array.from(input.labels ?? [])
    .map((label) => label.textContent ?? "")
    .join(" ");
  return `${labels} ${input.id} ${input.name} ${input.accept}`.toLowerCase();
}

function acceptsResume(input: HTMLInputElement, file: File) {
  if (!input.accept.trim()) return true;
  const extension = `.${file.name.split(".").pop()?.toLowerCase()}`;
  return input.accept
    .toLowerCase()
    .split(",")
    .map((value) => value.trim())
    .some(
      (value) =>
        value === extension ||
        value === file.type.toLowerCase() ||
        (value === "application/pdf" && extension === ".pdf") ||
        (value.includes("wordprocessingml") && extension === ".docx"),
    );
}

export function attachResumeFile(
  document: Document,
  file: File,
): ResumeAttachmentResult {
  const candidates = Array.from(
    document.querySelectorAll<HTMLInputElement>('input[type="file"]'),
  ).filter(
    (input) =>
      !input.disabled &&
      /\b(?:resume|résumé|cv)\b/i.test(fieldFingerprint(input)) &&
      acceptsResume(input, file),
  );
  const input = candidates[0];
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
