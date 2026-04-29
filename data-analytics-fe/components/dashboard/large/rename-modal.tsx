"use client";

import React, { useState } from "react";
import { IoClose } from "react-icons/io5";
import { MdEdit } from "react-icons/md";

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRename: (newName: string) => Promise<void>;
  currentName: string;
}

export function RenameModal({ isOpen, onClose, onRename, currentName }: RenameModalProps) {
  const [newName, setNewName] = useState(currentName);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    setNewName(currentName);
  }, [currentName, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newName === currentName) {
      onClose();
      return;
    }

    try {
      setIsSubmitting(true);
      await onRename(newName);
      onClose();
    } catch (error) {
      console.error("Failed to rename:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 backdrop-blur-md transition-opacity"
        style={{ background: "rgba(0,0,0,0.5)" }}
        onClick={onClose}
      />
      <div
        className="relative z-20 w-full max-w-md overflow-hidden rounded-xl border shadow-2xl animate-in fade-in zoom-in duration-300"
        style={{
          background: "var(--surface-base)",
          borderColor: "var(--surface-border)",
        }}
      >
        <div
          className="flex items-center justify-between border-b px-6 py-4"
          style={{ borderColor: "var(--surface-border)" }}
        >
          <div className="flex items-center gap-3">
            <MdEdit className="text-primary text-xl" />
            <h2 className="text-xl font-bold leading-tight tracking-tight" style={{ color: "var(--text-primary)" }}>
              Rename Project
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="cursor-pointer group flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-50"
            style={{ color: "var(--text-secondary)" }}
          >
            <IoClose className="text-xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label htmlFor="projectName" className="block text-sm font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
              Project Name
            </label>
            <input
              id="projectName"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full rounded-lg border px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              style={{
                background: "var(--surface-inset)",
                borderColor: "var(--surface-border)",
                color: "var(--text-primary)",
              }}
              placeholder="Enter project name"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="cursor-pointer px-4 py-2 rounded-lg transition-colors font-medium text-sm hover:bg-black/5 dark:hover:bg-white/5"
              style={{ color: "var(--text-secondary)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !newName.trim()}
              className="cursor-pointer px-4 py-2 rounded-lg bg-primary hover:bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
