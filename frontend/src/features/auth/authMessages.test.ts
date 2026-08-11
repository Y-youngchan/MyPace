import { describe, expect, it } from "vitest";
import { formatAuthError } from "./authMessages";

describe("formatAuthError", () => {
  it("shows a clear duplicate email message for already registered accounts", () => {
    expect(formatAuthError("User already registered")).toBe("이미 존재하는 이메일입니다.");
    expect(formatAuthError("Email already exists")).toBe("이미 존재하는 이메일입니다.");
  });

  it("keeps the invalid login guide for wrong email or password", () => {
    expect(formatAuthError("Invalid login credentials")).toBe("이메일 또는 비밀번호를 확인해주세요.");
  });

  it("explains common Supabase email setup and rate limit errors", () => {
    expect(formatAuthError("Error sending confirmation email")).toBe("가입 확인 메일 발송에 실패했습니다. Supabase 이메일 설정을 확인해주세요.");
    expect(formatAuthError("Email signups are disabled")).toBe("이메일 회원가입이 꺼져 있습니다. Supabase 이메일 로그인 설정을 확인해주세요.");
    expect(formatAuthError("Email rate limit exceeded")).toBe("이메일 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.");
  });

  it("keeps the original auth message visible for unknown errors", () => {
    expect(formatAuthError("Unexpected Supabase auth failure")).toBe("인증 처리 중 문제가 발생했습니다. Supabase 메시지: Unexpected Supabase auth failure");
  });
});
