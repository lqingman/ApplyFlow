import { afterEach, describe, expect, it, vi } from "vitest";

import {
  attachResumeToActivePage,
  enableInlineAssistants,
  fillActivePage,
  scanActivePage,
} from "./browser";

function chromeForTab(
  tabId: number,
  options: {
    executeScript?: ReturnType<typeof vi.fn>;
    sendMessage?: ReturnType<typeof vi.fn>;
    permissions?: {
      contains: ReturnType<typeof vi.fn>;
      request: ReturnType<typeof vi.fn>;
    };
  } = {},
) {
  return {
    tabs: {
      query: vi.fn().mockResolvedValue([{ id: tabId }]),
      sendMessage: options.sendMessage ?? vi.fn(),
    },
    scripting: {
      executeScript: options.executeScript ?? vi.fn().mockResolvedValue([]),
    },
    permissions:
      options.permissions ??
      ({
        contains: vi.fn().mockResolvedValue(false),
        request: vi.fn().mockResolvedValue(false),
      } as const),
  };
}

describe("extension browser bridge", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("scans when Chrome omits the active tab URL", async () => {
    const executeScript = vi
      .fn()
      .mockResolvedValueOnce([{ frameId: 0, result: false }])
      .mockResolvedValueOnce([{ frameId: 0 }]);
    const sendMessage = vi
      .fn()
      .mockRejectedValueOnce(new Error("No listener"))
      .mockResolvedValueOnce({
        ok: true,
        fields: [
          {
            id: "email",
            label: "Email address",
            kind: "email",
            required: true,
            value: "",
            options: [],
          },
        ],
      });
    vi.stubGlobal("chrome", chromeForTab(41, { executeScript, sendMessage }));

    await expect(scanActivePage()).resolves.toMatchObject({
      blockedCount: 0,
      fields: [{ id: "email", label: "Email address" }],
    });
    expect(executeScript).toHaveBeenNthCalledWith(1, {
      target: { tabId: 41 },
      func: expect.any(Function),
    });
    expect(executeScript).toHaveBeenNthCalledWith(2, {
      target: { tabId: 41, frameIds: [0] },
      files: ["content.js"],
    });
  });

  it("reports a useful error when Chrome blocks script injection", async () => {
    const executeScript = vi
      .fn()
      .mockResolvedValueOnce([{ frameId: 0, result: false }])
      .mockRejectedValueOnce(new Error("Cannot access contents"));
    vi.stubGlobal(
      "chrome",
      chromeForTab(42, {
        executeScript,
        sendMessage: vi.fn().mockRejectedValue(new Error("No listener")),
      }),
    );

    await expect(scanActivePage()).rejects.toThrow(
      "ApplyProof could not access this application",
    );
  });

  it("returns normalized safe-fill results", async () => {
    const sendMessage = vi
      .fn()
      .mockRejectedValueOnce(new Error("No listener"))
      .mockResolvedValueOnce({
        ok: true,
        results: [{ fieldId: "email", status: "filled" }],
      });
    vi.stubGlobal("chrome", chromeForTab(43, { sendMessage }));

    await expect(
      fillActivePage([{ fieldId: "email", value: "maya.chen@example.com" }]),
    ).resolves.toEqual([{ fieldId: "email", status: "filled" }]);
  });

  it("reuses an installed listener without reinjecting the bundle", async () => {
    const executeScript = vi
      .fn()
      .mockResolvedValueOnce([{ frameId: 0, result: false }]);
    const sendMessage = vi
      .fn()
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true, fields: [], blockedCount: 0 });
    vi.stubGlobal("chrome", chromeForTab(44, { executeScript, sendMessage }));

    await expect(scanActivePage()).resolves.toEqual({
      fields: [],
      blockedCount: 0,
    });
    expect(
      executeScript.mock.calls.some(([injection]) => "files" in injection),
    ).toBe(false);
  });

  it("enables writing assistants for scanned fields", async () => {
    const sendMessage = vi
      .fn()
      .mockRejectedValueOnce(new Error("No listener"))
      .mockResolvedValueOnce({ ok: true, mountedCount: 1 });
    vi.stubGlobal("chrome", chromeForTab(45, { sendMessage }));
    const fields = [
      {
        id: "project",
        label: "Describe a project",
        kind: "textarea" as const,
        required: true,
        value: "",
        options: [],
      },
    ];
    const job = {
      company: "Example Labs",
      role: "Frontend Engineer",
      description: "Build accessible products.",
    };

    await expect(enableInlineAssistants(fields, job)).resolves.toBe(1);
    expect(sendMessage).toHaveBeenLastCalledWith(
      45,
      expect.objectContaining({
        type: "APPLYPROOF_ENABLE_INLINE_ASSISTANTS",
        fields,
        job,
        generateBlankFields: true,
      }),
    );
  });

  it("sends the saved resume to the active page after a user action", async () => {
    const sendMessage = vi
      .fn()
      .mockRejectedValueOnce(new Error("No listener"))
      .mockResolvedValueOnce({ status: "attached" });
    vi.stubGlobal("chrome", chromeForTab(46, { sendMessage }));
    const file = {
      name: "maya.pdf",
      type: "application/pdf",
      lastModified: 123,
      arrayBuffer: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3]).buffer),
    } as unknown as File;

    await expect(attachResumeToActivePage(file)).resolves.toBe("attached");
    expect(sendMessage).toHaveBeenLastCalledWith(46, {
      type: "APPLYPROOF_ATTACH_RESUME",
      file: {
        name: "maya.pdf",
        type: "application/pdf",
        lastModified: 123,
        data: "AQID",
      },
    });
  });

  it("requests scoped access and routes embedded Greenhouse fields", async () => {
    const executeScript = vi
      .fn()
      .mockResolvedValueOnce([{ frameId: 0, result: true }])
      .mockResolvedValueOnce([
        {
          frameId: 0,
          result: { url: "https://careers.example.com/job", isTop: true },
        },
        {
          frameId: 7,
          result: {
            url: "https://job-boards.greenhouse.io/embed/job_app?for=example",
            isTop: false,
          },
        },
      ])
      .mockResolvedValueOnce([{ frameId: 0 }, { frameId: 7 }]);
    const sendMessage = vi.fn(
      async (
        _tabId: number,
        message: { type?: string; fills?: Array<{ fieldId: string }> },
        options?: { frameId?: number },
      ) => {
        if (message.type === "APPLYPROOF_PING") throw new Error("No listener");
        if (message.type === "APPLYPROOF_SCAN" && options?.frameId === 7) {
          return {
            ok: true,
            fields: [
              {
                id: "email",
                label: "Email",
                kind: "email",
                required: true,
                value: "",
                options: [],
              },
            ],
            blockedCount: 1,
          };
        }
        if (message.type === "APPLYPROOF_SCAN") {
          return {
            ok: true,
            fields: [],
            blockedCount: 0,
            job: { role: "Cloud Engineer", company: "Example" },
          };
        }
        if (message.type === "APPLYPROOF_FILL_FIELDS") {
          return {
            ok: true,
            results: message.fills?.map(({ fieldId }) => ({
              fieldId,
              status: "filled",
            })),
          };
        }
        return { ok: true };
      },
    );
    const permissions = {
      contains: vi.fn().mockResolvedValue(false),
      request: vi.fn().mockResolvedValue(true),
    };
    vi.stubGlobal(
      "chrome",
      chromeForTab(47, { executeScript, sendMessage, permissions }),
    );

    const scan = await scanActivePage();
    expect(scan).toMatchObject({
      fields: [{ id: "applyproof-frame-7:email", label: "Email" }],
      blockedCount: 1,
      job: { role: "Cloud Engineer", company: "Example" },
    });
    expect(permissions.request).toHaveBeenCalledWith({
      origins: ["https://job-boards.greenhouse.io/*"],
    });
    expect(executeScript).toHaveBeenLastCalledWith({
      target: { tabId: 47, frameIds: [0, 7] },
      files: ["content.js"],
    });

    await expect(
      fillActivePage([
        {
          fieldId: "applyproof-frame-7:email",
          value: "maya.chen@example.com",
        },
      ]),
    ).resolves.toEqual([
      { fieldId: "applyproof-frame-7:email", status: "filled" },
    ]);
    expect(sendMessage).toHaveBeenLastCalledWith(
      47,
      {
        type: "APPLYPROOF_FILL_FIELDS",
        fills: [{ fieldId: "email", value: "maya.chen@example.com" }],
      },
      { frameId: 7 },
    );
  });

  it("stops when the user declines embedded Greenhouse access", async () => {
    const executeScript = vi
      .fn()
      .mockResolvedValueOnce([{ frameId: 0, result: true }]);
    const permissions = {
      contains: vi.fn().mockResolvedValue(false),
      request: vi.fn().mockResolvedValue(false),
    };
    vi.stubGlobal("chrome", chromeForTab(48, { executeScript, permissions }));

    await expect(scanActivePage()).rejects.toThrow(
      "needs permission to access the embedded Greenhouse application",
    );
    expect(executeScript).toHaveBeenCalledTimes(1);
  });
});
