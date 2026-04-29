import { Sidebar } from "@/components/dashboard/large/sidebar";
import { ReportViewSkeleton } from "@/components/dashboard/large/report-view-skeleton";
import { TableOfContentsSkeleton } from "@/components/dashboard/large/table-of-contents-skeleton";

export default function Loading() {
  return (
    <div className="flex h-screen w-full font-display antialiased overflow-hidden" style={{ background: "var(--surface-base)", color: "var(--text-primary)" }}>
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
