import React, { InputHTMLAttributes } from "react";

interface NeonInputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: string;
  label?: string;
}

export function NeonInput({ icon, label, className, ...props }: NeonInputProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-xs uppercase tracking-wider font-semibold text-slate-400 pl-1">
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary transition-colors duration-300">
            <span className="material-symbols-outlined text-[20px]!">{icon}</span>
          </div>
        )}
        <input
          className={`w-full bg-[#182234]/80 border border-slate-700/50 text-white text-base rounded-lg block p-3.5 placeholder-slate-600 focus:outline-none focus:ring-0 transition-all duration-300 focus:shadow-[0_0_15px_rgba(13,89,242,0.4)] focus:border-primary ${icon ? "pl-10" : ""
            } ${className}`}
          {...props}
        />
      </div>
    </div>
  );
}
