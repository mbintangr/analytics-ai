import React, { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function SearchInput() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(searchParams.get("search") || "");

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (value) {
        params.set("search", value);
      } else {
        params.delete("search");
      }

      const queryString = params.toString();

      startTransition(() => {
        if (pathname !== "/projects" && value) {
          router.push(`/projects?${queryString}`);
        } else if (pathname === "/projects") {
          router.replace(`/projects?${queryString}`);
        }
      });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [value, pathname, router]);

  return (
    <div className="relative group flex-1 xl:w-80">
      <div
        className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-primary"
        style={{ color: "var(--text-muted)" }}
      >
        <span className="material-symbols-outlined text-[20px]">search</span>
      </div>
      <input
        className="block w-full pl-10 pr-3 py-3 border-none rounded-xl text-sm transition-all shadow-sm outline-none focus:ring-2 focus:ring-primary/50"
        style={{
          background: "var(--surface-card)",
          color: "var(--text-primary)",
          border: "1px solid var(--surface-border)",
        }}
        placeholder="Search projects, files..."
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
}
