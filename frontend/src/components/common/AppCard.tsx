import type { ReactNode } from "react";

type AppCardProps = {
  children: ReactNode;
  className?: string;
};

export default function AppCard({ children, className = "" }: AppCardProps) {
  const hasCustomBackground = /\bbg-/.test(className);

  return (
    <section
      className={`rounded-[28px] border border-[#173b68]/10 ${hasCustomBackground ? "" : "bg-white"} p-6 shadow-[0_18px_45px_rgba(23,37,63,0.06)] ${className}`.trim()}
    >
      {children}
    </section>
  );
}
