"use client";

import React, { useState } from "react";
import { SearchInput } from "../small/search-input";
import { ActionButton } from "../small/action-button";
import { UploadModal } from "./upload-modal";

export interface HeaderProps {
  userName?: string | null;
  userId?: string;
}

export function Header({ userName, userId }: HeaderProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <header className="flex flex-col xl:flex-row gap-6 justify-between items-start xl:items-center">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
            Welcome Back, <span className="text-primary">{userName || "User"}</span>
          </h2>
          <p className="text-slate-400 text-base">
            Here's an overview of your recent data analysis sessions.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
          <SearchInput />
          <ActionButton icon="add" onClick={() => setShowModal(true)}>New Analysis</ActionButton>
        </div>
      </header>

      <UploadModal isOpen={showModal} onClose={() => setShowModal(false)} userId={userId} />
    </>
  );
}
