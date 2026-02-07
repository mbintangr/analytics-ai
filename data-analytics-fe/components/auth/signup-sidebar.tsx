import React from "react";
import { BsClipboardDataFill } from "react-icons/bs";
import { FaAsterisk } from "react-icons/fa";
import { MdInsights } from "react-icons/md";
import { Logo } from "../dashboard/small/logo";

export function SignupSidebar() {
  return (
    <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-10 bg-[#101622]/60 border-r border-white/5 relative">
      {/* Decorative tech grid lines */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(13,89,242,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(13,89,242,0.05)_1px,transparent_1px)] bg-size-[40px_40px] pointer-events-none opacity-50"></div>

      {/* Header Brand */}
      <Logo />

      {/* Value Props */}
      <div className="flex flex-col gap-10 z-10 my-auto">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-white">
            System <br />
            <span className="text-primary">Capabilities</span>
          </h1>
          <div className="h-1 w-12 bg-primary rounded-full"></div>
          <p className="text-slate-400 text-sm font-medium mt-1">
            Initialize your node to access our advanced AI swarm intelligence
            network.
          </p>
        </div>
        <div className="space-y-4">
          {/* Feature 1 */}
          <div className="flex gap-4 items-start p-4 rounded-lg bg-[#101622]/40 border border-white/5 hover:border-primary/40 transition-all duration-300 group cursor-default">
            <div className="p-2 rounded bg-primary/5 text-primary group-hover:text-[#101622] group-hover:bg-primary transition-all">
              <FaAsterisk />
            </div>
            <div>
              <h3 className="font-bold text-white text-base group-hover:text-primary transition-colors">
                Multi-Agent Workflows
              </h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Coordinate autonomous agents to solve complex data problems.
              </p>
            </div>
          </div>
          {/* Feature 2 */}
          <div className="flex gap-4 items-start p-4 rounded-lg bg-[#101622]/40 border border-white/5 hover:border-primary/40 transition-all duration-300 group cursor-default">
            <div className="p-2 rounded bg-primary/5 text-primary group-hover:text-[#101622] group-hover:bg-primary transition-all">
              <MdInsights />
            </div>
            <div>
              <h3 className="font-bold text-white text-base group-hover:text-primary transition-colors">
                Automated Insights
              </h3>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Generate comprehensive analytics reports by utilizing AI.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Text */}
      <div className="z-10 flex justify-between items-end border-t border-white/10 pt-6">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
            Status
          </span>
          <span className="text-xs text-green-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse"></span>
            ONLINE
          </span>
        </div>
        <div className="text-xs text-gray-600 font-mono">V1.0</div>
      </div>
    </div>
  );
}
