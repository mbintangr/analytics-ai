import { Sidebar } from "@/components/dashboard/large/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex h-screen w-full font-display antialiased overflow-hidden" style={{ background: "var(--surface-base)", color: "var(--text-primary)" }}>
      <Sidebar />
      <main className="flex-1 h-full overflow-y-auto relative">
        <div className="w-full h-full flex flex-col items-center justify-center p-6 md:p-10">
          <div className="flex flex-col items-center justify-center w-full max-w-5xl text-center pb-20 pt-10">
            {/* Title Skeleton */}
            <Skeleton className="h-12 w-64 md:w-96 mb-4 rounded-lg" />
            
            {/* Subtitle Skeleton */}
            <Skeleton className="h-6 w-full max-w-lg mb-12 rounded-lg" />

            {/* Upload Bar Skeleton */}
            <div 
              className="w-full max-w-2xl rounded-full p-2 flex items-center justify-between mb-16 border"
              style={{
                background: "var(--surface-card)",
                borderColor: "var(--surface-border)",
              }}
            >
              <Skeleton className="h-6 w-48 ml-4 rounded-md bg-transparent" />
              <Skeleton className="size-12 rounded-full shrink-0" />
            </div>

            {/* Recent Projects Title Skeleton */}
            <div className="w-full text-center mb-6">
              <Skeleton className="h-8 w-48 mx-auto rounded-lg" />
            </div>

            {/* Recent Projects Grid Skeleton (3 items) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full text-left">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl border flex flex-col gap-4 h-[220px]"
                  style={{
                    background: "var(--surface-card)",
                    borderColor: "var(--surface-border)",
                  }}
                >
                  <div
                    className="h-28 w-full rounded-xl animate-pulse"
                    style={{ background: "var(--surface-deep)" }}
                  />
                  <div className="space-y-2 mt-auto">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3.5 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
