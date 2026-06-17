import { auth } from "@/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const backendUrl =
      process.env.BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:4001";
    const res = await fetch(`${backendUrl}/report/${id}`);

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Backend returned ${res.status}: ${errorText}`);
      return NextResponse.json(
        { error: `Backend error: ${res.status}`, details: errorText },
        { status: res.status },
      );
    }

    const data = await res.json();

    try {
      const { prisma } = await import("@/lib/prisma");
      const processes = await prisma.analysisProcess.findMany({
        where: {
          analysisSessionId: id,
        },
        orderBy: {
          timestamp: "asc",
        },
      });
      data.processes = processes;
    } catch (dbError) {
      console.error("Error fetching process logs:", dbError);
      data.processes = [];
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Report Proxy Error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
