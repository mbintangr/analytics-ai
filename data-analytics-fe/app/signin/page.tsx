import { BackgroundEffects } from "@/components/auth/background-effects";
import { GlassCard } from "@/components/auth/glass-card";
import { LoginForm } from "@/components/auth/login-form";
import Link from "next/link";
import { BsClipboardDataFill } from "react-icons/bs";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    return redirect("/");
  }

  return (
    <main className="font-display relative z-10 flex-1 flex flex-col items-center justify-center min-h-screen p-4 sm:p-8 w-full overflow-hidden">
      <BackgroundEffects />

      <div className="relative z-20 w-full max-w-[460px]">
        <GlassCard>
          <div className="flex flex-col items-center text-center gap-2">
            <div 
              className="flex items-center justify-center size-12 rounded-xl border mb-4 shadow-lg"
              style={{ background: "var(--surface-inset)", borderColor: "var(--surface-border)" }}
            >
              <span className="text-primary"><BsClipboardDataFill className="w-6 h-6" /></span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Analytics AI
            </h1>
            <p className="text-sm font-medium mt-1" style={{ color: "var(--text-secondary)" }}>
              Welcome Back! Please sign in to your account.
            </p>
          </div>

          <LoginForm />

          <div className="text-center">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              New to the network?
              <Link
                href="/signup"
                className="font-semibold hover:text-primary transition-colors ml-1 relative inline-block group/link"
                style={{ color: "var(--text-primary)" }}
              >
                Sign Up
                <span className="absolute bottom-0 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover/link:w-full"></span>
              </Link>
            </p>
          </div>
        </GlassCard>
      </div>

      <div className="mt-8 flex items-center gap-2 text-slate-600 text-xs font-mono uppercase tracking-widest opacity-60 relative z-20">
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
        Online v1.0
      </div>
    </main>
  );
}
