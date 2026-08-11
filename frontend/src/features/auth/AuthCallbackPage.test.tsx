import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AuthCallbackPage from "./AuthCallbackPage";
import { supabase } from "../../lib/supabase";

vi.mock("../../lib/supabase", () => ({
  supabase: {
    auth: {
      exchangeCodeForSession: vi.fn(),
    },
  },
}));

const auth = vi.mocked(supabase.auth);

function renderAuthCallbackPage(path = "/auth/callback?code=oauth-code") {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/dashboard" element={<h1>대시보드</h1>} />
        <Route path="/login" element={<h1>로그인</h1>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AuthCallbackPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.exchangeCodeForSession.mockResolvedValue({ data: {}, error: null } as never);
  });

  it("exchanges the OAuth code and moves to the dashboard", async () => {
    renderAuthCallbackPage();

    expect(screen.getByText("로그인을 마무리하고 있습니다.")).toBeInTheDocument();

    await waitFor(() => {
      expect(auth.exchangeCodeForSession).toHaveBeenCalledWith("oauth-code");
    });
    expect(await screen.findByRole("heading", { name: "대시보드" })).toBeInTheDocument();
  });

  it("moves back to login when the OAuth callback has no code", async () => {
    renderAuthCallbackPage("/auth/callback");

    expect(await screen.findByRole("heading", { name: "로그인" })).toBeInTheDocument();
    expect(auth.exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("shows an error guide when the OAuth code exchange fails", async () => {
    auth.exchangeCodeForSession.mockResolvedValueOnce({
      data: {},
      error: { message: "invalid callback code" },
    } as never);

    renderAuthCallbackPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("소셜 로그인 처리 중 문제가 발생했습니다.");
    expect(screen.getByRole("link", { name: "로그인으로 돌아가기" })).toHaveAttribute("href", "/login");
  });
});
