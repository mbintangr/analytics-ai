import React from "react";

export function SocialLogin() {
  return (
    <>
      {/* Divider */}
      <div className="relative flex py-2 items-center opacity-70">
        <div className="grow border-t" style={{ borderColor: "var(--surface-border)" }}></div>
        <span className="shrink-0 mx-4 text-[10px] uppercase tracking-widest font-bold" style={{ color: "var(--text-muted)" }}>
          Or connect with
        </span>
        <div className="grow border-t" style={{ borderColor: "var(--surface-border)" }}></div>
      </div>
    </>
  );
}
