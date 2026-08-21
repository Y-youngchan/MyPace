import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import LoginPage from "./LoginPage";
import { supabase } from "../../lib/supabase";

vi.mock("../../lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signInWithOAuth: vi.fn(),
    },
  },
}));

const auth = vi.mocked(supabase.auth);

function renderLoginPage() {
  render(
    <BrowserRouter>
      <LoginPage />
    </BrowserRouter>,
  );
}

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    window.localStorage.clear();
    window.history.pushState({}, "", "/login");
    auth.signInWithPassword.mockResolvedValue({ data: {}, error: null } as never);
    auth.signUp.mockResolvedValue({ data: {}, error: null } as never);
    auth.signInWithOAuth.mockResolvedValue({ data: {}, error: null } as never);
  });

  it("hides the local development dashboard shortcut by default", () => {
    renderLoginPage();

    expect(screen.queryByRole("button", { name: "개발용 대시보드 보기" })).not.toBeInTheDocument();
  });

  it("signs in with email and password", async () => {
    renderLoginPage();

    fireEvent.change(screen.getByLabelText("이메일"), { target: { value: "youngchan@example.com" } });
    fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: "safe-password" } });
    fireEvent.click(screen.getByRole("button", { name: "이메일로 로그인" }));

    await waitFor(() => {
      expect(auth.signInWithPassword).toHaveBeenCalledWith({
        email: "youngchan@example.com",
        password: "safe-password",
      });
    });
  });

  it("moves to the dashboard after a successful email login", async () => {
    renderLoginPage();

    fireEvent.change(screen.getByLabelText("이메일"), { target: { value: "youngchan@example.com" } });
    fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: "safe-password" } });
    fireEvent.click(screen.getByRole("button", { name: "이메일로 로그인" }));

    await waitFor(() => {
      expect(window.location.pathname).toBe("/dashboard");
    });
  });

  it("moves to the separate sign-up page", async () => {
    renderLoginPage();

    fireEvent.click(screen.getByRole("link", { name: "회원가입하기" }));

    expect(window.location.pathname).toBe("/signup");
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it("opens the dashboard in local development mode", () => {
    vi.stubEnv("VITE_ENABLE_DEV_DASHBOARD", "true");

    renderLoginPage();

    fireEvent.click(screen.getByRole("button", { name: "개발용 대시보드 보기" }));

    expect(window.localStorage.getItem("mypace_dev_dashboard_access")).toBe("true");
    expect(window.location.pathname).toBe("/dashboard");
  });

  it("starts Google and Kakao OAuth login", async () => {
    renderLoginPage();

    fireEvent.click(screen.getByRole("button", { name: "Google로 계속하기" }));
    fireEvent.click(screen.getByRole("button", { name: "Kakao로 계속하기" }));

    await waitFor(() => {
      expect(auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      expect(auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: "kakao",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
    });
  });

  it("does not render phone login", () => {
    renderLoginPage();

    expect(screen.queryByText(/휴대폰/)).not.toBeInTheDocument();
  });
});
