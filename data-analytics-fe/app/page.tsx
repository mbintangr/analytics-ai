import { Header } from "@/components/dashboard/large/header";
import { Project } from "@/components/dashboard/large/project-grid";
import { Sidebar } from "@/components/dashboard/large/sidebar";
import { DashboardContent } from "@/components/dashboard/large/dashboard-content";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  let projects: Project[] = [];
  let stats = {
    activeProjects: 0,
    processing: 0,
    failedJobs: 0,
    successRate: 0,
  };

  if (session?.user?.id) {
    const analysisSessions = await prisma.analysisSession.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      // take: 6, // Removed take to calculate stats on all sessions, but we need to slice for grid
    });

    const totalSessions = analysisSessions.length;
    const processingCount = analysisSessions.filter(
      (s) => s.status === "PROCESSING"
    ).length;
    const failedCount = analysisSessions.filter(
      (s) => s.status === "FAILED"
    ).length;
    const completedCount = analysisSessions.filter(
      (s) => s.status === "COMPLETED"
    ).length;

    // Calculate success rate: Completed / (Completed + Failed) * 100
    // If no completed or failed, 0% (or 100%? usually 0 if nothing happened)
    const finishedCount = completedCount + failedCount;
    const successRate = finishedCount > 0
      ? Math.round((completedCount / finishedCount) * 100)
      : 0;

    stats = {
      activeProjects: totalSessions,
      processing: processingCount,
      failedJobs: failedCount,
      successRate: successRate,
    };

    // For the grid, we only want the recent 6
    projects = analysisSessions.slice(0, 6).map((session) => {
      // Map database status to frontend status
      let status: Project["status"] = "Processing";
      let type: Project["type"] = "processing";

      if (session.status === "COMPLETED") {
        status = "Completed";
        // TODO: In the future, determine type based on content or artifacts
        type = "bar";
      } else if (session.status === "FAILED") {
        status = "Failed";
        type = "error";
      } else {
        // Default to processing
        status = "Processing";
        type = "processing";
      }

      return {
        id: session.id,
        title: session.title,
        filename: session.originalFileName,
        status: status,
        duration: session.durationSeconds
          ? `${session.durationSeconds.toFixed(1)}s`
          : undefined,
        type: type,
      };
    });
  }

  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-background-dark font-display antialiased overflow-hidden text-slate-900 dark:text-white">
      <Sidebar />
      <main className="flex-1 h-full overflow-y-auto relative">
        <div className="max-w-[1440px] mx-auto p-6 md:p-10 flex flex-col gap-8">
          <Header userName={session?.user?.name} userId={session?.user?.id} />
          <DashboardContent initialStats={stats} initialProjects={projects} />
        </div>
      </main>
    </div>
  );
}
