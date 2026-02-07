import { Sidebar } from "@/components/dashboard/large/sidebar";
import { HeaderSkeleton } from "@/components/dashboard/large/header-skeleton";
import { ProjectGridSkeleton } from "@/components/dashboard/large/project-grid-skeleton";

export default function Loading() {
  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-background-dark font-display antialiased overflow-hidden text-slate-900 dark:text-white">
      <Sidebar />
      <main className="flex-1 h-full overflow-y-auto relative">
        <div className="max-w-[1440px] mx-auto p-6 md:p-10 flex flex-col gap-8">
          <HeaderSkeleton />
          <div className="flex flex-col gap-6">
            <div className="h-8 w-48 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
            <ProjectGridSkeleton />
          </div>
        </div>
      </main>
    </div>
  );
}
