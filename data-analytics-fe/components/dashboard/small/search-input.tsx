import React, { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

export function SearchInput() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(searchParams.get("search") || "");

  // Simple debounce implementation inside effect or use a hook if available
  // Let's use a simple timeout for now to avoid creating extra files if not needed, 
  // or I can create a hook. I'll stick to simple timeout for this component.

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (value) {
        params.set("search", value);
      } else {
        params.delete("search");
      }

      const queryString = params.toString();
      const targetPath = pathname === "/projects" ? "/projects" : "/projects";

      // If we are on dashboard and type, go to projects. 
      // If we are on projects, replace.

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
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
        <span className="material-symbols-outlined text-[20px]">search</span>
      </div>
      <input
        className="block w-full pl-10 pr-3 py-3 border-none rounded-xl bg-[#222f49] text-white placeholder-slate-400 focus:ring-2 focus:ring-primary/50 text-sm transition-all shadow-sm outline-none"
        placeholder="Search projects, files..."
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
}
