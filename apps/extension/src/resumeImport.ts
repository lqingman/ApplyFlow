import { parseResumeText, type ParsedResume } from "./resumeTextParser";

const maxResumeBytes = 10 * 1024 * 1024;

async function textFromDocx(file: File) {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({
    arrayBuffer: await file.arrayBuffer(),
  });
  return result.value;
}

async function textFromPdf(file: File) {
  const [{ getDocument, GlobalWorkerOptions }, { default: pdfWorkerUrl }] =
    await Promise.all([
      import("pdfjs-dist"),
      import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
    ]);
  GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  const loadingTask = getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
  });
  const document = await loadingTask.promise;
  try {
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      let pageText = "";
      for (const item of content.items) {
        if (!("str" in item)) continue;
        pageText += `${item.str}${item.hasEOL ? "\n" : " "}`;
      }
      pages.push(pageText.trim());
    }
    return pages.join("\n");
  } finally {
    await loadingTask.destroy();
  }
}

export async function importResumeFile(file: File): Promise<ParsedResume> {
  if (file.size > maxResumeBytes) {
    throw new Error("Choose a resume smaller than 10 MB.");
  }
  const extension = file.name.split(".").pop()?.toLowerCase();
  let text: string;
  if (extension === "docx") {
    text = await textFromDocx(file);
  } else if (extension === "pdf") {
    text = await textFromPdf(file);
  } else {
    throw new Error("Choose a Word (.docx) or PDF (.pdf) resume.");
  }
  return parseResumeText(text);
}
