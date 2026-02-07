import React, { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-8 sm:p-10 flex flex-col gap-8
        bg-[rgba(16,22,35,0.75)] backdrop-blur-2xl border border-white/10
        shadow-[0_8px_32px_rgba(0,0,0,0.5)] ${className}`}
    >
      {/* Subtle top highlight line */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
      {children}
    </div>
  );
}
