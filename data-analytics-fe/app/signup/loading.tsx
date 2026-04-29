import { BackgroundEffects } from "@/components/auth/background-effects";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main
      className="font-display min-h-screen flex items-center justify-center p-4 relative overflow-hidden selection:bg-primary selection:text-white"
      style={{ background: "var(--surface-base)", color: "var(--text-primary)" }}
    >
      <BackgroundEffects />

      {/* Main Glassmorphic Card */}
      <div
        className="w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-12 gap-0 border rounded-xl backdrop-blur-2xl shadow-2xl overflow-hidden relative z-10"
        style={{ background: "var(--glass-bg)", borderColor: "var(--glass-border)" }}
      >
        {/* Left Panel: Sidebar Skeleton */}
        <div
          className="hidden lg:flex lg:col-span-5 flex-col justify-between p-10 border-r relative"
          style={{ background: "var(--surface-sidebar)", borderColor: "var(--surface-border)" }}
        >
          {/* Decorative tech grid lines */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(13,89,242,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(13,89,242,0.05)_1px,transparent_1px)] bg-size-[40px_40px] pointer-events-none opacity-50"></div>

          {/* Logo skeleton */}
          <div className="flex items-center gap-2 z-10">
            <Skeleton className="w-8 h-8 rounded" />
            <Skeleton className="h-5 w-32" />
          </div>

          {/* Value Props skeleton */}
          <div className="flex flex-col gap-10 z-10 my-auto">
            <div className="flex flex-col gap-3">
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-1 w-12 rounded-full" />
              <Skeleton className="h-4 w-64 mt-1" />
            </div>
            <div className="space-y-4">
              {/* Feature 1 skeleton */}
              <div
                className="flex gap-4 items-start p-4 rounded-lg border"
                style={{ background: "var(--surface-deep)", borderColor: "var(--surface-border)" }}
              >
                <Skeleton className="w-9 h-9 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
              </div>
              {/* Feature 2 skeleton */}
              <div
                className="flex gap-4 items-start p-4 rounded-lg border"
                style={{ background: "var(--surface-deep)", borderColor: "var(--surface-border)" }}
              >
                <Skeleton className="w-9 h-9 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-60" />
                </div>
              </div>
            </div>
          </div>

          {/* Footer skeleton */}
          <div className="z-10 flex justify-between items-end border-t pt-6" style={{ borderColor: "var(--surface-border)" }}>
            <div className="flex flex-col gap-1">
              <Skeleton className="h-2 w-12" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-3 w-8" />
          </div>
        </div>

        {/* Right Panel: Form Skeleton */}
        <div className="col-span-1 lg:col-span-7 p-8 md:p-12 lg:p-16 flex flex-col justify-center relative">
          {/* Mobile Header skeleton */}
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <Skeleton className="w-5 h-5 rounded" />
            <Skeleton className="h-5 w-28" />
          </div>

          <div className="max-w-md mx-auto w-full flex flex-col gap-8">
            {/* Header skeleton */}
            <div className="space-y-1">
              <Skeleton className="h-3 w-32 mb-2" />
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-4 w-64 mt-1" />
            </div>

            {/* Form skeleton */}
            <div className="flex flex-col gap-5">
              {/* Name Input */}
              <div className="space-y-2">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>

              {/* Submit Button */}
              <Skeleton className="h-12 w-full rounded-lg mt-4" />
            </div>

            {/* Footer link skeleton */}
            <div className="flex justify-center">
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
