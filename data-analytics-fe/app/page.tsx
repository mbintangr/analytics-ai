import { Sidebar } from "@/components/dashboard/large/sidebar";
import { HomeContent } from "@/components/dashboard/large/home-content";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { Project } from "@/components/dashboard/large/project-grid";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  let projects: Project[] = [];

  if (session?.user?.id) {
    const analysisSessions = await prisma.analysisSession.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 3,
    });

    projects = analysisSessions.map((session) => {
      let status: Project["status"] = "Processing";
      let type: Project["type"] = "processing";

      if (session.status === "COMPLETED") {
        status = "Completed";
        type = "bar";
      } else if (session.status === "FAILED") {
        status = "Failed";
        type = "error";
      } else {
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
        <div className="w-full h-full flex flex-col items-center justify-center p-6 md:p-10">
          <HomeContent userName={session?.user?.name} userId={session?.user?.id} recentProjects={projects} />
        </div>
      </main>
    </div>
  );
}
