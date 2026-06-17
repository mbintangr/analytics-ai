import React, { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-8 sm:p-10 flex flex-col gap-8 backdrop-blur-2xl shadow-2xl ${className}`}
      style={{
        background: "var(--glass-bg)",
        border: "1px solid var(--glass-border)",
      }}
    >
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
      {children}
    </div>
  );
}
