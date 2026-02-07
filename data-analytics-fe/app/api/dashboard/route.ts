import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Project } from "@/components/dashboard/large/project-grid";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const analysisSessions = await prisma.analysisSession.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const totalSessions = analysisSessions.length;
    const processingCount = analysisSessions.filter(
      (s) => s.status === "PROCESSING",
    ).length;
    const failedCount = analysisSessions.filter(
      (s) => s.status === "FAILED",
    ).length;
    const completedCount = analysisSessions.filter(
      (s) => s.status === "COMPLETED",
    ).length;

    const finishedCount = completedCount + failedCount;
    const successRate =
      finishedCount > 0
        ? Math.round((completedCount / finishedCount) * 100)
        : 0;

    const stats = {
      activeProjects: totalSessions,
      processing: processingCount,
      failedJobs: failedCount,
      successRate: successRate,
    };

    const projects: Project[] = analysisSessions.slice(0, 8).map((session) => {
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

    return NextResponse.json({ stats, projects });
  } catch (error) {
    console.error("Dashboard API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
