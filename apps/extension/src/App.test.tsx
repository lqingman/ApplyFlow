import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "./App";

vi.mock("./browser", () => ({
  scanActivePage: vi.fn().mockResolvedValue({
    blockedCount: 1,
    fields: [
      {
        id: "email",
        label: "Email address",
        kind: "email",
        required: true,
        value: "",
        options: [],
      },
      {
        id: "work-authorization",
        label: "Work authorization",
        kind: "select",
        required: true,
        value: "",
        options: ["Authorized"],
      },
      {
        id: "gender",
        label: "Gender identity",
        kind: "radio",
        required: false,
        value: "",
        options: ["Woman"],
      },
    ],
  }),
  fillActivePage: vi
    .fn()
    .mockResolvedValue([{ fieldId: "email", status: "filled" }]),
  focusField: vi.fn().mockResolvedValue(undefined),
}));

describe("profile-first autofill workflow", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(cleanup);

  it("requires profile selection before autofill", () => {
    render(<App />);

    expect(
      screen.getByRole("button", { name: "Scan & Autofill" }),
    ).toBeDisabled();
    fireEvent.click(
      screen.getByRole("button", { name: "Use Maya demo profile" }),
    );
    expect(
      screen.getByRole("button", { name: "Scan & Autofill" }),
    ).toBeEnabled();
    expect(screen.getByText("Selected")).toBeInTheDocument();
  });

  it("prioritizes outcomes and review exceptions after autofill", async () => {
    render(<App />);

    fireEvent.click(
      screen.getByRole("button", { name: "Use Maya demo profile" }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Scan & Autofill" }));

    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "Autofill summary" }),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText("Safely filled").previousSibling).toHaveTextContent(
      "1",
    );
    expect(screen.getByText("Need review").previousSibling).toHaveTextContent(
      "1",
    );
    expect(screen.getByText("Skipped").previousSibling).toHaveTextContent("1");
    expect(screen.getByText("Blocked").previousSibling).toHaveTextContent("1");
    expect(
      screen.getByText(
        "Work authorization is high risk and must be confirmed by you.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("View all 3 detected safe fields"),
    ).toBeInTheDocument();
  });
});
