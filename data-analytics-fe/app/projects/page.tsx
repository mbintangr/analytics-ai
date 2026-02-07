import { Sidebar } from "@/components/dashboard/large/sidebar";
import { Header } from "@/components/dashboard/large/header";
import { ProjectGrid, Project } from "@/components/dashboard/large/project-grid";
import { auth } from "@/auth";

import { ProjectsContent } from "@/components/dashboard/large/projects-content";

export default async function ProjectsPage() {

  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-background-dark font-display antialiased overflow-hidden text-slate-900 dark:text-white">
      <Sidebar />
      <main className="flex-1 h-full overflow-y-auto relative">
        <div className="max-w-[1440px] mx-auto p-6 md:p-10 flex flex-col gap-8">
          <ProjectsContentWrapper />
        </div>
      </main>
    </div>
  );
}

import { headers } from "next/headers";

async function ProjectsContentWrapper() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <>
      <Header userName={session?.user?.name} userId={session?.user?.id} />
      <ProjectsContent />
    </>
  )
}
