import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "../api/client";
import TransactionsPage from "./TransactionsPage";

vi.mock("../api/client", () => ({
  apiRequest: vi.fn(),
}));

const request = vi.mocked(apiRequest);

const defaultTransactions = {
  items: [
    {
      id: "transaction-1",
      user_id: "user-1",
      amount: "12000.00",
      kind: "expense",
      occurred_at: "2026-08-12T00:00:00+00:00",
      description: "점심 식사",
      category_name: "식비",
      category_id: "category-1",
      account_id: "account-1",
      is_synthetic: false,
    },
    {
      id: "transaction-2",
      user_id: "user-1",
      amount: "2800000.00",
      kind: "income",
      occurred_at: "2026-08-01T00:00:00+00:00",
      description: "월급",
      category_name: "급여",
      category_id: "category-2",
      account_id: "account-1",
      is_synthetic: false,
    },
  ],
  total: 2,
};

const julyTransactions = {
  items: [
    {
      id: "transaction-3",
      user_id: "user-1",
      amount: "55000.00",
      kind: "expense",
      occurred_at: "2026-07-20T00:00:00+00:00",
      description: "7월 교통비",
      category_name: "교통",
      category_id: "category-3",
      account_id: "account-1",
      is_synthetic: false,
    },
  ],
  total: 1,
};

const defaultCategories = [
  { id: "category-1", user_id: "user-1", name: "식비", kind: "expense" },
  { id: "category-2", user_id: "user-1", name: "급여", kind: "income" },
  { id: "category-3", user_id: "user-1", name: "교통", kind: "expense" },
];

function mockDefaultApi() {
  request.mockImplementation((path, options) => {
    if (path === "/categories") {
      return Promise.resolve(defaultCategories);
    }

    if (path === "/transactions/transaction-1" && options?.method === "PUT") {
      return Promise.resolve({
        id: "transaction-1",
        user_id: "user-1",
        amount: "18000.00",
        kind: "expense",
        occurred_at: "2026-08-12T00:00:00+00:00",
        description: "저녁 식사",
        category_name: "외식",
        category_id: "category-4",
        account_id: "account-1",
        is_synthetic: false,
      });
    }

    if (path === "/transactions/transaction-1" && options?.method === "DELETE") {
      return Promise.resolve(undefined);
    }

    if (path === "/transactions" && options?.method === "POST") {
      return Promise.resolve({
        id: "transaction-3",
        user_id: "user-1",
        amount: "5800.00",
        kind: "expense",
        occurred_at: "2026-08-13T00:00:00+00:00",
        description: "카페",
        category_name: "카페",
        category_id: "category-4",
        account_id: "account-1",
        is_synthetic: false,
      });
    }

    if (typeof path === "string" && path.includes("start=2026-07-01")) {
      return Promise.resolve(julyTransactions);
    }

    if (typeof path === "string" && path.startsWith("/transactions?")) {
      return Promise.resolve(defaultTransactions);
    }

    return Promise.reject(new Error(`Unhandled request: ${path}`));
  });
}

function getCurrentMonthRange() {
  const month = new Date().toISOString().slice(0, 7);
  const [year, monthNumber] = month.split("-").map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();

  return {
    month,
    start: `${month}-01`,
    end: `${month}-${String(lastDay).padStart(2, "0")}`,
  };
}

describe("TransactionsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDefaultApi();
  });

  it("shows saved transactions from the API", async () => {
    const currentMonthRange = getCurrentMonthRange();

    render(<TransactionsPage />);

    expect(screen.getByRole("heading", { name: "거래내역" })).toBeInTheDocument();
    expect(await screen.findByText("점심 식사")).toBeInTheDocument();
    expect(screen.getByText("-12,000원")).toBeInTheDocument();
    expect(screen.getByText("2026-08-12")).toBeInTheDocument();
    expect(request).toHaveBeenCalledWith(`/transactions?start=${currentMonthRange.start}&end=${currentMonthRange.end}`);
  });

  it("filters the visible list by income or expense", async () => {
    render(<TransactionsPage />);

    expect(await screen.findByText("점심 식사")).toBeInTheDocument();
    expect(screen.getByText("월급")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "수입" }));

    expect(screen.queryByText("점심 식사")).not.toBeInTheDocument();
    expect(screen.getByText("월급")).toBeInTheDocument();
    expect(screen.getAllByText("2,800,000원").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "전체" }));

    expect(screen.getByText("점심 식사")).toBeInTheDocument();
    expect(screen.getByText("월급")).toBeInTheDocument();
  });

  it("loads categories and shows only categories matching the selected transaction kind", async () => {
    render(<TransactionsPage />);

    expect(await screen.findByText("점심 식사")).toBeInTheDocument();
    expect(screen.getByLabelText("카테고리 선택")).toHaveValue("식비");
    expect(screen.getByRole("option", { name: "식비" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "급여" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText("수입"));

    expect(screen.getByLabelText("카테고리 선택")).toHaveValue("급여");
    expect(screen.getByRole("option", { name: "급여" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "식비" })).not.toBeInTheDocument();
  });

  it("keeps a direct category input option for categories that are not prepared yet", async () => {
    render(<TransactionsPage />);

    expect(await screen.findByText("점심 식사")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("카테고리 입력 방식"), { target: { value: "manual" } });
    fireEvent.change(screen.getByLabelText("직접 입력 카테고리"), { target: { value: "카페" } });
    fireEvent.change(screen.getByLabelText("금액"), { target: { value: "5800" } });
    fireEvent.change(screen.getByLabelText("메모"), { target: { value: "카페" } });
    const occurredAt = (screen.getByLabelText("날짜") as HTMLInputElement).value;
    fireEvent.click(screen.getByRole("button", { name: "거래 저장" }));

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith("/transactions", {
        method: "POST",
        body: JSON.stringify({
          amount: 5800,
          kind: "expense",
          occurred_at: occurredAt,
          description: "카페",
          category_name: "카페",
        }),
      });
    });
  });

  it("loads transactions again when the month filter changes", async () => {
    render(<TransactionsPage />);

    await screen.findByText("점심 식사");
    fireEvent.change(screen.getByLabelText("조회 월"), { target: { value: "2026-07" } });

    expect(await screen.findByText("7월 교통비")).toBeInTheDocument();
    expect(request).toHaveBeenCalledWith("/transactions?start=2026-07-01&end=2026-07-31");
  });

  it("keeps the recent transaction list inside a scrollable area", async () => {
    render(<TransactionsPage />);

    expect(await screen.findByText("점심 식사")).toBeInTheDocument();

    expect(screen.getByLabelText("스크롤 가능한 최근 거래 목록")).toHaveClass("overflow-y-auto");
  });

  it("shows income entries from the income page as read-only synthetic transactions", async () => {
    request.mockImplementation((path) => {
      if (path === "/categories") {
        return Promise.resolve(defaultCategories);
      }
      if (typeof path === "string" && path.startsWith("/transactions?")) {
        return Promise.resolve({
          items: [
            {
              id: "income-entry-1",
              user_id: "user-1",
              amount: "2750000.00",
              kind: "income",
              occurred_at: "2026-08-25T00:00:00+00:00",
              description: "월급",
              category_name: "월급",
              category_id: null,
              account_id: null,
              is_synthetic: true,
            },
          ],
          total: 1,
        });
      }
      return Promise.reject(new Error(`Unhandled request: ${path}`));
    });

    render(<TransactionsPage />);

    expect((await screen.findAllByText("월급")).length).toBeGreaterThan(0);
    expect(screen.getByText("수입 메뉴에서 관리")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "월급 수정" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "월급 삭제" })).not.toBeInTheDocument();
  });

  it("links to the categories page when there are no saved categories for the selected kind", async () => {
    request.mockImplementation((path) => {
      if (path === "/categories") {
        return Promise.resolve([{ id: "category-2", user_id: "user-1", name: "급여", kind: "income" }]);
      }
      if (typeof path === "string" && path.startsWith("/transactions?")) {
        return Promise.resolve(defaultTransactions);
      }
      return Promise.reject(new Error(`Unhandled request: ${path}`));
    });

    render(<TransactionsPage />);

    expect(await screen.findByText("점심 식사")).toBeInTheDocument();

    expect(screen.getByText("지출 카테고리가 아직 없어요.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "카테고리 추가하러 가기" })).toHaveAttribute("href", "/categories");
  });

  it("shows category loading state instead of an empty category guide before categories load", async () => {
    request.mockImplementation((path) => {
      if (path === "/categories") {
        return new Promise(() => undefined);
      }
      if (typeof path === "string" && path.startsWith("/transactions?")) {
        return Promise.resolve(defaultTransactions);
      }
      return Promise.reject(new Error(`Unhandled request: ${path}`));
    });

    render(<TransactionsPage />);

    expect(await screen.findByText("점심 식사")).toBeInTheDocument();

    expect(screen.getByText("카테고리를 불러오는 중이에요.")).toBeInTheDocument();
    expect(screen.queryByText("지출 카테고리가 아직 없어요.")).not.toBeInTheDocument();
  });

  it("formats money input and saves a new expense transaction", async () => {
    render(<TransactionsPage />);

    fireEvent.change(screen.getByLabelText("날짜"), { target: { value: "2026-08-13" } });
    fireEvent.change(screen.getByLabelText("카테고리 입력 방식"), { target: { value: "manual" } });
    fireEvent.change(screen.getByLabelText("직접 입력 카테고리"), { target: { value: "카페" } });
    fireEvent.change(screen.getByLabelText("금액"), { target: { value: "5800" } });
    fireEvent.change(screen.getByLabelText("메모"), { target: { value: "카페" } });

    expect(screen.getByLabelText("금액")).toHaveValue("5,800");

    fireEvent.click(screen.getByRole("button", { name: "거래 저장" }));

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith("/transactions", {
        method: "POST",
        body: JSON.stringify({
          amount: 5800,
          kind: "expense",
          occurred_at: "2026-08-13",
          description: "카페",
          category_name: "카페",
        }),
      });
    });
    expect(await screen.findByRole("status")).toHaveTextContent("거래가 저장됐어요. 대시보드와 캘린더에 반영돼요.");
    expect(screen.getAllByText("카페").length).toBeGreaterThan(0);
  });

  it("fills the form from a transaction and saves edits", async () => {
    render(<TransactionsPage />);

    expect(await screen.findByText("점심 식사")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "점심 식사 수정" }));

    expect(screen.getByLabelText("카테고리 선택")).toHaveValue("식비");
    expect(screen.getByLabelText("금액")).toHaveValue("12,000");
    expect(screen.getByLabelText("메모")).toHaveValue("점심 식사");

    fireEvent.change(screen.getByLabelText("카테고리 입력 방식"), { target: { value: "manual" } });
    fireEvent.change(screen.getByLabelText("직접 입력 카테고리"), { target: { value: "외식" } });
    fireEvent.change(screen.getByLabelText("금액"), { target: { value: "18000" } });
    fireEvent.change(screen.getByLabelText("메모"), { target: { value: "저녁 식사" } });
    fireEvent.click(screen.getByRole("button", { name: "거래 수정 저장" }));

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith("/transactions/transaction-1", {
        method: "PUT",
        body: JSON.stringify({
          amount: 18000,
          kind: "expense",
          occurred_at: "2026-08-12",
          description: "저녁 식사",
          category_name: "외식",
        }),
      });
    });
    expect(await screen.findByRole("status")).toHaveTextContent("거래가 수정됐어요. 대시보드와 캘린더에도 반영돼요.");
    expect(screen.getByText("저녁 식사")).toBeInTheDocument();
    expect(screen.queryByText("점심 식사")).not.toBeInTheDocument();
  });

  it("deletes a transaction after confirmation", async () => {
    vi.spyOn(window, "confirm").mockReturnValueOnce(true);

    render(<TransactionsPage />);

    expect(await screen.findByText("점심 식사")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "점심 식사 삭제" }));

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith("/transactions/transaction-1", {
        method: "DELETE",
      });
    });
    expect(await screen.findByRole("status")).toHaveTextContent("거래가 삭제됐어요.");
    expect(screen.queryByText("점심 식사")).not.toBeInTheDocument();
  });
});
