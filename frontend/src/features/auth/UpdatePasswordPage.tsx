import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { isValidSignupPassword } from "./signupValidation";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [message, setMessage] = useState("");

  async function handleUpdatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValidSignupPassword(password)) {
      setMessage("비밀번호는 영문과 숫자를 포함해 8자 이상이어야 합니다.");
      return;
    }

    if (password !== passwordConfirmation) {
      setMessage("비밀번호 확인이 일치하지 않습니다.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    setMessage(error ? "비밀번호 변경에 실패했습니다." : "비밀번호가 변경되었습니다. 다시 로그인해주세요.");
  }

  return (
    <main className="mx-auto grid min-h-screen max-w-[560px] content-center gap-5 px-6 py-12">
      <section className="grid gap-3">
        <p className="m-0 text-2xl font-extrabold tracking-[-0.02em] text-[#173b68]">MyPace</p>
        <h1 className="m-0 text-4xl font-extrabold tracking-[-0.06em] text-[#173b68]">새 비밀번호 설정</h1>
        <p className="m-0 leading-7 text-[#66758c]">메일 링크로 들어온 뒤 새 비밀번호를 설정해주세요.</p>
      </section>

      <section className="grid gap-4 rounded-[28px] border border-[#173b68]/10 bg-white p-6 shadow-[0_18px_45px_rgba(23,37,63,0.06)]">
        <form className="grid gap-3" onSubmit={handleUpdatePassword}>
          <label className="font-bold text-[#17253f]" htmlFor="update-password">
            새 비밀번호
          </label>
          <input
            className="rounded-2xl border border-[#dfe5e2] bg-white px-4 py-3 outline-[#62c6ae]"
            id="update-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <label className="font-bold text-[#17253f]" htmlFor="update-password-confirmation">
            새 비밀번호 확인
          </label>
          <input
            className="rounded-2xl border border-[#dfe5e2] bg-white px-4 py-3 outline-[#62c6ae]"
            id="update-password-confirmation"
            type="password"
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            required
          />
          <button className="mt-2 cursor-pointer rounded-full bg-[#173b68] px-5 py-3 font-bold text-white" type="submit">
            새 비밀번호 저장
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
