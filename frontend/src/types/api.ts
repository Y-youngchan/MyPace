export type IncomeEntry = {
  id: string;
  user_id: string;
  source_id: string;
  period: string;
  expected_amount: string;
  actual_amount: string | null;
  received_at: string | null;
};

export type CalendarEvent = {
  id: string;
  event_date: string;
  event_type: "income" | "expense" | "budget";
  title: string;
  amount: string | null;
};
