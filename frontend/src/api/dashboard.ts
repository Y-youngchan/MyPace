import { apiRequest } from "./client";

export type DashboardRecentTransaction = {
  title: string;
  category: string;
  amount: string;
};

export type DashboardBudgetProgress = {
  category: string;
  used_amount: string;
  budget_amount: string;
  used_percent: number;
  status: "여유" | "안정" | "주의" | "초과";
};

export type DashboardSummary = {
  period: string;
  expected_income: string;
  monthly_spent: string;
  remaining_living_money: string;
  daily_available: string;
  budget_usage_percent: number;
  recent_transactions: DashboardRecentTransaction[];
  budget_progress: DashboardBudgetProgress[];
  weekly_actions: string[];
};

export function getDashboardSummary(period: string) {
  return apiRequest<DashboardSummary>(`/dashboard/summary?period=${period}`);
}
