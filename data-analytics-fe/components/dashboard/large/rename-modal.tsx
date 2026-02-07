"use client";

import React, { useState, useEffect } from "react";
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

  useEffect(() => {
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
        className="absolute inset-0 bg-background-dark/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />
      <div className="relative z-20 w-full max-w-md overflow-hidden rounded-xl border border-[#314368] bg-[#101623] shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="flex items-center justify-between border-b border-[#314368] bg-[#101623] px-6 py-4">
          <div className="flex items-center gap-3">
            <MdEdit className="text-primary text-xl" />
            <h2 className="text-xl font-bold leading-tight tracking-tight text-white">
              Rename Project
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
          <div className="mb-6">
            <label htmlFor="projectName" className="block text-sm font-medium text-slate-300 mb-2">
              Project Name
            </label>
            <input
              id="projectName"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full rounded-lg border border-[#314368] bg-[#182234] px-4 py-2.5 text-white placeholder-slate-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
              placeholder="Enter project name"
              autoFocus
            />
          </div>

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
