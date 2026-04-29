"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { IoArrowBackOutline, IoReload, IoCalendarOutline, IoCheckmarkCircleOutline, IoHelpCircleOutline, IoCubeOutline, IoTimerOutline, IoFlashOutline } from "react-icons/io5";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProcessingView } from "./processing-view";
import { ProcessLogsTable, ProcessLog } from "./process-logs-table";
import { DatasetTable } from "./dataset-table";

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

interface SessionMetadata {
  title: string;
  createdAt: Date;
  finishedAt: Date | null;
  businessQuestions: string | null;
  modelName: string | null;
  durationSeconds: number | null;
  totalTokens: number | null;
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
  metadata,
}: ReportViewProps & { reportId?: string; metadata?: SessionMetadata | null }) {
  const router = useRouter();
  const [internalStatus, setInternalStatus] = React.useState(status);
  const [internalReportContent, setInternalReportContent] = React.useState(reportContent);
  const [internalImageBaseUrl, setInternalImageBaseUrl] = React.useState(imageBaseUrl);
  const [internalProcesses, setInternalProcesses] = React.useState<ProcessLog[]>([]);
  const [activeTab, setActiveTab] = React.useState<'report' | 'logs' | 'dataset' | 'info'>('report');
  const [isRegenerating, setIsRegenerating] = React.useState(false);

  React.useEffect(() => {
    if (status) setInternalStatus(status);
    if (reportContent) setInternalReportContent(reportContent);
    if (imageBaseUrl) setInternalImageBaseUrl(imageBaseUrl);
  }, [status, reportContent, imageBaseUrl]);

  React.useEffect(() => {
    if (!reportId || (internalStatus === "COMPLETED" && internalProcesses.length > 0) || internalStatus === "FAILED" || internalStatus === "CANCELLED") {
      if (internalStatus === "COMPLETED" && internalProcesses.length > 0) return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/report/${reportId}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.status) {
          if (data.status === "COMPLETED" && internalStatus !== "COMPLETED") {
            router.refresh();
          }
          setInternalStatus(data.status);
        }
        if (data.report) setInternalReportContent(data.report);
        if (data.processes) setInternalProcesses(data.processes);
      } catch (error) {
        console.error("Polling error:", error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [reportId, internalStatus]);

  const handleRegenerate = async () => {
    if (!reportId || isRegenerating) return;
    try {
      setIsRegenerating(true);
      const res = await fetch(`/api/report/${reportId}/regenerate`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.details || err.error || "Regeneration failed");
      }
      const data = await res.json();
      if (data.session_id) {
        router.push(`/report/${data.session_id}`);
      }
    } catch (error) {
      console.error("Regenerate failed:", error);
      alert(`Regeneration failed: ${error}`);
    } finally {
      setIsRegenerating(false);
    }
  };

  if (isLoading || (internalStatus && internalStatus.startsWith("PROCESSING"))) {
    return <ProcessingView status={internalStatus} filename={filename} createdAt={createdAt} reportId={reportId} />;
  }

  if (!internalReportContent && activeTab === 'report') {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[500px]" style={{ color: "var(--text-muted)" }}>
        <span className="material-symbols-outlined text-4xl mb-2">description</span>
        <p>No report content available.</p>
        {!isPage && onBack && (
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 rounded-lg text-white transition-colors hover:opacity-80"
            style={{ background: "var(--surface-card)" }}
          >
            Go Back
          </button>
        )}
        {isPage && (
          <Link
            href="/"
            className="mt-4 px-4 py-2 rounded-lg text-white transition-colors hover:opacity-80"
            style={{ background: "var(--surface-card)" }}
          >
            Go Back to Dashboard
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 md:pt-10 scroll-smooth h-full">
      <div
        className="max-w-5xl mx-auto backdrop-blur-md border rounded-2xl p-8 md:p-12 shadow-2xl relative overflow-hidden"
        style={{
          background: "var(--glass-bg)",
          borderColor: "var(--surface-border)",
        }}
      >
        {/* Header Gradient Line */}
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-primary to-transparent opacity-50"></div>

        {/* Back Button + Regenerate */}
        <div className="flex items-center justify-between mb-8">
          {isPage ? (
            <Link
              href="/"
              className="group flex items-center gap-2 transition-colors w-fit hover:text-primary"
              style={{ color: "var(--text-secondary)" }}
            >
              <IoArrowBackOutline size={20} />
              <span className="text-sm font-medium">Back to Projects</span>
            </Link>
          ) : (
            <button
              onClick={onBack}
              className="group flex items-center gap-2 transition-colors hover:text-primary"
              style={{ color: "var(--text-secondary)" }}
            >
              <IoArrowBackOutline size={20} />
              <span className="text-sm font-medium">Back to Projects</span>
            </button>
          )}

          {reportId && (internalStatus === "COMPLETED" || internalStatus === "FAILED" || internalStatus === "CANCELLED") && (
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="hover:cursor-pointer group flex items-center gap-2 px-4 py-2 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:text-white hover:border-primary hover:bg-primary/10"
              style={{ borderColor: "var(--surface-border)", color: "var(--text-secondary)" }}
            >
              <IoReload size={16} className={isRegenerating ? "animate-spin" : ""} />
              <span className="text-sm font-medium">
                {isRegenerating ? "Regenerating..." : "Regenerate Report"}
              </span>
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex space-x-6 mb-8 border-b" style={{ borderColor: "var(--surface-border)" }}>
          {(["report", "dataset", "logs", "info"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`hover:cursor-pointer pb-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent hover:text-primary"
              }`}
              style={activeTab !== tab ? { color: "var(--text-secondary)" } : undefined}
            >
              {tab === "report" ? "Report View" : tab === "dataset" ? "Data Viewer" : tab === "logs" ? "System Logs" : "Project Info"}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'report' ? (
          <div className="prose max-w-none
            prose-headings:font-display prose-headings:font-bold
            prose-h1:text-4xl prose-h1:mb-6 prose-h1:bg-clip-text prose-h1:text-transparent prose-h1:bg-linear-to-r prose-h1:from-primary prose-h1:to-purple-400
            prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-6 prose-h2:flex prose-h2:items-center prose-h2:gap-3
            prose-h2:before:content-[''] prose-h2:before:w-1 prose-h2:before:h-8 prose-h2:before:bg-primary prose-h2:before:rounded-full
            prose-p:leading-relaxed
            prose-strong:font-semibold
            prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1 prose-code:rounded prose-code:font-mono
            prose-ul:list-disc prose-ul:pl-6 prose-li:marker:text-primary
            [&_h2]:text-[color:var(--text-primary)]
            [&_h3]:text-[color:var(--text-primary)]
            [&_p]:text-[color:var(--text-secondary)]
            [&_li]:text-[color:var(--text-secondary)]
            [&_strong]:text-[color:var(--text-primary)]
            [&_pre]:bg-[color:var(--surface-deep)] [&_pre]:border [&_pre]:border-[color:var(--surface-border)]
            "
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              urlTransform={(value) => value}
              components={{
                h1: ({ node, ...props }) => {
                  const id = props.children?.toString().toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
                  return <h1 id={id} {...props} />;
                },
                h2: ({ node, ...props }) => {
                  const id = props.children?.toString().toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
                  return <h2 id={id} {...props} />;
                },
                h3: ({ node, ...props }) => {
                  const id = props.children?.toString().toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
                  return <h3 id={id} {...props} />;
                },
                img: (props) => {
                  if (!props.src) return null;
                  let src = props.src;
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
        ) : activeTab === 'logs' ? (
          <ProcessLogsTable logs={internalProcesses} className="overflow-x-auto" />
        ) : activeTab === 'dataset' && reportId ? (
          <DatasetTable reportId={reportId} />
        ) : activeTab === 'dataset' && !reportId ? (
          <div className="flex justify-center items-center h-full min-h-[500px]" style={{ color: "var(--text-secondary)" }}>
            <p>No report ID available for dataset preview.</p>
          </div>
        ) : activeTab === 'info' ? (
          <ProjectInfoPanel metadata={metadata ?? null} />
        ) : null}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t text-center" style={{ borderColor: "var(--surface-border)" }}>
          <p className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
            DATA ANALYTICS REPORT • GENERATED BY ANALYTICS AI
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Project Info Panel ───────────────────────────────────────────────────────

function MetaStat({
  icon,
  label,
  value,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-sm`}
      style={{
        borderColor: accent ? "rgba(13,89,242,0.3)" : "var(--surface-border)",
        background: accent ? "rgba(13,89,242,0.05)" : "var(--surface-inset)",
      }}
    >
      <div className={`mt-0.5 shrink-0 ${accent ? "text-primary" : ""}`} style={!accent ? { color: "var(--text-muted)" } : undefined}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>{label}</p>
        <p className={`text-sm font-semibold ${accent ? "text-primary" : ""} break-words`} style={!accent ? { color: "var(--text-primary)" } : undefined}>
          {value}
        </p>
      </div>
    </div>
  );
}

function ProjectInfoPanel({ metadata }: { metadata: SessionMetadata | null }) {
  if (!metadata) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]" style={{ color: "var(--text-muted)" }}>
        <IoCubeOutline size={36} className="mb-3 opacity-40" />
        <p className="text-sm">No project metadata available.</p>
      </div>
    );
  }

  const fmt = (d: Date | null | string) =>
    d ? new Date(d).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—";

  const duration = metadata.durationSeconds != null
    ? metadata.durationSeconds >= 60
      ? `${Math.floor(metadata.durationSeconds / 60)}m ${Math.round(metadata.durationSeconds % 60)}s`
      : `${metadata.durationSeconds.toFixed(1)}s`
    : "—";

  const tokens = metadata.totalTokens != null
    ? metadata.totalTokens.toLocaleString()
    : "—";

  return (
    <div className="animate-in fade-in duration-300 space-y-6">
      {/* Title */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Project Title</p>
        <h2 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{metadata.title}</h2>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="sm:col-span-2 lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <MetaStat icon={<IoCalendarOutline size={18} />} label="Created At" value={fmt(metadata.createdAt)} />
          <MetaStat icon={<IoCheckmarkCircleOutline size={18} />} label="Finished At" value={fmt(metadata.finishedAt)} />
        </div>
        <MetaStat icon={<IoTimerOutline size={18} />} label="Duration" value={duration} accent={metadata.durationSeconds != null} />
        <MetaStat icon={<IoCubeOutline size={18} />} label="Model" value={metadata.modelName ?? "—"} accent={!!metadata.modelName} />
        <MetaStat icon={<IoFlashOutline size={18} />} label="Total Tokens" value={tokens} accent={metadata.totalTokens != null} />
      </div>

      {/* Business Questions */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <IoHelpCircleOutline size={17} style={{ color: "var(--text-muted)" }} />
          <p className="text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Business Questions</p>
        </div>
        {metadata.businessQuestions ? (
          <div className="rounded-xl border p-5 backdrop-blur-sm" style={{ borderColor: "var(--surface-border)", background: "var(--surface-inset)" }}>
            <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {metadata.businessQuestions}
            </pre>
          </div>
        ) : (
          <p className="text-sm italic" style={{ color: "var(--text-muted)" }}>No business questions recorded.</p>
        )}
      </div>
    </div>
  );
}
