"use client";

import { useState } from "react";
import { search, type SearchHit } from "@/lib/api";

export default function SearchPage() {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSearch() {
    setLoading(true);
    setErr(null);
    try {
      const res = await search(q);
      setHits(res.hits);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h2 className="text-2xl font-semibold tracking-tight">Search</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Semantic search over ingested chunks (pgvector).
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. explain RAG and why it reduces hallucination"
          className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-400"
        />
        <button
          onClick={() => void onSearch()}
          disabled={!q.trim() || loading}
          className="rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </div>

      {err ? (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4">
        {hits.map((h) => (
          <div
            key={h.chunk_id}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm font-semibold">{h.material_title}</div>
              <div className="text-xs text-zinc-500">
                score {h.score.toFixed(3)}
              </div>
            </div>
            <div className="mt-2 text-sm leading-6 text-zinc-700">
              {h.excerpt}
            </div>
          </div>
        ))}
        {hits.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-600">
            No results yet. Upload + ingest a material first.
          </div>
        ) : null}
      </div>
    </div>
  );
}

