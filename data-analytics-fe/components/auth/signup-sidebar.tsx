import React from "react";
import { BsClipboardDataFill } from "react-icons/bs";
import { FaAsterisk } from "react-icons/fa";
import { MdInsights } from "react-icons/md";
import { Logo } from "../dashboard/small/logo";

export function SignupSidebar() {
  return (
    <div
      className="hidden lg:flex lg:col-span-5 flex-col justify-between p-10 border-r relative"
      style={{
        background: "var(--surface-sidebar)",
        borderColor: "var(--surface-border)",
      }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(13,89,242,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(13,89,242,0.05)_1px,transparent_1px)] bg-size-[40px_40px] pointer-events-none opacity-50"></div>

      <Logo />

      <div className="flex flex-col gap-10 z-10 my-auto">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight" style={{ color: "var(--text-primary)" }}>
            System <br />
            <span className="text-primary">Capabilities</span>
          </h1>
          <div className="h-1 w-12 bg-primary rounded-full"></div>
          <p className="text-sm font-medium mt-1" style={{ color: "var(--text-secondary)" }}>
            Initialize your node to access our advanced AI swarm intelligence network.
          </p>
        </div>
        <div className="space-y-4">
          <div
            className="flex gap-4 items-start p-4 rounded-lg border hover:border-primary/40 transition-all duration-300 group cursor-default"
            style={{
              background: "var(--surface-deep)",
              borderColor: "var(--surface-border)",
            }}
          >
            <div className="p-2 rounded bg-primary/10 text-primary group-hover:text-white group-hover:bg-primary transition-all">
              <FaAsterisk />
            </div>
            <div>
              <h3 className="font-bold text-base group-hover:text-primary transition-colors" style={{ color: "var(--text-primary)" }}>
                Multi-Agent Workflows
              </h3>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Coordinate autonomous agents to solve complex data problems.
              </p>
            </div>
          </div>
          <div
            className="flex gap-4 items-start p-4 rounded-lg border hover:border-primary/40 transition-all duration-300 group cursor-default"
            style={{
              background: "var(--surface-deep)",
              borderColor: "var(--surface-border)",
            }}
          >
            <div className="p-2 rounded bg-primary/10 text-primary group-hover:text-white group-hover:bg-primary transition-all">
              <MdInsights />
            </div>
            <div>
              <h3 className="font-bold text-base group-hover:text-primary transition-colors" style={{ color: "var(--text-primary)" }}>
                Automated Insights
              </h3>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                Generate comprehensive analytics reports by utilizing AI.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="z-10 flex justify-between items-end border-t pt-6" style={{ borderColor: "var(--surface-border)" }}>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: "var(--text-muted)" }}>
            Status
          </span>
          <span className="text-xs text-green-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
            ONLINE
          </span>
        </div>
        <div className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>V1.0</div>
      </div>
    </div>
  );
}
