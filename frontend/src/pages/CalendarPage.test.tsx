import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CalendarPage from "./CalendarPage";
import { apiRequest } from "../api/client";

vi.mock("../api/client", () => ({
  apiRequest: vi.fn(),
}));

const request = vi.mocked(apiRequest);

describe("CalendarPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows monthly money events from the calendar API", async () => {
    request.mockResolvedValueOnce([
      {
        id: "transaction-1",
        event_date: "2026-08-03",
        event_type: "expense",
        title: "점심 식사",
        amount: "12000",
      },
      {
        id: "income-1",
        event_date: "2026-08-25",
        event_type: "income",
        title: "월급 입금",
        amount: "2750000",
      },
    ]);

    render(<CalendarPage />);

    expect(screen.getByRole("heading", { name: "캘린더" })).toBeInTheDocument();
    expect(await screen.findByText("점심 식사")).toBeInTheDocument();
    expect(screen.getAllByText("12,000원").length).toBeGreaterThan(0);
    expect(screen.getByText("월급 입금")).toBeInTheDocument();
    expect(screen.getAllByText("2,750,000원").length).toBeGreaterThan(0);
  });

  it("shows an empty state when this month has no money events", async () => {
    request.mockResolvedValueOnce([]);

    render(<CalendarPage />);

    expect(await screen.findByText("이번 달 돈 일정이 아직 없어요.")).toBeInTheDocument();
  });
});
