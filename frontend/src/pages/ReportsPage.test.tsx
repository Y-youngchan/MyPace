import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ReportsPage from "./ReportsPage";
import { getDashboardSummary } from "../api/dashboard";

vi.mock("../api/dashboard", () => ({
  getDashboardSummary: vi.fn(),
}));

const loadSummary = vi.mocked(getDashboardSummary);

describe("ReportsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a readable monthly report from dashboard summary data", async () => {
    loadSummary.mockResolvedValueOnce({
      period: "2026-08-01",
      expected_income: "2800000.00",
      monthly_spent: "670000.00",
      remaining_living_money: "2130000.00",
      daily_available: "71000.00",
      budget_usage_percent: 24,
      recent_transactions: [
        { title: "점심 식사", category: "식비", amount: "12000.00" },
        { title: "지하철", category: "교통", amount: "55000.00" },
      ],
      budget_progress: [
        { category: "식비", used_amount: "240000.00", budget_amount: "500000.00", used_percent: 48, status: "여유" },
        { category: "교통", used_amount: "170000.00", budget_amount: "200000.00", used_percent: 85, status: "주의" },
      ],
      weekly_actions: ["교통비가 빨라지고 있어요."],
    });

    render(<ReportsPage />);

    expect(await screen.findByRole("heading", { name: "리포트" })).toBeInTheDocument();
    expect(screen.getByText("이번 달 리포트")).toBeInTheDocument();
    expect(screen.getByText("수입 2,800,000원 중 670,000원을 사용했어요.")).toBeInTheDocument();
    expect(screen.getByText("예산 사용률 24%")).toBeInTheDocument();
    expect(screen.getAllByText("교통").length).toBeGreaterThan(0);
    expect(screen.getByText("교통비가 빨라지고 있어요.")).toBeInTheDocument();
  });

  it("shows an empty report guide when there is no finance data", async () => {
    loadSummary.mockResolvedValueOnce({
      period: "2026-08-01",
      expected_income: "0.00",
      monthly_spent: "0.00",
      remaining_living_money: "0.00",
      daily_available: "0.00",
      budget_usage_percent: 0,
      recent_transactions: [],
      budget_progress: [],
      weekly_actions: [],
    });

    render(<ReportsPage />);

    expect(await screen.findByText("아직 리포트를 만들 데이터가 부족해요.")).toBeInTheDocument();
    expect(screen.getByText("수입, 예산, 거래를 입력하면 월간 리포트가 자동으로 채워져요.")).toBeInTheDocument();
  });
});
