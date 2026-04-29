import { cn } from "@/lib/utils";
import React from "react";

interface StatsCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass: string;
  bgClass: string;
  borderHoverClass: string;
  textHoverClass: string;
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
        "p-5 rounded-xl border transition-colors group",
        borderHoverClass
      )}
      style={{
        background: "var(--surface-card)",
        borderColor: "var(--surface-border)",
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          {label}
        </p>
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
          "text-3xl font-bold transition-colors",
          textHoverClass
        )}
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </p>
    </div>
  );
}
