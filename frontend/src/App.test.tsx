import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";

describe("App", () => {
  it("shows the MyPace identity", () => {
    render(<App />);

    expect(screen.getByText("MyPace")).toBeInTheDocument();
    expect(screen.getByText("내 수입에 맞춰, 소비도 마이페이스")).toBeInTheDocument();
  });
});
