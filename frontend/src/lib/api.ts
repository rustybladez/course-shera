export type Material = {
  id: string;
  course_id: string;
  category: "theory" | "lab";
  title: string;
  type: string;
  storage_url?: string | null;
  link_url?: string | null;
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

export type Me = { user_id: string; role: "admin" | "student" };

export type ListMaterialsFilters = {
  courseId?: string;
  category?: "theory" | "lab";
  type?: string;
  week?: number;
  topic?: string;
  tags?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function headers(json: boolean, token?: string): Record<string, string> {
  const h: Record<string, string> = {};
  if (json) h["content-type"] = "application/json";
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

async function apiFetch<T>(
  path: string,
  init?: RequestInit,
  token?: string,
): Promise<T> {
  const isJson = init?.body != null && typeof init.body === "string" && !(init.body instanceof FormData);
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.headers as Record<string, string>),
      ...headers(!!isJson, token),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const j = await res.json();
      msg = (j?.detail as string) || msg;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }

  return (await res.json()) as T;
}

async function apiFetchForm(
  path: string,
  body: FormData,
  token?: string,
): Promise<unknown> {
  const h: Record<string, string> = {};
  if (token) h["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    body,
    headers: h,
    cache: "no-store",
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const j = await res.json();
      msg = (j?.detail as string) || msg;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return res.json();
}

export type AuthResponse = {
  access_token: string;
  user_id: string;
  role: string;
};

export async function signup(
  email: string,
  password: string,
  name?: string,
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
}

export async function login(
  email: string,
  password: string,
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function getMe(token?: string): Promise<Me> {
  return apiFetch<Me>("/auth/me", {}, token);
}

export async function listMaterials(
  filters?: ListMaterialsFilters,
  token?: string,
): Promise<Material[]> {
  const sp = new URLSearchParams();
  if (filters?.courseId) sp.set("course_id", filters.courseId);
  if (filters?.category) sp.set("category", filters.category);
  if (filters?.type) sp.set("type", filters.type);
  if (filters?.week != null) sp.set("week", String(filters.week));
  if (filters?.topic) sp.set("topic", filters.topic);
  if (filters?.tags) sp.set("tags", filters.tags);
  const q = sp.toString();
  return apiFetch<Material[]>(`/materials${q ? `?${q}` : ""}`, {}, token);
}

export async function getMaterial(id: string, token?: string): Promise<Material> {
  return apiFetch<Material>(`/materials/${id}`, {}, token);
}

export async function listCourses(
  token?: string,
): Promise<Array<{ id: string; title: string; code?: string | null; term?: string | null }>> {
  return apiFetch("/courses", {}, token);
}

export async function createCourse(
  input: { title: string; code?: string; term?: string },
  token?: string,
) {
  return apiFetch<{ id: string; title: string; code?: string | null; term?: string | null }>(
    "/courses",
    { method: "POST", body: JSON.stringify(input) },
    token,
  );
}

export async function uploadMaterial(
  input: {
    file: File;
    courseId: string;
    category: "theory" | "lab";
    title: string;
    type: "pdf" | "slides" | "code" | "note";
    week?: number;
    topic?: string;
    tags?: string;
  },
  token?: string,
): Promise<Material> {
  const fd = new FormData();
  fd.append("file", input.file);
  fd.append("course_id", input.courseId);
  fd.append("category", input.category);
  fd.append("title", input.title);
  fd.append("type", input.type);
  if (input.week !== undefined) fd.append("week", String(input.week));
  if (input.topic) fd.append("topic", input.topic);
  if (input.tags) fd.append("tags", input.tags);
  return apiFetchForm("/materials/upload", fd, token) as Promise<Material>;
}

export async function addLinkMaterial(
  input: {
    courseId: string;
    title: string;
    linkUrl: string;
    topic?: string;
    week?: number;
    tags?: string[];
  },
  token?: string,
): Promise<Material> {
  return apiFetch<Material>(
    "/materials/link",
    {
      method: "POST",
      body: JSON.stringify({
        course_id: input.courseId,
        title: input.title,
        link_url: input.linkUrl,
        topic: input.topic ?? null,
        week: input.week ?? null,
        tags: input.tags ?? null,
      }),
    },
    token,
  );
}

export async function updateMaterial(
  id: string,
  patch: {
    title?: string;
    category?: "theory" | "lab";
    type?: string;
    week?: number;
    topic?: string;
    tags?: string[] | null;
    link_url?: string;
  },
  token?: string,
): Promise<Material> {
  return apiFetch<Material>(
    `/materials/${id}`,
    { method: "PATCH", body: JSON.stringify(patch) },
    token,
  );
}

export async function deleteMaterial(id: string, token?: string): Promise<void> {
  await apiFetch(`/materials/${id}`, { method: "DELETE" }, token);
}

export async function ingestMaterial(
  materialId: string,
  token?: string,
): Promise<{ chunks_added: number }> {
  return apiFetch<{ chunks_added: number }>(
    `/materials/${materialId}/ingest`,
    { method: "POST" },
    token,
  );
}

/** Returns URL to fetch file with auth. Call fetch(url, { headers: { Authorization: `Bearer ${token}` } }) then blob. */
export function materialFileUrl(id: string): string {
  return `${API_URL}/materials/${id}/file`;
}

export async function search(
  query: string,
  opts?: { courseId?: string; category?: "theory" | "lab"; topK?: number },
  token?: string,
) {
  return apiFetch<{ hits: SearchHit[] }>(
    "/search",
    {
      method: "POST",
      body: JSON.stringify({
        course_id: opts?.courseId ?? null,
        query,
        category: opts?.category ?? null,
        top_k: opts?.topK ?? 8,
      }),
    },
    token,
  );
}

export async function generate(
  mode: "theory_notes" | "slides" | "lab_code",
  prompt: string,
  courseId?: string,
  token?: string,
) {
  return apiFetch<{ content_markdown: string; citations: string[]; validation?: unknown }>(
    "/generate",
    {
      method: "POST",
      body: JSON.stringify({
        course_id: courseId ?? null,
        mode,
        prompt,
      }),
    },
    token,
  );
}

export async function createThread(
  courseId?: string,
  title?: string,
  token?: string,
) {
  return apiFetch<{ id: string; course_id?: string | null; title?: string | null }>(
    "/chat/threads",
    {
      method: "POST",
      body: JSON.stringify({ course_id: courseId ?? null, title: title ?? null }),
    },
    token,
  );
}

export async function listThreadMessages(
  threadId: string,
  token?: string,
) {
  return apiFetch<Array<{ id: string; role: string; content: string; created_at: string }>>(
    `/chat/threads/${threadId}/messages`,
    {},
    token,
  );
}

export async function sendThreadMessage(
  threadId: string,
  content: string,
  token?: string,
) {
  return apiFetch<{ id: string; role: string; content: string; created_at: string }>(
    `/chat/threads/${threadId}/messages`,
    { method: "POST", body: JSON.stringify({ content }) },
    token,
  );
}
