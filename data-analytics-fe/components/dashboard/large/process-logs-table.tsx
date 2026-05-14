"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { IoClose, IoDownloadOutline } from "react-icons/io5";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export interface ProcessLog {
  id: string;
  timestamp: string;
  type: string;
  name: string;
  event: string;
  details?: string | null;
}

interface ProcessLogsTableProps {
  logs: ProcessLog[];
  className?: string;
  isLoading?: boolean;
  autoScroll?: boolean;
  standalone?: boolean;
  projectName?: string;
}

function escapeCsvCell(value: string | null | undefined): string {
  const str = value ?? "";
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function exportLogsToCsv(logs: ProcessLog[], projectName?: string) {
  const headers = ["ID", "Timestamp", "Type", "Name", "Event", "Details"];
  const rows = logs.map((log) => [
    escapeCsvCell(log.id),
    escapeCsvCell(new Date(log.timestamp).toLocaleString()),
    escapeCsvCell(log.type),
    escapeCsvCell(log.name),
    escapeCsvCell(log.event),
    escapeCsvCell(log.details),
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = projectName ? `${projectName}_system-logs.csv` : `system-logs.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ProcessLogsTable({ logs, className, isLoading, autoScroll = false, standalone = false, projectName }: ProcessLogsTableProps) {
  const scrollRef = useRef<HTMLTableRowElement>(null);
  const [selectedLog, setSelectedLog] = useState<ProcessLog | null>(null);
  const [mounted, setMounted] = useState(false);
  const [detailsMode, setDetailsMode] = useState<"raw" | "formatted">("formatted");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs.length, autoScroll]);

  const tableHeader = standalone ? (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 shrink-0">
      <div>
        <h3 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>System Logs</h3>
        <p className="text-xs mt-0.5 max-w-md" style={{ color: "var(--text-muted)" }}>
          Execution trace and tool usage for this session.
        </p>
      </div>

      <div className="flex w-full sm:w-auto items-stretch gap-2 shrink-0">
        <span className="text-xs font-medium px-3 py-2 rounded-lg border flex items-center h-[38px]" style={{ borderColor: "var(--surface-border)", background: "var(--surface-inset)", color: "var(--text-muted)" }}>
          {logs.length} {logs.length === 1 ? "entry" : "entries"}
        </span>
        <button
          onClick={() => exportLogsToCsv(logs, projectName)}
          disabled={logs.length === 0}
          className="flex h-[38px] items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary/60 hover:bg-primary/10 hover:text-primary shrink-0"
          style={{
            borderColor: "var(--surface-border)",
            color: "var(--text-secondary)",
          }}
          title="Export CSV"
        >
          <IoDownloadOutline size={15} />
          <span className="hidden sm:inline">Export CSV</span>
        </button>
      </div>
    </div>
  ) : (
    <div
      className="flex items-center justify-between px-4 py-2.5 border-b backdrop-blur-sm shrink-0"
      style={{ borderColor: "var(--surface-border)", background: "var(--surface-inset)" }}
    >
      <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
        {logs.length} {logs.length === 1 ? "entry" : "entries"}
      </span>
      <button
        onClick={() => exportLogsToCsv(logs)}
        disabled={logs.length === 0}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:border-primary/60 hover:bg-primary/10 hover:text-primary"
        style={{ borderColor: "var(--surface-border)", color: "var(--text-secondary)" }}
      >
        <IoDownloadOutline size={14} />
        <span className="hidden sm:inline">Export CSV</span>
      </button>
    </div>
  );

  return (
    <>
      <div className={cn(standalone ? "flex flex-col h-full animate-in fade-in duration-300" : "flex flex-col h-full overflow-hidden w-full", className)}>
        {standalone ? tableHeader : null}
        
        <div
          className={cn(
            standalone ? "flex-1 overflow-hidden border rounded-xl flex flex-col relative" : "flex-1 flex flex-col overflow-hidden relative"
          )}
          style={standalone ? { borderColor: "var(--surface-border)", background: "var(--surface-card)" } : undefined}
        >
          {!standalone ? tableHeader : null}
          
          <div className="overflow-auto flex-1 w-full">
            <table className="w-full text-left text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
              <thead
                className="sticky top-0 z-10 backdrop-blur-md"
                style={{ background: "var(--surface-inset)", color: "var(--text-muted)" }}
              >
                <tr style={{ borderBottom: "1px solid var(--surface-border)" }}>
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Event</th>
              <th className="px-4 py-3 font-medium">Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center italic" style={{ color: "var(--text-muted)" }}>
                  {isLoading ? "Loading logs..." : "No logs available."}
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.id}
                  className="transition-colors group border-b"
                  style={{ borderColor: "var(--surface-border)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-inset)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                >
                  <td className="px-4 py-2 whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-bold",
                        log.type === "AGENT"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-green-500/20 text-green-400"
                      )}
                    >
                      {log.type}
                    </span>
                  </td>
                  <td className="px-4 py-2" style={{ color: "var(--text-primary)" }}>{log.name}</td>
                  <td className="px-4 py-2">
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-bold",
                        log.event === "START"
                          ? "bg-yellow-500/10 text-yellow-500"
                          : "bg-purple-500/10 text-purple-400"
                      )}
                    >
                      {log.event}
                    </span>
                  </td>
                  <td
                    className="px-4 py-2 max-w-[300px] truncate cursor-pointer hover:text-primary transition-colors"
                    style={{ color: "var(--text-muted)" }}
                    title={log.details || ""}
                    onClick={() => setSelectedLog(log)}
                  >
                    {log.details || "-"}
                  </td>
                </tr>
              ))
            )}
            <tr ref={scrollRef}></tr>
          </tbody>
        </table>
          </div>
        </div>
      </div>

      {/* Log Details Modal via Portal */}
      {selectedLog && mounted && createPortal(
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div
            className="w-full max-w-4xl border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            style={{ background: "var(--surface-card)", borderColor: "var(--surface-border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between p-4 border-b"
              style={{ borderColor: "var(--surface-border)", background: "var(--surface-inset)" }}
            >
              <div className="flex items-center gap-3">
                <span className={cn(
                  "px-2 py-0.5 rounded text-xs font-bold",
                  selectedLog.type === "AGENT" ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400"
                )}>
                  {selectedLog.type}
                </span>
                <h3 className="font-mono text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{selectedLog.name}</h3>
                <span className={cn(
                  "px-2 py-0.5 rounded text-xs font-bold",
                  selectedLog.event === "START" ? "bg-yellow-500/10 text-yellow-500" : "bg-purple-500/10 text-purple-400"
                )}>
                  {selectedLog.event}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex bg-black/5 dark:bg-white/5 rounded p-0.5 border" style={{ borderColor: "var(--surface-border)" }}>
                  <button
                    onClick={() => setDetailsMode("raw")}
                    className={cn("px-3 py-1 text-xs font-medium rounded transition-colors", detailsMode === "raw" ? "shadow-sm" : "opacity-60 hover:opacity-100")}
                    style={detailsMode === "raw" ? { background: "var(--surface-card)", color: "var(--text-primary)" } : { color: "var(--text-primary)" }}
                  >
                    Raw
                  </button>
                  <button
                    onClick={() => setDetailsMode("formatted")}
                    className={cn("px-3 py-1 text-xs font-medium rounded transition-colors", detailsMode === "formatted" ? "shadow-sm" : "opacity-60 hover:opacity-100")}
                    style={detailsMode === "formatted" ? { background: "var(--surface-card)", color: "var(--text-primary)" } : { color: "var(--text-primary)" }}
                  >
                    Formatted
                  </button>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-1.5 rounded-full transition-colors hover:bg-black/10 dark:hover:bg-white/10"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <IoClose size={20} />
                </button>
              </div>
            </div>

            <div className="p-4 overflow-auto font-mono text-xs" style={{ background: "var(--surface-deep)", color: "var(--text-secondary)" }}>
              <div className="mb-4 border-b pb-2 flex justify-between" style={{ borderColor: "var(--surface-border)", color: "var(--text-muted)" }}>
                <span>Timestamp: {new Date(selectedLog.timestamp).toLocaleString()}</span>
                <span>ID: {selectedLog.id}</span>
              </div>
              
              {detailsMode === "raw" ? (
                <pre className="whitespace-pre-wrap wrap-break-word">
                  {(() => {
                    try {
                      return selectedLog.details ? JSON.stringify(JSON.parse(selectedLog.details), null, 2) : "No details available.";
                    } catch (e) {
                      return selectedLog.details || "No details available.";
                    }
                  })()}
                </pre>
              ) : (
                <div className="prose prose-sm max-w-none font-sans
                  prose-headings:font-display prose-headings:font-bold
                  prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                  prose-p:leading-relaxed
                  prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1 prose-code:rounded prose-code:font-mono
                  prose-ul:list-disc prose-ul:pl-6 prose-li:marker:text-primary
                  [&_h1]:text-[color:var(--text-primary)]
                  [&_h2]:text-[color:var(--text-primary)]
                  [&_h3]:text-[color:var(--text-primary)]
                  [&_p]:text-[color:var(--text-secondary)]
                  [&_li]:text-[color:var(--text-secondary)]
                  [&_strong]:text-[color:var(--text-primary)]
                  [&_pre]:bg-[color:var(--surface-card)] [&_pre]:border [&_pre]:border-[color:var(--surface-border)]
                ">
                  {(() => {
                    if (!selectedLog.details) return "No details available.";
                    try {
                      const parsed = JSON.parse(selectedLog.details);
                      if (parsed.result && typeof parsed.result === "string") {
                        return <ReactMarkdown remarkPlugins={[remarkGfm]}>{parsed.result}</ReactMarkdown>;
                      } else if (parsed.output && typeof parsed.output === "string") {
                        return <ReactMarkdown remarkPlugins={[remarkGfm]}>{parsed.output}</ReactMarkdown>;
                      } else if (parsed.response && typeof parsed.response === "string") {
                        return <ReactMarkdown remarkPlugins={[remarkGfm]}>{parsed.response}</ReactMarkdown>;
                      }
                      return <pre className="font-mono text-xs"><code>{JSON.stringify(parsed, null, 2)}</code></pre>;
                    } catch (e) {
                      return <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedLog.details}</ReactMarkdown>;
                    }
                  })()}
                </div>
              )}
            </div>
            <div className="p-3 border-t flex justify-end" style={{ borderColor: "var(--surface-border)", background: "var(--surface-inset)" }}>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 text-xs font-medium rounded transition-colors hover:opacity-80"
                style={{ background: "var(--surface-card)", color: "var(--text-secondary)" }}
              >
                Close
              </button>
            </div>
          </div>
          <div className="absolute inset-0 z-[-1]" onClick={() => setSelectedLog(null)}></div>
        </div>,
        document.body
      )}
    </>
  );
}
