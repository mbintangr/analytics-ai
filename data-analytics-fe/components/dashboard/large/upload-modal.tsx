"use client";
import { useRouter } from "next/navigation";

import React from "react";
import { MdOutlineAnalytics } from "react-icons/md";
import { IoClose } from "react-icons/io5";

import { UploadView } from "./upload-view";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
}

export function UploadModal({ isOpen, onClose, userId }: UploadModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleUploadSuccess = (sessionId: string) => {
    onClose();
    router.push(`/report/${sessionId}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-md transition-opacity"
        style={{ background: "rgba(0,0,0,0.5)" }}
      />

      {/* Modal Container */}
      <div
        className="relative z-20 flex max-h-[90vh] w-full max-w-[900px] flex-col overflow-hidden rounded-xl border shadow-2xl animate-in fade-in zoom-in duration-300"
        style={{
          background: "var(--surface-base)",
          borderColor: "var(--surface-border)",
        }}
      >
        {/* Modal Header */}
        <div
          className="flex items-center justify-between border-b px-6 py-4"
          style={{
            borderColor: "var(--surface-border)",
            background: "var(--surface-base)",
          }}
        >
          <div className="flex items-center gap-3">
            <MdOutlineAnalytics className="text-primary text-xl" />
            <h2 className="text-xl font-bold leading-tight tracking-tight" style={{ color: "var(--text-primary)" }}>
              Upload Data
            </h2>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer group flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-50"
            style={{ color: "var(--text-secondary)" }}
          >
            <IoClose className="text-xl" />
          </button>
        </div>

        {/* Modal Body */}
        <UploadView
          userId={userId}
          onUploadSuccess={handleUploadSuccess}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
