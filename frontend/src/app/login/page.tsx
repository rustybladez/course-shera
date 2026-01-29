"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { login, signup } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response =
        mode === "login"
          ? await login(email, password)
          : await signup(email, password, name || undefined);

      // Store token and role in localStorage
      localStorage.setItem("auth_token", response.access_token);
      localStorage.setItem("user_role", response.role);

      // Redirect to appropriate page
      if (response.role === "admin") {
        router.push("/admin/upload");
      } else {
        router.push("/library");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl shadow-indigo-200/50 border border-slate-200 p-8 md:p-10">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center justify-center gap-2 mb-4 group">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-300/50 group-hover:scale-105 transition-transform">
                <i className="fas fa-graduation-cap text-white text-2xl"></i>
              </div>
            </Link>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Course Shera
            </h1>
            <p className="text-slate-600 text-base">
              {mode === "login"
                ? "Welcome back! Sign in to continue"
                : "Create your account to get started"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "signup" && (
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold text-slate-700 mb-2"
                >
                  Name (optional)
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="admin@courseshera.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-slate-700 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-indigo-300/50 transition-all hover:shadow-indigo-400/50 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="fas fa-spinner fa-spin"></i>
                  Processing...
                </span>
              ) : mode === "login" ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="fas fa-sign-in-alt"></i>
                  Sign In
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <i className="fas fa-user-plus"></i>
                  Create Account
                </span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setError(null);
              }}
              className="text-indigo-600 hover:text-indigo-700 text-sm font-semibold transition-colors"
            >
              {mode === "login"
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-indigo-600 font-medium transition-colors group"
            >
              <i className="fas fa-arrow-left transition-transform group-hover:-translate-x-1"></i>
              Back to home
            </Link>
          </div>
        </div>

        {/* Quick login hints */}
        <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-center">
          <p className="text-xs font-semibold text-indigo-900 mb-2">Demo Credentials</p>
          <div className="flex flex-wrap justify-center gap-3 text-xs">
            <span className="bg-white px-3 py-1.5 rounded-lg text-slate-700 font-mono shadow-sm">
              admin@courseshera.com
            </span>
            <span className="bg-white px-3 py-1.5 rounded-lg text-slate-700 font-mono shadow-sm">
              student@courseshera.com
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
