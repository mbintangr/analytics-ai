import { Sidebar } from "@/components/dashboard/large/sidebar";
import { HeaderSkeleton } from "@/components/dashboard/large/header-skeleton";
import { StatsRowSkeleton } from "@/components/dashboard/large/stats-row-skeleton";
import { ProjectGridSkeleton } from "@/components/dashboard/large/project-grid-skeleton";

export default function Loading() {
  return (
    <div className="flex h-screen w-full font-display antialiased overflow-hidden" style={{ background: "var(--surface-base)", color: "var(--text-primary)" }}>
      <Sidebar />
      <main className="flex-1 h-full overflow-y-auto relative">
        <div className="max-w-[1440px] mx-auto p-6 md:p-10 flex flex-col gap-8">
          <HeaderSkeleton />
          <StatsRowSkeleton />
          <ProjectGridSkeleton />
        </div>
      </main>
    </div>
  );
}
