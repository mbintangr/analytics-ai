import { Sidebar } from "@/components/dashboard/large/sidebar";
import { HeaderSkeleton } from "@/components/dashboard/large/header-skeleton";
import { ProjectGridSkeleton } from "@/components/dashboard/large/project-grid-skeleton";

export default function Loading() {
  return (
    <div className="flex h-screen w-full font-display antialiased overflow-hidden" style={{ background: "var(--surface-base)", color: "var(--text-primary)" }}>
      <Sidebar />
      <main className="flex-1 h-full overflow-y-auto relative">
        <div className="max-w-[1440px] mx-auto p-6 md:p-10 flex flex-col gap-8">
          <HeaderSkeleton />
          <div className="flex flex-col gap-6">
            <div className="h-8 w-48 rounded animate-pulse" style={{ background: "var(--surface-border)" }} />
            <ProjectGridSkeleton />
          </div>
        </div>
      </main>
    </div>
  );
}
