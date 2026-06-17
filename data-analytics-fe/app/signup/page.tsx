import { BackgroundEffects } from "@/components/auth/background-effects";
import { SignupForm } from "@/components/auth/signup-form";
import { SignupSidebar } from "@/components/auth/signup-sidebar";
import { BsClipboardDataFill } from "react-icons/bs";
import { auth } from "@/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function SignupPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    return redirect("/");
  }

  return (
    <main className="font-display min-h-screen flex items-center justify-center p-4 relative overflow-hidden selection:bg-primary selection:text-white" style={{ background: "var(--surface-base)", color: "var(--text-primary)" }}>
      <BackgroundEffects />

      <div 
        className="w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-12 gap-0 border rounded-xl backdrop-blur-2xl shadow-2xl overflow-hidden relative z-10"
        style={{ background: "var(--glass-bg)", borderColor: "var(--glass-border)" }}
      >

        <SignupSidebar />

        <div className="col-span-1 lg:col-span-7 p-8 md:p-12 lg:p-16 flex flex-col justify-center relative">
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <span className="text-primary"><BsClipboardDataFill /></span>
            <span className="font-bold text-lg tracking-tight" style={{ color: "var(--text-primary)" }}>Analytics AI</span>
          </div>

          <SignupForm />
        </div>
      </div>
    </main>
  );
}
