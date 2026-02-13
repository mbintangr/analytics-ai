"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { IoArrowBackOutline } from "react-icons/io5";
import Link from "next/link";
import { ProcessingView } from "./processing-view";
import { ProcessLogsTable, ProcessLog } from "./process-logs-table";

interface ReportViewProps {
  reportContent: string | null;
  imageBaseUrl?: string | null;
  onBack?: () => void;
  isLoading?: boolean;
  isPage?: boolean;
  status?: string;
  filename?: string;
  createdAt?: Date;
}



export function ReportView({
  reportContent,
  imageBaseUrl,
  onBack,
  isLoading = false,
  isPage = false,
  status = "PROCESSING",
  filename,
  createdAt,
  reportId,
}: ReportViewProps & { reportId?: string }) {
  const [internalStatus, setInternalStatus] = React.useState(status);
  const [internalReportContent, setInternalReportContent] = React.useState(reportContent);
  const [internalImageBaseUrl, setInternalImageBaseUrl] = React.useState(imageBaseUrl);
  const [internalProcesses, setInternalProcesses] = React.useState<ProcessLog[]>([]);
  const [activeTab, setActiveTab] = React.useState<'report' | 'logs'>('report');

  // Sync props to state if they change (optional, but good for initial load or re-validation)
  React.useEffect(() => {
    if (status) setInternalStatus(status);
    if (reportContent) setInternalReportContent(reportContent);
    if (imageBaseUrl) setInternalImageBaseUrl(imageBaseUrl);
  }, [status, reportContent, imageBaseUrl]);

  React.useEffect(() => {
    if (!reportId || (internalStatus === "COMPLETED" && internalProcesses.length > 0) || internalStatus === "FAILED") {
      if (internalStatus === "COMPLETED" && internalProcesses.length > 0) return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/report/${reportId}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.status) setInternalStatus(data.status);
        if (data.report) setInternalReportContent(data.report);
        if (data.processes) setInternalProcesses(data.processes);

      } catch (error) {
        console.error("Polling error:", error);
      }
    }

    // Initial fetch
    fetchData();

    const interval = setInterval(fetchData, 3000);

    return () => clearInterval(interval);
  }, [reportId, internalStatus]);

  if (isLoading || (internalStatus && internalStatus.startsWith("PROCESSING"))) {
    return <ProcessingView status={internalStatus} filename={filename} createdAt={createdAt} reportId={reportId} />;
  }

  if (!internalReportContent && activeTab === 'report') {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-slate-400">
        <span className="material-symbols-outlined text-4xl mb-2">description</span>
        <p>No report content available.</p>
        {!isPage && onBack && (
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-colors"
          >
            Go Back
          </button>
        )}
        {isPage && (
          <Link
            href="/"
            className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-colors"
          >
            Go Back to Dashboard
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 md:pt-10 scroll-smooth h-full">
      <div className="max-w-5xl mx-auto backdrop-blur-md bg-slate-900/50 border border-slate-800 rounded-2xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
        {/* Header Gradient Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-primary to-transparent opacity-50"></div>

        {/* Back Button */}
        {isPage ? (
          <Link
            href="/"
            className="group flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors w-fit"
          >
            <IoArrowBackOutline size={20} />
            <span className="text-sm font-medium">Back to Projects</span>
          </Link>
        ) : (
          <button
            onClick={onBack}
            className="group flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors"
          >
            <IoArrowBackOutline size={20} />
            <span className="text-sm font-medium">Back to Projects</span>
          </button>
        )}

        {/* Tabs */}
        <div className="flex space-x-6 mb-8 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('report')}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'report'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-400 hover:text-white'
              }`}
          >
            Report View
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'logs'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-400 hover:text-white'
              }`}
          >
            System Logs
          </button>
        </div>

        {/* Content */}


        {activeTab === 'report' ? (
          /* Report Content */
          <div className="prose prose-invert prose-slate max-w-none 
            prose-headings:font-display prose-headings:font-bold prose-headings:text-white
            prose-h1:text-4xl prose-h1:mb-6 prose-h1:bg-clip-text prose-h1:text-transparent prose-h1:bg-linear-to-r prose-h1:from-primary prose-h1:to-purple-400
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-6 prose-h2:flex prose-h2:items-center prose-h2:gap-3
            prose-h2:before:content-[''] prose-h2:before:w-1 prose-h2:before:h-8 prose-h2:before:bg-primary prose-h2:before:rounded-full
            prose-p:text-slate-300 prose-p:leading-relaxed
            prose-strong:text-white prose-strong:font-semibold
            prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1 prose-code:rounded prose-code:font-mono
            prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800
            prose-ul:list-disc prose-ul:pl-6 prose-li:text-slate-300 prose-li:marker:text-primary
            ">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              urlTransform={(value) => value}
              components={{
                h1: ({ node, ...props }) => {
                  const id = props.children?.toString().toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
                  return <h1 id={id} {...props} />
                },
                h2: ({ node, ...props }) => {
                  const id = props.children?.toString().toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
                  return <h2 id={id} {...props} />
                },
                h3: ({ node, ...props }) => {
                  const id = props.children?.toString().toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
                  return <h3 id={id} {...props} />
                },
                img: (props) => {
                  if (!props.src) return null;
                  let src = props.src;
                  // If src is relative and not data URI, prepend base URL
                  if (typeof src === 'string' && internalImageBaseUrl && !src.startsWith("http") && !src.startsWith("data:") && !src.startsWith("/")) {
                    src = `${internalImageBaseUrl}${src}`;
                  }
                  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
                  return <img {...props} src={src} />;
                }
              }}
            >
              {internalReportContent}
            </ReactMarkdown>
          </div>
        ) : (
          /* System Logs Content */
          <ProcessLogsTable logs={internalProcesses} className="overflow-x-auto" />
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-slate-800 text-center">
          <p className="text-slate-600 text-xs font-mono">
            DATA ANALYTICS REPORT • GENERATED BY ANALYTICS AI
          </p>
        </div>
      </div>
    </div>
  );
}
