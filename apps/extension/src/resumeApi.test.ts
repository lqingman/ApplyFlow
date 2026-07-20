import { afterEach, describe, expect, it, vi } from "vitest";

import { extractResumeWithAi } from "./resumeApi";

const baseline = {
  firstName: "Maya",
  lastName: "Chen",
  email: "maya@example.com",
  phone: undefined,
  location: undefined,
  education: [],
  experience: [],
  evidence: [],
  reviews: [],
  notes: ["Local baseline"],
};

describe("AI resume extraction client", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sends extracted text and the deterministic baseline, not a file", async () => {
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        ...baseline,
        location: "Vancouver, BC",
        reviews: [
          {
            fieldPath: "location",
            sourceText: "Vancouver, BC",
            confidence: "high",
          },
        ],
        notes: ["AI extraction completed"],
      }),
    });
    vi.stubGlobal("fetch", fetch);

    await expect(
      extractResumeWithAi("Maya Chen\nVancouver, BC", baseline),
    ).resolves.toMatchObject({ location: "Vancouver, BC" });
    const body = JSON.parse(fetch.mock.calls[0]?.[1]?.body as string);
    expect(body).toMatchObject({
      text: "Maya Chen\nVancouver, BC",
      baseline: { firstName: "Maya" },
    });
    expect(body).not.toHaveProperty("file");
  });

  it("falls back to deterministic extraction when the API is unavailable", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    await expect(extractResumeWithAi("Maya Chen", baseline)).resolves.toEqual({
      ...baseline,
      notes: [
        "Local baseline",
        "AI extraction was unavailable; deterministic extraction was used.",
      ],
    });
  });
});
