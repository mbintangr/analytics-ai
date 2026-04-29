import { Skeleton } from "@/components/ui/skeleton";

export function TableOfContentsSkeleton() {
  return (
    <aside
      className="hidden xl:block w-72 px-8 py-10 border-l backdrop-blur-sm h-full overflow-y-auto"
      style={{
        borderColor: "var(--surface-border)",
        background: "var(--surface-inset)",
      }}
    >
      <div className="sticky flex flex-col gap-6">
        <Skeleton className="h-4 w-24" />
        <div
          className="flex flex-col gap-4 border-l relative pl-4"
          style={{ borderColor: "var(--surface-border)" }}
        >
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    </aside>
  );
}
