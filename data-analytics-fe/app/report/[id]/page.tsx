import React from "react";
import { Sidebar } from "@/components/dashboard/large/sidebar";
import { ReportView } from "@/components/dashboard/large/report-view";
import { TableOfContents } from "@/components/dashboard/large/table-of-contents";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return <div>Please log in</div>;
  }

  let reportContent = null;
  let imageBaseUrl = null;
  let status = "PROCESSING";
  let filename = "Unknown File";
  let createdAt: Date | undefined = undefined;
  let isError = false;
  let metadata: {
    title: string;
    createdAt: Date;
    finishedAt: Date | null;
    businessQuestions: string | null;
    modelName: string | null;
    durationSeconds: number | null;
    totalTokens: number | null;
  } | null = null;

  try {
    const analysisSession = await prisma.analysisSession.findUnique({
      where: { id },
      select: {
        status: true,
        originalFileName: true,
        title: true,
        createdAt: true,
        finishedAt: true,
        businessQuestions: true,
        modelName: true,
        durationSeconds: true,
        totalTokens: true,
      }
    });
    if (analysisSession) {
      status = analysisSession.status;
      filename = analysisSession.originalFileName;
      createdAt = analysisSession.createdAt;
      metadata = {
        title: analysisSession.title,
        createdAt: analysisSession.createdAt,
        finishedAt: analysisSession.finishedAt ?? null,
        businessQuestions: analysisSession.businessQuestions ?? null,
        modelName: analysisSession.modelName ?? null,
        durationSeconds: analysisSession.durationSeconds ?? null,
        totalTokens: analysisSession.totalTokens ?? null,
      };

      if (status === "FAILED" || status === "CANCELLED") {
        redirect("/");
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    console.error("Error fetching session status:", error);
  }

  try {
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";
    const res = await fetch(`${backendUrl}/report/${id}`, {
      cache: 'no-store'
    });

    if (res.ok) {
      const data = await res.json();
      reportContent = data.report;
      if (data.image_dir) {
        imageBaseUrl = `${backendUrl}/${data.image_dir}/`;
      }
    } else {
      isError = true;
    }
  } catch (error) {
    console.error("Error fetching report server-side:", error);
    isError = true;
  }

  // if (isError || !reportContent) {
  //   return <div>Error fetching report</div>;
  // }

  return (
    <div className="flex h-screen w-full font-display antialiased overflow-hidden" style={{ background: "var(--surface-base)", color: "var(--text-primary)" }}>
      <Sidebar />
      <main className="flex-1 h-full flex relative overflow-hidden pt-16 md:pt-0 flex-col md:flex-row">
        <div className="flex-1 h-full overflow-y-auto">
          <ReportView
            reportContent={reportContent}
            imageBaseUrl={imageBaseUrl}
            isPage={true}
            status={status}
            filename={filename}
            createdAt={createdAt}
            reportId={id}
            metadata={metadata}
          />
        </div>

        {status === "COMPLETED" && reportContent && <TableOfContents content={reportContent} />}
      </main>
    </div>
  );
}
