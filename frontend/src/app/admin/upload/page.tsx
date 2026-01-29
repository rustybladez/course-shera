"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  addLinkMaterial,
  createCourse,
  deleteMaterial,
  ingestMaterial,
  listCourses,
  listMaterials,
  updateMaterial,
  uploadMaterial,
  type Material,
} from "@/lib/api";
import { useMe } from "@/lib/use-me";
import { LogoutButton } from "@/components/LogoutButton";

export default function AdminUploadPage() {
  const router = useRouter();
  const { getToken, isAdmin, me, loading: meLoading } = useMe();
  const [courses, setCourses] = useState<Array<{ id: string; title: string }>>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [courseId, setCourseId] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newCode, setNewCode] = useState("");
  const [newTerm, setNewTerm] = useState("");
  const [category, setCategory] = useState<"theory" | "lab">("theory");
  const [type, setType] = useState<"pdf" | "slides" | "code" | "note">("pdf");
  const [title, setTitle] = useState("");
  const [week, setWeek] = useState("");
  const [topic, setTopic] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploaded, setUploaded] = useState<Material | null>(null);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTopic, setLinkTopic] = useState("");
  const [linkWeek, setLinkWeek] = useState("");
  const [linkTags, setLinkTags] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", topic: "", week: "", tags: "" });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [ingestId, setIngestId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    setErr(null);
    try {
      const [cs, mats] = await Promise.all([
        listCourses(token),
        listMaterials({}, token),
      ]);
      setCourses(cs.map((c) => ({ id: c.id, title: c.title })));
      setMaterials(mats);
      setCourseId((prev) => (prev || cs[0]?.id) ?? "");
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (meLoading || !me) return;
    if (!isAdmin) {
      router.replace("/library");
      return;
    }
    void load();
  }, [meLoading, me, isAdmin, router, load]);

  async function onCreateCourse() {
    const token = await getToken();
    if (!token) return;
    setErr(null);
    setBusy(true);
    try {
      const c = await createCourse(
        { title: newTitle || "Demo Course", code: newCode || undefined, term: newTerm || undefined },
        token,
      );
      await load();
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
    if (!file || !courseId) return;
    const token = await getToken();
    if (!token) return;
    setErr(null);
    setBusy(true);
    setUploaded(null);
    try {
      const m = await uploadMaterial(
        {
          file,
          courseId,
          category,
          title: title || file.name,
          type,
          week: week ? Number(week) : undefined,
          topic: topic || undefined,
          tags: tags || undefined,
        },
        token,
      );
      setUploaded(m);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onAddLink() {
    if (!courseId || !linkTitle || !linkUrl) return;
    const token = await getToken();
    if (!token) return;
    setErr(null);
    setBusy(true);
    try {
      await addLinkMaterial(
        {
          courseId,
          title: linkTitle,
          linkUrl,
          topic: linkTopic || undefined,
          week: linkWeek ? Number(linkWeek) : undefined,
          tags: linkTags ? linkTags.split(",").map((t) => t.trim()) : undefined,
        },
        token,
      );
      setLinkTitle("");
      setLinkUrl("");
      setLinkTopic("");
      setLinkWeek("");
      setLinkTags("");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onIngest(m: Material) {
    if (m.type === "link") return;
    const token = await getToken();
    if (!token) return;
    setErr(null);
    setIngestId(m.id);
    try {
      await ingestMaterial(m.id, token);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setIngestId(null);
    }
  }

  async function onUpdate() {
    if (!editId) return;
    const token = await getToken();
    if (!token) return;
    setErr(null);
    setBusy(true);
    try {
      await updateMaterial(
        editId,
        {
          title: editForm.title || undefined,
          topic: editForm.topic || undefined,
          week: editForm.week ? Number(editForm.week) : undefined,
          tags: editForm.tags ? editForm.tags.split(",").map((t) => t.trim()) : undefined,
        },
        token,
      );
      setEditId(null);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(m: Material) {
    if (!confirm(`Delete "${m.title}"?`)) return;
    const token = await getToken();
    if (!token) return;
    setErr(null);
    setBusy(true);
    try {
      await deleteMaterial(m.id, token);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function startEdit(m: Material) {
    setEditId(m.id);
    setEditForm({
      title: m.title,
      topic: m.topic ?? "",
      week: m.week != null ? String(m.week) : "",
      tags: m.tags?.join(", ") ?? "",
    });
  }

  if (meLoading || !me) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-zinc-500">Loading…</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-lg font-semibold">
              Course Shera
            </Link>
            <nav className="flex gap-4">
              <Link href="/library" className="text-sm text-zinc-500 hover:text-zinc-900">
                Library
              </Link>
              <Link href="/admin/upload" className="text-sm font-medium text-zinc-900">
                Admin
              </Link>
            </nav>
          </div>
          <LogoutButton />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Admin CMS</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Create courses, upload materials, add links, edit metadata, ingest.
            </p>
          </div>
          <Link className="text-sm font-medium text-zinc-700 underline" href="/library">
            View library
          </Link>
        </div>

        {err && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {err}
          </div>
        )}

        <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold">Course</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
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
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold">Upload file</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
              onChange={(e) => setType(e.target.value as "pdf" | "slides" | "code" | "note")}
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
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="mt-3 block w-full text-sm text-zinc-700 file:mr-4 file:rounded-xl file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-zinc-900 hover:file:bg-zinc-200"
          />
          <div className="mt-3 flex gap-3">
            <button
              onClick={() => void onUpload()}
              disabled={busy || !courseId || !file}
              className="rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              {busy ? "Uploading…" : "Upload"}
            </button>
            {uploaded && (
              <span className="self-center text-sm text-emerald-600">
                Uploaded. Ingest from list below.
              </span>
            )}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold">Add link</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <input
              value={linkTitle}
              onChange={(e) => setLinkTitle(e.target.value)}
              placeholder="Title *"
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            />
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="URL *"
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            />
            <input
              value={linkTopic}
              onChange={(e) => setLinkTopic(e.target.value)}
              placeholder="Topic (optional)"
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            />
            <input
              value={linkWeek}
              onChange={(e) => setLinkWeek(e.target.value)}
              placeholder="Week (optional)"
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            />
            <input
              value={linkTags}
              onChange={(e) => setLinkTags(e.target.value)}
              placeholder="Tags (comma-separated)"
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400 sm:col-span-2"
            />
          </div>
          <button
            onClick={() => void onAddLink()}
            disabled={busy || !courseId || !linkTitle || !linkUrl}
            className="mt-3 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            Add link
          </button>
        </section>

        <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold">Materials</h3>
          <div className="mt-3 space-y-3">
            {materials.map((m) => (
              <div
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-100 p-3"
              >
                {editId === m.id ? (
                  <>
                    <div className="flex flex-1 flex-wrap gap-2">
                      <input
                        value={editForm.title}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, title: e.target.value }))
                        }
                        placeholder="Title"
                        className="rounded-lg border border-zinc-200 px-2 py-1 text-sm"
                      />
                      <input
                        value={editForm.topic}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, topic: e.target.value }))
                        }
                        placeholder="Topic"
                        className="rounded-lg border border-zinc-200 px-2 py-1 text-sm"
                      />
                      <input
                        value={editForm.week}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, week: e.target.value }))
                        }
                        placeholder="Week"
                        className="w-16 rounded-lg border border-zinc-200 px-2 py-1 text-sm"
                      />
                      <input
                        value={editForm.tags}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, tags: e.target.value }))
                        }
                        placeholder="Tags"
                        className="rounded-lg border border-zinc-200 px-2 py-1 text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => void onUpdate()}
                        disabled={busy}
                        className="rounded-lg bg-zinc-900 px-3 py-1 text-xs font-medium text-white"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditId(null)}
                        className="rounded-lg border border-zinc-200 px-3 py-1 text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <span className="font-medium">{m.title}</span>
                      <span className="ml-2 text-xs text-zinc-500">
                        {m.category} · {m.type}
                        {m.week != null ? ` · Week ${m.week}` : ""}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(m)}
                        className="rounded-lg border border-zinc-200 px-3 py-1 text-xs hover:bg-zinc-50"
                      >
                        Edit
                      </button>
                      {m.type !== "link" && (
                        <button
                          onClick={() => void onIngest(m)}
                          disabled={ingestId != null}
                          className="rounded-lg bg-zinc-900 px-3 py-1 text-xs font-medium text-white disabled:opacity-60"
                        >
                          {ingestId === m.id ? "Ingesting…" : "Ingest"}
                        </button>
                      )}
                      <button
                        onClick={() => void onDelete(m)}
                        disabled={busy}
                        className="rounded-lg border border-red-200 px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {materials.length === 0 && (
              <p className="text-sm text-zinc-500">No materials yet. Upload or add a link.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
