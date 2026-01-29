"use client";

import { useState } from "react";
import { generate } from "@/lib/api";

type Mode = "theory_notes" | "slides" | "lab_code";

export default function GeneratePage() {
  const [mode, setMode] = useState<Mode>("theory_notes");
  const [prompt, setPrompt] = useState("");
  const [out, setOut] = useState<string>("");
  const [validation, setValidation] = useState<unknown>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onRun() {
    setLoading(true);
    setErr(null);
    try {
      const res = await generate(mode, prompt);
      setOut(res.content_markdown);
      setValidation(res.validation ?? null);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h2 className="text-2xl font-semibold tracking-tight">Generate</h2>
      <p className="mt-1 text-sm text-zinc-600">
        Retrieval-first generation grounded in your ingested course materials.
      </p>

      <div className="mt-6 grid gap-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="text-sm font-medium text-zinc-700">Mode</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as Mode)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 sm:w-[240px]"
          >
            <option value="theory_notes">Theory notes</option>
            <option value="slides">Slides (Markdown)</option>
            <option value="lab_code">Lab code</option>
          </select>
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Summarize RAG with an example, and include common pitfalls."
          rows={4}
          className="w-full rounded-2xl border border-zinc-200 bg-white p-4 text-sm outline-none focus:border-zinc-400"
        />

        <div className="flex items-center gap-3">
          <button
            onClick={() => void onRun()}
            disabled={!prompt.trim() || loading}
            className="rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {loading ? "Generating…" : "Generate"}
          </button>
          <div className="text-xs text-zinc-500">
            Tip: ingest at least one material first for better grounding.
          </div>
        </div>
      </div>

      {err ? (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold">Output (Markdown)</div>
          <pre className="mt-3 max-h-[520px] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-zinc-950 p-4 text-xs text-zinc-50">
            {out || "No output yet."}
          </pre>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold">Validation (MVP)</div>
          <pre className="mt-3 max-h-[520px] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-zinc-50 p-4 text-xs text-zinc-900">
            {validation ? JSON.stringify(validation, null, 2) : "No validation yet."}
          </pre>
        </div>
      </div>
    </div>
  );
}

