import React from "react";
import { Sidebar } from "@/components/dashboard/large/sidebar";
import { ReportView } from "@/components/dashboard/large/report-view";
import { TableOfContents } from "@/components/dashboard/large/table-of-contents";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

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

  // 1. Fetch status from DB
  try {
    const analysisSession = await prisma.analysisSession.findUnique({
      where: { id },
      select: {
        status: true,
        originalFileName: true,
        createdAt: true
      }
    });
    if (analysisSession) {
      status = analysisSession.status;
      filename = analysisSession.originalFileName;
      createdAt = analysisSession.createdAt;
    }
  } catch (error) {
    console.error("Error fetching session status:", error);
  }

  // 2. Fetch report content (if likely completed or checking)
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
    <div className="flex h-screen w-full bg-background-light dark:bg-background-dark font-display antialiased overflow-hidden text-slate-900 dark:text-white">
      <Sidebar />
      <main className="flex-1 h-full flex relative overflow-hidden">
        {/* Main Report Area */}
        <div className="flex-1 h-full overflow-y-auto">
          <ReportView
            reportContent={reportContent}
            imageBaseUrl={imageBaseUrl}
            isPage={true}
            status={status}
            filename={filename}
            createdAt={createdAt}
            reportId={id}
          />
        </div>

        {/* Table of Contents Sidebar */}
        {status === "COMPLETED" && reportContent && <TableOfContents content={reportContent} />}
      </main>
    </div>
  );
}
