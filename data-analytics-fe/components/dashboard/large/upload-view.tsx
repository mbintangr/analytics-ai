"use client";
import React, { useState, useRef } from "react";
import { IoMdCloudUpload } from "react-icons/io";
import { IoRocket } from "react-icons/io5";
import { cn } from "@/lib/utils";

interface UploadViewProps {
  userId?: string;
  onUploadSuccess?: (sessionId: string) => void;
  onCancel?: () => void;
}

const AVAILABLE_MODELS = [
  { value: "openrouter/xiaomi/mimo-v2-flash", label: "Mimo V2 Flash" },
  // { value: "nvidia_nim/openai/gpt-oss-120b", label: "GPT OSS 120B" },
  { value: "openrouter/openai/gpt-oss-120b", label: "GPT OSS 120B" },
];

function parseCsvRow(row: string): string[] {
  const fields: string[] = [];
  let i = 0;
  while (i < row.length) {
    if (row[i] === '"') {
      let field = '';
      i++;
      while (i < row.length) {
        if (row[i] === '"' && row[i + 1] === '"') {
          field += '"';
          i += 2;
        } else if (row[i] === '"') {
          i++;
          break;
        } else {
          field += row[i++];
        }
      }
      fields.push(field);
      if (row[i] === ',') i++;
    } else {
      const end = row.indexOf(',', i);
      if (end === -1) {
        fields.push(row.slice(i));
        break;
      } else {
        fields.push(row.slice(i, end));
        i = end + 1;
      }
    }
  }
  return fields;
}

export function UploadView({ userId, onUploadSuccess, onCancel }: UploadViewProps) {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [isParquet, setIsParquet] = useState(false);
  const [unsupportedFile, setUnsupportedFile] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [businessQuestions, setBusinessQuestions] = useState("");
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) processFile(selectedFile);
  };

  const isParquetFile = (f: File) =>
    f.name.toLowerCase().endsWith(".parquet") ||
    f.type === "application/octet-stream" && f.name.toLowerCase().endsWith(".parquet");

  const isValidFile = (f: File) =>
    f.name.toLowerCase().endsWith(".csv") ||
    f.name.toLowerCase().endsWith(".parquet");

  const processFile = (f: File) => {
    if (!isValidFile(f)) {
      setUnsupportedFile(f.name);
      return;
    }
    setUnsupportedFile(null);
    setFile(f);
    if (isParquetFile(f)) {
      setIsParquet(true);
      setHeaders([]);
      setRows([]);
      return;
    }
    setIsParquet(false);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
      if (lines.length > 0) {
        const headerRow = parseCsvRow(lines[0]);
        const colCount = headerRow.length;
        const dataRows = lines.slice(1, 6).map((line) => {
          const cells = parseCsvRow(line);
          while (cells.length < colCount) cells.push("");
          return cells.slice(0, colCount);
        });
        setHeaders(headerRow);
        setRows(dataRows);
      }
    };
    reader.readAsText(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) processFile(droppedFile);
  };

  const reset = () => {
    setFile(null);
    setHeaders([]);
    setRows([]);
    setIsParquet(false);
    setUnsupportedFile(null);
    setBusinessQuestions("");
    setSelectedModel(AVAILABLE_MODELS[0].value);
    setIsUploading(false);
    setProgress(0);
  };

  const handleCancel = () => {
    if (isUploading) return;
    if (onCancel) {
      onCancel();
    } else {
      reset();
    }
  };

  const handleGenerateInsights = async () => {
    if (!file) return;
    if (!userId) {
      console.error("User not logged in");
      return;
    }

    try {
      setIsUploading(true);
      setProgress(0);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";
      const CHUNK_SIZE = 20 * 1024 * 1024;
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

      const initFormData = new FormData();
      initFormData.append("filename", file.name);
      initFormData.append("user_id", userId);

      const initResponse = await fetch(`${API_URL}/upload/init`, {
        method: "POST",
        body: initFormData,
      });

      if (!initResponse.ok) throw new Error(`Init failed: ${initResponse.statusText}`);
      const { upload_id } = await initResponse.json();

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(file.size, start + CHUNK_SIZE);
        const chunk = file.slice(start, end);

        const chunkFormData = new FormData();
        chunkFormData.append("upload_id", upload_id);
        chunkFormData.append("chunk_index", i.toString());
        chunkFormData.append("file", chunk);

        const chunkResponse = await fetch(`${API_URL}/upload/chunk`, {
          method: "POST",
          body: chunkFormData,
        });

        if (!chunkResponse.ok) throw new Error(`Chunk ${i} upload failed: ${chunkResponse.statusText}`);
        setProgress(Math.round(((i + 1) / totalChunks) * 100));
      }

      const completeFormData = new FormData();
      completeFormData.append("upload_id", upload_id);
      completeFormData.append("filename", file.name);
      completeFormData.append("user_id", userId);
      completeFormData.append("business_questions", businessQuestions);
      completeFormData.append("model_name", selectedModel);

      const completeResponse = await fetch(`${API_URL}/upload/complete`, {
        method: "POST",
        body: completeFormData,
      });

      if (!completeResponse.ok) throw new Error(`Completion failed: ${completeResponse.statusText}`);

      const data = await completeResponse.json();
      if (onUploadSuccess && data.session_id) {
        onUploadSuccess(data.session_id);
      }
    } catch (error) {
      console.error("Analysis failed:", error);
      alert(`Upload failed: ${error}`);
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden w-full text-left" style={{ background: "var(--surface-base)" }}>
      <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin">
        {!file ? (
          <div className="mb-8 flex flex-col gap-4">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className={`group relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed px-6 py-10 transition-colors hover:cursor-pointer ${
                unsupportedFile
                  ? "border-red-500/60 bg-red-500/5 hover:border-red-400 hover:bg-red-500/10"
                  : "hover:border-primary"
              }`}
              style={
                !unsupportedFile
                  ? { borderColor: "var(--surface-border)", background: "var(--surface-inset)" }
                  : undefined
              }
              onClick={() => fileInputRef.current?.click()}
            >
              <div className={`flex h-16 w-16 items-center justify-center rounded-full ${
                unsupportedFile ? "bg-red-500/20" : "bg-primary/20"
              }`}>
                {unsupportedFile
                  ? <span className="material-symbols-outlined text-4xl text-red-400">block</span>
                  : <IoMdCloudUpload className="text-4xl text-primary" />}
              </div>
              <div className="text-center">
                <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>Drop file here or click to upload</p>
                <p className="mt-1 text-sm font-normal" style={{ color: "var(--text-secondary)" }}>Supported formats: .csv, .parquet</p>
              </div>
              <button
                className="cursor-pointer mt-2 flex h-9 items-center justify-center rounded-lg px-4 text-sm font-bold shadow-sm ring-1 ring-inset ring-[color:var(--surface-border)] transition-all"
                style={{
                  background: "var(--surface-inset)",
                  color: "var(--text-primary)",
                }}
              >
                Browse Files
              </button>
            </div>

            {unsupportedFile && (
              <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 animate-in fade-in slide-in-from-top-1 duration-200">
                <span className="material-symbols-outlined text-red-400 text-lg mt-0.5 shrink-0">error</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-red-300">Unsupported file type</p>
                  <p className="text-xs text-red-400/80 mt-0.5 truncate">
                    <span className="font-mono">{unsupportedFile}</span> is not supported. Please upload a <span className="font-semibold">.csv</span> or <span className="font-semibold">.parquet</span> file.
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setUnsupportedFile(null); }}
                  className="shrink-0 text-red-400/60 hover:text-red-300 transition-colors"
                  aria-label="Dismiss"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="mb-8">
            <div
              className={cn(
                "group flex items-center justify-between p-4 mb-6 rounded-xl border border-dashed transition-all",
                !isUploading && "hover:border-primary hover:cursor-pointer"
              )}
              style={{ borderColor: "var(--surface-border)", background: "var(--surface-inset)" }}
              onClick={() => !isUploading && fileInputRef.current?.click()}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                  <IoMdCloudUpload className="text-xl text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{file.name}</p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Click to change file</p>
                </div>
              </div>
              {!isUploading && (
                <span className="material-symbols-outlined transition-colors" style={{ color: "var(--text-secondary)" }}>
                  edit
                </span>
              )}
            </div>

            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold leading-tight tracking-tight" style={{ color: "var(--text-primary)" }}>
                Data Preview (Top 5 Rows)
              </h3>
            </div>

            {isParquet ? (
              <div className="flex items-center gap-3 rounded-lg border px-4 py-4" style={{ borderColor: "var(--surface-border)", background: "var(--surface-inset)" }}>
                <span className="material-symbols-outlined text-xl" style={{ color: "var(--text-secondary)" }}>info</span>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Preview is not available for Parquet files. The file will be processed directly by the analysis engine.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border" style={{ borderColor: "var(--surface-border)", background: "var(--surface-base)" }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead style={{ background: "var(--surface-inset)" }}>
                      <tr>
                        {headers.map((header, i) => (
                          <th key={i} className="whitespace-nowrap px-4 py-3 text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody style={{ borderColor: "var(--surface-border)" }}>
                      {rows.map((row, i) => (
                        <tr key={i} className="border-t" style={{ borderColor: "var(--surface-border)" }}>
                          {row.map((cell, j) => (
                            <td key={j} className="whitespace-nowrap px-4 py-3 text-sm" style={{ color: "var(--text-primary)" }}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="mt-6">
              <h3 className="text-lg font-bold leading-tight tracking-tight mb-3" style={{ color: "var(--text-primary)" }}>
                Business Questions
              </h3>
              <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
                What specific questions do you want answered from your data? This helps the AI focus its analysis.
              </p>
              <textarea
                value={businessQuestions}
                onChange={(e) => setBusinessQuestions(e.target.value)}
                disabled={isUploading}
                placeholder="e.g. What are the top revenue drivers? Which customer segments are growing fastest? Are there any seasonal trends?"
                className="w-full rounded-lg border px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors resize-none disabled:opacity-50"
                style={{
                  background: "var(--surface-inset)",
                  borderColor: "var(--surface-border)",
                  color: "var(--text-primary)",
                }}
                rows={4}
              />
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-bold leading-tight tracking-tight mb-3" style={{ color: "var(--text-primary)" }}>
                AI Model
              </h3>
              <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
                Choose the AI model to use for analysis.
              </p>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={isUploading}
                className="w-full rounded-lg border px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors disabled:opacity-50 appearance-none cursor-pointer"
                style={{
                  background: "var(--surface-inset)",
                  borderColor: "var(--surface-border)",
                  color: "var(--text-primary)",
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2390a4cb' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: "right 0.75rem center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "1.25em 1.25em",
                }}
              >
                {AVAILABLE_MODELS.map((model) => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".csv,.parquet"
          onChange={handleFileChange}
        />
      </div>

      <div
        className="flex flex-wrap items-center justify-end gap-3 border-t px-6 py-4 mt-auto"
        style={{
          borderColor: "var(--surface-border)",
          background: "var(--surface-base)",
        }}
      >
        <button
          onClick={handleCancel}
          disabled={isUploading}
          className="cursor-pointer flex h-10 items-center justify-center rounded-lg border px-6 text-sm font-bold transition-colors hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            borderColor: "var(--surface-border)",
            color: "var(--text-primary)",
            background: "transparent",
          }}
        >
          Cancel
        </button>
        <button
          disabled={!file || isUploading}
          onClick={handleGenerateInsights}
          className="cursor-pointer flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-bold text-white shadow-[0_0_15px_rgba(13,89,242,0.4)] transition-all hover:bg-blue-600 hover:shadow-[0_0_20px_rgba(13,89,242,0.6)] disabled:opacity-50 disabled:cursor-not-allowed hover:cursor-pointer min-w-[180px]"
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center w-full">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined animate-spin text-lg">sync</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-1 bg-white/30 rounded mt-1 overflow-hidden">
                <div className="h-full bg-white transition-all duration-300 ease-out" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          ) : (
            <>
              <IoRocket className="text-lg" />
              Generate Insights
            </>
          )}
        </button>
      </div>
    </div>
  );
}
