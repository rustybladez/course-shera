"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { generate, listCourses } from "@/lib/api";
import { useMe } from "@/lib/use-me";
import { LogoutButton } from "@/components/LogoutButton";

type GenerateMode = "theory_notes" | "slides" | "lab_code";

export default function GeneratePage() {
  const router = useRouter();
  const { getToken, isAdmin, me, loading: meLoading } = useMe();
  
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState<GenerateMode>("theory_notes");
  const [courseId, setCourseId] = useState<string | undefined>(undefined);
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([]);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ content_markdown: string; citations: string[]; validation?: unknown } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [expandedContent, setExpandedContent] = useState(false);

  useEffect(() => {
    if (meLoading) return;
    if (!me) {
      router.replace("/login");
      return;
    }
    const loadCourses = async () => {
      const token = await getToken();
      if (!token) return;
      try {
        const cs = await listCourses(token);
        setCourses(cs.map((c) => ({ id: c.id, title: c.title })));
      } catch (e) {
        console.error("Failed to load courses:", e);
      }
    };
    void loadCourses();
  }, [meLoading, me, router, getToken]);

  async function handleGenerate() {
    if (!prompt.trim()) return;
    const token = await getToken();
    if (!token) return;

    setLoading(true);
    setErr(null);
    setResult(null);
    setExpandedContent(false);
    
    try {
      const res = await generate(mode, prompt.trim(), courseId, token);
      setResult(res);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading && prompt.trim()) void handleGenerate();
  };

  if (meLoading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="text-center text-zinc-600">Loading...</div>
      </div>
    );
  }

  if (!me) return null;

  const suggestions = [
    "Quantum Computing Basics",
    "Modern Web Accessibility",
    "Principles of Macroeconomics",
    "Introduction to Rust Programming"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold">
            Course Shera
          </Link>
          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-4 text-sm font-medium text-zinc-600">
              <Link href="/library" className="hover:text-zinc-900">Library</Link>
              <Link href="/search" className="hover:text-zinc-900">Search</Link>
              <Link href="/generate" className="text-zinc-900">Generate</Link>
              <Link href="/chat" className="hover:text-zinc-900">Chat</Link>
              {isAdmin && (
                <Link href="/admin/upload" className="hover:text-zinc-900">Admin</Link>
              )}
            </nav>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              AI-Generated Learning Materials
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Generate new learning materials based on course content and knowledge bases.
            </p>
          </div>

          {/* Generator Card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                <i className="fas fa-magic text-xl"></i>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-900">Generate Materials</h3>
                <p className="text-sm text-zinc-600">Enter a topic or concept</p>
              </div>
            </div>

            {/* Filters */}
            <div className="mb-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-500">Course (optional)</label>
                <select
                  value={courseId ?? ""}
                  onChange={(e) => setCourseId(e.target.value || undefined)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
                >
                  <option value="">All courses</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-500">Material Type</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as GenerateMode)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
                >
                  <option value="theory_notes">📝 Reading Notes</option>
                  <option value="slides">📊 Slides</option>
                  <option value="lab_code">💻 Lab Code</option>
                </select>
              </div>
            </div>

            {/* Prompt Input */}
            <div className="mb-4">
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="e.g., Explain sorting algorithms with examples"
                disabled={loading}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-400 disabled:opacity-50"
              />
            </div>

            {/* Suggestions */}
            <div className="mb-4 flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setPrompt(s)}
                  className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600 transition hover:bg-indigo-50 hover:text-indigo-600"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Generate Button */}
            <button
              onClick={() => void handleGenerate()}
              disabled={!prompt.trim() || loading}
              className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <i className="fas fa-circle-notch fa-spin"></i>
                  Generating...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <i className="fas fa-sparkles"></i>
                  Generate {mode === "theory_notes" ? "Notes" : mode === "slides" ? "Slides" : "Code"}
                </span>
              )}
            </button>
          </div>

          {/* Error */}
          {err && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <i className="fas fa-triangle-exclamation mr-2"></i>
              {err}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-green-200 bg-green-50/50 p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-semibold text-green-900">
                    {mode === "theory_notes" ? "📝 Generated Notes" : mode === "slides" ? "📊 Generated Slides" : "💻 Generated Lab Code"}
                  </div>
                  {result.citations.length > 0 && (
                    <span className="text-xs text-green-700">
                      {result.citations.length} source{result.citations.length !== 1 ? "s" : ""} cited
                    </span>
                  )}
                </div>
                
                <div className={`prose prose-sm max-w-none ${!expandedContent ? "max-h-96 overflow-hidden relative" : ""}`}>
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        return !inline && match ? (
                          <SyntaxHighlighter
                            style={oneDark}
                            language={match[1]}
                            PreTag="div"
                            {...props}
                          >
                            {String(children).replace(/\n$/, "")}
                          </SyntaxHighlighter>
                        ) : (
                          <code className={className} {...props}>
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {result.content_markdown}
                  </ReactMarkdown>
                  {!expandedContent && (
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-green-50/50 to-transparent" />
                  )}
                </div>
                
                <button
                  onClick={() => setExpandedContent(!expandedContent)}
                  className="mt-3 text-sm font-medium text-green-600 transition hover:text-green-700"
                >
                  {expandedContent ? "← Show Less" : "Show More →"}
                </button>
              </div>

              {/* Validation Info */}
              {result.validation && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
                  <div className="font-semibold">Validation</div>
                  <pre className="mt-2 overflow-x-auto">
                    {JSON.stringify(result.validation, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Info */}
          {!result && !loading && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-900">
              <div className="mb-2 font-semibold">💡 How it works</div>
              <ul className="space-y-1 text-blue-800">
                <li>• <strong>Theory Notes:</strong> Structured Markdown notes with citations</li>
                <li>• <strong>Slides:</strong> Presentation-ready content in Markdown format</li>
                <li>• <strong>Lab Code:</strong> Syntactically correct code examples with explanations</li>
                <li>• Content is grounded in uploaded course materials via RAG retrieval</li>
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
