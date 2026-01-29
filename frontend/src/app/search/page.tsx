"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import ReactMarkdown from "react-markdown";
import {
  listCourses,
  search,
  searchAsk,
  materialFileUrl,
  type Material,
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
import { UnifiedLayout } from "@/components/UnifiedLayout";

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
  const [materials, setMaterials] = useState<Map<string, Material>>(new Map());

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
      
      // Fetch material details for citations
      const uniqueMaterialIds = new Set(res.hits.map(h => h.material_id));
      const materialsMap = new Map<string, Material>();
      
      for (const materialId of uniqueMaterialIds) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/materials`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const allMaterials: Material[] = await response.json();
            const material = allMaterials.find(m => m.id === materialId);
            if (material) {
              materialsMap.set(materialId, material);
            }
          }
        } catch (err) {
          console.error(`Failed to fetch material ${materialId}:`, err);
        }
      }
      
      setMaterials(materialsMap);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading && q.trim()) void onSearch();
  };

  async function openMaterialFromCitation(materialId: string) {
    const material = materials.get(materialId);
    if (!material) return;
    
    if (material.link_url) {
      window.open(material.link_url, "_blank", "noopener,noreferrer");
      return;
    }
    if (!material.storage_url) return;
    
    const token = await getToken();
    if (!token) return;
    
    const url = materialFileUrl(material.id);
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load file");
      const blob = await res.blob();
      const u = URL.createObjectURL(blob);
      window.open(u, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Failed to open material:", err);
    }
  }

  if (meLoading) {
    return (
      <UnifiedLayout>
        <div className="flex items-center justify-center h-full">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
        </div>
      </UnifiedLayout>
    );
  }

  if (!me) return null;

  const citedIds = new Set((askResult?.citations ?? []).map(String));

  const processAnswerWithCitations = (answer: string, citations: string[]) => {
    let processed = answer;
    const chunkIdToNumber: Record<string, number> = {};
    
    citations.forEach((id, idx) => {
      chunkIdToNumber[id] = idx + 1;
    });
    
    Object.entries(chunkIdToNumber).forEach(([chunkId, num]) => {
      const pattern = new RegExp(`\\[${chunkId}\\]`, "g");
      processed = processed.replace(pattern, `[${num}]`);
    });
    
    return processed;
  };

  return (
    <UnifiedLayout>
      <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8">
        <h1 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
          Intelligent Search
        </h1>
      </header>

      <section className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
        <div className="mx-auto max-w-5xl flex flex-col gap-6">
          {/* Intro */}
          <div className="rounded-2xl border-2 border-indigo-100 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-700 font-medium">
              🔍 Semantic + full-text hybrid search. Use <span className="font-bold text-indigo-600">Ask</span> for a grounded answer with citations.
            </p>
          </div>

          {/* Filters */}
          <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Course</label>
                <select
                  value={courseId ?? ""}
                  onChange={(e) => setCourseId(e.target.value || undefined)}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500"
                >
                  <option value="">All Courses</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Category</label>
                <select
                  value={category ?? ""}
                  onChange={(e) =>
                    setCategory(
                      e.target.value ? (e.target.value as "theory" | "lab") : undefined,
                    )
                  }
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500"
                >
                  <option value="">All</option>
                  <option value="theory">📚 Theory</option>
                  <option value="lab">🔬 Lab</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Results</label>
                <select
                  value={topK}
                  onChange={(e) => setTopK(Number(e.target.value))}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500"
                >
                  <option value={5}>5</option>
                  <option value={8}>8</option>
                  <option value={12}>12</option>
                  <option value={20}>20</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Language
                </label>
                <input
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  placeholder="e.g. python"
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Symbol
                </label>
                <input
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder="e.g. function name"
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Natural language query or question…"
              className="flex-1 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500"
            />
            <div className="flex gap-2">
              <button
                onClick={() => void onSearch()}
                disabled={!q.trim() || loading}
                className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "⏳ Searching..." : "🔍 Search"}
              </button>
              <button
                onClick={() => void onAsk()}
                disabled={!q.trim() || loading}
                className="rounded-xl border-2 border-indigo-200 bg-white px-5 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                💬 Ask (RAG)
              </button>
            </div>
          </div>

          {err && (
            <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              ⚠️ {err}
            </div>
          )}

          {/* RAG Answer */}
          {askResult && (
            <div className="space-y-4">
              <div className="rounded-2xl border-2 border-indigo-200 bg-indigo-50/50 p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-2xl">💡</span>
                  <h3 className="text-lg font-bold text-indigo-900">AI Answer</h3>
                </div>
                <div className={`prose prose-sm max-w-none text-slate-800 ${!expandedAnswer ? "max-h-64 overflow-hidden relative" : ""}`}>
                  <ReactMarkdown>
                    {processAnswerWithCitations(askResult.answer, askResult.citations)}
                  </ReactMarkdown>
                  {!expandedAnswer && (
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-indigo-50/50 to-transparent" />
                  )}
                </div>
                <button
                  onClick={() => setExpandedAnswer(!expandedAnswer)}
                  className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
                >
                  {expandedAnswer ? "↑ Show Less" : "↓ Show More"}
                </button>
              </div>

              {/* Citations */}
              {askResult.citations.length > 0 && (
                <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="text-2xl">📚</span>
                    <h3 className="text-lg font-bold text-emerald-900">
                      Citations ({askResult.citations.length})
                    </h3>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {askResult.citations.map((citationId, idx) => {
                      const citedHit = hits.find((h) => String(h.chunk_id) === String(citationId));
                      const hasMaterial = citedHit && materials.has(citedHit.material_id);
                      return (
                        <div
                          key={citationId}
                          onClick={() => citedHit && openMaterialFromCitation(citedHit.material_id)}
                          className={`rounded-xl border-2 border-emerald-100 bg-white p-4 shadow-sm ${
                            hasMaterial ? "cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all hover:-translate-y-0.5" : ""
                          }`}
                        >
                          <div className="mb-2 flex items-center gap-2">
                            <span className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                              {idx + 1}
                            </span>
                            {citedHit && (
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-bold text-slate-900 truncate flex items-center gap-1.5">
                                  {citedHit.material_title}
                                  {hasMaterial && (
                                    <i className="fas fa-external-link-alt text-[10px] text-emerald-600"></i>
                                  )}
                                </div>
                                <div className="text-xs text-slate-600">
                                  {citedHit.category === "theory" ? "📚 Theory" : "🔬 Lab"}
                                  {hasMaterial && <span className="ml-1.5 text-emerald-600 font-semibold">• Click to open</span>}
                                </div>
                              </div>
                            )}
                          </div>
                          {citedHit && (
                            <p className="line-clamp-3 text-xs leading-relaxed text-slate-600">
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
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
            </div>
          )}

          {!loading && hits.length > 0 && (
            <div className="space-y-4">
              {hits.map((h, idx) => {
                const relevance = typeof h.score === "number" ? h.score : 0;
                const relevanceColor = getRelevanceColor(relevance);
                const relevanceLabel = getRelevanceLabel(relevance);
                const isCode = Boolean(h.language);
                const isCited = citedIds.has(String(h.chunk_id));

                return (
                  <div
                    key={h.chunk_id}
                    className={`group rounded-2xl border-2 bg-white p-6 shadow-sm transition-all hover:shadow-lg ${
                      isCited ? "border-indigo-300 ring-2 ring-indigo-100" : "border-slate-200 hover:border-indigo-200"
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                            {idx + 1}
                          </span>
                          <h3 className="text-base font-bold text-slate-900">{h.material_title}</h3>
                          <span className="inline-flex flex-shrink-0 items-center rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            {h.category === "theory" ? "📚 Theory" : "🔬 Lab"}
                          </span>
                          {h.symbol_name && (
                            <span className="rounded-lg bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                              {h.symbol_name}
                            </span>
                          )}
                          {(h.start_line != null || h.end_line != null) && (
                            <span className="text-xs font-medium text-slate-600">
                              L{h.start_line ?? "?"}–{h.end_line ?? "?"}
                            </span>
                          )}
                          {isCited && (
                            <span className="rounded-lg bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                              ✓ Cited
                            </span>
                          )}
                        </div>

                        {isCode ? (
                          <div className="overflow-x-auto rounded-xl">
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
                          <p className="text-sm leading-relaxed text-slate-700">
                            {cleanMarkdown(truncateExcerpt(h.excerpt, 500))}
                          </p>
                        )}

                        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          Chunk from course material
                        </div>
                      </div>

                      <div
                        className={`flex flex-shrink-0 flex-col items-center justify-center rounded-xl p-4 ${relevanceColor}`}
                      >
                        <div className="mb-1 text-xs font-semibold uppercase">{relevanceLabel}</div>
                        <div className="text-2xl font-bold">{formatRelevance(relevance)}</div>
                        <div className="mt-1 text-xs">match</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && hits.length === 0 && q.trim() && (
            <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-12 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">No results found</h3>
              <p className="text-sm text-slate-600">
                Try a different query or ensure materials are ingested.
              </p>
            </div>
          )}

          {!loading && hits.length === 0 && !q.trim() && (
            <div className="rounded-2xl border-2 border-indigo-100 bg-indigo-50/30 p-8">
              <div className="text-4xl mb-4 text-center">⏳</div>
              <h3 className="text-lg font-bold text-indigo-900 mb-4 text-center">How It Works</h3>
              <ul className="space-y-2 text-sm text-slate-700">
                <li className="flex gap-2">
                  <span>🔹</span>
                  <span>Semantic + full-text hybrid search beyond plain keywords</span>
                </li>
                <li className="flex gap-2">
                  <span>🔹</span>
                  <span>Use <strong className="text-indigo-700">Ask (RAG)</strong> to get an AI answer grounded in course materials</span>
                </li>
                <li className="flex gap-2">
                  <span>🔹</span>
                  <span>Filter by language/symbol for syntax-aware code search</span>
                </li>
                <li className="flex gap-2">
                  <span>🔹</span>
                  <span>Ingest materials in <Link href="/admin/upload" className="font-semibold text-indigo-600 hover:text-indigo-700 underline">Admin Upload</Link> first</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </section>
    </UnifiedLayout>
  );
}
