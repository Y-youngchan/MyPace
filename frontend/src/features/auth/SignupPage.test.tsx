import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import SignupPage from "./SignupPage";
import { supabase } from "../../lib/supabase";
import { createSignupProfile } from "../../api/accountRecovery";

vi.mock("../../lib/supabase", () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
    },
  },
}));

vi.mock("../../api/accountRecovery", () => ({
  createSignupProfile: vi.fn(),
}));

const auth = vi.mocked(supabase.auth);
const createProfile = vi.mocked(createSignupProfile);

function renderSignupPage() {
  render(
    <BrowserRouter>
      <SignupPage />
    </BrowserRouter>,
  );
}

describe("SignupPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, "", "/signup");
    auth.signUp.mockResolvedValue({ data: { user: { id: "user-id" } }, error: null } as never);
    createProfile.mockResolvedValue({} as never);
  });

  it("creates an email account from a separate sign-up page", async () => {
    renderSignupPage();

    fireEvent.change(screen.getByLabelText("이메일"), { target: { value: "youngchan@example.com" } });
    fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: "safe1234!" } });
    fireEvent.change(screen.getByLabelText("비밀번호 확인"), { target: { value: "safe1234!" } });
    fireEvent.change(screen.getByLabelText("이름"), { target: { value: "유영찬" } });
    fireEvent.change(screen.getByLabelText("사용자 닉네임"), { target: { value: "찬이" } });
    fireEvent.change(screen.getByLabelText("휴대폰번호"), { target: { value: "010-1234-5678" } });
    fireEvent.click(screen.getByRole("button", { name: "이메일로 회원가입" }));

    await waitFor(() => {
      expect(auth.signUp).toHaveBeenCalledWith({
        email: "youngchan@example.com",
        password: "safe1234!",
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: "유영찬",
            nickname: "찬이",
            phone_number: "010-1234-5678",
          },
        },
      });
    });
    expect(createProfile).toHaveBeenCalledWith({
      user_id: "user-id",
      email: "youngchan@example.com",
      display_name: "찬이",
      full_name: "유영찬",
      nickname: "찬이",
      phone_number: "010-1234-5678",
      user_type: "worker",
    });
    expect(await screen.findByRole("status")).toHaveTextContent("가입 확인 메일을 확인해주세요.");
  });

  it("shows a password rule guide before requesting sign-up", async () => {
    renderSignupPage();

    fireEvent.change(screen.getByLabelText("이메일"), { target: { value: "youngchan@example.com" } });
    fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: "password" } });
    fireEvent.change(screen.getByLabelText("비밀번호 확인"), { target: { value: "password" } });
    fireEvent.change(screen.getByLabelText("이름"), { target: { value: "유영찬" } });
    fireEvent.change(screen.getByLabelText("사용자 닉네임"), { target: { value: "찬이" } });
    fireEvent.change(screen.getByLabelText("휴대폰번호"), { target: { value: "010-1234-5678" } });
    fireEvent.click(screen.getByRole("button", { name: "이메일로 회원가입" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("비밀번호는 영문과 숫자를 포함해 8자 이상이어야 합니다.");
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it("shows a password confirmation guide before requesting sign-up", async () => {
    renderSignupPage();

    fireEvent.change(screen.getByLabelText("이메일"), { target: { value: "youngchan@example.com" } });
    fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: "safe1234!" } });
    fireEvent.change(screen.getByLabelText("비밀번호 확인"), { target: { value: "safe12345!" } });
    fireEvent.change(screen.getByLabelText("이름"), { target: { value: "유영찬" } });
    fireEvent.change(screen.getByLabelText("사용자 닉네임"), { target: { value: "찬이" } });
    fireEvent.change(screen.getByLabelText("휴대폰번호"), { target: { value: "010-1234-5678" } });
    fireEvent.click(screen.getByRole("button", { name: "이메일로 회원가입" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("비밀번호 확인이 일치하지 않습니다.");
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it("shows a nickname length guide before requesting sign-up", async () => {
    renderSignupPage();

    fireEvent.change(screen.getByLabelText("이메일"), { target: { value: "youngchan@example.com" } });
    fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: "safe1234!" } });
    fireEvent.change(screen.getByLabelText("비밀번호 확인"), { target: { value: "safe1234!" } });
    fireEvent.change(screen.getByLabelText("이름"), { target: { value: "유영찬" } });
    fireEvent.change(screen.getByLabelText("사용자 닉네임"), { target: { value: "길이가긴닉네임입니다요" } });
    fireEvent.change(screen.getByLabelText("휴대폰번호"), { target: { value: "010-1234-5678" } });
    fireEvent.click(screen.getByRole("button", { name: "이메일로 회원가입" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("닉네임은 10자 이내로 입력해주세요.");
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it("shows that nickname tags are assigned automatically", () => {
    renderSignupPage();

    expect(screen.getByText("동일한 닉네임은 자동 태그번호로 구분돼요.")).toBeInTheDocument();
  });

  it("moves to the dashboard when sign-up also creates a login session", async () => {
    auth.signUp.mockResolvedValueOnce({
      data: { session: { access_token: "new-session" } },
      error: null,
    } as never);

    renderSignupPage();

    fireEvent.change(screen.getByLabelText("이메일"), { target: { value: "youngchan@example.com" } });
    fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: "safe1234!" } });
    fireEvent.change(screen.getByLabelText("비밀번호 확인"), { target: { value: "safe1234!" } });
    fireEvent.change(screen.getByLabelText("이름"), { target: { value: "유영찬" } });
    fireEvent.change(screen.getByLabelText("사용자 닉네임"), { target: { value: "찬이" } });
    fireEvent.change(screen.getByLabelText("휴대폰번호"), { target: { value: "010-1234-5678" } });
    fireEvent.click(screen.getByRole("button", { name: "이메일로 회원가입" }));

    await waitFor(() => {
      expect(window.location.pathname).toBe("/dashboard");
    });
  });

  it("shows a duplicate email guide when the email already belongs to another auth method", async () => {
    auth.signUp.mockResolvedValueOnce({ data: {}, error: { message: "User already registered" } } as never);

    renderSignupPage();

    fireEvent.change(screen.getByLabelText("이메일"), { target: { value: "youngchan@example.com" } });
    fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: "safe1234!" } });
    fireEvent.change(screen.getByLabelText("비밀번호 확인"), { target: { value: "safe1234!" } });
    fireEvent.change(screen.getByLabelText("이름"), { target: { value: "유영찬" } });
    fireEvent.change(screen.getByLabelText("사용자 닉네임"), { target: { value: "찬이" } });
    fireEvent.change(screen.getByLabelText("휴대폰번호"), { target: { value: "010-1234-5678" } });
    fireEvent.click(screen.getByRole("button", { name: "이메일로 회원가입" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("이미 존재하는 이메일입니다.");
  });

  it("prevents repeated sign-up clicks while Supabase is processing", async () => {
    auth.signUp.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ data: { user: { id: "user-id" } }, error: null } as never), 100);
        }) as never,
    );

    renderSignupPage();

    fireEvent.change(screen.getByLabelText("이메일"), { target: { value: "youngchan@example.com" } });
    fireEvent.change(screen.getByLabelText("비밀번호"), { target: { value: "safe1234!" } });
    fireEvent.change(screen.getByLabelText("비밀번호 확인"), { target: { value: "safe1234!" } });
    fireEvent.change(screen.getByLabelText("이름"), { target: { value: "유영찬" } });
    fireEvent.change(screen.getByLabelText("사용자 닉네임"), { target: { value: "찬이" } });
    fireEvent.change(screen.getByLabelText("휴대폰번호"), { target: { value: "010-1234-5678" } });

    const button = screen.getByRole("button", { name: "이메일로 회원가입" });
    fireEvent.click(button);
    fireEvent.click(button);

    expect(button).toBeDisabled();
    expect(auth.signUp).toHaveBeenCalledTimes(1);
  });
});
