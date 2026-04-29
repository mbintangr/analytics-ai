import { cn } from "@/lib/utils";
import React from "react";

type StatusType = "Completed" | "Processing" | "Failed";

interface StatusBadgeProps {
  status: StatusType;
  duration?: string;
  className?: string;
}

export function StatusBadge({ status, duration, className }: StatusBadgeProps) {
  const styles = {
    Completed: {
      container: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      dot: "bg-emerald-500",
      animate: "",
    },
    Processing: {
      container: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      dot: "bg-amber-500",
      animate: "animate-pulse",
    },
    Failed: {
      container: "bg-red-500/10 text-red-400 border-red-500/20",
      dot: "bg-red-500",
      animate: "",
    },
  };

  const style = styles[status];

  return (
    <div className={cn("mt-auto flex items-center justify-between pt-2 border-t border-white/5", className)}>
      <div
        className={cn(
          "flex items-center gap-2 px-2.5 py-1 rounded-full border",
          style.container
        )}
      >
        <div className={cn("size-1.5 rounded-full", style.dot, style.animate)}></div>
        <span className="text-xs font-semibold">{status}</span>
      </div>
      <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{duration || "--"}</span>
    </div>
  );
}
