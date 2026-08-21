import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AppCard from "./AppCard";

describe("AppCard", () => {
  it("does not keep the default white background when a custom background is provided", () => {
    render(<AppCard className="bg-[#173b68] text-white">예산 배분 조정</AppCard>);

    const card = screen.getByText("예산 배분 조정").closest("section");

    expect(card).toHaveClass("bg-[#173b68]");
    expect(card).not.toHaveClass("bg-white");
  });
});
