import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white text-zinc-900">
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-semibold">
            Course Shera
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
            >
              Sign in
            </Link>
            <Link
              href="/library"
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              Library
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-14">
        <div className="flex flex-col gap-6">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-600 shadow-sm">
            Hackathon MVP • FastAPI • Next.js • pgvector • Gemini
          </div>

          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Course Shera
          </h1>
          <p className="max-w-2xl text-lg leading-7 text-zinc-600">
            Upload course materials, search them semantically, generate grounded
            notes/code, and chat with context. Sign in to access the library.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card
              title="Library"
              desc="Browse materials (Theory / Lab) and open files or links."
              href="/library"
            />
            <Card
              title="Search"
              desc="Natural-language semantic search over chunks."
              href="/search"
            />
            <Card
              title="Generate"
              desc="Create notes, slides, or lab code grounded in sources."
              href="/generate"
            />
            <Card
              title="Chat"
              desc="Conversational interface (MVP)."
              href="/chat"
            />
            <Card
              title="Admin Upload"
              desc="Upload materials, add links, organize, ingest."
              href="/admin/upload"
            />
          </div>

          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 shadow-sm">
            Backend API at{" "}
            <span className="font-mono text-zinc-900">
              {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}
            </span>
            . Set <span className="font-mono">GEMINI_*</span> in backend{" "}
            <span className="font-mono">.env</span>.
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({
  title,
  desc,
  href,
}: {
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <div className="text-base font-semibold">{title}</div>
        <div className="text-zinc-300 transition group-hover:text-zinc-400">
          →
        </div>
      </div>
      <div className="mt-2 text-sm leading-6 text-zinc-600">{desc}</div>
    </Link>
  );
}
