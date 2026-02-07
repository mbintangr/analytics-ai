import React from "react";

export function SocialLogin() {
  return (
    <>
      {/* Divider */}
      <div className="relative flex py-2 items-center opacity-70">
        <div className="grow border-t border-gray-700"></div>
        <span className="shrink-0 mx-4 text-gray-500 text-[10px] uppercase tracking-widest font-bold">
          Or connect with
        </span>
        <div className="grow border-t border-gray-700"></div>
      </div>

      {/* Social Login Buttons */}
      {/* <div className="grid grid-cols-2 gap-4">
        <button className="flex items-center justify-center gap-3 py-2.5 px-4 border border-white/10 bg-white/5 rounded-lg hover:border-primary/50 hover:bg-white/10 transition-all group focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer">
          <img src="https://authjs.dev/img/providers/google.svg" className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all" alt="Google" />
          <span className="text-xs font-bold tracking-wide text-gray-300 group-hover:text-white">
            GOOGLE
          </span>
        </button>
        <button className="flex items-center justify-center gap-3 py-2.5 px-4 border border-white/10 bg-white/5 rounded-lg hover:border-primary/50 hover:bg-white/10 transition-all group focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer">
          <img src="https://authjs.dev/img/providers/github.svg" className="w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all invert" alt="GitHub" />
          <span className="text-xs font-bold tracking-wide text-gray-300 group-hover:text-white">
            GITHUB
          </span>
        </button>
      </div> */}
    </>
  );
}
