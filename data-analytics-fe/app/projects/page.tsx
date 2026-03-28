import { Sidebar } from "@/components/dashboard/large/sidebar";
import { Header } from "@/components/dashboard/large/header";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

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

async function ProjectsContentWrapper() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  let stats = {
    activeProjects: 0,
    processing: 0,
    failedJobs: 0,
    successRate: 0,
  };

  if (session?.user?.id) {
    const allSessions = await prisma.analysisSession.findMany({
      where: { userId: session.user.id },
      select: { status: true }
    });
    
    const totalSessions = allSessions.length;
    const processingCount = allSessions.filter((s) => s.status === "PROCESSING").length;
    const failedCount = allSessions.filter((s) => s.status === "FAILED").length;
    const completedCount = allSessions.filter((s) => s.status === "COMPLETED").length;
    const finishedCount = completedCount + failedCount;
    stats = {
      activeProjects: totalSessions,
      processing: processingCount,
      failedJobs: failedCount,
      successRate: finishedCount > 0 ? Math.round((completedCount / finishedCount) * 100) : 0,
    };
  }

  return (
    <>
      <Header userName={session?.user?.name} userId={session?.user?.id} />
      <ProjectsContent initialStats={stats} />
    </>
  )
}
