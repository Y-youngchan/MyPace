import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { verifyPasswordReset } from "../../api/accountRecovery";
import { supabase } from "../../lib/supabase";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { can_reset } = await verifyPasswordReset({
      email,
      full_name: fullName,
      phone_number: phoneNumber,
    });

    if (!can_reset) {
      setMessage("입력한 정보와 일치하는 계정을 찾지 못했습니다.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    setMessage(error ? "비밀번호 재설정 메일 발송에 실패했습니다." : "비밀번호 재설정 메일을 보냈습니다.");
  }

  return (
    <main className="mx-auto grid min-h-screen max-w-[560px] content-center gap-5 px-6 py-12">
      <section className="grid gap-3">
        <p className="m-0 text-2xl font-extrabold tracking-[-0.02em] text-[#173b68]">MyPace</p>
        <h1 className="m-0 text-4xl font-extrabold tracking-[-0.06em] text-[#173b68]">비밀번호 찾기</h1>
        <p className="m-0 leading-7 text-[#66758c]">가입된 이메일, 이름, 휴대폰번호가 맞으면 재설정 메일을 보내드려요.</p>
      </section>

      <section className="grid gap-4 rounded-[28px] border border-[#173b68]/10 bg-white p-6 shadow-[0_18px_45px_rgba(23,37,63,0.06)]">
        <form className="grid gap-3" onSubmit={handleResetPassword}>
          <label className="font-bold text-[#17253f]" htmlFor="forgot-email">
            가입된 이메일
          </label>
          <input
            className="rounded-2xl border border-[#dfe5e2] bg-white px-4 py-3 outline-[#62c6ae]"
            id="forgot-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <label className="font-bold text-[#17253f]" htmlFor="forgot-full-name">
            이름
          </label>
          <input
            className="rounded-2xl border border-[#dfe5e2] bg-white px-4 py-3 outline-[#62c6ae]"
            id="forgot-full-name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
          />
          <label className="font-bold text-[#17253f]" htmlFor="forgot-phone">
            휴대폰번호
          </label>
          <input
            className="rounded-2xl border border-[#dfe5e2] bg-white px-4 py-3 outline-[#62c6ae]"
            id="forgot-phone"
            type="tel"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            required
          />
          <button className="mt-2 cursor-pointer rounded-full bg-[#173b68] px-5 py-3 font-bold text-white" type="submit">
            비밀번호 재설정 메일 받기
          </button>
        </form>
      </section>

      <Link className="text-center font-extrabold text-[#173b68] no-underline" to="/login">
        로그인으로 돌아가기
      </Link>

      {message && (
        <p className="rounded-2xl bg-white px-4 py-3 text-[#4c5f7c]" role="status">
          {message}
        </p>
      )}
    </main>
  );
}
