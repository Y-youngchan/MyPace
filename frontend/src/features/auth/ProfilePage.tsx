import { FormEvent, useEffect, useState } from "react";
import { getProfile, saveProfile } from "../../api/profile";
import type { ProfileResponse } from "../../api/profile";
import AppCard from "../../components/common/AppCard";
import { supabase } from "../../lib/supabase";
import { isValidSignupPassword } from "./signupValidation";

type Notice = {
  tone: "success" | "error";
  text: string;
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    let mounted = true;
    getProfile()
      .then((loadedProfile) => {
        if (!mounted) {
          return;
        }
        setProfile(loadedProfile);
        setNickname(loadedProfile.nickname);
      })
      .catch(() => {
        if (mounted) {
          setNotice({ tone: "error", text: "프로필 정보를 불러오지 못했어요." });
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSaveNickname(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) {
      return;
    }

    const trimmedNickname = nickname.trim();
    if (trimmedNickname.length === 0) {
      setNotice({ tone: "error", text: "닉네임을 입력해주세요." });
      return;
    }
    if (trimmedNickname.length > 10) {
      setNotice({ tone: "error", text: "닉네임은 10자 이내로 입력해주세요." });
      return;
    }

    try {
      const savedProfile = await saveProfile({
        display_name: trimmedNickname,
        full_name: profile.full_name,
        nickname: trimmedNickname,
        phone_number: profile.phone_number,
        user_type: profile.user_type,
      });
      setProfile(savedProfile);
      setNickname(savedProfile.nickname);
      setNotice({ tone: "success", text: "닉네임이 변경됐어요." });
    } catch {
      setNotice({ tone: "error", text: "닉네임을 변경하지 못했어요." });
    }
  }

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValidSignupPassword(password)) {
      setNotice({ tone: "error", text: "비밀번호는 영문과 숫자를 포함해 8자 이상이어야 합니다." });
      return;
    }
    if (password !== passwordConfirmation) {
      setNotice({ tone: "error", text: "비밀번호 확인이 일치하지 않습니다." });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setNotice({ tone: "error", text: "비밀번호를 변경하지 못했어요." });
      return;
    }

    setPassword("");
    setPasswordConfirmation("");
    setNotice({ tone: "success", text: "비밀번호가 변경됐어요." });
  }

  return (
    <div className="grid w-full max-w-[960px] gap-7">
      <header>
        <p className="m-0 text-[0.82rem] font-extrabold tracking-[0.08em] text-[#62c6ae] uppercase">Profile</p>
        <h1 className="my-2 text-[clamp(2rem,4vw,3rem)] leading-[1.08] font-extrabold tracking-[-0.06em] text-[#173b68]">
          프로필
        </h1>
        <p className="m-0 text-[#66758c]">내 계정 정보와 로그인 비밀번호를 관리해요.</p>
      </header>

      {profile ? (
        <>
          <AppCard className="grid gap-4">
            <div>
              <p className="m-0 text-sm font-extrabold tracking-[0.08em] text-[#62c6ae] uppercase">Account</p>
              <h2 className="my-2 text-2xl font-extrabold tracking-[-0.04em] text-[#17253f]">계정 정보</h2>
            </div>
            <dl className="m-0 grid gap-3 text-[#4c5f7c]">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#f7faf8] px-4 py-3">
                <dt className="font-bold">이메일</dt>
                <dd className="m-0 font-extrabold text-[#173b68]">{profile.email || "이메일 정보 없음"}</dd>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#f7faf8] px-4 py-3">
                <dt className="font-bold">현재 닉네임</dt>
                <dd className="m-0 flex items-center gap-2 font-extrabold text-[#173b68]">
                  {profile.nickname}
                  <span className="rounded-full bg-[#eaf1f7] px-3 py-1 text-sm">#{profile.nickname_tag}</span>
                </dd>
              </div>
            </dl>
          </AppCard>

          <AppCard>
            <h2 className="m-0 text-2xl font-extrabold tracking-[-0.04em] text-[#17253f]">닉네임 변경</h2>
            <form className="mt-5 grid gap-3" onSubmit={handleSaveNickname}>
              <label className="font-bold text-[#17253f]" htmlFor="profile-nickname-change">
                새 닉네임
              </label>
              <input
                className="rounded-2xl border border-[#dfe5e2] bg-white px-4 py-3 outline-[#62c6ae]"
                id="profile-nickname-change"
                maxLength={10}
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                required
              />
              <p className="m-0 text-sm font-bold text-[#66758c]">닉네임은 10자 이내로 입력해주세요.</p>
              <button className="mt-2 w-fit cursor-pointer rounded-full bg-[#173b68] px-5 py-3 font-bold text-white" type="submit">
                닉네임 저장
              </button>
            </form>
          </AppCard>

          <AppCard>
            <h2 className="m-0 text-2xl font-extrabold tracking-[-0.04em] text-[#17253f]">비밀번호 변경</h2>
            <form className="mt-5 grid gap-3" onSubmit={handleChangePassword}>
              <label className="font-bold text-[#17253f]" htmlFor="profile-password">
                새 비밀번호
              </label>
              <input
                className="rounded-2xl border border-[#dfe5e2] bg-white px-4 py-3 outline-[#62c6ae]"
                id="profile-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <label className="font-bold text-[#17253f]" htmlFor="profile-password-confirmation">
                새 비밀번호 확인
              </label>
              <input
                className="rounded-2xl border border-[#dfe5e2] bg-white px-4 py-3 outline-[#62c6ae]"
                id="profile-password-confirmation"
                type="password"
                value={passwordConfirmation}
                onChange={(event) => setPasswordConfirmation(event.target.value)}
                required
              />
              <p className="m-0 text-sm font-bold text-[#66758c]">비밀번호는 영문과 숫자를 포함해 8자 이상이어야 해요.</p>
              <button className="mt-2 w-fit cursor-pointer rounded-full bg-[#173b68] px-5 py-3 font-bold text-white" type="submit">
                비밀번호 변경
              </button>
            </form>
          </AppCard>
        </>
      ) : (
        <AppCard>
          <p className="m-0 text-[#66758c]">프로필 정보를 불러오고 있어요.</p>
        </AppCard>
      )}

      {notice && (
        <p
          className={`rounded-2xl bg-white px-4 py-3 font-bold ${
            notice.tone === "success" ? "text-[#3b947f]" : "text-[#9f3328]"
          }`}
          role={notice.tone === "success" ? "status" : "alert"}
        >
          {notice.text}
        </p>
      )}
    </div>
  );
}
