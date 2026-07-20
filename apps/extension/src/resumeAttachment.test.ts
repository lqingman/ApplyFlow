import { afterEach, describe, expect, it, vi } from "vitest";

import { attachResumeFile } from "./resumeAttachment";

class TestDataTransfer {
  private filesList: File[] = [];
  items = {
    add: (file: File) => this.filesList.push(file),
  };
  get files() {
    return this.filesList as unknown as FileList;
  }
}

describe("saved resume attachment", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("attaches a saved resume by visible label and dispatches change", () => {
    vi.stubGlobal("DataTransfer", TestDataTransfer);
    document.body.innerHTML = `
      <label>Cover letter <input type="file" id="cover-letter"></label>
      <label>Resume / CV <input type="file" id="resume" accept=".pdf,.docx"></label>
    `;
    const input = document.querySelector<HTMLInputElement>("#resume");
    let selectedFiles = [] as unknown as FileList;
    Object.defineProperty(input, "files", {
      configurable: true,
      get: () => selectedFiles,
      set: (value: FileList) => {
        selectedFiles = value;
      },
    });
    const changed = vi.fn();
    input?.addEventListener("change", changed);
    const file = new File(["resume"], "maya.pdf", { type: "application/pdf" });

    expect(attachResumeFile(document, file)).toEqual({ status: "attached" });
    expect(input?.files?.[0]).toBe(file);
    expect(changed).toHaveBeenCalledOnce();
    expect(
      document.querySelector<HTMLInputElement>("#cover-letter")?.files,
    ).toHaveLength(0);
  });

  it("does not replace an existing page selection", () => {
    vi.stubGlobal("DataTransfer", TestDataTransfer);
    document.body.innerHTML = `<label>Resume <input type="file" id="resume"></label>`;
    const input = document.querySelector<HTMLInputElement>("#resume");
    Object.defineProperty(input, "files", {
      configurable: true,
      value: [new File(["existing"], "existing.pdf")],
    });

    expect(
      attachResumeFile(
        document,
        new File(["saved"], "saved.pdf", { type: "application/pdf" }),
      ),
    ).toEqual({ status: "skipped_existing" });
  });
});
