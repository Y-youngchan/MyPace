import { FormEvent, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    setMessage(error ? "로그인 메일 발송에 실패했습니다." : "로그인 메일을 확인해주세요.");
  }

  async function handleSignUp() {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setMessage(error ? "회원가입 메일 발송에 실패했습니다." : "회원가입 메일을 확인해주세요.");
  }

  async function handleKakaoLogin() {
    await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <main className="welcome-shell">
      <p className="brand">MyPace</p>
      <h1>로그인</h1>
      <form onSubmit={handleSignIn}>
        <label htmlFor="email">이메일</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <button type="submit">이메일로 로그인</button>
      </form>
      <button type="button" onClick={handleSignUp}>
        이메일로 회원가입
      </button>
      <button type="button" onClick={handleKakaoLogin}>
        카카오로 계속하기
      </button>
      {message && <p role="status">{message}</p>}
    </main>
  );
}
