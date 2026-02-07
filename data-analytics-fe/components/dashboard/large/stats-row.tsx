import React from "react";
import { StatsCard } from "../medium/stats-card";
import { FaFolder } from "react-icons/fa";
import { FaRepeat } from "react-icons/fa6";
import { PiWarningCircleBold } from "react-icons/pi";
import { FaCheckCircle } from "react-icons/fa";

interface StatsRowProps {
  activeProjects: number;
  processing: number;
  failedJobs: number;
  successRate: number;
}

export function StatsRow({
  activeProjects,
  processing,
  failedJobs,
  successRate,
}: StatsRowProps) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard
        label="Active Projects"
        value={activeProjects.toString()}
        icon={<FaFolder />}
        colorClass="text-primary"
        bgClass="bg-primary/10"
        borderHoverClass="hover:border-primary/50"
        textHoverClass="group-hover:text-primary"
      />
      <StatsCard
        label="Processing"
        value={processing.toString()}
        icon={<FaRepeat />}
        colorClass="text-amber-500"
        bgClass="bg-amber-500/10"
        borderHoverClass="hover:border-amber-500/50"
        textHoverClass="group-hover:text-amber-500"
      />
      <StatsCard
        label="Failed Jobs"
        value={failedJobs.toString()}
        icon={<PiWarningCircleBold />}
        colorClass="text-red-500"
        bgClass="bg-red-500/10"
        borderHoverClass="hover:border-red-500/50"
        textHoverClass="group-hover:text-red-500"
      />
      <StatsCard
        label="Success Rate"
        value={`${successRate}%`}
        icon={<FaCheckCircle />}
        colorClass="text-emerald-500"
        bgClass="bg-emerald-500/10"
        borderHoverClass="hover:border-emerald-500/50"
        textHoverClass="group-hover:text-emerald-500"
      />
    </section>
  );
}
