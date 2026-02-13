"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { FaCheck } from "react-icons/fa";
import { RiPsychotherapyLine } from "react-icons/ri";
import { MdQueryStats } from "react-icons/md";
import { TbFileDescription } from "react-icons/tb";
import { ProcessLogsTable, ProcessLog } from "./process-logs-table";

interface ProcessingViewProps {
  className?: string;
  status?: string;
  filename?: string;
  createdAt?: Date;
}

type StepStatus = "pending" | "processing" | "completed";



import { useRouter } from "next/navigation";

export function ProcessingView({ className, status = "PROCESSING", filename, createdAt, reportId }: ProcessingViewProps & { reportId?: string }) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [logs, setLogs] = useState<ProcessLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (createdAt) {
      const start = new Date(createdAt).getTime();
      const now = new Date().getTime();
      setElapsedTime(Math.floor((now - start) / 1000));
    }

    const timer = setInterval(() => {
      if (createdAt) {
        const start = new Date(createdAt).getTime();
        const now = new Date().getTime();
        setElapsedTime(Math.floor((now - start) / 1000));
      } else {
        setElapsedTime(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [createdAt]);

  useEffect(() => {
    if (!reportId) return;

    const fetchLogs = async () => {
      try {
        const res = await fetch(`/api/report/${reportId}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === "ERROR") {
          router.push("/");
          return;
        }

        if (data.processes) {
          setLogs((prev) => {
            // Only update if length changed to avoid too many re-renders or simple check
            if (prev.length !== data.processes.length) return data.processes;
            return prev;
          });
        }
      } catch (e) {
        console.error("Error fetching logs in processing view", e);
      }
    };

    fetchLogs();
    const logInterval = setInterval(fetchLogs, 3000);
    return () => clearInterval(logInterval);
  }, [reportId, router]);


  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const getStepStatus = (stepName: string): StepStatus => {
    const order = [
      "data_preprocessing_agent",
      "business_questions_agent",
      "eda_agent",
      "data_explainer_agent"
    ];

    const currentAgent = status.replace("PROCESSING ", "").trim();

    if (status === "PROCESSING") {
      return stepName === "data_preprocessing_agent" ? "processing" : "pending";
    }

    if (status === "COMPLETED") return "completed";
    if (status === "ERROR") return "pending";

    const currentIndex = order.indexOf(currentAgent);
    const stepIndex = order.indexOf(stepName);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "processing";
    return "pending";
  };

  const getProgressWidth = () => {
    if (status === "COMPLETED") return "100%";

    if (status.includes("data_preprocessing_agent")) return "12%";
    if (status.includes("business_questions_agent")) return "38%";
    if (status.includes("eda_agent")) return "64%";
    if (status.includes("data_explainer_agent")) return "90%";

    return "0%";
  };

  return (
    <div className={cn("relative flex h-full w-full flex-col overflow-hidden bg-background-cyber text-white font-display selection:bg-primary selection:text-white", className)}>
      {/* Cyber Grid Background */}
      <div className="fixed inset-0 pointer-events-none z-0 h-full w-full opacity-50"
        style={{
          backgroundImage: `linear-gradient(rgba(13, 89, 242, 0.03) 1px, transparent 1px),
             linear-gradient(90deg, rgba(13, 89, 242, 0.03) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      >
        <div className="absolute inset-0 bg-linear-to-t from-background-cyber via-transparent to-transparent"></div>
      </div>

      <div className="relative flex h-full w-full flex-col z-10">
        <div className="flex flex-1 overflow-hidden">

          {/* Header Info Card */}
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-4">
            <div className="flex flex-col gap-1 backdrop-blur-md bg-slate-900/40 border border-glass-border p-4 rounded-xl shadow-2xl min-w-fit">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Filename</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Elapsed</span>
              </div>
              <div className="flex items-center justify-between gap-6">
                <div className="flex items-center gap-2">
                  <TbFileDescription className="text-primary text-xl" />
                  <span className="text-sm font-semibold text-white truncate max-w-[200px]" title={filename}>{filename || "Unknown"}</span>
                </div>
                <div className="font-mono text-emerald-400 font-bold text-lg">
                  {formatTime(elapsedTime)}
                </div>
              </div>
            </div>

            {/* Logs Toggle */}
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 rounded-full text-xs font-mono uppercase tracking-wider text-primary transition-all backdrop-blur-sm"
            >
              {showLogs ? "Hide System Logs" : "Show System Logs"}
            </button>
          </div>

          {/* Main Content Area */}
          <main className="flex-1 relative overflow-hidden flex flex-col items-center justify-center p-12 bg-background-cyber/50">

            {showLogs ? (
              <div className="w-full max-w-5xl h-[60vh] backdrop-blur-xl bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                  <h3 className="font-mono text-sm text-primary uppercase tracking-wider">System Execution Logs</h3>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                      <span className="text-[10px] text-blue-300">AGENT</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-green-500/10 border border-green-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                      <span className="text-[10px] text-green-300">TOOL</span>
                    </div>
                  </div>
                </div>


                <ProcessLogsTable logs={logs} className="flex-1 p-0" />

              </div>
            ) : (
              /* Progress Nodes */
              <div className="w-full max-w-5xl relative flex items-center justify-between h-48 animate-in fade-in zoom-in duration-500">
                {/* Connector Lines */}
                <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-800 -translate-y-1/2 z-0 w-full mx-12"></div>
                {/* Active Beam Line */}
                <div
                  className="absolute left-0 top-1/2 h-0.5 bg-linear-to-r from-secondary via-secondary to-primary -translate-y-1/2 z-0 mx-12 shadow-[0_0_10px_rgba(13,89,242,0.6)] opacity-50 transition-all duration-1000 ease-in-out"
                  style={{ width: getProgressWidth() }}
                ></div>

                {/* Node 1: Preprocessing */}
                <StatusNode
                  title="Data Preprocessing"
                  status={getStepStatus("data_preprocessing_agent")}
                  icon={<FaCheck />}
                  detail="Understanding, Assessing, and Cleaning"
                />

                {/* Node 2: Business Questions */}
                <StatusNode
                  title="Business Questions"
                  status={getStepStatus("business_questions_agent")}
                  icon={<RiPsychotherapyLine />}
                  detail="Formulating Business Questions"
                />

                {/* Node 3: EDA */}
                <StatusNode
                  title="Exploratory Analysis"
                  status={getStepStatus("eda_agent")}
                  icon={<MdQueryStats />}
                  detail="Performing Exploratory Data Analysis"
                />

                {/* Node 4: Explanation */}
                <StatusNode
                  title="Data Explanation"
                  status={getStepStatus("data_explainer_agent")}
                  icon={<TbFileDescription />}
                  detail="Generating Final Report"
                />

              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function StatusNode({ title, status, icon, detail }: { title: string, status: StepStatus, icon: React.ReactNode, detail?: string }) {
  if (status === "completed") {
    return (
      <div className="relative z-10 flex flex-col items-center group">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] border-4 border-background-cyber ring-2 ring-emerald-500/50 transition-transform hover:scale-110">
          <span className="text-background-cyber text-3xl font-bold">{icon}</span>
        </div>
        <div className="absolute top-20 flex flex-col items-center w-48 text-center">
          <span className="text-emerald-400 font-mono text-xs uppercase tracking-wider mb-1">Completed</span>
          <h3 className="text-white font-semibold">{title}</h3>
          {detail && <p className="text-slate-500 text-xs mt-1">{detail}</p>}
        </div>
      </div>
    )
  }

  if (status === "processing") {
    return (
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-primary opacity-20 animate-ping"></div>
          <div className="absolute inset-0 rounded-full bg-primary opacity-40 animate-pulse-glow"></div>
          <div className="relative w-16 h-16 rounded-full bg-background-cyber border-2 border-primary flex items-center justify-center shadow-[0_0_30px_rgba(13,89,242,0.6)] z-20">
            <span className="text-primary text-3xl animate-pulse">{icon}</span>
          </div>
        </div>
        <div className="absolute top-24 flex flex-col items-center w-56 text-center">
          <span className="text-primary font-mono text-xs uppercase tracking-wider mb-1 animate-pulse">In Progress</span>
          <h3 className="text-white font-bold text-base">{title}</h3>
          <div className="mt-2 bg-slate-900/80 border border-primary/30 rounded px-3 py-2 text-left w-full max-w-[200px]">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
              <span className="text-sm text-primary/80 font-mono">Working...</span>
            </div>
            {detail && <p className="text-xs text-slate-400 leading-tight">{detail}</p>}
          </div>
        </div>
      </div>
    )
  }

  // Pending
  return (
    <div className="relative z-10 flex flex-col items-center group">
      <div className="w-14 h-14 rounded-full bg-background-cyber border-2 border-slate-700 flex items-center justify-center transition-colors group-hover:border-slate-500">
        <span className="text-slate-600 text-2xl group-hover:text-slate-400">{icon}</span>
      </div>
      <div className="absolute top-20 flex flex-col items-center w-48 text-center">
        <span className="text-slate-600 font-mono text-xs uppercase tracking-wider mb-1">Pending</span>
        <h3 className="text-slate-400 font-medium">{title}</h3>
      </div>
    </div>
  )
}
