"use client";

import React, { useState } from "react";
import { ProjectCard } from "../medium/project-card";
import { FiGrid } from "react-icons/fi";
import { FaListUl } from "react-icons/fa";
import { FaChevronRight } from "react-icons/fa";
import { HiDotsHorizontal } from "react-icons/hi";
import { cn } from "@/lib/utils";
import { StatusBadge } from "../small/status-badge";
import { Dropdown } from "../../ui/dropdown";

export type ViewMode = "grid" | "list";

export interface Project {
  id: string;
  title: string;
  filename: string;
  status: "Completed" | "Processing" | "Failed";
  duration?: string;
  type: "bar" | "processing" | "error" | "wave" | "donut" | "log";
}

interface ProjectGridProps {
  projects: Project[];
  onProjectClick?: (project: Project) => void;
  onDelete?: (project: Project) => void;
  onRename?: (project: Project) => void;
}

export function ProjectGrid({ projects, onProjectClick, onDelete, onRename }: ProjectGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          All Projects
        </h2>
        <div
          className="flex gap-2 p-1 rounded-xl border"
          style={{ background: "var(--surface-card)", borderColor: "var(--surface-border)" }}
        >
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "p-2 rounded-lg transition-all hover:cursor-pointer",
              viewMode === "grid"
                ? "bg-primary text-white shadow-lg shadow-blue-900/20"
                : "hover:bg-black/5 dark:hover:bg-white/5"
            )}
            style={viewMode !== "grid" ? { color: "var(--text-secondary)" } : undefined}
          >
            <FiGrid size={20} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "p-2 rounded-lg transition-all hover:cursor-pointer",
              viewMode === "list"
                ? "bg-primary text-white shadow-lg shadow-blue-900/20"
                : "hover:bg-black/5 dark:hover:bg-white/5"
            )}
            style={viewMode !== "list" ? { color: "var(--text-secondary)" } : undefined}
          >
            <FaListUl size={20} />
          </button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
          {projects.map((project) => (
            <div key={project.id} onClick={() => onProjectClick?.(project)} className="cursor-pointer">
              <ProjectCard
                title={project.title}
                filename={project.filename}
                status={project.status}
                duration={project.duration}
                type={project.type}
                onDelete={onDelete ? () => onDelete(project) : undefined}
                onRename={onRename ? () => onRename(project) : undefined}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => onProjectClick?.(project)}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 p-4 rounded-xl border hover:border-primary/50 transition-all group hover:cursor-pointer"
              style={{
                background: "var(--surface-card)",
                borderColor: "var(--surface-border)",
              }}
            >
              <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <div
                  className="size-8 sm:size-10 shrink-0 rounded-lg flex items-center justify-center border"
                  style={{ background: "var(--surface-inset)", borderColor: "var(--surface-border)" }}
                >
                  <span className="material-symbols-outlined text-[18px] sm:text-[20px]" style={{ color: "var(--text-muted)" }}>
                    {project.type === "error" ? "warning" : "analytics"}
                  </span>
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-sm sm:text-base group-hover:text-primary transition-colors truncate" style={{ color: "var(--text-primary)" }}>
                    {project.title}
                  </h4>
                  <p className="text-[10px] sm:text-xs font-mono truncate" style={{ color: "var(--text-secondary)" }}>
                    {project.filename}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-2 sm:gap-6 pt-2 sm:pt-0 border-t sm:border-t-0" style={{ borderColor: "var(--surface-border)" }}>
                <StatusBadge status={project.status} duration={project.duration} className="w-32 sm:w-40 !border-t-0 !pt-0 !mt-0" />
                <div className="flex items-center gap-2">
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <Dropdown
                      trigger={
                        <div className="p-1.5 sm:p-2 rounded-full transition-colors cursor-pointer" style={{ color: "var(--text-muted)" }}>
                          <HiDotsHorizontal className="size-4 sm:size-5" />
                        </div>
                      }
                      items={[
                        {
                          label: "Rename",
                          onClick: onRename ? () => onRename(project) : () => {},
                          icon: <span className="material-symbols-outlined text-lg">edit</span>,
                        },
                        {
                          label: "Delete",
                          onClick: onDelete ? () => onDelete(project) : () => {},
                          icon: <span className="material-symbols-outlined text-lg">delete</span>,
                          className: "text-red-400 hover:text-red-300 hover:bg-red-500/10",
                        },
                      ]}
                    />
                  </div>
                  <FaChevronRight className="text-[16px] sm:text-[20px] sm:opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--text-muted)" }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
