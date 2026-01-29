"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  createCourse,
  listCourses,
  uploadMaterial,
  ingestMaterial,
  type Material,
} from "@/lib/api";

export default function AdminUploadPage() {
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>(
    [],
  );
  const [courseId, setCourseId] = useState<string>("");

  const [newTitle, setNewTitle] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newTerm, setNewTerm] = useState("");

  const [category, setCategory] = useState<"theory" | "lab">("theory");
  const [type, setType] = useState<"pdf" | "slides" | "code" | "note">("pdf");
  const [title, setTitle] = useState("");
  const [week, setWeek] = useState<string>("");
  const [topic, setTopic] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [uploaded, setUploaded] = useState<Material | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refreshCourses() {
    const c = await listCourses();
    setCourses(c.map((x) => ({ id: x.id, title: x.title })));
    if (!courseId && c[0]?.id) setCourseId(c[0].id);
  }

  useEffect(() => {
    void refreshCourses().catch((e) =>
      setErr(e instanceof Error ? e.message : String(e)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onCreateCourse() {
    setErr(null);
    setBusy(true);
    try {
      const c = await createCourse({
        title: newTitle || "Demo Course",
        code: newCode || undefined,
        term: newTerm || undefined,
      });
      await refreshCourses();
      setCourseId(c.id);
      setNewTitle("");
      setNewCode("");
      setNewTerm("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onUpload() {
    if (!file) return;
    setErr(null);
    setBusy(true);
    setUploaded(null);
    try {
      const m = await uploadMaterial({
        file,
        courseId,
        category,
        title: title || file.name,
        type,
        week: week ? Number(week) : undefined,
        topic: topic || undefined,
        tags: tags || undefined,
      });
      setUploaded(m);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onIngest() {
    if (!uploaded) return;
    setErr(null);
    setBusy(true);
    try {
      await ingestMaterial(uploaded.id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Admin Upload</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Upload a file and optionally run ingestion (chunk + embed).
          </p>
        </div>
        <Link className="text-sm underline text-zinc-700" href="/library">
          View library
        </Link>
      </div>

      {err ? (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="text-sm font-semibold">Course</div>
        <div className="grid gap-3 sm:grid-cols-3">
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
          >
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>

          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="New course title"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
          />
          <button
            onClick={() => void onCreateCourse()}
            disabled={busy}
            className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            Create course
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <input
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            placeholder="Code (optional)"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
          />
          <input
            value={newTerm}
            onChange={(e) => setNewTerm(e.target.value)}
            placeholder="Term (optional)"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
          />
          <div className="text-xs text-zinc-500 sm:self-center">
            Create once, then upload multiple materials.
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="text-sm font-semibold">Material</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as "theory" | "lab")}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
          >
            <option value="theory">Theory</option>
            <option value="lab">Lab</option>
          </select>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
          >
            <option value="pdf">PDF</option>
            <option value="slides">Slides</option>
            <option value="code">Code</option>
            <option value="note">Note</option>
          </select>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional)"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
          />
          <input
            value={week}
            onChange={(e) => setWeek(e.target.value)}
            placeholder="Week (optional)"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
          />
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Topic (optional)"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
          />
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Tags (comma-separated)"
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
          />
        </div>

        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm text-zinc-700 file:mr-4 file:rounded-xl file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-zinc-900 hover:file:bg-zinc-200"
        />

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => void onUpload()}
            disabled={busy || !courseId || !file}
            className="rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {busy ? "Working…" : "Upload"}
          </button>
          <button
            onClick={() => void onIngest()}
            disabled={busy || !uploaded}
            className="rounded-xl border border-zinc-200 bg-white px-5 py-3 text-sm font-medium hover:bg-zinc-50 disabled:opacity-60"
          >
            Ingest uploaded material
          </button>
        </div>

        {uploaded ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            Uploaded: <span className="font-mono">{uploaded.id}</span>. You can now ingest
            it and try Search/Generate.
          </div>
        ) : null}
      </div>
    </div>
  );
}

