import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "../api/client";
import { getDashboardSummary } from "../api/dashboard";
import BudgetsPage from "./BudgetsPage";

vi.mock("../api/client", () => ({
  apiRequest: vi.fn(),
}));

vi.mock("../api/dashboard", () => ({
  getDashboardSummary: vi.fn(),
}));

const request = vi.mocked(apiRequest);
const loadDashboard = vi.mocked(getDashboardSummary);

describe("BudgetsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadDashboard.mockResolvedValue({
      period: "2026-08-01",
      expected_income: "2900000.00",
      monthly_spent: "67000.00",
      remaining_living_money: "2833000.00",
      daily_available: "94433.00",
      budget_usage_percent: 4,
      recent_transactions: [],
      budget_progress: [
        { category: "식비", used_amount: "12000.00", budget_amount: "500000.00", used_percent: 2, status: "여유" },
        { category: "교통", used_amount: "55000.00", budget_amount: "200000.00", used_percent: 28, status: "여유" },
      ],
      weekly_actions: [],
    });
    request.mockRejectedValueOnce(new Error("saved budget not found"));
    request.mockResolvedValueOnce([
      {
        id: "income-1",
        user_id: "user-1",
        source_id: "source-1",
        period: "2026-08-01",
        expected_amount: "3000000",
        actual_amount: "2900000",
        received_at: "2026-08-25",
      },
    ]);
  });

  it("shows the monthly budget baseline and recommended allocation from saved income", async () => {
    render(<BudgetsPage />);

    expect(screen.getByRole("heading", { name: "예산" })).toBeInTheDocument();
    expect(screen.getByText("월 수입 기준선")).toBeInTheDocument();
    expect(await screen.findByText("2,900,000원")).toBeInTheDocument();
    expect(screen.queryByText("2,750,000원")).not.toBeInTheDocument();
    expect(screen.getByText("예산 배분 조정")).toBeInTheDocument();
    expect(screen.getByText("고정비")).toBeInTheDocument();
    expect(screen.getByText("생활비")).toBeInTheDocument();
    expect(screen.getByText("저축")).toBeInTheDocument();
    expect(screen.getByText("여유금")).toBeInTheDocument();
  });

  it("shows the saved budget before recalculating a recommendation from income", async () => {
    request.mockReset();
    request.mockResolvedValueOnce({
      id: "budget-1",
      user_id: "user-1",
      period: "2026-08-01",
      basis_income_amount: "2900000",
      status: "accepted",
      items: {
        고정비: "650000.00",
        생활비: "850000.00",
        저축: "500000.00",
        여유금: "150000.00",
      },
    });

    render(<BudgetsPage />);

    expect(await screen.findByText("저장된 예산 기준")).toBeInTheDocument();
    expect(screen.getByText("650,000원")).toBeInTheDocument();
    expect(screen.queryByText("1,102,000원")).not.toBeInTheDocument();
  });

  it("uses expected income when actual income is not entered yet", async () => {
    request.mockReset();
    request.mockRejectedValueOnce(new Error("saved budget not found"));
    request.mockResolvedValueOnce([
      {
        id: "income-1",
        user_id: "user-1",
        source_id: "source-1",
        period: "2026-08-01",
        expected_amount: "3100000",
        actual_amount: null,
        received_at: null,
      },
    ]);

    render(<BudgetsPage />);

    expect(await screen.findByText("3,100,000원")).toBeInTheDocument();
    expect(screen.getByText("예상 수입 기준")).toBeInTheDocument();
  });

  it("shows an empty budget state instead of local fallback numbers when income loading fails", async () => {
    request.mockReset();
    request.mockRejectedValueOnce(new Error("saved budget not found"));
    request.mockRejectedValueOnce(new Error("backend offline"));
    loadDashboard.mockResolvedValueOnce({
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

    render(<BudgetsPage />);

    expect(await screen.findByText("수입 데이터가 아직 없어요.")).toBeInTheDocument();
    expect(screen.queryByText("2,750,000원")).not.toBeInTheDocument();
    expect(screen.queryByText("31,000원")).not.toBeInTheDocument();
    expect(screen.queryByText("68% · 안정")).not.toBeInTheDocument();
  });

  it("shows category budget progress with pace status", async () => {
    render(<BudgetsPage />);

    expect(screen.getByText("카테고리별 사용률")).toBeInTheDocument();
    expect(await screen.findByText("식비")).toBeInTheDocument();
    expect(await screen.findByText("2% · 여유")).toBeInTheDocument();
    expect(screen.getByText((_, node) => node?.textContent === "12,000원 사용 / 500,000원 예산")).toBeInTheDocument();
    expect(screen.queryByText("68% · 안정")).not.toBeInTheDocument();
  });

  it("shows an empty category state instead of fallback category progress", async () => {
    loadDashboard.mockResolvedValueOnce({
      period: "2026-08-01",
      expected_income: "2900000.00",
      monthly_spent: "0.00",
      remaining_living_money: "2900000.00",
      daily_available: "96666.00",
      budget_usage_percent: 0,
      recent_transactions: [],
      budget_progress: [],
      weekly_actions: [],
    });

    render(<BudgetsPage />);

    expect(await screen.findByText("카테고리별 예산 사용 데이터가 아직 없어요.")).toBeInTheDocument();
    expect(screen.queryByText("식비")).not.toBeInTheDocument();
    expect(screen.queryByText("68% · 안정")).not.toBeInTheDocument();
  });

  it("saves the recommended allocation for the current budget period", async () => {
    const currentPeriod = `${new Date().toISOString().slice(0, 7)}-01`;
    request.mockResolvedValueOnce({
      id: "budget-1",
      user_id: "user-1",
      period: currentPeriod,
      basis_income_amount: "2900000",
      status: "accepted",
      items: {
        고정비: "1102000",
        생활비: "1015000",
        저축: "580000",
        여유금: "203000",
      },
    });

    render(<BudgetsPage />);

    expect(await screen.findByText("2,900,000원")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "예산 확정 저장" }));

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith(`/budgets/${currentPeriod}`, {
        method: "PUT",
        body: JSON.stringify({
          basis_income_amount: 2900000,
          items: [
            { category_name: "고정비", amount: 1102000, reason: "월세, 통신비, 구독료처럼 매달 빠지는 돈" },
            { category_name: "생활비", amount: 1015000, reason: "식비, 교통, 카페, 쇼핑까지 매일 쓰는 돈" },
            { category_name: "저축", amount: 580000, reason: "먼저 빼두면 흔들리지 않는 돈" },
            { category_name: "여유금", amount: 203000, reason: "예상 밖 지출을 막아주는 완충 금액" },
          ],
        }),
      });
    });
    expect(await screen.findByRole("status")).toHaveTextContent("예산이 저장됐어요.");
  });

  it("refreshes category budget progress after saving the budget", async () => {
    const currentPeriod = `${new Date().toISOString().slice(0, 7)}-01`;
    loadDashboard.mockReset();
    loadDashboard
      .mockResolvedValueOnce({
        period: currentPeriod,
        expected_income: "2900000.00",
        monthly_spent: "67000.00",
        remaining_living_money: "2833000.00",
        daily_available: "94433.00",
        budget_usage_percent: 4,
        recent_transactions: [],
        budget_progress: [
          { category: "고정비", used_amount: "0.00", budget_amount: "1102000.00", used_percent: 0, status: "여유" },
        ],
        weekly_actions: [],
      })
      .mockResolvedValueOnce({
        period: currentPeriod,
        expected_income: "2900000.00",
        monthly_spent: "520000.00",
        remaining_living_money: "2380000.00",
        daily_available: "79333.00",
        budget_usage_percent: 18,
        recent_transactions: [],
        budget_progress: [
          { category: "고정비", used_amount: "520000.00", budget_amount: "1102000.00", used_percent: 47, status: "여유" },
        ],
        weekly_actions: ["저장된 예산 기준으로 사용률을 다시 계산했어요."],
      });
    request.mockResolvedValueOnce({
      id: "budget-1",
      user_id: "user-1",
      period: currentPeriod,
      basis_income_amount: "2900000",
      status: "accepted",
      items: {
        고정비: "1102000",
        생활비: "1015000",
        저축: "580000",
        여유금: "203000",
      },
    });

    render(<BudgetsPage />);

    expect(await screen.findByText("0% · 여유")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "예산 확정 저장" }));

    expect(await screen.findByText("47% · 여유")).toBeInTheDocument();
    expect(screen.getByText((_, node) => node?.textContent === "520,000원 사용 / 1,102,000원 예산")).toBeInTheDocument();
    expect(loadDashboard).toHaveBeenCalledTimes(2);
  });

  it("lets users change allocation ratios before saving the budget", async () => {
    const currentPeriod = `${new Date().toISOString().slice(0, 7)}-01`;
    request.mockResolvedValueOnce({
      id: "budget-1",
      user_id: "user-1",
      period: currentPeriod,
      basis_income_amount: "2900000",
      status: "accepted",
      items: {
        고정비: "1160000",
        생활비: "1015000",
        저축: "580000",
        여유금: "203000",
      },
    });

    render(<BudgetsPage />);

    expect(await screen.findByText("2,900,000원")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("고정비 비율"), { target: { value: "40" } });
    expect(await screen.findByText("1,160,000원")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "예산 확정 저장" }));

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith(`/budgets/${currentPeriod}`, {
        method: "PUT",
        body: expect.stringContaining('"category_name":"고정비","amount":1160000'),
      });
    });
  });

  it("automatically adjusts spare money so editable ratios add up to 100 percent", async () => {
    const currentPeriod = `${new Date().toISOString().slice(0, 7)}-01`;

    render(<BudgetsPage />);

    expect(await screen.findByText("2,900,000원")).toBeInTheDocument();
    expect(screen.getByLabelText("여유금 비율")).toBeDisabled();

    fireEvent.change(screen.getByLabelText("고정비 비율"), { target: { value: "40" } });

    expect(screen.getByLabelText("여유금 비율")).toHaveValue(5);
    expect(screen.getByText("현재 비율 합계 100%")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "예산 확정 저장" }));

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith(`/budgets/${currentPeriod}`, {
        method: "PUT",
        body: JSON.stringify({
          basis_income_amount: 2900000,
          items: [
            { category_name: "고정비", amount: 1160000, reason: "월세, 통신비, 구독료처럼 매달 빠지는 돈" },
            { category_name: "생활비", amount: 1015000, reason: "식비, 교통, 카페, 쇼핑까지 매일 쓰는 돈" },
            { category_name: "저축", amount: 580000, reason: "먼저 빼두면 흔들리지 않는 돈" },
            { category_name: "여유금", amount: 145000, reason: "예상 밖 지출을 막아주는 완충 금액" },
          ],
        }),
      });
    });
  });

  it("blocks saving when editable ratios go over 100 percent", async () => {
    render(<BudgetsPage />);

    expect(await screen.findByText("2,900,000원")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("저축 비율"), { target: { value: "30" } });

    expect(screen.getByLabelText("여유금 비율")).toHaveValue(0);
    expect(screen.getByText("비율 합계가 100%를 넘었어요. 다른 항목을 줄여주세요.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "예산 확정 저장" })).toBeDisabled();
  });
});
