"use client";

import React, { useState, useEffect } from "react";
import { Logo } from "../small/logo";
import { NavLink } from "../small/nav-link";
import { LogoutButton } from "../small/logout-button";
import { ThemeToggle } from "../small/theme-toggle";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export function Sidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile drawer when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* Mobile Top Navigation */}
      <div 
        className="md:hidden fixed top-0 left-0 right-0 h-16 border-b flex items-center justify-between px-4 z-40 backdrop-blur-md"
        style={{ background: "var(--surface-sidebar)", borderColor: "var(--surface-border)" }}
      >
        <Logo />
        <button 
          onClick={() => setIsMobileOpen(true)} 
          className="p-2 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center"
          style={{ color: "var(--text-primary)" }}
        >
          <span className="material-symbols-outlined text-2xl leading-none">menu</span>
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" 
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside 
        className={cn(
          "fixed md:static top-0 left-0 h-full w-72 shrink-0 border-r transition-all duration-300 z-50 flex flex-col",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
        style={{
          background: "var(--surface-sidebar)",
          borderColor: "var(--surface-border)",
        }}
      >
        <div className="h-16 px-4 md:px-6 flex items-center justify-between md:pt-10 md:pb-6 md:h-auto">
          <Logo />
          
          {/* Mobile Close Button */}
          <button 
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-2 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center"
            style={{ color: "var(--text-primary)" }}
          >
            <span className="material-symbols-outlined leading-none">close</span>
          </button>
        </div>

        <nav className="flex-1 flex flex-col gap-2 px-4 py-4 overflow-y-auto">
          <NavLink href="/" icon="home" label="Home" />
          <NavLink href="/projects" icon="folder" label="Projects" />
        </nav>

        <div className="p-4 border-t flex flex-col gap-1" style={{ borderColor: "var(--surface-border)" }}>
          <ThemeToggle />
          <LogoutButton />
        </div>
      </aside>
    </>
  );
}
