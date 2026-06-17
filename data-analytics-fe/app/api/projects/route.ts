import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Project } from "@/components/dashboard/large/project-grid";

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search");

  try {
    const allSessions = await prisma.analysisSession.findMany({
      where: { userId: session.user.id },
    });

    const totalSessions = allSessions.length;
    const processingCount = allSessions.filter((s) => s.status === "PROCESSING").length;
    const failedCount = allSessions.filter((s) => s.status === "FAILED").length;
    const completedCount = allSessions.filter((s) => s.status === "COMPLETED").length;
    const finishedCount = completedCount + failedCount;
    const successRate = finishedCount > 0 ? Math.round((completedCount / finishedCount) * 100) : 0;

    const stats = {
      activeProjects: totalSessions,
      processing: processingCount,
      failedJobs: failedCount,
      successRate: successRate,
    };

    const where: any = {
      userId: session.user.id,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { originalFileName: { contains: search, mode: "insensitive" } },
      ];
    }

    const analysisSessions = search ? await prisma.analysisSession.findMany({
      where,
      orderBy: { createdAt: "desc" },
    }) : allSessions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const projects: Project[] = analysisSessions.map((session) => {
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
    console.error("Projects API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Missing project ID" },
        { status: 400 },
      );
    }

    const project = await prisma.analysisSession.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const backendUrl =
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:8000";
    try {
      const response = await fetch(`${backendUrl}/project/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        console.error(
          `Failed to delete files from backend: ${response.statusText}`,
        );
      }
    } catch (backendError) {
      console.error("Error connecting to backend for deletion:", backendError);
    }

    await prisma.analysisSession.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete Project Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, title } = await request.json();

    if (!id || !title) {
      return NextResponse.json(
        { error: "Missing project ID or title" },
        { status: 400 },
      );
    }

    if (title.length > 100) {
      return NextResponse.json({ error: "Title too long" }, { status: 400 });
    }

    const project = await prisma.analysisSession.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await prisma.analysisSession.update({
      where: { id },
      data: { title },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Rename Project Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
