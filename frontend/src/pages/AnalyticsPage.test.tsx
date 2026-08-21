import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AnalyticsPage from "./AnalyticsPage";
import { getDashboardSummary } from "../api/dashboard";
import { apiRequest } from "../api/client";

vi.mock("../api/dashboard", () => ({
  getDashboardSummary: vi.fn(),
}));

vi.mock("../api/client", () => ({
  apiRequest: vi.fn(),
}));

const loadSummary = vi.mocked(getDashboardSummary);
const request = vi.mocked(apiRequest);

describe("AnalyticsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    request.mockResolvedValue({
      items: [
        {
          id: "transaction-1",
          user_id: "user-1",
          amount: "520000.00",
          kind: "expense",
          occurred_at: "2026-08-03T00:00:00+00:00",
          description: "월세",
          category_name: "월세/관리비",
          category_id: "category-1",
          category_cost_type: "fixed",
          account_id: "account-1",
          is_synthetic: false,
        },
        {
          id: "transaction-2",
          user_id: "user-1",
          amount: "150000.00",
          kind: "expense",
          occurred_at: "2026-08-05T00:00:00+00:00",
          description: "식비",
          category_name: "식비",
          category_id: "category-2",
          category_cost_type: "variable",
          account_id: "account-1",
          is_synthetic: false,
        },
        {
          id: "income-entry-1",
          user_id: "user-1",
          amount: "2800000.00",
          kind: "income",
          occurred_at: "2026-08-25T00:00:00+00:00",
          description: "월급",
          category_name: "월급",
          category_id: null,
          category_cost_type: null,
          account_id: null,
          is_synthetic: true,
        },
      ],
      total: 3,
    });
  });

  it("shows monthly analysis from dashboard summary data", async () => {
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

    render(<AnalyticsPage />);

    expect(await screen.findByRole("heading", { name: "분석" })).toBeInTheDocument();
    expect(screen.getByText("2,800,000원")).toBeInTheDocument();
    expect(screen.getByText("670,000원")).toBeInTheDocument();
    expect(screen.getByText("24%")).toBeInTheDocument();
    expect(await screen.findByText("고정비 지출")).toBeInTheDocument();
    expect(screen.getByText("520,000원")).toBeInTheDocument();
    expect(screen.getByText("변동비 지출")).toBeInTheDocument();
    expect(screen.getByText("150,000원")).toBeInTheDocument();
    expect(screen.getAllByText("교통").length).toBeGreaterThan(0);
    expect(screen.getByText("85% · 주의")).toBeInTheDocument();
    expect(screen.getByText("교통비가 빨라지고 있어요.")).toBeInTheDocument();
  });

  it("shows a first-step guide when there is not enough data to analyze", async () => {
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

    render(<AnalyticsPage />);

    expect(await screen.findByText("분석할 데이터가 아직 부족해요.")).toBeInTheDocument();
    expect(screen.getByText("수입, 예산, 거래를 입력하면 이 화면에서 소비 흐름을 자동으로 정리해드릴게요.")).toBeInTheDocument();
  });
});
