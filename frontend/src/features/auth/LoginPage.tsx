import { FormEvent, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setMessage(error ? formatAuthError(error.message) : "로그인되었습니다.");
  }

  async function handleSignUp() {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    setMessage(error ? formatAuthError(error.message) : "가입 확인 메일을 확인해주세요.");
  }

  async function handleGoogleLogin() {
    await signInWithOAuth("google");
  }

  async function handleKakaoLogin() {
    await signInWithOAuth("kakao");
  }

  async function signInWithOAuth(provider: "google" | "kakao") {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <main className="mx-auto grid min-h-screen max-w-[520px] content-center gap-5 px-6 py-12">
      <p className="m-0 font-bold tracking-[-0.02em] text-[#173b68]">MyPace</p>
      <h1 className="m-0 text-4xl font-extrabold tracking-[-0.06em] text-[#173b68]">로그인</h1>
      <form className="grid gap-3 rounded-[28px] border border-[#173b68]/10 bg-white p-6 shadow-[0_18px_45px_rgba(23,37,63,0.06)]" onSubmit={handleSignIn}>
        <label className="font-bold text-[#17253f]" htmlFor="email">
          이메일
        </label>
        <input
          className="rounded-2xl border border-[#dfe5e2] bg-white px-4 py-3 outline-[#62c6ae]"
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <label className="font-bold text-[#17253f]" htmlFor="password">
          비밀번호
        </label>
        <input
          className="rounded-2xl border border-[#dfe5e2] bg-white px-4 py-3 outline-[#62c6ae]"
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={8}
          required
        />
        <button className="mt-2 cursor-pointer rounded-full bg-[#173b68] px-5 py-3 font-bold text-white" type="submit">
          이메일로 로그인
        </button>
      </form>
      <button
        className="cursor-pointer rounded-full border border-[#173b68]/15 bg-white px-5 py-3 font-bold text-[#173b68]"
        type="button"
        onClick={handleSignUp}
      >
        이메일로 회원가입
      </button>
      <button
        className="cursor-pointer rounded-full border border-[#173b68]/15 bg-white px-5 py-3 font-bold text-[#173b68]"
        type="button"
        onClick={handleGoogleLogin}
      >
        Google로 계속하기
      </button>
      <button
        className="cursor-pointer rounded-full bg-[#fee500] px-5 py-3 font-bold text-[#2f201b]"
        type="button"
        onClick={handleKakaoLogin}
      >
        Kakao로 계속하기
      </button>
      {message && (
        <p className="rounded-2xl bg-white px-4 py-3 text-[#4c5f7c]" role="status">
          {message}
        </p>
      )}
    </main>
  );
}

function formatAuthError(message: string) {
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes("already") || lowerMessage.includes("registered")) {
    return "이미 가입된 이메일입니다. 기존 가입 방식으로 로그인해주세요.";
  }
  if (lowerMessage.includes("invalid login")) {
    return "이메일 또는 비밀번호를 확인해주세요.";
  }
  return "인증 처리 중 문제가 발생했습니다.";
}
