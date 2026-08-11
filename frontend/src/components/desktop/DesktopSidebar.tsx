import DesktopMenuScroll from "./DesktopMenuScroll";

export default function DesktopSidebar() {
  return (
    <aside
      className="grid content-start gap-10 border-r border-[#dfe5e2] bg-white/70 p-6 pt-9 max-[1100px]:gap-5 max-[1100px]:border-r-0 max-[1100px]:border-b max-[1100px]:p-5"
      aria-label="주요 메뉴"
    >
      <div>
        <p className="m-0 font-bold tracking-[-0.02em] text-[#173b68]">MyPace</p>
        <p className="mt-2 mb-0 text-[0.92rem] leading-6 text-[#60708a]">내 수입에 맞춰, 소비도 마이페이스</p>
      </div>
      <DesktopMenuScroll />
    </aside>
  );
}
