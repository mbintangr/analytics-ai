import React from "react";
import { BsClipboardDataFill } from "react-icons/bs";

export function Logo() {
  return (
    <div className="flex items-center gap-3 z-10">
      <div className="text-primary flex items-center justify-center w-8 h-8 rounded border border-primary/30 bg-primary/10">
        <BsClipboardDataFill />
      </div>
      <h2 className="text-lg font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
        Analytics AI
      </h2>
    </div>
  );
}
