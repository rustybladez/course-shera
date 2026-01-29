export type Material = {
  id: string;
  course_id: string;
  category: "theory" | "lab";
  title: string;
  type: string;
  storage_url: string;
  week?: number | null;
  topic?: string | null;
  tags?: string[] | null;
  created_at: string;
};

export type SearchHit = {
  chunk_id: string;
  material_id: string;
  material_title: string;
  category: "theory" | "lab";
  excerpt: string;
  score: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const j = await res.json();
      msg = j?.detail || msg;
    } catch {}
    throw new Error(msg);
  }

  return (await res.json()) as T;
}

export async function listMaterials(): Promise<Material[]> {
  return apiFetch<Material[]>("/materials");
}

export async function listCourses(): Promise<Array<{ id: string; title: string; code?: string | null; term?: string | null }>> {
  return apiFetch("/courses");
}

export async function createCourse(input: { title: string; code?: string; term?: string }) {
  return apiFetch<{ id: string; title: string; code?: string | null; term?: string | null }>("/courses", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function ingestMaterial(materialId: string): Promise<{ chunks_added: number }> {
  return apiFetch<{ chunks_added: number }>(`/materials/${materialId}/ingest`, {
    method: "POST",
  });
}

export async function uploadMaterial(input: {
  file: File;
  courseId: string;
  category: "theory" | "lab";
  title: string;
  type: "pdf" | "slides" | "code" | "note" | "link";
  week?: number;
  topic?: string;
  tags?: string;
}) {
  const fd = new FormData();
  fd.append("file", input.file);
  fd.append("course_id", input.courseId);
  fd.append("category", input.category);
  fd.append("title", input.title);
  fd.append("type", input.type);
  if (input.week !== undefined) fd.append("week", String(input.week));
  if (input.topic) fd.append("topic", input.topic);
  if (input.tags) fd.append("tags", input.tags);

  const res = await fetch(`${API_URL}/materials/upload`, {
    method: "POST",
    body: fd,
    cache: "no-store",
  });
  if (!res.ok) {
    let msg = `Upload failed (${res.status})`;
    try {
      const j = await res.json();
      msg = j?.detail || msg;
    } catch {}
    throw new Error(msg);
  }
  return (await res.json()) as Material;
}

export async function search(query: string, opts?: { courseId?: string; category?: "theory" | "lab"; topK?: number }) {
  return apiFetch<{ hits: SearchHit[] }>("/search", {
    method: "POST",
    body: JSON.stringify({
      course_id: opts?.courseId ?? null,
      query,
      category: opts?.category ?? null,
      top_k: opts?.topK ?? 8,
    }),
  });
}

export async function generate(mode: "theory_notes" | "slides" | "lab_code", prompt: string, courseId?: string) {
  return apiFetch<{ content_markdown: string; citations: string[]; validation?: unknown }>("/generate", {
    method: "POST",
    body: JSON.stringify({
      course_id: courseId ?? null,
      mode,
      prompt,
    }),
  });
}

export async function createThread(courseId?: string, title?: string) {
  return apiFetch<{ id: string; course_id?: string | null; title?: string | null }>("/chat/threads", {
    method: "POST",
    body: JSON.stringify({ course_id: courseId ?? null, title: title ?? null }),
  });
}

export async function listThreadMessages(threadId: string) {
  return apiFetch<Array<{ id: string; role: string; content: string; created_at: string }>>(
    `/chat/threads/${threadId}/messages`,
  );
}

export async function sendThreadMessage(threadId: string, content: string) {
  return apiFetch<{ id: string; role: string; content: string; created_at: string }>(
    `/chat/threads/${threadId}/messages`,
    {
      method: "POST",
      body: JSON.stringify({ content }),
    },
  );
}

