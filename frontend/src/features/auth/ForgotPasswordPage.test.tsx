import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import ForgotPasswordPage from "./ForgotPasswordPage";
import { verifyPasswordReset } from "../../api/accountRecovery";
import { supabase } from "../../lib/supabase";

vi.mock("../../api/accountRecovery", () => ({
  verifyPasswordReset: vi.fn(),
}));

vi.mock("../../lib/supabase", () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: vi.fn(),
    },
  },
}));

const verifyPasswordResetMock = vi.mocked(verifyPasswordReset);
const auth = vi.mocked(supabase.auth);

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifyPasswordResetMock.mockResolvedValue({ can_reset: true });
    auth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null } as never);
  });

  it("sends a reset email after email name and phone match", async () => {
    render(
      <BrowserRouter>
        <ForgotPasswordPage />
      </BrowserRouter>,
    );

    fireEvent.change(screen.getByLabelText("가입된 이메일"), { target: { value: "youngchan@example.com" } });
    fireEvent.change(screen.getByLabelText("이름"), { target: { value: "유영찬" } });
    fireEvent.change(screen.getByLabelText("휴대폰번호"), { target: { value: "01012345678" } });
    fireEvent.click(screen.getByRole("button", { name: "비밀번호 재설정 메일 받기" }));

    await waitFor(() => {
      expect(verifyPasswordResetMock).toHaveBeenCalledWith({
        email: "youngchan@example.com",
        full_name: "유영찬",
        phone_number: "01012345678",
      });
    });
    expect(auth.resetPasswordForEmail).toHaveBeenCalledWith("youngchan@example.com", {
      redirectTo: `${window.location.origin}/update-password`,
    });
    expect(await screen.findByRole("status")).toHaveTextContent("비밀번호 재설정 메일을 보냈습니다.");
  });
});
