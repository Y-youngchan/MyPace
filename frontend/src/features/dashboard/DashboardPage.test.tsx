import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { getDashboardSummary } from "../../api/dashboard";
import DashboardPage from "./DashboardPage";

vi.mock("../../api/dashboard", () => ({
  getDashboardSummary: vi.fn(),
}));

const loadDashboard = vi.mocked(getDashboardSummary);

function renderDashboardPage() {
  render(
    <BrowserRouter>
      <DashboardPage />
    </BrowserRouter>,
  );
}

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadDashboard.mockResolvedValue({
      period: "2026-08-01",
      expected_income: "2800000.00",
      monthly_spent: "67000.00",
      remaining_living_money: "2733000.00",
      daily_available: "91100.00",
      budget_usage_percent: 10,
      recent_transactions: [{ title: "점심 식사", category: "식비", amount: "12000.00" }],
      budget_progress: [{ category: "식비", used_amount: "12000.00", budget_amount: "500000.00", used_percent: 2, status: "여유" }],
      weekly_actions: ["이번 주는 예산 사용률이 높은 항목부터 먼저 확인해보세요."],
    });
  });

  it("shows the top money summary cards", async () => {
    renderDashboardPage();

    expect(screen.getByRole("heading", { name: "오늘의 마이페이스" })).toBeInTheDocument();
    expect(screen.getByText("이번 달 예상 수입")).toBeInTheDocument();
    expect(screen.getByText("이번 달 지출")).toBeInTheDocument();
    expect(screen.getByText("남은 생활비")).toBeInTheDocument();
    expect(screen.getByText("예산 사용률")).toBeInTheDocument();
    expect(await screen.findByText("2,733,000원")).toBeInTheDocument();
  });

  it("shows API budget progress and weekly action guidance", async () => {
    renderDashboardPage();

    expect(screen.getByRole("heading", { name: "예산 진행률" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "이번 주 추천 행동" })).toBeInTheDocument();
    expect(await screen.findByText("이번 주는 예산 사용률이 높은 항목부터 먼저 확인해보세요.")).toBeInTheDocument();
    expect(screen.getByText("2% · 여유")).toBeInTheDocument();
  });

  it("guides first-time users to enter income, budgets, and transactions", async () => {
    loadDashboard.mockResolvedValueOnce({
      period: "2026-08-01",
      expected_income: "0.00",
      monthly_spent: "0.00",
      remaining_living_money: "0.00",
      daily_available: "0.00",
      budget_usage_percent: 0,
      recent_transactions: [],
      budget_progress: [],
      weekly_actions: ["수입을 먼저 입력하면 이번 달 예산 기준선을 만들 수 있어요."],
    });

    renderDashboardPage();

    expect(await screen.findByRole("heading", { name: "처음 시작을 도와드릴게요" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "수입 입력하기" })).toHaveAttribute("href", "/income");
    expect(screen.getByRole("link", { name: "예산 만들기" })).toHaveAttribute("href", "/budgets");
    expect(screen.getByRole("link", { name: "거래 추가하기" })).toHaveAttribute("href", "/transactions");
    expect(screen.getByRole("link", { name: "거래 추가" })).toHaveAttribute("href", "/transactions");
    expect(screen.getByText("아직 거래가 없어요.")).toBeInTheDocument();
    expect(screen.getByText("예산을 만들면 카테고리별 사용 속도를 볼 수 있어요.")).toBeInTheDocument();
  });

  it("keeps dashboard transaction actions inside the content cards", () => {
    renderDashboardPage();

    expect(screen.queryByRole("link", { name: "거래 추가" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "전체 보기" })).toHaveAttribute("href", "/transactions");
  });

  it("keeps the local fallback dashboard when the API is not available", async () => {
    loadDashboard.mockRejectedValueOnce(new Error("backend offline"));

    renderDashboardPage();

    expect(await screen.findByText("외식 예산은 이번 주 90,000원 안에서 맞춰보세요.")).toBeInTheDocument();
    expect(screen.getByText("64%")).toBeInTheDocument();
  });

  it("uses stable 4 to 2 to 1 summary card columns", () => {
    renderDashboardPage();

    expect(screen.getByTestId("dashboard-page")).toHaveClass("w-full");
    expect(screen.getByTestId("dashboard-page")).toHaveClass("max-w-[1680px]");
    expect(screen.getByLabelText("상단 요약")).toHaveClass("grid-cols-4");
    expect(screen.getByLabelText("상단 요약")).toHaveClass("max-[1200px]:grid-cols-2");
    expect(screen.getByLabelText("상단 요약")).toHaveClass("max-[640px]:grid-cols-1");
  });
});
