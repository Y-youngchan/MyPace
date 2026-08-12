export type IncomeEntry = {
  id: string;
  user_id: string;
  source_id: string;
  period: string;
  expected_amount: string;
  actual_amount: string | null;
  received_at: string | null;
};

export type BudgetResponse = {
  id: string;
  user_id: string;
  period: string;
  basis_income_amount: string;
  status: string;
  items: Record<string, string>;
};

export type TransactionEntry = {
  id: string;
  user_id: string;
  amount: string;
  kind: "income" | "expense";
  occurred_at: string;
  description: string;
  category_name?: string | null;
  category_id: string | null;
  account_id: string;
  is_synthetic: boolean;
};

export type TransactionListResponse = {
  items: TransactionEntry[];
  total: number;
};

export type CategoryEntry = {
  id: string;
  user_id: string;
  name: string;
  kind: "income" | "expense";
};

export type CalendarEvent = {
  id: string;
  event_date: string;
  event_type: "income" | "expense" | "budget";
  title: string;
  amount: string | null;
};
