import { NavLink } from "react-router-dom";

type DesktopNavLinkProps = {
  label: string;
  to: string;
};

export default function DesktopNavLink({ label, to }: DesktopNavLinkProps) {
  return (
    <NavLink
      className={({ isActive }) =>
        isActive
          ? "rounded-2xl bg-[#173b68] px-3.5 py-3 font-bold text-white no-underline max-[1100px]:min-w-max max-[1100px]:px-6"
          : "rounded-2xl px-3.5 py-3 font-bold text-[#4c5f7c] no-underline max-[1100px]:min-w-max max-[1100px]:px-6"
      }
      to={to}
    >
      {label}
    </NavLink>
  );
}
