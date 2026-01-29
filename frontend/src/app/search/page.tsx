"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import ReactMarkdown from "react-markdown";
import {
  listCourses,
  search,
  searchAsk,
  type SearchHit,
  type SearchAskResult,
} from "@/lib/api";
import {
  cleanMarkdown,
  formatRelevance,
  getRelevanceColor,
  getRelevanceLabel,
  truncateExcerpt,
} from "@/lib/search-utils";
import { useMe } from "@/lib/use-me";
import { LogoutButton } from "@/components/LogoutButton";

export default function SearchPage() {
  const router = useRouter();
  const { getToken, isAdmin, me, loading: meLoading } = useMe();
  const [q, setQ] = useState("");
  const [courseId, setCourseId] = useState<string | undefined>(undefined);
  const [category, setCategory] = useState<"theory" | "lab" | undefined>(undefined);
  const [topK, setTopK] = useState(12);
  const [language, setLanguage] = useState<string>("");
  const [symbol, setSymbol] = useState<string>("");
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([]);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [askResult, setAskResult] = useState<SearchAskResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedAnswer, setExpandedAnswer] = useState(false);

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

  async function onSearch() {
    if (!q.trim()) return;
    const token = await getToken();
    if (!token) return;

    setLoading(true);
    setErr(null);
    setAskResult(null);
    try {
      const res = await search(
        {
          query: q.trim(),
          course_id: courseId,
          category,
          top_k: topK,
          language: language.trim() || undefined,
          symbol: symbol.trim() || undefined,
          use_hybrid: true,
        },
        token,
      );
      setHits(res.hits);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function onAsk() {
    if (!q.trim()) return;
    const token = await getToken();
    if (!token) return;

    setLoading(true);
    setErr(null);
    setAskResult(null);
    setHits([]);
    try {
      const res = await searchAsk(
        {
          query: q.trim(),
          course_id: courseId,
          category,
          top_k: Math.min(topK, 10),
        },
        token,
      );
      setAskResult(res);
      setHits(res.hits);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading && q.trim()) void onSearch();
  };

  if (meLoading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="text-center text-zinc-600">Loading...</div>
      </div>
    );
  }

  if (!me) return null;

  const citedIds = new Set((askResult?.citations ?? []).map(String));

  // Process answer to replace chunk IDs with numbered citations
  const processAnswerWithCitations = (answer: string, citations: string[]) => {
    let processed = answer;
    const chunkIdToNumber: Record<string, number> = {};
    
    // Map each chunk ID to a number
    citations.forEach((id, idx) => {
      chunkIdToNumber[id] = idx + 1;
    });
    
    // Replace [chunk_id] with [1], [2], etc.
    Object.entries(chunkIdToNumber).forEach(([chunkId, num]) => {
      const pattern = new RegExp(`\\[${chunkId}\\]`, "g");
      processed = processed.replace(pattern, `[${num}]`);
    });
    
    return processed;
  };

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
              <Link href="/search" className="text-zinc-900">Search</Link>
              <Link href="/generate" className="hover:text-zinc-900">Generate</Link>
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
              Intelligent Search
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Semantic + full-text search. RAG “Ask” for a grounded answer with citations.
            </p>
          </div>

          {/* Filters */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-500">Course</label>
                <select
                  value={courseId ?? ""}
                  onChange={(e) => setCourseId(e.target.value || undefined)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
                >
                  <option value="">All</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-500">Category</label>
                <select
                  value={category ?? ""}
                  onChange={(e) =>
                    setCategory(
                      e.target.value ? (e.target.value as "theory" | "lab") : undefined,
                    )
                  }
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
                >
                  <option value="">All</option>
                  <option value="theory">Theory</option>
                  <option value="lab">Lab</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-500">Results</label>
                <select
                  value={topK}
                  onChange={(e) => setTopK(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
                >
                  <option value={5}>5</option>
                  <option value={8}>8</option>
                  <option value={12}>12</option>
                  <option value={20}>20</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-500">
                  Language (code)
                </label>
                <input
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  placeholder="e.g. python"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium text-zinc-500">
                  Symbol (code)
                </label>
                <input
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder="e.g. function name"
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
                />
              </div>
            </div>
          </div>

          {/* Search / Ask */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Natural language query or question…"
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-400"
            />
            <div className="flex gap-2">
              <button
                onClick={() => void onSearch()}
                disabled={!q.trim() || loading}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? "…" : "Search"}
              </button>
              <button
                onClick={() => void onAsk()}
                disabled={!q.trim() || loading}
                className="rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Ask (RAG)
              </button>
            </div>
          </div>

          {err && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {err}
            </div>
          )}

          {/* RAG Answer */}
          {askResult && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 shadow-sm">
                <div className="mb-3 text-sm font-semibold text-blue-900">Answer</div>
                <div className={`prose prose-sm max-w-none text-zinc-800 ${!expandedAnswer ? "max-h-64 overflow-hidden relative" : ""}`}>
                  <ReactMarkdown>
                    {processAnswerWithCitations(askResult.answer, askResult.citations)}
                  </ReactMarkdown>
                  {!expandedAnswer && (
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-blue-50/50 to-transparent" />
                  )}
                </div>
                <button
                  onClick={() => setExpandedAnswer(!expandedAnswer)}
                  className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700 transition"
                >
                  {expandedAnswer ? "← Less" : "More →"}
                </button>
              </div>

              {/* Citations section */}
              {askResult.citations.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-amber-900">
                    <span>📚 Citations</span>
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-200 text-xs font-bold text-amber-900">
                      {askResult.citations.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {askResult.citations.map((citationId, idx) => {
                      const citedHit = hits.find((h) => String(h.chunk_id) === String(citationId));
                      return (
                        <div
                          key={citationId}
                          className="rounded-lg border border-amber-100 bg-white p-3"
                        >
                          <div className="mb-2 flex items-baseline gap-2">
                            <span className="inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-white">
                              {idx + 1}
                            </span>
                            {citedHit && (
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-medium text-zinc-700">
                                  {citedHit.material_title}
                                </div>
                                <div className="text-xs text-zinc-500">
                                  {citedHit.category === "theory" ? "📚 Theory" : "🔬 Lab"}
                                </div>
                              </div>
                            )}
                          </div>
                          {citedHit && (
                            <p className="line-clamp-2 text-xs leading-relaxed text-zinc-600">
                              {cleanMarkdown(truncateExcerpt(citedHit.excerpt, 200))}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Results */}
          <div className="grid gap-4">
            {hits.map((h, idx) => {
              const relevance = typeof h.score === "number" ? h.score : 0;
              const relevanceColor = getRelevanceColor(relevance);
              const relevanceLabel = getRelevanceLabel(relevance);
              const isCode = Boolean(h.language);
              const isCited = citedIds.has(String(h.chunk_id));

              return (
                <div
                  key={h.chunk_id}
                  className={`group rounded-2xl border bg-white p-5 shadow-sm transition-all hover:shadow-lg ${
                    isCited ? "border-blue-300 ring-1 ring-blue-200" : "border-zinc-200"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                          {idx + 1}
                        </span>
                        <h3 className="text-sm font-semibold text-zinc-900">{h.material_title}</h3>
                        <span className="inline-flex flex-shrink-0 items-center rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                          {h.category === "theory" ? "📚" : "🔬"} {h.category}
                        </span>
                        {h.symbol_name && (
                          <span className="rounded-md bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                            {h.symbol_name}
                          </span>
                        )}
                        {(h.start_line != null || h.end_line != null) && (
                          <span className="text-xs text-zinc-500">
                            L{h.start_line ?? "?"}–{h.end_line ?? "?"}
                          </span>
                        )}
                        {isCited && (
                          <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                            Cited
                          </span>
                        )}
                      </div>

                      {isCode ? (
                        <div className="overflow-x-auto rounded-xl bg-zinc-900 text-sm">
                          <SyntaxHighlighter
                            language={h.language ?? "text"}
                            style={oneDark}
                            showLineNumbers={h.start_line != null}
                            startingLineNumber={h.start_line ?? 1}
                            PreTag="div"
                            customStyle={{
                              margin: 0,
                              padding: "1rem",
                              borderRadius: "0.75rem",
                              fontSize: "0.8125rem",
                            }}
                            codeTagProps={{ className: "font-mono" }}
                          >
                            {h.excerpt}
                          </SyntaxHighlighter>
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed text-zinc-700">
                          {cleanMarkdown(truncateExcerpt(h.excerpt, 500))}
                        </p>
                      )}

                      <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-zinc-300" />
                        Chunk from material
                      </div>
                    </div>

                    <div
                      className={`flex flex-shrink-0 flex-col items-center justify-center rounded-xl p-3 ${relevanceColor}`}
                    >
                      <div className="mb-0.5 text-xs font-semibold">{relevanceLabel}</div>
                      <div className="text-lg font-bold">{formatRelevance(relevance)}</div>
                      <div className="mt-1 text-xs">match</div>
                    </div>
                  </div>
                </div>
              );
            })}

            {!loading && hits.length === 0 && q.trim() && (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
                <div className="mb-2 text-sm font-medium text-zinc-900">🔍 No results</div>
                <div className="text-sm text-zinc-600">
                  Try a different query or ensure materials are ingested.
                </div>
              </div>
            )}

            {!loading && hits.length === 0 && !q.trim() && (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
                <div className="mb-2 text-sm font-medium text-zinc-900">⏳ Ready</div>
                <div className="text-sm text-zinc-600">
                  Enter a query, then Search or Ask (RAG) for a grounded answer.
                </div>
              </div>
            )}
          </div>

          {hits.length === 0 && (
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-900">
              <div className="mb-2 font-semibold">💡 How it works</div>
              <ul className="space-y-1 text-blue-800">
                <li>• Semantic + full-text hybrid search beyond plain keywords</li>
                <li>• Use <strong>Ask (RAG)</strong> to get an AI answer grounded in course materials</li>
                <li>• Filter by language/symbol for syntax-aware code search</li>
                <li>• Ingest materials in <Link href="/admin/upload" className="underline">Admin</Link> first</li>
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
