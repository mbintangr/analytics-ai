import { cn } from "@/lib/utils";
import React from "react";

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "icon";
}

export function ActionButton({
  icon,
  children,
  variant = "primary",
  className,
  ...props
}: ActionButtonProps) {
  const baseStyles = "flex items-center justify-center gap-2 rounded-xl transition-all hover:cursor-pointer";

  const variants = {
    primary:
      "px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] w-full sm:w-auto whitespace-nowrap",
    secondary: "px-6 py-3 bg-[#1e293b] text-slate-400 hover:text-white hover:bg-white/5",
    icon: "p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], className)}
      {...props}
    >
      {icon && <span className="material-symbols-outlined text-[20px]">{icon}</span>}
      {children}
    </button>
  );
}
