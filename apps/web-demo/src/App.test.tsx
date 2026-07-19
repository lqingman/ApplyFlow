import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { scanDocument } from "../../extension/src/scanner";
import { App } from "./App";

describe("Northstar Labs application", () => {
  afterEach(cleanup);
  it("renders the complete target form", () => {
    render(<App />);

    expect(
      screen.getByRole("heading", { name: "Junior Software Engineer" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Email address/)).toHaveAttribute(
      "type",
      "email",
    );
    expect(screen.getByLabelText(/Work authorization/)).toBeRequired();
    expect(
      screen.getByLabelText(/Describe a relevant project/),
    ).toHaveAttribute("maxlength", "700");
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "type",
      "password",
    );
    expect(
      screen.getByRole("button", { name: "Submit application" }),
    ).toBeInTheDocument();
  });

  it("provides a fully labelled, safe Phase 2 scan fixture", () => {
    render(<App />);

    const fields = scanDocument(document);

    expect(fields).toHaveLength(18);
    expect(fields.every((field) => field.label.length > 2)).toBe(true);
    expect(fields.some((field) => field.id === "password")).toBe(false);
    expect(fields.find((field) => field.id === "relocation")).toMatchObject({
      label: "Are you open to relocating?",
      kind: "radio",
      options: ["Yes", "No"],
    });
    expect(fields.find((field) => field.id === "motivation")).toMatchObject({
      label: "Why are you interested in this role?",
      kind: "textarea",
      maxLength: 500,
    });
  });
});
