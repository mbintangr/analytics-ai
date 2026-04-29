import React from "react";
import { Logo } from "../small/logo";
import { NavLink } from "../small/nav-link";
import { LogoutButton } from "../small/logout-button";
import { ThemeToggle } from "../small/theme-toggle";

export function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-72 h-full shrink-0 border-r transition-colors duration-200"
      style={{
        background: "var(--surface-sidebar)",
        borderColor: "var(--surface-border)",
      }}
    >
      <div className="px-6 pt-10 pb-6">
        <Logo />
      </div>
      <nav className="flex-1 flex flex-col gap-2 px-4 py-4 overflow-y-auto">
        <NavLink href="/" icon="home" label="Home" />
        <NavLink href="/projects" icon="folder" label="Projects" />
        {/* <NavLink href="#" icon="settings" label="Settings" /> */}
      </nav>
      <div className="p-4 border-t flex flex-col gap-1" style={{ borderColor: "var(--surface-border)" }}>
        <ThemeToggle />
        <LogoutButton />
      </div>
    </aside>
  );
}
