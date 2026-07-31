import type { ReactNode } from "react";
import DesktopSidebar from "../components/desktop/DesktopSidebar";

type DesktopLayoutProps = {
  children: ReactNode;
};

export default function DesktopLayout({ children }: DesktopLayoutProps) {
  return (
    <div className="grid min-h-screen grid-cols-[260px_minmax(0,1fr)] max-[1100px]:grid-cols-1">
      <DesktopSidebar />
      <main className="px-[clamp(24px,3vw,56px)] py-[clamp(28px,3vw,48px)] max-[700px]:px-5">{children}</main>
    </div>
  );
}
