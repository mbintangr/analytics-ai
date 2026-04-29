"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  icon: string;
  label: string;
}

export function NavLink({ href, icon, label }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-3 rounded-xl transition-colors",
        isActive
          ? "bg-primary/20 text-primary"
          : "hover:bg-black/5 dark:hover:bg-white/5"
      )}
      style={
        isActive
          ? undefined
          : { color: "var(--text-secondary)" }
      }
    >
      <span className="material-symbols-outlined text-[24px]">{icon}</span>
      <span className="text-sm font-medium" style={isActive ? undefined : { color: "var(--text-secondary)" }}>
        {label}
      </span>
    </Link>
  );
}
