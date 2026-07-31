import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DashboardPage from "./DashboardPage";

describe("DashboardPage", () => {
  it("shows the top money summary cards", () => {
    render(<DashboardPage />);

    expect(screen.getByRole("heading", { name: "오늘의 마이페이스" })).toBeInTheDocument();
    expect(screen.getByText("이번 달 예상 수입")).toBeInTheDocument();
    expect(screen.getByText("이번 달 지출")).toBeInTheDocument();
    expect(screen.getByText("남은 생활비")).toBeInTheDocument();
    expect(screen.getByText("예산 사용률")).toBeInTheDocument();
  });

  it("shows budget progress and weekly action guidance", () => {
    render(<DashboardPage />);

    expect(screen.getByRole("heading", { name: "예산 진행률" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "이번 주 추천 행동" })).toBeInTheDocument();
    expect(screen.getByText("외식 예산은 이번 주 90,000원 안에서 맞춰보세요.")).toBeInTheDocument();
  });

  it("uses stable 4 to 2 to 1 summary card columns", () => {
    render(<DashboardPage />);

    expect(screen.getByTestId("dashboard-page")).toHaveClass("w-full");
    expect(screen.getByTestId("dashboard-page")).toHaveClass("max-w-[1680px]");
    expect(screen.getByLabelText("상단 요약")).toHaveClass("grid-cols-4");
    expect(screen.getByLabelText("상단 요약")).toHaveClass("max-[1200px]:grid-cols-2");
    expect(screen.getByLabelText("상단 요약")).toHaveClass("max-[640px]:grid-cols-1");
  });
});
