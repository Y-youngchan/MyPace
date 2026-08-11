import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { formatAuthError } from "./authMessages";
import { enableDevDashboardAccess } from "./devAccess";

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setMessage(formatAuthError(error.message));
      return;
    }

    setMessage("로그인되었습니다.");
    navigate("/dashboard", { replace: true });
  }

  async function handleGoogleLogin() {
    await signInWithOAuth("google");
  }

  async function handleKakaoLogin() {
    await signInWithOAuth("kakao");
  }

  function handleOpenDevDashboard() {
    enableDevDashboardAccess();
    navigate("/dashboard", { replace: true });
  }

  async function signInWithOAuth(provider: "google" | "kakao") {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <main className="mx-auto grid min-h-screen max-w-[560px] content-center gap-5 px-6 py-12">
      <section className="grid gap-3">
        <p className="m-0 text-2xl font-extrabold tracking-[-0.02em] text-[#173b68]">MyPace</p>
        <p className="m-0 text-[0.95rem] font-extrabold tracking-[0.08em] text-[#62c6ae] uppercase">나의 지출관리 파트너</p>
        <h1 className="m-0 text-4xl font-extrabold tracking-[-0.06em] text-[#173b68]">로그인</h1>
        <p className="m-0 leading-7 text-[#66758c]">회원가입 후 나만의 지출 관리를 시작해보세요.</p>
      </section>

      <section className="grid gap-4 rounded-[28px] border border-[#173b68]/10 bg-white p-6 shadow-[0_18px_45px_rgba(23,37,63,0.06)]">
        <div>
          <h2 className="m-0 text-2xl font-extrabold tracking-[-0.04em] text-[#17253f]">이미 계정이 있나요?</h2>
          <p className="m-0 mt-1 text-sm text-[#66758c]">로그인 후 바로 대시보드에 들어갈 수 있어요.</p>
        </div>
        <form className="grid gap-3" onSubmit={handleSignIn}>
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
        <div className="flex justify-center gap-3 text-sm font-bold text-[#66758c]">
          <Link className="text-[#173b68] no-underline" to="/find-email">
            이메일 찾기
          </Link>
          <span aria-hidden="true">·</span>
          <Link className="text-[#173b68] no-underline" to="/forgot-password">
            비밀번호 찾기
          </Link>
        </div>
      </section>

      <section className="grid gap-3 rounded-[28px] border border-[#173b68]/10 bg-white/75 p-6">
        <div>
          <h2 className="m-0 text-xl font-extrabold tracking-[-0.04em] text-[#17253f]">처음 오셨나요?</h2>
          <p className="m-0 mt-1 text-sm text-[#66758c]">이메일로 계정을 만들고 MyPace를 시작해요.</p>
        </div>
        <Link className="rounded-full border border-[#173b68]/15 bg-white px-5 py-3 text-center font-bold text-[#173b68] no-underline" to="/signup">
          회원가입하기
        </Link>
      </section>

      <section className="grid gap-3">
        <p className="m-0 text-center text-sm font-bold text-[#66758c]">간편 로그인</p>
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
      </section>

      {import.meta.env.DEV && (
        <section className="grid gap-2 rounded-[24px] border border-dashed border-[#173b68]/20 bg-white/55 p-4">
          <p className="m-0 text-sm font-bold text-[#66758c]">회원가입 메일 제한에 걸렸을 때 화면 확인용이에요.</p>
          <button
            className="cursor-pointer rounded-full border border-[#173b68]/15 bg-white px-5 py-3 font-bold text-[#173b68]"
            type="button"
            onClick={handleOpenDevDashboard}
          >
            개발용 대시보드 보기
          </button>
        </section>
      )}
      {message && (
        <p className="rounded-2xl bg-white px-4 py-3 text-[#4c5f7c]" role="status">
          {message}
        </p>
      )}
    </main>
  );
}
