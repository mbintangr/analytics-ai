"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleLogout = async () => {
    try {
      setIsPending(true);
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/signin");
            router.refresh();
          },
        },
      });
    } catch (error) {
      console.error("Sign out failed:", error);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isPending}
      className={cn(
        "hover:cursor-pointer flex w-full items-center gap-3 px-3 py-3 rounded-xl transition-colors text-left hover:bg-black/5 dark:hover:bg-white/5",
        isPending && "opacity-50 cursor-not-allowed"
      )}
      style={{ color: "var(--text-secondary)" }}
    >
      <span className="material-symbols-outlined text-[24px]">logout</span>
      <span className="text-sm font-medium">
        {isPending ? "Signing out..." : "Sign Out"}
      </span>
    </button>
  );
}
