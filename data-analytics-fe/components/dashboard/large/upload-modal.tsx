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

export function UploadModal({ isOpen, onClose, userId }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [isUploading, setIsUploading] = useState(false);
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
    setIsUploading(false);
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
      const formData = new FormData();
      formData.append("file", file);
      formData.append("user_id", userId);

      const response = await fetch("http://localhost:4001/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();

      // Success - close modal and redirect
      handleClose();
      if (data.session_id) {
        router.push(`/report/${data.session_id}`);
      }
    } catch (error) {
      console.error("Analysis failed:", error);
    } finally {
      setIsUploading(false);
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
            className="cursor-pointer flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-bold text-white shadow-[0_0_15px_rgba(13,89,242,0.4)] transition-all hover:bg-blue-600 hover:shadow-[0_0_20px_rgba(13,89,242,0.6)] disabled:opacity-50 disabled:cursor-not-allowed hover:cursor-pointer"
          >
            {isUploading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-lg">sync</span>
                Processing...
              </>
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

