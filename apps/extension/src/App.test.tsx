import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "./App";

describe("extension shell", () => {
  it("shows every planned workflow stage", () => {
    render(<App />);

    for (const stage of ["Profile", "Analyze", "Review", "Audit"]) {
      expect(screen.getByRole("heading", { name: stage })).toBeInTheDocument();
    }
  });
});
