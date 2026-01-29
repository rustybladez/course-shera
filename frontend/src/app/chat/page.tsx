"use client";

import { useEffect, useMemo, useState } from "react";
import { createThread, listThreadMessages, sendThreadMessage } from "@/lib/api";
import { UnifiedLayout } from "@/components/UnifiedLayout";

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
    <UnifiedLayout>
      <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8">
        <h1 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
          Chat Assistant
        </h1>
      </header>

      <section className="flex-1 overflow-hidden bg-slate-50/50 flex flex-col p-8">
        <div className="mx-auto w-full max-w-4xl flex flex-col h-full gap-4">
          {/* Info banner */}
          <div className="rounded-2xl border-2 border-indigo-100 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-700 font-medium">
              💬 Ask questions and get answers. <span className="text-slate-600">(Tool-calling + citations coming next)</span>
            </p>
          </div>

          {err && (
            <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              ⚠️ {err}
            </div>
          )}

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm">
            <div className="space-y-4">
              {msgs.map((m) => (
                <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={[
                      "inline-block max-w-[85%] rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm",
                      m.role === "user"
                        ? "bg-indigo-600 text-white"
                        : "bg-slate-100 text-slate-900 border-2 border-slate-200",
                    ].join(" ")}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {msgs.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Start a Conversation</h3>
                  <p className="text-sm text-slate-600">
                    Ask me anything about your courses!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Input area */}
          <div className="flex gap-3">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-indigo-500"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void onSend();
                }
              }}
            />
            <button
              onClick={() => void onSend()}
              disabled={!threadId || loading || !text.trim()}
              className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "⏳" : "📤"} {loading ? "Sending..." : "Send"}
            </button>
          </div>
        </div>
      </section>
    </UnifiedLayout>
  );
}
