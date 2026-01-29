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
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-lg font-semibold">
              Course Shera
            </Link>
            <nav className="flex gap-4">
              <Link href="/library" className="text-sm font-medium text-zinc-900">
                Library
              </Link>
              <Link href="/search" className="text-sm text-zinc-500 hover:text-zinc-900">
                Search
              </Link>
              <Link href="/generate" className="text-sm text-zinc-500 hover:text-zinc-900">
                Generate
              </Link>
              <Link href="/chat" className="text-sm text-zinc-500 hover:text-zinc-900">
                Chat
              </Link>
              {isAdmin && (
                <Link href="/admin/upload" className="text-sm text-zinc-500 hover:text-zinc-900">
                  Admin
                </Link>
              )}
            </nav>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Library</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Browse course materials (Theory / Lab). Filter by course, topic, week, tags.
            </p>
          </div>

          <div className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-xs font-medium text-zinc-500">Course</label>
              <select
                value={filters.courseId ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    courseId: e.target.value || undefined,
                  }))
                }
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
              >
                <option value="">All</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500">Category</label>
              <select
                value={filters.category ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    category: (e.target.value || undefined) as "theory" | "lab" | undefined,
                  }))
                }
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
              >
                <option value="">All</option>
                <option value="theory">Theory</option>
                <option value="lab">Lab</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500">Type</label>
              <select
                value={filters.type ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, type: e.target.value || undefined }))
                }
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
              >
                <option value="">All</option>
                <option value="pdf">PDF</option>
                <option value="slides">Slides</option>
                <option value="code">Code</option>
                <option value="note">Note</option>
                <option value="link">Link</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-500">Week</label>
              <input
                type="number"
                min={1}
                value={filters.week ?? ""}
                onChange={(e) => {
                  const v = e.target.value ? Number(e.target.value) : undefined;
                  setFilters((f) => ({ ...f, week: v }));
                }}
                placeholder="Any"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-zinc-500">Topic</label>
              <input
                value={filters.topic ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, topic: e.target.value || undefined }))
                }
                placeholder="Filter by topic"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-zinc-500">Tags (comma-separated)</label>
              <input
                value={filters.tags ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, tags: e.target.value || undefined }))
                }
                placeholder="e.g. demo, week1"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
              />
            </div>
          </div>

          {err && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {err}
            </div>
          )}

          {loading ? (
            <p className="text-sm text-zinc-500">Loading…</p>
          ) : (
            <div className="grid gap-4">
              {items.map((m) => (
                <div
                  key={m.id}
                  className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-base font-semibold">{m.title}</div>
                      <div className="mt-1 flex flex-wrap gap-2 text-sm text-zinc-600">
                        <span className="rounded-md bg-zinc-100 px-2 py-0.5">
                          {m.category}
                        </span>
                        <span className="rounded-md bg-zinc-100 px-2 py-0.5">
                          {m.type}
                        </span>
                        {m.week != null && (
                          <span className="text-zinc-500">Week {m.week}</span>
                        )}
                        {m.topic && (
                          <span className="text-zinc-500">Topic: {m.topic}</span>
                        )}
                      </div>
                      {m.tags && m.tags.length > 0 && (
                        <div className="mt-2 text-xs text-zinc-500">
                          {m.tags.join(", ")}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => openMaterial(m)}
                      className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                    >
                      {m.link_url ? "Open link" : "Open file"}
                    </button>
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-600">
                  No materials match. Try different filters or ask an admin to upload
                  content.
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
