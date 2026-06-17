"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectCard } from "../medium/project-card";
import { Project } from "./project-grid";
import { MdOutlineAnalytics } from "react-icons/md";
import { UploadModal } from "./upload-modal";
import { RenameModal } from "./rename-modal";

interface HomeContentProps {
  userName?: string | null;
  userId?: string;
  recentProjects: Project[];
}

export function HomeContent({ userName, userId, recentProjects: initialProjects }: HomeContentProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>(initialProjects);

  const [projectToRename, setProjectToRename] = useState<Project | null>(null);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: project.id }),
      });

      if (res.ok) {
        setProjects((prev) => prev.filter((p) => p.id !== project.id));
      } else {
        alert("Failed to delete project");
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      alert("Error deleting project");
    }
  };

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
      } else {
        const data = await res.json();
        alert(data.error || "Failed to rename project");
      }
    } catch (error) {
      console.error("Error renaming project:", error);
      alert("Error renaming project");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-5xl text-center pb-20 pt-10">
      <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight" style={{ color: "var(--text-primary)" }}>
        Welcome, <span className="text-primary">{userName || "User"}!</span>
      </h1>
      <p className="text-lg md:text-xl mb-12 max-w-2xl font-medium" style={{ color: "var(--text-secondary)" }}>
        Ready to start your data journey? Click to upload your dataset below.
      </p>

      <div
        onClick={() => setIsModalOpen(true)}
        className="w-full max-w-2xl rounded-full pl-6 pr-2 py-2 flex items-center justify-between cursor-pointer hover:border-primary transition-all shadow-md hover:shadow-primary/10 group mb-16 border"
        style={{
          background: "var(--surface-card)",
          borderColor: "var(--surface-border)",
        }}
      >
        <span className="text-lg text-left truncate transition-colors" style={{ color: "var(--text-secondary)" }}>
          Upload a dataset (.csv)...
        </span>
        <div className="bg-primary text-white p-3 rounded-full group-hover:bg-blue-600 transition-transform shrink-0">
          <MdOutlineAnalytics size={24} />
        </div>
      </div>

      <UploadModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userId={userId}
      />

      {projects.length > 0 && (
        <div className="w-full text-left">
          <h2 className="text-2xl font-bold mb-6 text-center" style={{ color: "var(--text-primary)" }}>
            Recent Projects
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                title={project.title}
                filename={project.filename}
                status={project.status}
                duration={project.duration}
                type={project.type}
                onClick={() => handleProjectClick(project)}
                onDelete={() => handleDeleteProject(project)}
                onRename={() => handleRenameProject(project)}
              />
            ))}
          </div>
        </div>
      )}

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
