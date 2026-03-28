"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ProjectGrid, Project } from "./project-grid";
import { ProjectGridSkeleton } from "./project-grid-skeleton";
import { RenameModal } from "./rename-modal";
import { StatsRow } from "./stats-row";

interface DashboardStats {
  activeProjects: number;
  processing: number;
  failedJobs: number;
  successRate: number;
}

interface ProjectsContentProps {
  initialStats?: DashboardStats;
}

export function ProjectsContent({ initialStats }: ProjectsContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(initialStats || null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async (isBackground = false) => {
      if (!isBackground) setIsLoading(true);
      try {
        const query = searchParams.get("search");
        const url = query ? `/api/projects?search=${encodeURIComponent(query)}` : "/api/projects";
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setProjects(data.projects);
          if (data.stats) {
            setStats(data.stats);
          }
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        if (!isBackground) setIsLoading(false);
      }
    };

    fetchProjects();

    const intervalId = setInterval(() => fetchProjects(true), 2000);
    return () => clearInterval(intervalId);
  }, [searchParams]);

  const handleProjectClick = (project: Project) => {
    if (project.status !== "Failed") {
      router.push(`/report/${project.id}`);
    }
  };

  const handleDeleteProject = async (project: Project) => {
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      return;
    }

    try {
      const res = await fetch("/api/projects", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: project.id }),
      });

      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== project.id));
      } else {
        console.error("Failed to delete project");
        alert("Failed to delete project");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Error deleting project");
    }
  };

  const [projectToRename, setProjectToRename] = useState<Project | null>(null);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);

  const handleRenameProject = (project: Project) => {
    setProjectToRename(project);
    setIsRenameModalOpen(true);
  };

  const onRenameSubmit = async (newName: string) => {
    if (!projectToRename) return;

    try {
      const res = await fetch("/api/projects", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: projectToRename.id, title: newName }),
      });

      if (res.ok) {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectToRename.id ? { ...p, title: newName } : p
          )
        );
      } else {
        const data = await res.json();
        alert(data.error || "Failed to rename project");
      }
    } catch (error) {
      console.error("Error renaming project:", error);
      alert("Error renaming project");
    }
  };

  if (isLoading && projects.length === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-8 w-48 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
        <ProjectGridSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {stats && <StatsRow {...stats} />}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">All Projects</h2>
      </div>
      <ProjectGrid
        projects={projects}
        onProjectClick={handleProjectClick}
        onDelete={handleDeleteProject}
        onRename={handleRenameProject}
      />
      {projectToRename && (
        <RenameModal
          isOpen={isRenameModalOpen}
          onClose={() => setIsRenameModalOpen(false)}
          onRename={onRenameSubmit}
          currentName={projectToRename.title}
        />
      )}
    </div>
  );
}
