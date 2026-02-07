import { Skeleton } from "@/components/ui/skeleton";

export function ReportViewSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-10 scroll-smooth h-full">
      <div className="max-w-5xl mx-auto backdrop-blur-md bg-slate-900/50 border border-slate-800 rounded-2xl p-8 md:p-12 shadow-2xl relative overflow-hidden flex flex-col gap-6">
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-primary to-transparent opacity-50"></div>
        <Skeleton className="h-6 w-32 mb-4" />

        <div className="space-y-4">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>

        <div className="space-y-4 mt-8">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>

        <div className="space-y-4 mt-8">
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
