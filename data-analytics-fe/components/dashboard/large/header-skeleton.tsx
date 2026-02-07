import { Skeleton } from "@/components/ui/skeleton";

export function HeaderSkeleton() {
  return (
    <div className="flex flex-col xl:flex-row gap-6 justify-between items-start xl:items-center">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-10 w-64 md:w-96" />
        <Skeleton className="h-6 w-48 md:w-72" />
      </div>
      <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
        <Skeleton className="h-10 w-full sm:w-64" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}
