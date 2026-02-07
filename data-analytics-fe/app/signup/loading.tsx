import { BackgroundEffects } from "@/components/auth/background-effects";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="bg-background-dark font-display min-h-screen flex items-center justify-center p-4 relative overflow-hidden text-white selection:bg-primary selection:text-background-dark">
      <BackgroundEffects />

      {/* Main Glassmorphic Card */}
      <div className="w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-12 gap-0 border border-white/10 rounded-xl bg-[#183422]/20 backdrop-blur-2xl shadow-2xl overflow-hidden relative z-10 ring-1 ring-white/5">
        {/* Left Panel: Sidebar Skeleton */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-10 bg-[#101622]/60 border-r border-white/5 relative">
          {/* Decorative tech grid lines */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(13,89,242,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(13,89,242,0.05)_1px,transparent_1px)] bg-size-[40px_40px] pointer-events-none opacity-50"></div>

          {/* Logo skeleton */}
          <div className="flex items-center gap-2 z-10">
            <Skeleton className="w-8 h-8 rounded bg-slate-800/80" />
            <Skeleton className="h-5 w-32 bg-slate-800/80" />
          </div>

          {/* Value Props skeleton */}
          <div className="flex flex-col gap-10 z-10 my-auto">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-10 w-40 bg-slate-800/80" />
              <Skeleton className="h-10 w-48 bg-slate-800/80" />
              <Skeleton className="h-1 w-12 rounded-full bg-slate-700/80" />
              <Skeleton className="h-4 w-64 mt-1 bg-slate-800/50" />
            </div>
            <div className="space-y-4">
              {/* Feature 1 skeleton */}
              <div className="flex gap-4 items-start p-4 rounded-lg bg-[#101622]/40 border border-white/5">
                <Skeleton className="w-9 h-9 rounded bg-slate-800/80" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40 bg-slate-800/80" />
                  <Skeleton className="h-3 w-56 bg-slate-800/50" />
                </div>
              </div>
              {/* Feature 2 skeleton */}
              <div className="flex gap-4 items-start p-4 rounded-lg bg-[#101622]/40 border border-white/5">
                <Skeleton className="w-9 h-9 rounded bg-slate-800/80" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-36 bg-slate-800/80" />
                  <Skeleton className="h-3 w-60 bg-slate-800/50" />
                </div>
              </div>
            </div>
          </div>

          {/* Footer skeleton */}
          <div className="z-10 flex justify-between items-end border-t border-white/10 pt-6">
            <div className="flex flex-col gap-1">
              <Skeleton className="h-2 w-12 bg-slate-800/50" />
              <Skeleton className="h-3 w-16 bg-slate-700/50" />
            </div>
            <Skeleton className="h-3 w-8 bg-slate-800/50" />
          </div>
        </div>

        {/* Right Panel: Form Skeleton */}
        <div className="col-span-1 lg:col-span-7 p-8 md:p-12 lg:p-16 flex flex-col justify-center relative bg-linear-to-br from-transparent to-black/40">
          {/* Mobile Header skeleton */}
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <Skeleton className="w-5 h-5 rounded bg-slate-800/80" />
            <Skeleton className="h-5 w-28 bg-slate-800/80" />
          </div>

          <div className="max-w-md mx-auto w-full flex flex-col gap-8">
            {/* Header skeleton */}
            <div className="space-y-1">
              <Skeleton className="h-3 w-32 mb-2 bg-slate-800/50" />
              <Skeleton className="h-8 w-56 bg-slate-800/80" />
              <Skeleton className="h-4 w-64 mt-1 bg-slate-800/50" />
            </div>

            {/* Form skeleton */}
            <div className="flex flex-col gap-5">
              {/* Name Input */}
              <div className="space-y-2">
                <Skeleton className="h-3 w-12 bg-slate-800/50" />
                <Skeleton className="h-12 w-full rounded-lg bg-slate-800/50" />
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <Skeleton className="h-3 w-12 bg-slate-800/50" />
                <Skeleton className="h-12 w-full rounded-lg bg-slate-800/50" />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <Skeleton className="h-3 w-16 bg-slate-800/50" />
                <Skeleton className="h-12 w-full rounded-lg bg-slate-800/50" />
              </div>

              {/* Submit Button */}
              <Skeleton className="h-12 w-full rounded-lg mt-4 bg-slate-700/50" />
            </div>

            {/* Footer link skeleton */}
            <div className="flex justify-center">
              <Skeleton className="h-4 w-48 bg-slate-800/30" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
