import { Link } from "@tanstack/react-router";

export const NAV_ITEMS = [
  { label: "Architecture", to: "/architecture" },
  { label: "Agents", to: "/agents" },
  { label: "Compliance", to: "/compliance" },
  { label: "Deployments", to: "/deployments" },
  { label: "Contact", to: "/contact" },
] as const;

export function SiteNav({ variant = "overlay" }: { variant?: "overlay" | "solid" }) {
  const wrapper =
    variant === "overlay"
      ? "absolute top-0 left-1/2 -translate-x-1/2 z-20"
      : "sticky top-0 left-0 right-0 z-30 flex justify-center pt-4 md:pt-6";
  return (
    <nav className={wrapper}>
      <div className="bg-black/80 backdrop-blur-sm rounded-b-2xl md:rounded-b-3xl px-4 py-2 md:px-8 md:py-3 border border-frost/10 flex items-center gap-3 sm:gap-6 md:gap-10 lg:gap-12">
        <Link
          to="/"
          className="text-[10px] sm:text-xs md:text-sm font-mono text-signal tracking-widest"
        >
          ◆ OMNI
        </Link>
        {NAV_ITEMS.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            className="text-[10px] sm:text-xs md:text-sm font-mono text-frost/70 hover:text-frost transition-colors"
            activeProps={{ className: "text-signal" }}
          >
            {n.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
