import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
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

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.signInWithPassword.mockResolvedValue({ data: {}, error: null } as never);
    auth.signUp.mockResolvedValue({ data: {}, error: null } as never);
    auth.signInWithOAuth.mockResolvedValue({ data: {}, error: null } as never);
  });

  it("signs in with email and password", async () => {
    render(<LoginPage />);

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

  it("signs up with email and password", async () => {
    render(<LoginPage />);

    fireEvent.change(screen.getByLabelText("이메일"), { target: { value: "youngchan@example.com" } });
    fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: "safe-password" } });
    fireEvent.click(screen.getByRole("button", { name: "이메일로 회원가입" }));

    await waitFor(() => {
      expect(auth.signUp).toHaveBeenCalledWith({
        email: "youngchan@example.com",
        password: "safe-password",
      });
    });
  });

  it("starts Google and Kakao OAuth login", async () => {
    render(<LoginPage />);

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
    render(<LoginPage />);

    expect(screen.queryByText(/휴대폰/)).not.toBeInTheDocument();
  });
});
