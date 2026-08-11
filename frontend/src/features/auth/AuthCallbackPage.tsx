import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    const code = searchParams.get("code");

    if (!code) {
      navigate("/login", { replace: true });
      return;
    }

    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (!mounted) {
        return;
      }
      if (error) {
        setErrorMessage("소셜 로그인 처리 중 문제가 발생했습니다.");
        return;
      }
      navigate("/dashboard", { replace: true });
    });

    return () => {
      mounted = false;
    };
  }, [navigate, searchParams]);

  return (
    <main className="mx-auto grid min-h-screen max-w-[560px] content-center gap-5 px-6 py-12">
      <section className="grid gap-3 rounded-[28px] border border-[#173b68]/10 bg-white p-6 shadow-[0_18px_45px_rgba(23,37,63,0.06)]">
        <p className="m-0 text-2xl font-extrabold tracking-[-0.02em] text-[#173b68]">MyPace</p>
        <h1 className="m-0 text-3xl font-extrabold tracking-[-0.05em] text-[#173b68]">로그인 연결 중</h1>
        <p className="m-0 leading-7 text-[#66758c]">로그인을 마무리하고 있습니다.</p>
        {errorMessage && (
          <>
            <p className="rounded-2xl bg-[#fff3f0] px-4 py-3 font-bold text-[#9f3328]" role="alert">
              {errorMessage}
            </p>
            <Link className="rounded-full bg-[#173b68] px-5 py-3 text-center font-bold text-white no-underline" to="/login">
              로그인으로 돌아가기
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
