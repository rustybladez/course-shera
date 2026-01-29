"use client";

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
import { UnifiedLayout } from "@/components/UnifiedLayout";

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
      <UnifiedLayout>
        <div className="flex items-center justify-center h-full">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
        </div>
      </UnifiedLayout>
    );
  }

  if (!isAdmin) return null;

  return (
    <UnifiedLayout>
      <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8">
        <h1 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
          Admin Panel
        </h1>
      </header>

      <section className="flex-1 overflow-y-auto bg-slate-50/50 p-8">
        <div className="mx-auto max-w-4xl flex flex-col gap-6">
          <div className="rounded-2xl border-2 border-indigo-100 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Admin CMS</h2>
            <p className="mt-2 text-sm text-slate-700">
              ⚙️ Create courses, upload materials, add links, edit metadata, and ingest documents.
            </p>
          </div>

          {err && (
            <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              ⚠️ {err}
            </div>
          )}

          <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">📚 Course Management</h3>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Select Course</label>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">New Course Title</label>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Course title"
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => void onCreateCourse()}
                  disabled={busy}
                  className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  ➕ Create Course
                </button>
              </div>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Course Code</label>
                <input
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="e.g. CSE101"
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Term</label>
                <input
                  value={newTerm}
                  onChange={(e) => setNewTerm(e.target.value)}
                  placeholder="e.g. Fall 2024"
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">📄 Upload File</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as "theory" | "lab")}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500"
                >
                  <option value="theory">📚 Theory</option>
                  <option value="lab">🔬 Lab</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as "pdf" | "slides" | "code" | "note")}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500"
                >
                  <option value="pdf">📄 PDF</option>
                  <option value="slides">📊 Slides</option>
                  <option value="code">💻 Code</option>
                  <option value="note">📝 Note</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Optional title"
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Week</label>
                <input
                  value={week}
                  onChange={(e) => setWeek(e.target.value)}
                  placeholder="Week number"
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Topic</label>
                <input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Topic name"
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Tags</label>
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="comma, separated"
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Select File</label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
              />
            </div>
            <div className="mt-4 flex gap-3 items-center">
              <button
                onClick={() => void onUpload()}
                disabled={busy || !courseId || !file}
                className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {busy ? "⏳ Uploading..." : "📤 Upload"}
              </button>
              {uploaded && (
                <span className="text-sm font-medium text-emerald-600">
                  ✓ Uploaded successfully! Ingest from list below.
                </span>
              )}
            </div>
          </div>

          <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">🔗 Add Link</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Title *</label>
                <input
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  placeholder="Link title"
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">URL *</label>
                <input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Topic</label>
                <input
                  value={linkTopic}
                  onChange={(e) => setLinkTopic(e.target.value)}
                  placeholder="Optional"
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Week</label>
                <input
                  value={linkWeek}
                  onChange={(e) => setLinkWeek(e.target.value)}
                  placeholder="Week number"
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Tags</label>
                <input
                  value={linkTags}
                  onChange={(e) => setLinkTags(e.target.value)}
                  placeholder="comma, separated"
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500"
                />
              </div>
            </div>
            <button
              onClick={() => void onAddLink()}
              disabled={busy || !courseId || !linkTitle || !linkUrl}
              className="mt-4 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ➕ Add Link
            </button>
          </div>

          <div className="rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-4">📚 Materials ({materials.length})</h3>
            <div className="space-y-3">
              {materials.map((m) => (
                <div
                  key={m.id}
                  className="rounded-xl border-2 border-slate-200 bg-slate-50/50 p-4 transition-all hover:border-indigo-200 hover:shadow-sm"
                >
                  {editId === m.id ? (
                    <>
                      <div className="flex flex-wrap gap-2 mb-3">
                        <input
                          value={editForm.title}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, title: e.target.value }))
                          }
                          placeholder="Title"
                          className="flex-1 min-w-[200px] rounded-lg border-2 border-slate-200 px-3 py-2 text-sm text-slate-900"
                        />
                        <input
                          value={editForm.topic}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, topic: e.target.value }))
                          }
                          placeholder="Topic"
                          className="flex-1 min-w-[150px] rounded-lg border-2 border-slate-200 px-3 py-2 text-sm text-slate-900"
                        />
                        <input
                          value={editForm.week}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, week: e.target.value }))
                          }
                          placeholder="Week"
                          className="w-20 rounded-lg border-2 border-slate-200 px-3 py-2 text-sm text-slate-900"
                        />
                        <input
                          value={editForm.tags}
                          onChange={(e) =>
                            setEditForm((f) => ({ ...f, tags: e.target.value }))
                          }
                          placeholder="Tags"
                          className="flex-1 min-w-[150px] rounded-lg border-2 border-slate-200 px-3 py-2 text-sm text-slate-900"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => void onUpdate()}
                          disabled={busy}
                          className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
                        >
                          ✓ Save
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          className="rounded-lg border-2 border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          ✕ Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex-1 min-w-[200px]">
                        <div className="font-bold text-slate-900">{m.title}</div>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-lg bg-indigo-100 px-2 py-0.5 font-semibold text-indigo-700">
                            {m.category}
                          </span>
                          <span className="rounded-lg bg-slate-200 px-2 py-0.5 font-semibold text-slate-700">
                            {m.type}
                          </span>
                          {m.week != null && (
                            <span className="text-slate-600 font-medium">Week {m.week}</span>
                          )}
                          {m.topic && (
                            <span className="text-slate-600 font-medium">• {m.topic}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(m)}
                          className="rounded-lg border-2 border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          ✏️ Edit
                        </button>
                        {m.type !== "link" && (
                          <button
                            onClick={() => void onIngest(m)}
                            disabled={ingestId != null}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                          >
                            {ingestId === m.id ? "⏳ Ingesting..." : "🔄 Ingest"}
                          </button>
                        )}
                        <button
                          onClick={() => void onDelete(m)}
                          disabled={busy}
                          className="rounded-lg border-2 border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {materials.length === 0 && (
                <div className="rounded-xl border-2 border-dashed border-slate-300 bg-white p-8 text-center">
                  <div className="text-4xl mb-2">📚</div>
                  <p className="text-sm font-medium text-slate-900 mb-1">No materials yet</p>
                  <p className="text-sm text-slate-600">Upload a file or add a link to get started.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </UnifiedLayout>
  );
}
