"use client";

import React, { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { NeonInput } from "./neon-input";
import { SocialLogin } from "./social-login";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    await authClient.signUp.email({
      email,
      password,
      name,
    }, {
      onRequest: () => {
        setLoading(true);
      },
      onSuccess: (ctx) => {
        setLoading(false);
        router.push("/signin");
      },
      onError: (ctx) => {
        setLoading(false);
        setError(ctx.error.message || "Something went wrong");
      }
    });

  };

  return (
    <div className="max-w-md mx-auto w-full flex flex-col gap-8">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-primary text-xs font-mono uppercase tracking-widest mb-2 opacity-80">
          <span>&gt;_</span> Initialize Protocol
        </div>
        <h2 className="text-3xl font-bold text-white tracking-tight">
          Create Your Account
        </h2>
        <p className="text-slate-400 text-sm font-medium mt-1">
          Enter your details to create an account.
        </p>
      </div>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        {/* Name Input */}
        <NeonInput
          id="name"
          type="text"
          label="Name"
          placeholder="John Doe"
          icon="badge"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* Email Input */}
        <NeonInput
          id="email"
          type="email"
          label="Email"
          placeholder="email@example.com"
          icon="alternate_email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Password Input */}
        <div className="flex flex-col gap-2">
          <label
            className="text-xs uppercase tracking-wider font-semibold text-slate-400 pl-1"
            htmlFor="password"
          >
            Password
          </label>
          <div className="relative group">
            {/* Icon */}
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary transition-colors duration-300">
              <span className="material-symbols-outlined text-[20px]">
                key
              </span>
            </div>

            <input
              id="password"
              type="password"
              className="w-full bg-[#182234]/80 border border-slate-700/50 text-white text-base rounded-lg block pl-10 p-3.5 pr-10 placeholder-slate-600 focus:outline-none focus:ring-0 transition-all duration-300 focus:shadow-[0_0_15px_rgba(13,89,242,0.4)] focus:border-primary"
              placeholder="••••••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer outline-none"
            >
              <span className="material-symbols-outlined text-[20px]">
                visibility
              </span>
            </button>
          </div>
        </div>

        {error && (
          <div className="text-red-500 text-sm bg-red-500/10 p-2 rounded border border-red-500/20">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full bg-linear-to-r from-primary to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3.5 px-4 rounded-lg shadow-[0_4px_14px_0_rgba(13,89,242,0.39)] hover:shadow-[0_6px_20px_rgba(13,89,242,0.23)] hover:-translate-y-0.5 transform transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-[#101623] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="flex items-center justify-center gap-2">
            {loading ? "Creating account..." : "Sign Up"}
            {!loading && <span className="material-symbols-outlined text-[18px]">
              arrow_forward
            </span>}
          </span>
        </button>
      </form>

      {/* Bottom Link */}
      <div className="text-center">
        <p className="text-slate-400 text-sm">
          Already have an account?{" "}
          <Link
            href="/signin"
            className="text-white font-semibold hover:text-primary transition-colors ml-1 relative inline-block group/link"
          >
            Sign in
            <span className="absolute bottom-0 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover/link:w-full"></span>
          </Link>
        </p>
      </div>
    </div>
  );
}
