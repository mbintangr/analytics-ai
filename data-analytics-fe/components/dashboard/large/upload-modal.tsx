"use client";
import { useRouter } from "next/navigation";

import React, { useState, useRef } from "react";
import { MdOutlineAnalytics } from "react-icons/md";
import { IoMdCloudUpload } from "react-icons/io";
import { IoClose } from "react-icons/io5";
import { IoRocket } from "react-icons/io5";
import { cn } from "@/lib/utils";


interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

const AVAILABLE_MODELS = [
  { value: "openrouter/xiaomi/mimo-v2-flash", label: "Mimo V2 Flash (Xiaomi)" },
  { value: "openrouter/openai/gpt-oss-120b:free", label: "GPT OSS 120B (Free)" },
  { value: "openrouter/openai/gpt-oss-20b:free", label: "GPT OSS 20B (Free)" },
  { value: "openrouter/nvidia/nemotron-3-nano-30b-a3b:free", label: "Nemotron 3 Nano 30B (Free)" },
  { value: "openrouter/qwen/qwen3-coder:free", label: "Qwen3 Coder (Free)" },
  { value: "openrouter/arcee-ai/trinity-large-preview:free", label: "Trinity Large Preview (Free)" },
  { value: "nvidia_nim/openai/gpt-oss-120b", label: "GPT OSS 120B (NVIDIA NIM)" },
];

export function UploadModal({ isOpen, onClose, userId }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingText, setLoadingText] = useState("Processing...");
  const [progress, setProgress] = useState(0);
  const [businessQuestions, setBusinessQuestions] = useState("");
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = (file: File) => {
    setFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);

      if (lines.length > 0) {
        const headerRow = lines[0].split(",");
        const dataRows = lines.slice(1, 6).map((line) => line.split(","));
        setHeaders(headerRow);
        setRows(dataRows);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "text/csv") {
      processFile(droppedFile);
    }
  };



  const reset = () => {
    setFile(null);
    setHeaders([]);
    setRows([]);
    setBusinessQuestions("");
    setSelectedModel(AVAILABLE_MODELS[0].value);
    setIsUploading(false);
    setProgress(0);
    setLoadingText("Processing...");
  };

  const handleClose = () => {
    if (isUploading) return;
    reset();
    onClose();
  };

  const handleGenerateInsights = async () => {
    if (!file) return;

    if (!userId) {
      console.error("User not logged in");
      return;
    }

    try {
      setIsUploading(true);
      setLoadingText("Initializing upload...");
      setProgress(0);

      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";
      const CHUNK_SIZE = 20 * 1024 * 1024; // 20MB chunks
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

      // 1. Initialize Upload
      const initFormData = new FormData();
      initFormData.append("filename", file.name);
      initFormData.append("user_id", userId);

      const initResponse = await fetch(`${API_URL}/upload/init`, {
        method: "POST",
        body: initFormData,
      });

      if (!initResponse.ok) {
        throw new Error(`Init failed: ${initResponse.statusText}`);
      }

      const { upload_id } = await initResponse.json();

      // 2. Upload Chunks
      for (let i = 0; i < totalChunks; i++) {
        setLoadingText(`Uploading part ${i + 1} of ${totalChunks}...`);
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

        if (!chunkResponse.ok) {
          throw new Error(`Chunk ${i} upload failed: ${chunkResponse.statusText}`);
        }

        // Update progress
        const currentProgress = Math.round(((i + 1) / totalChunks) * 100);
        setProgress(currentProgress);
      }

      // 3. Complete Upload
      setLoadingText("Finalizing and processing...");
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

      if (!completeResponse.ok) {
        throw new Error(`Completion failed: ${completeResponse.statusText}`);
      }

      const data = await completeResponse.json();

      // Success - close modal and redirect
      handleClose();
      if (data.session_id) {
        router.push(`/report/${data.session_id}`);
      }
    } catch (error) {
      console.error("Analysis failed:", error);
      alert(`Upload failed: ${error}`); // Simple alert for now
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-background-dark/80 backdrop-blur-md transition-opacity"
        onClick={handleClose}
      />

      {/* Modal Container */}
      <div className="relative z-20 flex max-h-[90vh] w-full max-w-[900px] flex-col overflow-hidden rounded-xl border border-[#314368] bg-[#101623] shadow-2xl animate-in fade-in zoom-in duration-300">

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#314368] bg-[#101623] px-6 py-4">
          <div className="flex items-center gap-3">
            <MdOutlineAnalytics className="text-primary text-xl" />
            <h2 className="text-xl font-bold leading-tight tracking-tight text-white">
              Upload Data
            </h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="cursor-pointer group flex h-8 w-8 items-center justify-center rounded-full text-[#90a4cb] transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            <IoClose className="text-xl" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-[#314368] scrollbar-track-transparent">

          {!file ? (
            /* Upload Section */
            <div className="mb-8 flex flex-col gap-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="group relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-[#314368] bg-[#182234]/30 px-6 py-10 transition-colors hover:border-primary hover:bg-[#182234]/50 hover:cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                  <IoMdCloudUpload className="text-4xl text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-white">Drop CSV file here or click to upload</p>
                  <p className="mt-1 text-sm font-normal text-[#90a4cb]">Supported formats: .csv</p>
                </div>
                <button className="cursor-pointer mt-2 flex h-9 items-center justify-center rounded-lg bg-[#182234] px-4 text-sm font-bold text-white shadow-sm ring-1 ring-inset ring-[#314368] transition-all hover:bg-[#222f49] hover:ring-white/20">
                  Browse Files
                </button>
              </div>
            </div>
          ) : (
            /* Data Preview Section */
            <div className="mb-8">
              {/* File Info Card */}
              <div
                className={cn(
                  "group flex items-center justify-between p-4 mb-6 rounded-xl border border-dashed border-[#314368] bg-[#182234]/30 transition-all",
                  !isUploading && "hover:border-primary hover:bg-[#182234]/50 hover:cursor-pointer"
                )}
                onClick={() => !isUploading && fileInputRef.current?.click()}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                    <IoMdCloudUpload className="text-xl text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{file.name}</p>
                    <p className="text-xs text-[#90a4cb]">Click to change file</p>
                  </div>
                </div>
                {!isUploading && (
                  <span className="material-symbols-outlined text-[#90a4cb] group-hover:text-white transition-colors">
                    edit
                  </span>
                )}
              </div>

              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold leading-tight tracking-tight text-white">
                  Data Preview (Top 5 Rows)
                </h3>
              </div>

              {/* Table */}
              <div className="overflow-hidden rounded-lg border border-[#314368] bg-[#101623]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[#182234]">
                      <tr>
                        {headers.map((header, i) => (
                          <th key={i} className="whitespace-nowrap px-4 py-3 text-sm font-medium text-[#90a4cb]">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#314368]">
                      {rows.map((row, i) => (
                        <tr key={i} className="group hover:bg-white/5">
                          {row.map((cell, j) => (
                            <td key={j} className="whitespace-nowrap px-4 py-3 text-sm text-white">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Business Questions */}
              <div className="mt-6">
                <h3 className="text-lg font-bold leading-tight tracking-tight text-white mb-3">
                  Business Questions
                  <span className="text-sm font-normal text-[#90a4cb] ml-2">(Optional)</span>
                </h3>
                <p className="text-sm text-[#90a4cb] mb-3">
                  What specific questions do you want answered from your data? This helps the AI focus its analysis.
                </p>
                <textarea
                  value={businessQuestions}
                  onChange={(e) => setBusinessQuestions(e.target.value)}
                  disabled={isUploading}
                  placeholder="e.g. What are the top revenue drivers? Which customer segments are growing fastest? Are there any seasonal trends?"
                  className="w-full rounded-lg border border-[#314368] bg-[#182234]/30 px-4 py-3 text-sm text-white placeholder-[#5a6f94] focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors resize-none disabled:opacity-50"
                  rows={4}
                />
              </div>

              {/* Model Selector */}
              <div className="mt-6">
                <h3 className="text-lg font-bold leading-tight tracking-tight text-white mb-3">
                  AI Model
                </h3>
                <p className="text-sm text-[#90a4cb] mb-3">
                  Choose the AI model to use for analysis.
                </p>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  disabled={isUploading}
                  className="w-full rounded-lg border border-[#314368] bg-[#182234]/30 px-4 py-3 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors disabled:opacity-50 appearance-none cursor-pointer"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2390a4cb' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.75rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.25em 1.25em' }}
                >
                  {AVAILABLE_MODELS.map((model) => (
                    <option key={model.value} value={model.value} className="bg-[#182234] text-white">
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
            accept=".csv"
            onChange={handleFileChange}
          />
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[#314368] bg-[#101623] px-6 py-4">
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="cursor-pointer flex h-10 items-center justify-center rounded-lg border border-[#314368] bg-transparent px-6 text-sm font-bold text-white transition-colors hover:bg-[#182234] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
                {/* Tiny progress bar bottom */}
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
    </div>
  );
}

