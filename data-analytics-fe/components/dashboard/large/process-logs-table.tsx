"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { IoClose, IoEyeOutline } from "react-icons/io5";

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
        <table className="w-full text-left text-xs font-mono text-slate-400">
          <thead className="bg-slate-900/50 text-slate-500 sticky top-0 z-10 backdrop-blur-md">
            <tr>
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Event</th>
              <th className="px-4 py-3 font-medium">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {logs.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-600 italic">
                  {isLoading ? "Loading logs..." : "No logs available."}
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-4 py-2 whitespace-nowrap text-slate-500">
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
                  <td className="px-4 py-2 text-slate-300">{log.name}</td>
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
                    className="px-4 py-2 max-w-[300px] truncate text-slate-500 cursor-pointer hover:text-slate-300"
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
            className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50">
              <div className="flex items-center gap-3">
                <span className={cn(
                  "px-2 py-0.5 rounded text-xs font-bold",
                  selectedLog.type === "AGENT" ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400"
                )}>
                  {selectedLog.type}
                </span>
                <h3 className="font-mono text-sm text-white font-semibold">{selectedLog.name}</h3>
                <span className={cn(
                  "px-2 py-0.5 rounded text-xs font-bold",
                  selectedLog.event === "START" ? "bg-yellow-500/10 text-yellow-500" : "bg-purple-500/10 text-purple-400"
                )}>
                  {selectedLog.event}
                </span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors"
              >
                <IoClose size={20} />
              </button>
            </div>

            <div className="p-4 overflow-auto bg-slate-950 font-mono text-xs text-slate-300">
              <div className="mb-4 text-slate-500 border-b border-slate-800 pb-2 flex justify-between">
                <span>Timestamp: {new Date(selectedLog.timestamp).toLocaleString()}</span>
                <span className="text-slate-600">ID: {selectedLog.id}</span>
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
            <div className="p-3 border-t border-slate-800 bg-slate-900/50 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium rounded transition-colors"
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
