import { Skeleton } from "@/components/ui/skeleton";

export function StatsRowSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="p-4 rounded-xl border flex flex-col gap-2"
          style={{
            background: "var(--surface-card)",
            borderColor: "var(--surface-border)",
          }}
        >
          <div className="flex justify-between items-start">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="size-8 rounded-full" />
          </div>
          <Skeleton className="h-8 w-16 mt-2" />
        </div>
      ))}
    </div>
  );
}
