"use client";

import { useEffect, useMemo, useState } from "react";
import { createThread, listThreadMessages, sendThreadMessage } from "@/lib/api";

type Msg = { id: string; role: string; content: string; created_at: string };

export default function ChatPage() {
  const [threadId, setThreadId] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const title = useMemo(() => "Demo chat", []);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      try {
        const t = await createThread(undefined, title);
        if (cancelled) return;
        setThreadId(t.id);
        const m = await listThreadMessages(t.id);
        if (cancelled) return;
        setMsgs(m);
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      }
    }
    void boot();
    return () => {
      cancelled = true;
    };
  }, [title]);

  async function onSend() {
    if (!threadId) return;
    const content = text.trim();
    if (!content) return;

    setLoading(true);
    setErr(null);
    setText("");
    try {
      // optimistic append
      const now = new Date().toISOString();
      setMsgs((m) => [
        ...m,
        { id: `local-${now}`, role: "user", content, created_at: now },
      ]);
      const assistant = await sendThreadMessage(threadId, content);
      setMsgs((m) => [...m, assistant]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-1px)] max-w-5xl flex-col px-6 py-10">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Chat</h2>
        <p className="mt-1 text-sm text-zinc-600">
          MVP chat (tool-calling + citations comes next).
        </p>
      </div>

      {err ? (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {err}
        </div>
      ) : null}

      <div className="mt-6 flex-1 space-y-3 overflow-auto rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        {msgs.map((m) => (
          <div key={m.id} className={m.role === "user" ? "text-right" : ""}>
            <div
              className={[
                "inline-block max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6",
                m.role === "user"
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-900",
              ].join(" ")}
            >
              {m.content}
            </div>
          </div>
        ))}
        {msgs.length === 0 ? (
          <div className="text-sm text-zinc-600">Starting chat…</div>
        ) : null}
      </div>

      <div className="mt-4 flex gap-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ask a question..."
          className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-zinc-400"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) void onSend();
          }}
        />
        <button
          onClick={() => void onSend()}
          disabled={!threadId || loading || !text.trim()}
          className="rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {loading ? "Sending…" : "Send"}
        </button>
      </div>
    </div>
  );
}

