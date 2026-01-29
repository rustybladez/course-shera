"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ingestMaterial, listMaterials, type Material } from "@/lib/api";

export default function LibraryPage() {
  const [items, setItems] = useState<Material[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setErr(null);
    try {
      setItems(await listMaterials());
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onIngest(id: string) {
    setBusyId(id);
    setErr(null);
    try {
      await ingestMaterial(id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Library</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Uploaded materials (local storage MVP).
          </p>
        </div>
        <Link
          href="/admin/upload"
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Upload
        </Link>
      </div>

      {err ? (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4">
        {items.map((m) => (
          <div
            key={m.id}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-base font-semibold">{m.title}</div>
                <div className="mt-1 text-sm text-zinc-600">
                  <span className="rounded-md bg-zinc-100 px-2 py-0.5">
                    {m.category}
                  </span>{" "}
                  <span className="ml-2 rounded-md bg-zinc-100 px-2 py-0.5">
                    {m.type}
                  </span>
                  {m.week ? (
                    <span className="ml-2 text-zinc-500">Week {m.week}</span>
                  ) : null}
                </div>
                {m.topic ? (
                  <div className="mt-2 text-sm text-zinc-500">
                    Topic: {m.topic}
                  </div>
                ) : null}
              </div>

              <div className="flex gap-2">
                <a
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
                  href={m.storage_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open file
                </a>
                <button
                  onClick={() => void onIngest(m.id)}
                  disabled={busyId === m.id}
                  className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
                >
                  {busyId === m.id ? "Ingesting…" : "Ingest"}
                </button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-600">
            No materials yet. Upload one from <Link className="underline" href="/admin/upload">Admin Upload</Link>.
          </div>
        ) : null}
      </div>
    </div>
  );
}

