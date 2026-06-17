"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { FaCheck } from "react-icons/fa";
import { MdQueryStats } from "react-icons/md";
import { TbFileDescription } from "react-icons/tb";
import { IoClose } from "react-icons/io5";
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
  const [isCancelling, setIsCancelling] = useState(false);
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

        if (data.status === "FAILED") {
          router.push("/");
          return;
        }

        if (data.processes) {
          setLogs((prev) => {
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

  const handleCancel = async () => {
    if (!reportId || isCancelling) return;
    if (!confirm("Are you sure you want to cancel this analysis? This cannot be undone.")) return;
    try {
      setIsCancelling(true);
      const res = await fetch(`/api/report/${reportId}/cancel`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.details || err.error || "Cancel failed");
      }
      router.push("/");
    } catch (error) {
      console.error("Cancel failed:", error);
      alert(`Cancel failed: ${error}`);
    } finally {
      setIsCancelling(false);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  };

  const getStepStatus = (stepName: string): StepStatus => {
    const order = [
      "data_preprocessing_agent",
      "eda_agent",
      "data_explainer_agent"
    ];

    const currentAgent = status.replace("PROCESSING ", "").trim();

    if (status === "PROCESSING") {
      return stepName === "data_preprocessing_agent" ? "processing" : "pending";
    }

    if (status === "COMPLETED") return "completed";
    if (status === "FAILED") return "pending";

    const currentIndex = order.indexOf(currentAgent);
    const stepIndex = order.indexOf(stepName);

    if (currentAgent === "business_questions_agent") {
      if (stepName === "data_preprocessing_agent") return "completed";
      return "pending";
    }

    if (currentIndex === -1) return "pending";

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "processing";
    return "pending";
  };

  const getProgressHeight = () => {
    if (status === "COMPLETED") return "100%";

    const currentAgent = status.replace("PROCESSING ", "").trim();

    if (currentAgent === "data_preprocessing_agent" || status === "PROCESSING") return "15%";
    if (currentAgent === "business_questions_agent") return "35%";
    if (currentAgent === "eda_agent") return "50%";
    if (currentAgent === "data_explainer_agent") return "85%";

    return "0%";
  };

  return (
    <div className={cn("relative flex h-full w-full flex-col overflow-hidden font-display selection:bg-primary selection:text-white", className)}
      style={{ background: "var(--surface-base)", color: "var(--text-primary)" }}
    >
      <div className="fixed inset-0 pointer-events-none z-0 h-full w-full opacity-40"
        style={{
          backgroundImage: `linear-gradient(rgba(13, 89, 242, 0.05) 1px, transparent 1px),
             linear-gradient(90deg, rgba(13, 89, 242, 0.05) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      >
        <div
          className="absolute inset-0 bg-linear-to-t from-[color:var(--surface-base)] via-transparent to-transparent"
        ></div>
      </div>

      <div className="relative flex h-full w-full flex-col z-10 p-4 pt-20 md:p-12 md:pt-12 gap-6 overflow-hidden">

        <div className="w-full md:w-fit md:min-w-[600px] mx-auto z-20 flex flex-col gap-4 shrink-0">
          <div
            className="flex flex-col gap-1 backdrop-blur-md border p-4 rounded-xl shadow-2xl w-full"
            style={{ background: "var(--glass-bg)", borderColor: "var(--surface-border)" }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-widest font-mono" style={{ color: "var(--text-secondary)" }}>Filename</span>
              <span className="text-[10px] uppercase tracking-widest font-mono" style={{ color: "var(--text-secondary)" }}>Elapsed</span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <TbFileDescription className="text-primary text-xl" />
                <span className="text-sm font-semibold truncate max-w-[160px] sm:max-w-[400px]" style={{ color: "var(--text-primary)" }} title={filename}>
                  {filename || "Unknown"}
                </span>
              </div>
              <div className="font-mono text-emerald-400 font-bold text-lg">
                {formatTime(elapsedTime)}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 w-full">
            <button
              onClick={() => setShowLogs(!showLogs)}
              className="px-4 py-2 rounded-full text-xs font-mono uppercase tracking-wider text-primary transition-all backdrop-blur-sm border hover:opacity-80"
              style={{ background: "var(--glass-bg)", borderColor: "var(--surface-border)" }}
            >
              {showLogs ? "Hide System Logs" : "Show System Logs"}
            </button>
            {reportId && (
              <button
                onClick={handleCancel}
                disabled={isCancelling}
                className="flex items-center gap-1.5 px-4 py-2 bg-red-900/10 hover:bg-red-800/20 border border-red-700/30 hover:border-red-500 rounded-full text-xs font-mono uppercase tracking-wider text-red-500 hover:text-red-400 transition-all backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <IoClose size={14} />
                {isCancelling ? "Cancelling..." : "Cancel Analysis"}
              </button>
            )}
          </div>
        </div>

        <main
          className="flex-1 w-full relative overflow-y-auto overflow-x-hidden flex flex-col pb-4 md:pb-0"
        >
          {showLogs ? (
            <div
              className="w-full max-w-5xl mx-auto h-full min-h-[400px] backdrop-blur-xl border rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-300"
              style={{ background: "var(--surface-deep)", borderColor: "var(--surface-border)" }}
            >
              <div
                className="p-4 border-b flex justify-between items-center"
                style={{ borderColor: "var(--surface-border)", background: "var(--glass-bg)" }}
              >
                <h3 className="font-mono text-sm text-primary uppercase tracking-wider">System Execution Logs</h3>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 hidden sm:inline-block"></span>
                    <span className="text-[10px] text-blue-300">AGENT</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-green-500/10 border border-green-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 hidden sm:inline-block"></span>
                    <span className="text-[10px] text-green-300">TOOL</span>
                  </div>
                </div>
              </div>

              <ProcessLogsTable logs={logs} className="flex-1 p-0" autoScroll={true} projectName={filename} />
            </div>
          ) : (
            <div className="w-full max-w-5xl mx-auto h-full flex flex-col items-center justify-start md:justify-center p-4 sm:p-12 min-h-[400px]">
              <div className="w-full max-w-lg md:max-w-3xl relative flex flex-col items-start gap-12 md:gap-20 h-auto py-8 md:py-16 pl-8 sm:pl-12 md:pl-20 animate-in fade-in zoom-in duration-500 mx-auto">
                <div className="absolute left-[63px] sm:left-[79px] md:left-[127px] top-16 md:top-24 bottom-16 md:bottom-24 w-0.5 md:w-1 z-0" style={{ background: "var(--surface-border)" }}></div>
                <div
                  className="absolute left-[63px] sm:left-[79px] md:left-[127px] top-16 md:top-24 w-0.5 md:w-1 bg-linear-to-b from-secondary via-secondary to-primary z-0 shadow-[0_0_10px_rgba(13,89,242,0.6)] opacity-50 transition-all duration-1000 ease-in-out"
                  style={{ height: getProgressHeight() }}
                ></div>

                <StatusNode
                  title="Data Preprocessing"
                  status={getStepStatus("data_preprocessing_agent")}
                  icon={<FaCheck />}
                  detail="Understanding, Assessing, and Cleaning"
                />
                <StatusNode
                  title="Exploratory Analysis"
                  status={getStepStatus("eda_agent")}
                  icon={<MdQueryStats />}
                  detail="Performing Exploratory Data Analysis"
                />
                <StatusNode
                  title="Data Explanation"
                  status={getStepStatus("data_explainer_agent")}
                  icon={<TbFileDescription />}
                  detail="Generating Final Report"
                />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function StatusNode({ title, status, icon, detail }: { title: string, status: StepStatus, icon: React.ReactNode, detail?: string }) {
  if (status === "completed") {
    return (
      <div className="relative z-10 flex flex-row items-center gap-6 md:gap-10 group w-full">
        <div className="w-16 h-16 md:w-24 md:h-24 shrink-0 rounded-full bg-secondary flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] border-4 ring-2 ring-emerald-500/50 transition-transform hover:scale-110"
          style={{ borderColor: "var(--surface-base)" }}
        >
          <span className="text-2xl sm:text-3xl md:text-5xl font-bold text-white">{icon}</span>
        </div>
        <div className="flex flex-col text-left min-w-0 md:pl-2">
          <span className="text-emerald-500 font-mono text-[10px] sm:text-xs md:text-sm uppercase tracking-wider mb-1 md:mb-2">Completed</span>
          <h3 className="font-semibold text-sm sm:text-base md:text-2xl truncate" style={{ color: "var(--text-primary)" }}>{title}</h3>
          {detail && <p className="text-[10px] sm:text-xs md:text-sm mt-1 md:mt-2 truncate" style={{ color: "var(--text-secondary)" }}>{detail}</p>}
        </div>
      </div>
    );
  }

  if (status === "processing") {
    return (
      <div className="relative z-10 flex flex-row items-center gap-6 md:gap-10 w-full">
        <div className="relative w-16 h-16 md:w-24 md:h-24 shrink-0 flex items-center justify-center">
          <div className="absolute inset-[-8px] md:inset-[-12px] rounded-full bg-primary opacity-20 animate-ping"></div>
          <div className="absolute inset-[-8px] md:inset-[-12px] rounded-full bg-primary opacity-40 animate-pulse-glow"></div>
          <div
            className="relative w-16 h-16 md:w-24 md:h-24 rounded-full border-2 border-primary flex items-center justify-center shadow-[0_0_30px_rgba(13,89,242,0.6)] z-20"
            style={{ background: "var(--surface-base)" }}
          >
            <span className="text-primary text-2xl sm:text-3xl md:text-5xl animate-pulse">{icon}</span>
          </div>
        </div>
        <div className="flex flex-col text-left min-w-0 md:pl-2">
          <span className="text-primary font-mono text-[10px] sm:text-xs md:text-sm uppercase tracking-wider mb-1 md:mb-2 animate-pulse">In Progress</span>
          <h3 className="font-bold text-sm sm:text-base md:text-2xl truncate" style={{ color: "var(--text-primary)" }}>{title}</h3>
          <div
            className="mt-2 md:mt-4 border border-primary/30 rounded-lg px-3 py-2 md:px-5 md:py-4 text-left w-full max-w-[200px] sm:max-w-[240px] md:max-w-[340px]"
            style={{ background: "var(--glass-bg)" }}
          >
            <div className="flex items-center gap-2 mb-1 md:mb-2">
              <div className="w-1.5 h-1.5 md:w-2.5 md:h-2.5 rounded-full bg-primary animate-pulse"></div>
              <span className="text-[10px] sm:text-xs md:text-sm text-primary/80 font-mono">Working...</span>
            </div>
            {detail && <p className="text-[10px] md:text-sm leading-tight truncate" style={{ color: "var(--text-muted)" }}>{detail}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative z-10 flex flex-row items-center gap-6 md:gap-10 group w-full pl-1 md:pl-2">
      <div
        className="w-14 h-14 md:w-20 md:h-20 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors hover:border-primary/50"
        style={{ background: "var(--surface-base)", borderColor: "var(--surface-border)" }}
      >
        <span className="text-xl sm:text-2xl md:text-4xl transition-colors group-hover:text-primary/70" style={{ color: "var(--text-muted)" }}>{icon}</span>
      </div>
      <div className="flex flex-col text-left min-w-0 md:pl-2">
        <span className="font-mono text-[10px] sm:text-xs md:text-sm uppercase tracking-wider mb-1 md:mb-2" style={{ color: "var(--text-muted)" }}>Pending</span>
        <h3 className="font-medium text-sm sm:text-base md:text-2xl truncate" style={{ color: "var(--text-secondary)" }}>{title}</h3>
      </div>
    </div>
  );
}
