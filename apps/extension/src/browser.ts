import {
  pageFillResultSchema,
  pageScanSchema,
  type FieldFill,
  type FillResult,
  type PageScan,
  type NormalizedField,
  type PageJobContext,
} from "@applyproof/shared-types";

const greenhouseOrigin = "https://job-boards.greenhouse.io/*";
const routedFieldPrefix = "applyproof-frame-";

type FrameTarget = {
  frameId: number;
  isTop: boolean;
  url?: string;
};

type FieldRoute = {
  frameId: number;
  fieldId: string;
};

type PageRouting = {
  tabId: number;
  frameIds: number[];
  fields: Map<string, FieldRoute>;
};

let latestRouting: PageRouting | undefined;

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("Open a job application tab and try again.");
  return tab.id;
}

function hasEmbeddedGreenhouseApplication() {
  return Array.from(document.querySelectorAll("iframe")).some((frame) => {
    const source = frame.getAttribute("src");
    if (!source) return false;
    try {
      return (
        new URL(source, location.href).hostname === "job-boards.greenhouse.io"
      );
    } catch {
      return false;
    }
  });
}

function describeCurrentFrame() {
  return {
    url: location.href,
    isTop: window.top === window,
  };
}

function isGreenhouseUrl(url: string | undefined) {
  if (!url) return false;
  try {
    return new URL(url).hostname === "job-boards.greenhouse.io";
  } catch {
    return false;
  }
}

async function requestGreenhouseAccess() {
  const request = { origins: [greenhouseOrigin] };
  if (await chrome.permissions.contains(request)) return;
  if (await chrome.permissions.request(request)) return;
  throw new Error(
    "ApplyProof needs permission to access the embedded Greenhouse application. Grant Greenhouse access and try again.",
  );
}

async function discoverFrameTargets(tabId: number): Promise<FrameTarget[]> {
  let inspection: chrome.scripting.InjectionResult<boolean>[];
  try {
    inspection = await chrome.scripting.executeScript({
      target: { tabId },
      func: hasEmbeddedGreenhouseApplication,
    });
  } catch {
    throw new Error(
      "ApplyProof could not access this application. Open a regular job application page and try again.",
    );
  }
  const hasGreenhouseFrame = inspection.some(
    (result) => result.result === true,
  );
  if (!hasGreenhouseFrame) return [{ frameId: 0, isTop: true }];

  await requestGreenhouseAccess();
  const frames = await chrome.scripting.executeScript({
    target: { tabId, allFrames: true },
    func: describeCurrentFrame,
  });
  const targets = frames
    .map((result): FrameTarget | undefined => {
      const description = result.result as
        { url?: string; isTop?: boolean } | undefined;
      if (!description?.isTop && !isGreenhouseUrl(description?.url))
        return undefined;
      return {
        frameId: result.frameId,
        isTop: description?.isTop === true,
        url: description?.url,
      };
    })
    .filter((target): target is FrameTarget => Boolean(target));

  if (!targets.some((target) => target.isTop)) {
    targets.unshift({ frameId: 0, isTop: true });
  }
  if (!targets.some((target) => isGreenhouseUrl(target.url))) {
    throw new Error(
      "ApplyProof could not reach the embedded Greenhouse application. Reload the page and try again.",
    );
  }
  return targets;
}

function sendToFrame(
  tabId: number,
  frameId: number,
  message: Record<string, unknown>,
) {
  return frameId === 0
    ? chrome.tabs.sendMessage(tabId, message)
    : chrome.tabs.sendMessage(tabId, message, { frameId });
}

async function ensureScanners(tabId: number, targets: FrameTarget[]) {
  const missing: number[] = [];
  for (const target of targets) {
    try {
      const response: unknown = await sendToFrame(tabId, target.frameId, {
        type: "APPLYPROOF_PING",
      });
      if ((response as { ok?: boolean })?.ok) continue;
    } catch {
      // A missing listener is expected before the first user-initiated scan.
    }
    missing.push(target.frameId);
  }

  if (!missing.length) return;
  try {
    await chrome.scripting.executeScript({
      target: { tabId, frameIds: missing },
      files: ["content.js"],
    });
  } catch {
    throw new Error(
      "ApplyProof could not access this application. Reload it, grant requested site access, and try again.",
    );
  }
}

async function preparePage(tabId: number) {
  const targets = await discoverFrameTargets(tabId);
  await ensureScanners(tabId, targets);
  return targets;
}

function externalFieldId(frameId: number, fieldId: string) {
  return frameId === 0 ? fieldId : `${routedFieldPrefix}${frameId}:${fieldId}`;
}

function routeFor(tabId: number, externalId: string): FieldRoute {
  if (latestRouting?.tabId === tabId) {
    const route = latestRouting.fields.get(externalId);
    if (route) return route;
  }
  return { frameId: 0, fieldId: externalId };
}

async function ensureOperationTarget(tabId: number, frameId: number) {
  if (latestRouting?.tabId === tabId) return;
  await ensureScanners(tabId, [{ frameId, isTop: frameId === 0 }]);
}

export async function scanActivePage(): Promise<PageScan> {
  const tabId = await activeTab();
  const targets = await preparePage(tabId);
  const fields: NormalizedField[] = [];
  const fieldRoutes = new Map<string, FieldRoute>();
  let blockedCount = 0;
  let topJob: PageJobContext | undefined;
  let fallbackJob: PageJobContext | undefined;

  for (const target of targets) {
    const response: unknown = await sendToFrame(tabId, target.frameId, {
      type: "APPLYPROOF_SCAN",
    });
    const scan = pageScanSchema.parse(response);
    blockedCount += scan.blockedCount;
    if (target.isTop && scan.job) topJob = scan.job;
    fallbackJob ??= scan.job;

    for (const field of scan.fields) {
      let id = externalFieldId(target.frameId, field.id);
      if (fieldRoutes.has(id))
        id = `${routedFieldPrefix}${target.frameId}:${id}`;
      fields.push({ ...field, id });
      fieldRoutes.set(id, { frameId: target.frameId, fieldId: field.id });
    }
  }

  latestRouting = {
    tabId,
    frameIds: targets.map((target) => target.frameId),
    fields: fieldRoutes,
  };
  return pageScanSchema.parse({
    fields,
    blockedCount,
    job: topJob ?? fallbackJob,
  });
}

export async function focusField(fieldId: string) {
  const tabId = await activeTab();
  const route = routeFor(tabId, fieldId);
  await ensureOperationTarget(tabId, route.frameId);
  const response: unknown = await sendToFrame(tabId, route.frameId, {
    type: "APPLYPROOF_FOCUS_FIELD",
    fieldId: route.fieldId,
  });
  if (!(response as { ok?: boolean })?.ok)
    throw new Error("That field is no longer available on the page.");
}

export async function fillActivePage(
  fills: FieldFill[],
): Promise<FillResult[]> {
  const tabId = await activeTab();
  const grouped = new Map<
    number,
    Array<{ externalId: string; fill: FieldFill }>
  >();
  for (const fill of fills) {
    const route = routeFor(tabId, fill.fieldId);
    const entries = grouped.get(route.frameId) ?? [];
    entries.push({
      externalId: fill.fieldId,
      fill: { ...fill, fieldId: route.fieldId },
    });
    grouped.set(route.frameId, entries);
  }

  const results: FillResult[] = [];
  for (const [frameId, entries] of grouped) {
    await ensureOperationTarget(tabId, frameId);
    const response: unknown = await sendToFrame(tabId, frameId, {
      type: "APPLYPROOF_FILL_FIELDS",
      fills: entries.map((entry) => entry.fill),
    });
    const parsed = pageFillResultSchema.parse(response).results;
    const externalIds = new Map(
      entries.map((entry) => [entry.fill.fieldId, entry.externalId]),
    );
    results.push(
      ...parsed.map((result) => ({
        ...result,
        fieldId: externalIds.get(result.fieldId) ?? result.fieldId,
      })),
    );
  }
  return results;
}

export async function enableInlineAssistants(
  fields: NormalizedField[],
  job?: PageJobContext,
) {
  const tabId = await activeTab();
  const grouped = new Map<number, NormalizedField[]>();
  for (const field of fields) {
    const route = routeFor(tabId, field.id);
    const frameFields = grouped.get(route.frameId) ?? [];
    frameFields.push({ ...field, id: route.fieldId });
    grouped.set(route.frameId, frameFields);
  }

  let mountedCount = 0;
  for (const [frameId, frameFields] of grouped) {
    await ensureOperationTarget(tabId, frameId);
    const response: unknown = await sendToFrame(tabId, frameId, {
      type: "APPLYPROOF_ENABLE_INLINE_ASSISTANTS",
      fields: frameFields,
      job,
      generateBlankFields: true,
    });
    if (!(response as { ok?: boolean })?.ok)
      throw new Error("ApplyProof could not add writing tools to this page.");
    mountedCount += (response as { mountedCount?: number }).mountedCount ?? 0;
  }
  return mountedCount;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 32_768;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(
      ...bytes.subarray(offset, offset + chunkSize),
    );
  }
  return btoa(binary);
}

export async function attachResumeToActivePage(file: File) {
  const tabId = await activeTab();
  const data = bytesToBase64(new Uint8Array(await file.arrayBuffer()));
  const message = {
    type: "APPLYPROOF_ATTACH_RESUME",
    file: {
      name: file.name,
      type: file.type,
      lastModified: file.lastModified,
      data,
    },
  };
  const frameIds =
    latestRouting?.tabId === tabId
      ? [...latestRouting.frameIds].sort((left, right) => {
          if (left === 0) return 1;
          if (right === 0) return -1;
          return left - right;
        })
      : [0];
  let fallback: "not_found" | "unsupported" = "not_found";

  for (const frameId of frameIds) {
    await ensureOperationTarget(tabId, frameId);
    const response: unknown = await sendToFrame(tabId, frameId, message);
    const status = (response as { status?: string })?.status;
    if (status === "attached" || status === "skipped_existing") return status;
    if (status === "unsupported") fallback = "unsupported";
    else if (status !== "not_found") {
      throw new Error("ApplyProof could not attach the saved resume.");
    }
  }
  return fallback;
}
