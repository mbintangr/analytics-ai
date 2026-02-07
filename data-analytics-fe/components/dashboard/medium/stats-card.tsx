import { cn } from "@/lib/utils";
import React from "react";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass: string; // e.g., "text-primary" or "text-amber-500"
  bgClass: string; // e.g., "bg-primary/10" or "bg-amber-500/10"
  borderHoverClass: string; // e.g., "hover:border-primary/50"
  textHoverClass: string; // e.g., "group-hover:text-primary"
}

export function StatsCard({
  label,
  value,
  icon,
  colorClass,
  bgClass,
  borderHoverClass,
  textHoverClass,
}: StatsCardProps) {
  return (
    <div
      className={cn(
        "p-5 rounded-xl bg-[#1e293b] border border-[#314368] transition-colors group",
        borderHoverClass
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <p className="text-slate-400 text-sm font-medium">{label}</p>
        <div
          className={cn(
            "p-1.5 rounded-lg text-[20px] flex items-center justify-center",
            typeof icon === "string" && "material-symbols-outlined",
            colorClass,
            bgClass
          )}
        >
          {icon}
        </div>
      </div>
      <p
        className={cn(
          "text-3xl font-bold text-white transition-colors",
          textHoverClass
        )}
      >
        {value}
      </p>
    </div>
  );
}
