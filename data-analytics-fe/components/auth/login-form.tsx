"use client";

import React, { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { NeonInput } from "./neon-input";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    await authClient.signIn.email({
      email,
      password,
    }, {
      onRequest: () => {
        setLoading(true);
      },
      onSuccess: () => {
        setLoading(false);
        router.push("/");
      },
      onError: (ctx) => {
        setLoading(false);
        if (ctx.error.status === 403) {
          setError("Please verify your email address");
        } else {
          setError(ctx.error.message || "Something went wrong");
        }
      }
    });
  };

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      {/* Email Field */}
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

      {/* Password Field */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center pl-1">
          <label
            className="text-xs uppercase tracking-wider font-semibold"
            style={{ color: "var(--text-secondary)" }}
            htmlFor="password"
          >
            Password
          </label>
        </div>
        <div className="relative group">
          <div
            className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none group-focus-within:text-primary transition-colors duration-300"
            style={{ color: "var(--text-muted)" }}
          >
            <span className="material-symbols-outlined text-[20px]">encrypted</span>
          </div>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            className="w-full border text-base rounded-lg block pl-10 p-3.5 pr-10 placeholder-slate-500 focus:outline-none focus:ring-0 transition-all duration-300 focus:shadow-[0_0_15px_rgba(13,89,242,0.4)] focus:border-primary"
            style={{
              background: "var(--surface-inset)",
              borderColor: "var(--surface-border)",
              color: "var(--text-primary)",
            }}
            placeholder="••••••••"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-primary transition-colors cursor-pointer outline-none"
            style={{ color: "var(--text-muted)" }}
          >
            <span className="material-symbols-outlined text-[20px]">
              {showPassword ? "visibility_off" : "visibility"}
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
        className="mt-4 w-full bg-linear-to-r from-primary to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3.5 px-4 rounded-lg shadow-[0_4px_14px_0_rgba(13,89,242,0.39)] hover:shadow-[0_6px_20px_rgba(13,89,242,0.23)] hover:-translate-y-0.5 transform transition-all duration-200 focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="flex items-center justify-center gap-2">
          {loading ? "Signing In..." : "Sign In"}
          {!loading && <span className="material-symbols-outlined text-[18px]">arrow_forward</span>}
        </span>
      </button>
    </form>
  );
}
