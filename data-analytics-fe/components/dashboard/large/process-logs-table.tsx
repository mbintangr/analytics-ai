"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { IoClose, IoDownloadOutline } from "react-icons/io5";

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
}

function escapeCsvCell(value: string | null | undefined): string {
  const str = value ?? "";
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function exportLogsToCsv(logs: ProcessLog[]) {
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
  a.download = `system-logs-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ProcessLogsTable({ logs, className, isLoading, autoScroll = false }: ProcessLogsTableProps) {
  const scrollRef = useRef<HTMLTableRowElement>(null);
  const [selectedLog, setSelectedLog] = useState<ProcessLog | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs.length, autoScroll]);

  return (
    <>
      <div className={cn("overflow-auto", className)}>
        {/* Toolbar */}
        <div
          className="flex items-center justify-between px-4 py-2.5 border-b backdrop-blur-sm"
          style={{ borderColor: "var(--surface-border)", background: "var(--surface-inset)" }}
        >
          <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
            {logs.length} {logs.length === 1 ? "entry" : "entries"}
          </span>
          <button
            onClick={() => exportLogsToCsv(logs)}
            disabled={logs.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:text-white hover:border-primary/60 hover:bg-primary/10"
            style={{ borderColor: "var(--surface-border)", color: "var(--text-secondary)" }}
          >
            <IoDownloadOutline size={14} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
        <table className="w-full text-left text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
          <thead
            className="sticky top-0 z-10 backdrop-blur-md"
            style={{ background: "var(--surface-inset)", color: "var(--text-muted)" }}
          >
            <tr>
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
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-full transition-colors hover:bg-black/10 dark:hover:bg-white/10"
                style={{ color: "var(--text-secondary)" }}
              >
                <IoClose size={20} />
              </button>
            </div>

            <div className="p-4 overflow-auto font-mono text-xs" style={{ background: "var(--surface-deep)", color: "var(--text-secondary)" }}>
              <div className="mb-4 border-b pb-2 flex justify-between" style={{ borderColor: "var(--surface-border)", color: "var(--text-muted)" }}>
                <span>Timestamp: {new Date(selectedLog.timestamp).toLocaleString()}</span>
                <span>ID: {selectedLog.id}</span>
              </div>
              <pre className="whitespace-pre-wrap wrap-break-word">
                {(() => {
                  try {
                    return selectedLog.details ? JSON.stringify(JSON.parse(selectedLog.details), null, 2) : "No details available.";
                  } catch (e) {
                    return selectedLog.details || "No details available.";
                  }
                })()}
              </pre>
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
