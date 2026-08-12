import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { formatAuthError } from "./authMessages";
import { isValidSignupPassword } from "./signupValidation";

type SignupNotice = {
  tone: "success" | "error";
  text: string;
} | null;

export default function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [notice, setNotice] = useState<SignupNotice>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }
    setNotice(null);

    if (!isValidSignupPassword(password)) {
      setNotice({ tone: "error", text: "비밀번호는 영문과 숫자를 포함해 8자 이상이어야 합니다." });
      return;
    }

    if (password !== passwordConfirmation) {
      setNotice({ tone: "error", text: "비밀번호 확인이 일치하지 않습니다." });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        setNotice({ tone: "error", text: formatAuthError(error.message) });
        return;
      }

      if (data.session) {
        navigate("/dashboard", { replace: true });
        return;
      }

      setNotice({ tone: "success", text: "입력한 이메일로 인증 메일을 보냈어요. 메일함에서 가입 인증을 진행해주세요." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto grid min-h-screen max-w-[560px] content-center gap-5 px-6 py-12">
      <section className="grid gap-3">
        <p className="m-0 text-2xl font-extrabold tracking-[-0.02em] text-[#173b68]">MyPace</p>
        <p className="m-0 text-[0.95rem] font-extrabold tracking-[0.08em] text-[#62c6ae] uppercase">나의 지출관리 파트너</p>
        <h1 className="m-0 text-4xl font-extrabold tracking-[-0.06em] text-[#173b68]">회원가입</h1>
      </section>

      <section className="grid gap-4 rounded-[28px] border border-[#173b68]/10 bg-white p-6 shadow-[0_18px_45px_rgba(23,37,63,0.06)]">
        <div>
          <h2 className="m-0 text-2xl font-extrabold tracking-[-0.04em] text-[#17253f]">이메일로 시작하기</h2>
          <p className="m-0 mt-1 text-sm text-[#66758c]">비밀번호는 영문과 숫자를 포함해 8자 이상으로 입력해주세요.</p>
        </div>
        <form className="grid gap-3" onSubmit={handleSignUp}>
          <label className="font-bold text-[#17253f]" htmlFor="signup-email">
            이메일
          </label>
          <input
            className="rounded-2xl border border-[#dfe5e2] bg-white px-4 py-3 outline-[#62c6ae]"
            id="signup-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <label className="font-bold text-[#17253f]" htmlFor="signup-password">
            비밀번호
          </label>
          <input
            className="rounded-2xl border border-[#dfe5e2] bg-white px-4 py-3 outline-[#62c6ae]"
            id="signup-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
          />
          <label className="font-bold text-[#17253f]" htmlFor="signup-password-confirmation">
            비밀번호 확인
          </label>
          <input
            className="rounded-2xl border border-[#dfe5e2] bg-white px-4 py-3 outline-[#62c6ae]"
            id="signup-password-confirmation"
            type="password"
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            minLength={8}
            required
          />
          <button className="mt-2 cursor-pointer rounded-full bg-[#173b68] px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "처리 중..." : "이메일로 회원가입"}
          </button>
        </form>
      </section>

      <Link className="text-center font-extrabold text-[#173b68] no-underline" to="/login">
        이미 계정이 있으면 로그인하기
      </Link>

      {notice && (
        <p
          className={`rounded-2xl bg-white px-4 py-3 ${notice.tone === "error" ? "text-[#9f3328]" : "text-[#4c5f7c]"}`}
          role={notice.tone === "error" ? "alert" : "status"}
        >
          {notice.text}
        </p>
      )}
    </main>
  );
}
