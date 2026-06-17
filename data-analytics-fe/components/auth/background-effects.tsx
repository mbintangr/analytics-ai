import React from "react";

export function BackgroundEffects() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px] animate-pulse-slow"></div>
      <div
        className="absolute bottom-[-10%] right-[10%] w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[120px] animate-pulse-slow"
        style={{ animationDelay: "2s" }}
      ></div>
      <div
        className="absolute inset-0 z-0 opacity-20"
        style={{
          backgroundSize: "40px 40px",
          backgroundImage: `
                linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
            `,
          maskImage: "radial-gradient(circle at center, black 40%, transparent 90%)",
          WebkitMaskImage: "radial-gradient(circle at center, black 40%, transparent 90%)"
        }}
        data-alt="Abstract grid background representing a data network"
      ></div>
    </div>
  );
}
