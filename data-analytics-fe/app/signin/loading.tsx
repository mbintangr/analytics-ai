import { BackgroundEffects } from "@/components/auth/background-effects";
import { GlassCard } from "@/components/auth/glass-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="font-display relative z-10 flex-1 flex flex-col items-center justify-center min-h-screen p-4 sm:p-8 w-full overflow-hidden">
      <BackgroundEffects />

      <div className="relative z-20 w-full max-w-[460px]">
        <GlassCard>
          {/* Header Section */}
          <div className="flex flex-col items-center text-center gap-2">
            <Skeleton className="w-12 h-12 rounded-xl mb-4 bg-slate-800/80" />
            <Skeleton className="h-8 w-48 bg-slate-800/80" />
            <Skeleton className="h-4 w-64 mt-1 bg-slate-800/50" />
          </div>

          {/* Form Placeholder */}
          <div className="w-full space-y-4 mt-2">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16 bg-slate-800/50" />
              <Skeleton className="h-10 w-full rounded-lg bg-slate-800/50" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16 bg-slate-800/50" />
                <Skeleton className="h-3 w-24 bg-slate-800/30" />
              </div>
              <Skeleton className="h-10 w-full rounded-lg bg-slate-800/50" />
            </div>

            <Skeleton className="h-10 w-full rounded-lg mt-6 bg-slate-700/50" />

            <div className="flex justify-center gap-4 mt-6">
              <Skeleton className="h-10 flex-1 rounded-lg bg-slate-800/30" />
              <Skeleton className="h-10 flex-1 rounded-lg bg-slate-800/30" />
            </div>
          </div>

          {/* Footer / Sign Up */}
          <div className="flex justify-center mt-2">
            <Skeleton className="h-4 w-48 bg-slate-800/30" />
          </div>
        </GlassCard>
      </div>

      {/* Decorative footer text */}
      <div className="mt-8 flex items-center gap-2 relative z-20">
        <Skeleton className="w-2 h-2 rounded-full bg-slate-700" />
        <Skeleton className="h-3 w-20 bg-slate-700/50" />
      </div>
    </main>
  );
}
