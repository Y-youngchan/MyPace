import { useEffect, useRef, useState } from "react";
import DesktopNavLink from "./DesktopNavLink";
import { desktopMenuItems } from "./desktopMenuItems";

export default function DesktopMenuScroll() {
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

    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateOverflow);
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
        {desktopMenuItems.map((item) => (
          <DesktopNavLink key={item.to} label={item.label} to={item.to} />
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
  );
}
