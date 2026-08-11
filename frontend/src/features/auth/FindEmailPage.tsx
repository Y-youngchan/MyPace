import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { findEmail } from "../../api/accountRecovery";

export default function FindEmailPage() {
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");

  async function handleFindEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const { emails } = await findEmail({ full_name: fullName, phone_number: phoneNumber });
    setMessage(emails.length > 0 ? `가입된 이메일: ${emails.join(", ")}` : "일치하는 이메일을 찾지 못했습니다.");
  }

  return (
    <main className="mx-auto grid min-h-screen max-w-[560px] content-center gap-5 px-6 py-12">
      <section className="grid gap-3">
        <p className="m-0 text-2xl font-extrabold tracking-[-0.02em] text-[#173b68]">MyPace</p>
        <h1 className="m-0 text-4xl font-extrabold tracking-[-0.06em] text-[#173b68]">이메일 찾기</h1>
        <p className="m-0 leading-7 text-[#66758c]">가입할 때 입력한 이름과 휴대폰번호로 이메일을 찾을 수 있어요.</p>
      </section>

      <section className="grid gap-4 rounded-[28px] border border-[#173b68]/10 bg-white p-6 shadow-[0_18px_45px_rgba(23,37,63,0.06)]">
        <form className="grid gap-3" onSubmit={handleFindEmail}>
          <label className="font-bold text-[#17253f]" htmlFor="find-email-full-name">
            이름
          </label>
          <input
            className="rounded-2xl border border-[#dfe5e2] bg-white px-4 py-3 outline-[#62c6ae]"
            id="find-email-full-name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            required
          />
          <label className="font-bold text-[#17253f]" htmlFor="find-email-phone">
            휴대폰번호
          </label>
          <input
            className="rounded-2xl border border-[#dfe5e2] bg-white px-4 py-3 outline-[#62c6ae]"
            id="find-email-phone"
            type="tel"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
            required
          />
          <button className="mt-2 cursor-pointer rounded-full bg-[#173b68] px-5 py-3 font-bold text-white" type="submit">
            이메일 찾기
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
