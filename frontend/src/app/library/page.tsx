"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  listCourses,
  listMaterials,
  materialFileUrl,
  type Material,
  type ListMaterialsFilters,
} from "@/lib/api";
import { useMe } from "@/lib/use-me";
import { UnifiedLayout } from "@/components/UnifiedLayout";

export default function LibraryPage() {
  const router = useRouter();
  const { getToken, isAdmin, me, loading: meLoading } = useMe();
  const [items, setItems] = useState<Material[]>([]);
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([]);
  const [filters, setFilters] = useState<ListMaterialsFilters>({});
  const [debouncedFilters, setDebouncedFilters] = useState<ListMaterialsFilters>({});
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const abortController = useRef<AbortController | null>(null);

  // Debounce filter changes to avoid race conditions
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500); // 500ms debounce

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [filters]);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    
    // Cancel previous request
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();

    setErr(null);
    setLoading(true);
    try {
      const [mats, cs] = await Promise.all([
        listMaterials(debouncedFilters, token, abortController.current.signal),
        listCourses(token, abortController.current.signal),
      ]);
      setItems(mats);
      setCourses(cs.map((c) => ({ id: c.id, title: c.title })));
    } catch (e) {
      // Ignore abort errors (from previous requests being cancelled)
      if (e instanceof Error && e.name === "AbortError") {
        return;
      }
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedFilters]);

  useEffect(() => {
    if (meLoading) return;
    if (!me) {
      router.replace("/login");
      return;
    }
    void load();
  }, [meLoading, me, router, load]);

  async function openMaterial(m: Material) {
    if (m.link_url) {
      window.open(m.link_url, "_blank", "noopener,noreferrer");
      return;
    }
    if (!m.storage_url) return;
    const token = await getToken();
    if (!token) return;
    const url = materialFileUrl(m.id);
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to load file");
    const blob = await res.blob();
    const u = URL.createObjectURL(blob);
    window.open(u, "_blank", "noopener,noreferrer");
  }

  if (meLoading || !me) {
    return (
      <UnifiedLayout>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            <p className="mt-4 text-slate-700 font-medium">Loading...</p>
          </div>
        </div>
      </UnifiedLayout>
    );
  }

  return (
    <UnifiedLayout>
      <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8">
        <h1 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Library</h1>
      </header>

      <section className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Course Materials</h2>
            <p className="mt-2 text-slate-600 text-base">
              Browse and access theory notes, lab materials, slides, and supplementary content.
            </p>
          </div>

          {/* Filters */}
          <div className="rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Course</label>
                <select
                  value={filters.courseId ?? ""}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      courseId: e.target.value || undefined,
                    }))
                  }
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 font-medium outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">All Courses</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Category</label>
                <select
                  value={filters.category ?? ""}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      category: (e.target.value || undefined) as "theory" | "lab" | undefined,
                    }))
                  }
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 font-medium outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">All Categories</option>
                  <option value="theory">📚 Theory</option>
                  <option value="lab">🔬 Lab</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Type</label>
                <select
                  value={filters.type ?? ""}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, type: e.target.value || undefined }))
                  }
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 font-medium outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">All Types</option>
                  <option value="pdf">📄 PDF</option>
                  <option value="slides">📊 Slides</option>
                  <option value="code">💻 Code</option>
                  <option value="note">📝 Note</option>
                  <option value="link">🔗 Link</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Week</label>
                <input
                  type="number"
                  min={1}
                  value={filters.week ?? ""}
                  onChange={(e) => {
                    const v = e.target.value ? Number(e.target.value) : undefined;
                    setFilters((f) => ({ ...f, week: v }));
                  }}
                  placeholder="Any week"
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">Topic</label>
                <input
                  value={filters.topic ?? ""}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, topic: e.target.value || undefined }))
                  }
                  placeholder="Filter by topic"
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-semibold text-slate-700">Tags (comma-separated)</label>
                <input
                  value={filters.tags ?? ""}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, tags: e.target.value || undefined }))
                  }
                  placeholder="e.g. demo, week1"
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {err && (
            <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              ⚠️ {err}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((m) => (
                <div
                  key={m.id}
                  className="group rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-indigo-200 hover:shadow-lg"
                >
                  <div className="flex flex-col gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{m.title}</h3>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-lg bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                          {m.category}
                        </span>
                        <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {m.type}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                        {m.week != null && (
                          <span className="font-medium">📅 Week {m.week}</span>
                        )}
                        {m.topic && (
                          <span className="font-medium">📚 {m.topic}</span>
                        )}
                      </div>
                      {m.tags && m.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {m.tags.map((tag, i) => (
                            <span key={i} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => openMaterial(m)}
                      className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
                    >
                      {m.link_url ? "🔗 Open Link" : "📄 Open File"}
                    </button>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="col-span-full rounded-2xl border-2 border-dashed border-slate-300 bg-white p-12 text-center">
                  <div className="text-4xl mb-4">📚</div>
                  <p className="text-lg font-semibold text-slate-900 mb-2">No materials found</p>
                  <p className="text-sm text-slate-600">
                    Try adjusting your filters or ask an admin to upload content.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </UnifiedLayout>
  );
}
