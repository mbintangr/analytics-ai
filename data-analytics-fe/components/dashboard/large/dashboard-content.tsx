"use client";

import React, { useEffect, useState } from "react";
import { ProjectGrid, Project } from "./project-grid";
import { StatsRow } from "./stats-row";
import { ReportView } from "./report-view";
import { RenameModal } from "./rename-modal";
import { DeleteModal } from "./delete-modal";

import { useRouter } from "next/navigation";

interface DashboardStats {
  activeProjects: number;
  processing: number;
  failedJobs: number;
  successRate: number;
}

interface DashboardContentProps {
  initialStats: DashboardStats;
  initialProjects: Project[];
}

export function DashboardContent({
  initialStats,
  initialProjects,
}: DashboardContentProps) {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [projects, setProjects] = useState<Project[]>(initialProjects);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch("/api/dashboard");
        if (res.ok) {
          const data = await res.json();
          setStats(data.stats);
          setProjects(data.projects);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      }
    };

    const intervalId = setInterval(fetchDashboardData, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const handleProjectClick = (project: Project) => {
    if (project.status !== "Failed") {
      router.push(`/report/${project.id}`);
    }
  };

  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleDeleteProject = (project: Project) => {
    setProjectToDelete(project);
    setIsDeleteModalOpen(true);
  };

  const onDeleteSubmit = async () => {
    if (!projectToDelete) return;

    try {
      const res = await fetch("/api/projects", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: projectToDelete.id }),
      });

      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== projectToDelete.id));
      }
    } catch (error) {
      console.error("Error deleting project:", error);
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: projectToRename.id, title: newName }),
      });

      if (res.ok) {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === projectToRename.id ? { ...p, title: newName } : p
          )
        );
      }
    } catch (error) {
      console.error("Error renaming project:", error);
    }
  };

  return (
    <>
      <StatsRow {...stats} />
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
      {projectToDelete && (
        <DeleteModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onDelete={onDeleteSubmit}
          projectName={projectToDelete.title}
        />
      )}
    </>
  );
}
