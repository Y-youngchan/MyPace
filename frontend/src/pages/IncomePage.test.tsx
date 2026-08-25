import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import IncomePage from "./IncomePage";
import { apiRequest } from "../api/client";

vi.mock("../api/client", () => ({
  apiRequest: vi.fn(),
}));

const request = vi.mocked(apiRequest);

describe("IncomePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    request.mockResolvedValueOnce([
      {
        id: "income-1",
        user_id: "user-1",
        source_id: "source-1",
        period: "2026-07-01",
        expected_amount: "2800000",
        actual_amount: "2750000",
        received_at: "2026-07-25",
      },
    ]);
  });

  it("shows income summary, form, and saved income entries", async () => {
    render(<IncomePage />);

    expect(screen.getByRole("heading", { name: "수입" })).toBeInTheDocument();
    expect(screen.getByLabelText("수입원 이름")).toBeInTheDocument();
    expect(screen.getByLabelText("예상 수입")).toBeInTheDocument();
    expect(screen.getByLabelText("실제 입금액")).toBeInTheDocument();

    expect(await screen.findByText("2,800,000원")).toBeInTheDocument();
    expect(screen.getAllByText("2,750,000원")).toHaveLength(3);
    expect(screen.getByText("예상보다 50,000원 적게 들어왔어요.")).toBeInTheDocument();
  });

  it("shows the income baseline and budget reflection status", async () => {
    render(<IncomePage />);

    expect(await screen.findByText("월 수입 기준선")).toBeInTheDocument();
    expect(screen.getByText("실제 입금 기준")).toBeInTheDocument();
    expect(screen.getByText("2,750,000원을 이번 달 예산 계산에 반영할 수 있어요.")).toBeInTheDocument();
  });

  it("shows an empty state when there are no income entries yet", async () => {
    request.mockReset();
    request.mockResolvedValueOnce([]);

    render(<IncomePage />);

    expect(await screen.findByText("아직 등록된 수입이 없어요.")).toBeInTheDocument();
    expect(screen.getByText("첫 수입을 입력하면 예산 계산의 기준선이 생겨요.")).toBeInTheDocument();
  });

  it("shows a clear error message when loading income entries fails", async () => {
    request.mockReset();
    request.mockRejectedValueOnce(new Error("network error"));

    render(<IncomePage />);

    expect(await screen.findByRole("alert")).toHaveTextContent("수입 목록을 불러오지 못했어요.");
  });

  it("keeps the form values and shows an error when creating income fails", async () => {
    request.mockRejectedValueOnce(new Error("save error"));

    render(<IncomePage />);

    fireEvent.change(screen.getByLabelText("수입원 이름"), { target: { value: "부수입" } });
    fireEvent.change(screen.getByLabelText("예상 수입"), { target: { value: "500000" } });
    fireEvent.click(screen.getByRole("button", { name: "수입 저장" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("수입을 저장하지 못했어요.");
    expect(screen.getByLabelText("수입원 이름")).toHaveValue("부수입");
    expect(screen.getByLabelText("예상 수입")).toHaveValue("500,000");
  });

  it("formats money fields with commas while typing", async () => {
    render(<IncomePage />);

    fireEvent.change(screen.getByLabelText("예상 수입"), { target: { value: "100000" } });
    fireEvent.change(screen.getByLabelText("실제 입금액"), { target: { value: "95000" } });

    expect(screen.getByLabelText("예상 수입")).toHaveValue("100,000");
    expect(screen.getByLabelText("실제 입금액")).toHaveValue("95,000");
  });

  it("creates an income entry from the form", async () => {
    request.mockResolvedValueOnce({
      id: "income-2",
      user_id: "user-1",
      source_id: "source-2",
      period: "2026-08-01",
      expected_amount: "3000000",
      actual_amount: null,
      received_at: null,
    });

    render(<IncomePage />);

    fireEvent.change(screen.getByLabelText("수입원 이름"), { target: { value: "월급" } });
    fireEvent.change(screen.getByLabelText("기준 월"), { target: { value: "2026-08" } });
    fireEvent.change(screen.getByLabelText("예상 수입"), { target: { value: "3,000,000" } });
    fireEvent.click(screen.getByRole("button", { name: "수입 저장" }));

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith("/incomes", {
        method: "POST",
        body: JSON.stringify({
          source_name: "월급",
          source_type: "salary",
          period: "2026-08-01",
          expected_amount: 3000000,
          actual_amount: null,
          received_at: null,
        }),
      });
    });
  });

  it("deletes an income entry after confirmation and reloads the list", async () => {
    request.mockReset();
    request
      .mockResolvedValueOnce([
        {
          id: "income-1",
          user_id: "user-1",
          source_id: "source-1",
          period: "2026-07-01",
          expected_amount: "2800000",
          actual_amount: "2750000",
          received_at: "2026-07-25",
        },
      ])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([]);
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<IncomePage />);

    fireEvent.click(await screen.findByRole("button", { name: "2026-07 수입 삭제" }));

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith("/incomes/income-1", {
        method: "DELETE",
      });
    });
    expect(await screen.findByText("아직 등록된 수입이 없어요.")).toBeInTheDocument();
    expect(await screen.findByRole("status")).toHaveTextContent("수입이 삭제됐어요.");

    confirm.mockRestore();
  });
});
