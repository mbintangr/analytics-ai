"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ProjectCard } from "../medium/project-card";
import { Project } from "./project-grid";
import { MdOutlineAnalytics } from "react-icons/md";
import { UploadModal } from "./upload-modal";

interface HomeContentProps {
  userName?: string | null;
  userId?: string;
  recentProjects: Project[];
}

export function HomeContent({ userName, userId, recentProjects }: HomeContentProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleProjectClick = (project: Project) => {
    if (project.status !== "Failed") {
      router.push(`/report/${project.id}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-5xl text-center pb-20 pt-10">
      <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
        Welcome, <span className="text-primary">{userName || "User"}!</span>
      </h1>
      <p className="text-slate-400 text-lg md:text-xl mb-12 max-w-2xl font-medium">
        Ready to start your data journey? Click to upload your dataset below.
      </p>

      {/* Styled Search Bar for Upload */}
      <div 
        onClick={() => setIsModalOpen(true)}
        className="w-full max-w-2xl bg-[#1e293b] border border-[#314368] rounded-full pl-6 pr-2 py-2 flex items-center justify-between cursor-pointer hover:border-primary transition-all shadow-[0_4px_20px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_25px_rgba(13,89,242,0.15)] group mb-16"
      >
        <span className="text-slate-400 group-hover:text-slate-300 transition-colors text-lg text-left truncate">
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

      {/* Project Cards */}
      {recentProjects.length > 0 && (
        <div className="w-full flex justify-center text-left">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
            {recentProjects.map((project) => (
              <div key={project.id} onClick={() => handleProjectClick(project)} className="cursor-pointer">
                <ProjectCard
                  title={project.title}
                  filename={project.filename}
                  status={project.status}
                  duration={project.duration}
                  type={project.type}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
