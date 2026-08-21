import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "../api/client";
import CategoriesPage from "./CategoriesPage";

vi.mock("../api/client", () => ({
  apiRequest: vi.fn(),
}));

const request = vi.mocked(apiRequest);

describe("CategoriesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    request.mockResolvedValueOnce([
      { id: "category-1", user_id: "user-1", name: "식비", kind: "expense", cost_type: "variable" },
      { id: "category-2", user_id: "user-1", name: "월급", kind: "income", cost_type: null },
    ]);
  });

  it("shows saved categories from the API", async () => {
    render(<CategoriesPage />);

    expect(screen.getByRole("heading", { name: "카테고리" })).toBeInTheDocument();
    expect(await screen.findByText("식비")).toBeInTheDocument();
    expect(screen.getByText("월급")).toBeInTheDocument();
    expect(screen.getAllByText("지출").length).toBeGreaterThan(0);
    expect(screen.getAllByText("수입").length).toBeGreaterThan(0);
    expect(screen.getAllByText("변동비").length).toBeGreaterThan(0);
  });

  it("filters the category list by expense and income", async () => {
    render(<CategoriesPage />);

    expect(await screen.findByText("식비")).toBeInTheDocument();
    expect(screen.getByText("월급")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "지출" }));

    expect(screen.getByText("식비")).toBeInTheDocument();
    expect(screen.queryByText("월급")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "수입" }));

    expect(screen.queryByText("식비")).not.toBeInTheDocument();
    expect(screen.getByText("월급")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "전체" }));

    expect(screen.getByText("식비")).toBeInTheDocument();
    expect(screen.getByText("월급")).toBeInTheDocument();
  });

  it("keeps the category list inside a scrollable list area", async () => {
    render(<CategoriesPage />);

    expect(await screen.findByText("식비")).toBeInTheDocument();

    expect(screen.getByLabelText("스크롤 가능한 카테고리 목록")).toHaveClass("overflow-y-auto");
  });

  it("resets the category list scroll position when changing filters", async () => {
    render(<CategoriesPage />);

    expect(await screen.findByText("식비")).toBeInTheDocument();
    const scrollArea = screen.getByLabelText("스크롤 가능한 카테고리 목록");
    scrollArea.scrollTop = 180;

    fireEvent.click(screen.getByRole("button", { name: "지출" }));

    expect(scrollArea.scrollTop).toBe(0);
  });

  it("creates a category from the form", async () => {
    request.mockResolvedValueOnce({ id: "category-3", user_id: "user-1", name: "교통", kind: "expense", cost_type: "variable" });

    render(<CategoriesPage />);

    fireEvent.change(screen.getByLabelText("카테고리 이름"), { target: { value: "교통" } });
    fireEvent.click(screen.getByLabelText("변동비"));
    fireEvent.click(screen.getByRole("button", { name: "카테고리 저장" }));

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith("/categories", {
        method: "POST",
        body: JSON.stringify({ name: "교통", kind: "expense", cost_type: "variable" }),
      });
    });
    expect(await screen.findByRole("status")).toHaveTextContent("카테고리가 저장됐어요.");
    expect(screen.getByText("교통")).toBeInTheDocument();
  });

  it("fills the form from a category and saves edits", async () => {
    request.mockResolvedValueOnce({ id: "category-1", user_id: "user-1", name: "외식", kind: "expense", cost_type: "fixed" });

    render(<CategoriesPage />);

    expect(await screen.findByText("식비")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "식비 수정" }));

    expect(screen.getByLabelText("카테고리 이름")).toHaveValue("식비");
    expect(screen.getByLabelText("변동비")).toBeChecked();
    fireEvent.change(screen.getByLabelText("카테고리 이름"), { target: { value: "외식" } });
    fireEvent.click(screen.getByLabelText("고정비"));
    fireEvent.click(screen.getByRole("button", { name: "카테고리 수정 저장" }));

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith("/categories/category-1", {
        method: "PUT",
        body: JSON.stringify({ name: "외식", kind: "expense", cost_type: "fixed" }),
      });
    });
    expect(await screen.findByRole("status")).toHaveTextContent("카테고리가 수정됐어요.");
    expect(screen.getByText("외식")).toBeInTheDocument();
    expect(screen.queryByText("식비")).not.toBeInTheDocument();
  });

  it("hides cost type selection for income categories and sends null cost type", async () => {
    request.mockResolvedValueOnce({ id: "category-4", user_id: "user-1", name: "이자", kind: "income", cost_type: null });

    render(<CategoriesPage />);

    fireEvent.click(screen.getByLabelText("수입"));

    expect(screen.queryByText("비용 성격")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("카테고리 이름"), { target: { value: "이자" } });
    fireEvent.click(screen.getByRole("button", { name: "카테고리 저장" }));

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith("/categories", {
        method: "POST",
        body: JSON.stringify({ name: "이자", kind: "income", cost_type: null }),
      });
    });
  });
});
