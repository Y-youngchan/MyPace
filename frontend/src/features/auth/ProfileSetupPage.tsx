import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { saveProfile } from "../../api/profile";

type ProfileSetupNotice = {
  tone: "success" | "error";
  text: string;
} | null;

export default function ProfileSetupPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [nickname, setNickname] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [notice, setNotice] = useState<ProfileSetupNotice>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }
    setNotice(null);

    if (nickname.length > 10) {
      setNotice({ tone: "error", text: "닉네임은 10자 이내로 입력해주세요." });
      return;
    }

    setIsSubmitting(true);
    try {
      await saveProfile({
        display_name: nickname,
        full_name: fullName,
        nickname,
        phone_number: phoneNumber,
        user_type: "worker",
      });
      navigate("/dashboard", { replace: true });
    } catch {
      setNotice({ tone: "error", text: "프로필 저장 중 문제가 발생했습니다." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto grid max-w-[620px] gap-5">
      <div className="grid gap-2">
        <p className="m-0 text-sm font-extrabold tracking-[0.12em] text-[#62c6ae] uppercase">Profile setup</p>
        <h1 className="m-0 text-4xl font-extrabold tracking-[-0.06em] text-[#173b68]">추가 정보 입력</h1>
        <p className="m-0 leading-7 text-[#66758c]">소셜 로그인 후 이메일/비밀번호 찾기와 사용자 구분에 필요한 정보를 한 번만 입력해요.</p>
      </div>

      <form className="grid gap-4 rounded-[28px] border border-[#173b68]/10 bg-white p-6 shadow-[0_18px_45px_rgba(23,37,63,0.06)]" onSubmit={handleSubmit}>
        <label className="font-bold text-[#17253f]" htmlFor="profile-full-name">
          이름
        </label>
        <input
          className="rounded-2xl border border-[#dfe5e2] bg-white px-4 py-3 outline-[#62c6ae]"
          id="profile-full-name"
          type="text"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
        />

        <label className="font-bold text-[#17253f]" htmlFor="profile-nickname">
          사용자 닉네임
        </label>
        <input
          className="rounded-2xl border border-[#dfe5e2] bg-white px-4 py-3 outline-[#62c6ae]"
          id="profile-nickname"
          type="text"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          maxLength={10}
          required
        />

        <label className="font-bold text-[#17253f]" htmlFor="profile-phone-number">
          휴대폰번호
        </label>
        <input
          className="rounded-2xl border border-[#dfe5e2] bg-white px-4 py-3 outline-[#62c6ae]"
          id="profile-phone-number"
          type="tel"
          value={phoneNumber}
          onChange={(event) => setPhoneNumber(event.target.value)}
          required
        />

        <button className="mt-2 cursor-pointer rounded-full bg-[#173b68] px-5 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "저장 중..." : "저장하고 대시보드로 이동"}
        </button>
      </form>

      {notice && (
        <p
          className={`rounded-2xl bg-white px-4 py-3 ${notice.tone === "error" ? "text-[#9f3328]" : "text-[#4c5f7c]"}`}
          role={notice.tone === "error" ? "alert" : "status"}
        >
          {notice.text}
        </p>
      )}
    </section>
  );
}
