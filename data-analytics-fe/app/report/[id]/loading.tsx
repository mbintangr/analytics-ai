import { Sidebar } from "@/components/dashboard/large/sidebar";
import { ReportViewSkeleton } from "@/components/dashboard/large/report-view-skeleton";
import { TableOfContentsSkeleton } from "@/components/dashboard/large/table-of-contents-skeleton";

export default function Loading() {
  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-background-dark font-display antialiased overflow-hidden text-slate-900 dark:text-white">
      <Sidebar />
      <main className="flex-1 h-full flex relative overflow-hidden">
        {/* Main Report Area */}
        <div className="flex-1 h-full overflow-y-auto">
          <ReportViewSkeleton />
        </div>

        {/* Table of Contents Sidebar */}
        <TableOfContentsSkeleton />
      </main>
    </div>
  );
}
