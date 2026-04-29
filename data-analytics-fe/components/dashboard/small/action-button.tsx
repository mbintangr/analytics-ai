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
    secondary: "px-6 py-3 font-medium text-sm",
    icon: "p-2 rounded-lg",
  };

  if (variant === "secondary") {
    return (
      <button
        className={cn(baseStyles, variants[variant], className)}
        style={{
          background: "var(--surface-card)",
          color: "var(--text-secondary)",
          border: "1px solid var(--surface-border)",
        }}
        {...props}
      >
        {icon && <span className="material-symbols-outlined text-[20px]">{icon}</span>}
        {children}
      </button>
    );
  }

  if (variant === "icon") {
    return (
      <button
        className={cn(baseStyles, variants[variant], className)}
        style={{ color: "var(--text-secondary)" }}
        {...props}
      >
        {icon && <span className="material-symbols-outlined text-[20px]">{icon}</span>}
        {children}
      </button>
    );
  }

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
