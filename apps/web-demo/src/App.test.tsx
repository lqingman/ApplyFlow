import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "./App";

describe("Northstar Labs application", () => {
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
});
