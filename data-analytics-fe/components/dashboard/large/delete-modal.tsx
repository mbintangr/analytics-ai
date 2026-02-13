"use client";

import React, { useState } from "react";
import { IoClose, IoTrash } from "react-icons/io5";

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => Promise<void>;
  projectName: string;
}

export function DeleteModal({ isOpen, onClose, onDelete, projectName }: DeleteModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await onDelete();
      onClose();
    } catch (error) {
      console.error("Failed to delete:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background-dark/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />
      <div className="relative z-20 w-full max-w-md overflow-hidden rounded-xl border border-[#314368] bg-[#101623] shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-between border-b border-[#314368] bg-[#101623] px-6 py-4">
          <div className="flex items-center gap-3">
            <IoTrash className="text-red-500 text-xl" />
            <h2 className="text-xl font-bold leading-tight tracking-tight text-white">
              Delete Project
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="cursor-pointer group flex h-8 w-8 items-center justify-center rounded-full text-[#90a4cb] transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            <IoClose className="text-xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-slate-300 mb-6">
            Are you sure you want to delete <span className="text-white font-bold">"{projectName}"</span>? This action cannot be undone.
          </p>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="cursor-pointer px-4 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-bold text-sm shadow-lg shadow-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Deleting..." : "Delete Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
