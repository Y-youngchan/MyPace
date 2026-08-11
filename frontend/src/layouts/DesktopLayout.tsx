import { Outlet } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import DesktopSidebar from "../components/desktop/DesktopSidebar";
import { supabase } from "../lib/supabase";
import { disableDevDashboardAccess } from "../features/auth/devAccess";

export default function DesktopLayout() {
  const navigate = useNavigate();

  async function handleSignOut() {
    disableDevDashboardAccess();
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="grid min-h-screen grid-cols-[260px_minmax(0,1fr)] max-[1100px]:grid-cols-1">
      <DesktopSidebar />
      <main className="px-[clamp(24px,3vw,56px)] py-[clamp(28px,3vw,48px)] max-[700px]:px-5">
        <header className="mb-6 flex justify-end">
          <button
            className="cursor-pointer rounded-full border border-[#173b68]/15 bg-white/80 px-4 py-2 text-sm font-extrabold text-[#173b68] shadow-[0_12px_30px_rgba(23,37,63,0.06)]"
            type="button"
            onClick={handleSignOut}
          >
            로그아웃
          </button>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
