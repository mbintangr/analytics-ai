import { ActionButton } from "../small/action-button";
import { StatusBadge } from "../small/status-badge";
import { HiDotsHorizontal } from "react-icons/hi";
import { MdDelete } from "react-icons/md";
import { MdEdit } from "react-icons/md";
import React from "react";
import { Dropdown } from "@/components/ui/dropdown";

interface ProjectCardProps {
  title: string;
  filename: string;
  status: "Completed" | "Processing" | "Failed";
  duration?: string;
  type: "bar" | "processing" | "error" | "wave" | "donut" | "log";
  onDelete?: () => void;
  onRename?: () => void;
}

export function ProjectCard({
  title,
  filename,
  status,
  duration,
  type,
  onDelete,
  onRename,
}: ProjectCardProps) {
  const getVisual = () => {
    switch (type) {
      case "bar":
        return (
          <div
            className="absolute inset-x-0 bottom-0 h-24 flex items-end justify-between px-6 gap-2 opacity-80"
            data-alt="Bar chart visualization of sales data"
          >
            <div className="w-full bg-primary/40 h-[30%] rounded-t-sm"></div>
            <div className="w-full bg-primary/60 h-[50%] rounded-t-sm"></div>
            <div className="w-full bg-primary/80 h-[40%] rounded-t-sm"></div>
            <div className="w-full bg-primary h-[70%] rounded-t-sm"></div>
            <div className="w-full bg-primary/50 h-[55%] rounded-t-sm"></div>
          </div>
        );
      case "processing":
        return (
          <div className="relative size-16">
            <div className="absolute inset-0 border-4 border-amber-500/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-amber-500 rounded-full border-t-transparent animate-spin"></div>
            <span className="absolute inset-0 flex items-center justify-center text-amber-500 text-xs font-bold animate-pulse">
              Running
            </span>
          </div>
        );
      case "error":
        return (
          <div className="flex flex-col items-center gap-2 text-red-500/80">
            <span className="material-symbols-outlined text-[48px]">warning</span>
            <span className="text-xs uppercase tracking-widest opacity-70">
              Timeout Error
            </span>
          </div>
        );
      case "wave":
        return (
          <>
            <svg
              className="w-full h-full text-purple-500 drop-shadow-[0_0_10px_rgba(168,85,247,0.4)]"
              preserveAspectRatio="none"
              viewBox="0 0 200 100"
            >
              <defs>
                <linearGradient id="gradient" x1="0%" x2="0%" y1="0%" y2="100%">
                  <stop
                    offset="0%"
                    style={{ stopColor: "currentColor", stopOpacity: 1 }}
                  ></stop>
                  <stop
                    offset="100%"
                    style={{ stopColor: "currentColor", stopOpacity: 0 }}
                  ></stop>
                </linearGradient>
              </defs>
              <path
                d="M0,50 C40,10 60,90 100,50 C140,10 160,90 200,50 V100 H0 Z"
                fill="url(#gradient)"
                opacity="0.2"
              ></path>
              <path
                d="M0,50 C40,10 60,90 100,50 C140,10 160,90 200,50"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              ></path>
            </svg>
          </>
        );
      case "donut":
        return (
          <div className="size-24 rounded-full border-12 border-[#222f49] border-t-blue-500 border-r-blue-400 rotate-45"></div>
        );
      case "log":
        return (
          <div className="flex items-end gap-1 h-12">
            <div className="w-3 bg-amber-500/50 animate-[bounce_1s_infinite_100ms] rounded-t-sm h-8"></div>
            <div className="w-3 bg-amber-500/70 animate-[bounce_1s_infinite_200ms] rounded-t-sm h-12"></div>
            <div className="w-3 bg-amber-500/50 animate-[bounce_1s_infinite_300ms] rounded-t-sm h-6"></div>
            <div className="w-3 bg-amber-500/70 animate-[bounce_1s_infinite_400ms] rounded-t-sm h-10"></div>
          </div>
        );
      default:
        return null;
    }
  };

  const getHoverClass = () => {
    switch (status) {
      case "Completed":
        if (type === "wave") return "group-hover:text-purple-500";
        return "group-hover:text-primary";
      case "Processing":
        return "group-hover:text-amber-500";
      case "Failed":
        return "group-hover:text-red-500";
      default:
        return "group-hover:text-white";
    }
  };

  const getBorderClass = () => {
    switch (status) {
      case "Completed":
        return "hover:border-primary/50";
      case "Processing":
        return "hover:border-amber-500/50";
      case "Failed":
        return "hover:border-red-500/50";
      default:
        return "hover:border-[#314368]";
    }
  };

  const getBgClass = () => {
    if (type === 'error') return "bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-red-900/20 to-[#101622]";
    return "bg-[#101622]";
  }

  return (
    <div
      className={`group flex flex-col bg-[#1e293b] rounded-2xl border border-[#314368] transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20 overflow-hidden cursor-pointer ${getBorderClass()}`}
    >
      {/* Thumbnail Area */}
      <div className={`h-40 w-full relative p-4 flex items-center justify-center overflow-hidden ${getBgClass()}`}>
        {getVisual()}
        <div className="absolute top-3 right-3">
          <Dropdown
            trigger={
              <div className="p-1 rounded-full hover:bg-black/20 text-slate-600 hover:text-white transition-colors">
                <HiDotsHorizontal size={20} />
              </div>
            }
            items={[
              {
                label: "Rename",
                onClick: onRename || (() => { }),
                icon: <MdEdit className="text-lg" />,
              },
              {
                label: "Delete",
                onClick: onDelete || (() => { }),
                icon: <MdDelete className="text-lg" />,
                className: "text-red-400 hover:text-red-300 hover:bg-red-500/10",
              },
            ]}
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div>
          <h4
            className={`text-white font-bold text-lg leading-tight transition-colors ${getHoverClass()}`}
          >
            {title}
          </h4>
          <p className="text-slate-400 text-xs mt-1 font-mono truncate">
            {filename}
          </p>
        </div>
        <StatusBadge status={status} duration={duration} />
      </div>
    </div>
  );
}
