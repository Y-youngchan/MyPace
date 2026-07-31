import { useEffect, useRef, useState } from "react";

const menuItems = ["대시보드", "수입", "예산", "거래내역", "분석", "리포트"];

export default function DesktopSidebar() {
  const menuRef = useRef<HTMLElement | null>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  useEffect(() => {
    const menu = menuRef.current;
    if (!menu) {
      return;
    }

    function updateOverflow() {
      const currentMenu = menuRef.current;
      if (!currentMenu) {
        return;
      }
      setHasOverflow(currentMenu.scrollWidth > currentMenu.clientWidth + 1);
    }

    updateOverflow();

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(updateOverflow);
    resizeObserver?.observe(menu);
    window.addEventListener("resize", updateOverflow);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", updateOverflow);
    };
  }, []);

  function scrollMenu(direction: "left" | "right") {
    menuRef.current?.scrollBy({
      left: direction === "right" ? 180 : -180,
      behavior: "smooth",
    });
  }

  return (
    <aside
      className="grid content-start gap-10 border-r border-[#dfe5e2] bg-white/70 p-6 pt-9 max-[1100px]:gap-5 max-[1100px]:border-r-0 max-[1100px]:border-b max-[1100px]:p-5"
      aria-label="주요 메뉴"
    >
      <div>
        <p className="m-0 font-bold tracking-[-0.02em] text-[#173b68]">MyPace</p>
        <p className="mt-2 mb-0 text-[0.92rem] leading-6 text-[#60708a]">내 수입에 맞춰, 소비도 마이페이스</p>
      </div>
      <div aria-label="메뉴 스크롤 영역" className="relative w-full min-w-0 overflow-hidden">
        {hasOverflow && (
          <button
            aria-label="메뉴 왼쪽으로 스크롤"
            className="pointer-events-none absolute top-1/2 left-2 z-10 hidden h-10 w-10 -translate-y-1/2 cursor-pointer rounded-full bg-white/80 text-2xl font-black text-[#173b68] shadow-[0_10px_30px_rgba(23,37,63,0.14)] backdrop-blur max-[1100px]:pointer-events-auto max-[1100px]:grid max-[1100px]:place-items-center"
            onClick={() => scrollMenu("left")}
            type="button"
          >
            ‹
          </button>
        )}
        <nav
          aria-label="주요 메뉴 목록"
          className="grid min-w-0 gap-2 overflow-x-auto whitespace-nowrap scroll-smooth max-[1100px]:flex max-[1100px]:px-14 max-[1100px]:[-ms-overflow-style:none] max-[1100px]:[scrollbar-width:none] max-[1100px]:[&::-webkit-scrollbar]:hidden"
          ref={menuRef}
        >
          {menuItems.map((item) => (
            <a
              className={
                item === "대시보드"
                  ? "rounded-2xl bg-[#173b68] px-3.5 py-3 font-bold text-white no-underline max-[1100px]:min-w-max max-[1100px]:px-6"
                  : "rounded-2xl px-3.5 py-3 font-bold text-[#4c5f7c] no-underline max-[1100px]:min-w-max max-[1100px]:px-6"
              }
              href="/"
              key={item}
            >
              {item}
            </a>
          ))}
        </nav>
        {hasOverflow && (
          <button
            aria-label="메뉴 오른쪽으로 스크롤"
            className="pointer-events-none absolute top-1/2 right-2 z-10 hidden h-10 w-10 -translate-y-1/2 cursor-pointer rounded-full bg-white/80 text-2xl font-black text-[#173b68] shadow-[0_10px_30px_rgba(23,37,63,0.14)] backdrop-blur max-[1100px]:pointer-events-auto max-[1100px]:grid max-[1100px]:place-items-center"
            onClick={() => scrollMenu("right")}
            type="button"
          >
            ›
          </button>
        )}
      </div>
    </aside>
  );
}
