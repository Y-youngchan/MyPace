import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BudgetsPage from "./BudgetsPage";

describe("BudgetsPage", () => {
  it("shows the monthly budget baseline and recommended allocation", () => {
    render(<BudgetsPage />);

    expect(screen.getByRole("heading", { name: "예산" })).toBeInTheDocument();
    expect(screen.getByText("월 수입 기준선")).toBeInTheDocument();
    expect(screen.getByText("2,750,000원")).toBeInTheDocument();
    expect(screen.getByText("추천 예산 배분")).toBeInTheDocument();
    expect(screen.getByText("고정비")).toBeInTheDocument();
    expect(screen.getByText("생활비")).toBeInTheDocument();
    expect(screen.getByText("저축")).toBeInTheDocument();
    expect(screen.getByText("여유금")).toBeInTheDocument();
  });

  it("shows category budget progress with pace status", () => {
    render(<BudgetsPage />);

    expect(screen.getByText("카테고리별 사용률")).toBeInTheDocument();
    expect(screen.getByText("식비")).toBeInTheDocument();
    expect(screen.getByText("68% · 안정")).toBeInTheDocument();
    expect(screen.getByText("생활")).toBeInTheDocument();
    expect(screen.getByText("81% · 주의")).toBeInTheDocument();
  });
});
