import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 via-white to-slate-50 text-slate-900">
      {/* Navbar */}
      <header className="fixed top-0 z-50 w-full border-b border-white/50 bg-white/60 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-slate-900">
            <span className="text-2xl">🎓</span>
            <span>Course Shera</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/library"
              className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-indigo-300 hover:-translate-y-0.5"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-16">
        {/* Hero Section */}
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-indigo-700 animate-fade-in-up">
              <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
              AI-Powered Learning Platform
            </div>
            
            <h1 className="text-balance text-5xl font-extrabold tracking-tight text-slate-900 sm:text-7xl animate-fade-in-up [animation-delay:100ms]">
              Supercharge Your <br />
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Academic Courses
              </span>
            </h1>
            
            <p className="mt-6 text-lg leading-8 text-slate-600 animate-fade-in-up [animation-delay:200ms]">
              Upload course materials, search them semantically, generate grounded study notes, slides, and code labs, and chat with an AI context-aware assistant.
            </p>

            <div className="mt-10 flex items-center justify-center gap-x-6 animate-fade-in-up [animation-delay:300ms]">
              <Link
                href="/library"
                className="rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-indigo-300 hover:-translate-y-1"
              >
                Browse Library
              </Link>
              <Link
                href="/login"
                className="group flex items-center gap-2 text-base font-semibold leading-6 text-slate-900 transition-colors hover:text-indigo-600"
              >
                Teacher Login <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="mx-auto mt-24 max-w-7xl animate-fade-in-up [animation-delay:400ms]">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <FeatureCard
                icon="fa-book"
                color="text-blue-600"
                bgColor="bg-blue-50"
                title="Smart Library"
                desc="Organize theories, labs, and slides. Filter by week, topic, or tags instantly."
                href="/library"
              />
              <FeatureCard
                icon="fa-magnifying-glass"
                color="text-indigo-600"
                bgColor="bg-indigo-50"
                title="Semantic Search"
                desc="Don't just keyword match. Find concepts and code snippets by meaning."
                href="/search"
              />
              <FeatureCard
                icon="fa-wand-magic-sparkles"
                color="text-purple-600"
                bgColor="bg-purple-50"
                title="AI Generator"
                desc="Turn course content into summarized notes, presentation slides, and lab code automatically."
                href="/generate"
              />
              <FeatureCard
                icon="fa-comments"
                color="text-emerald-600"
                bgColor="bg-emerald-50"
                title="Context Chat"
                desc="Ask questions and get answers grounded in your specific course materials."
                href="/chat"
              />
              <FeatureCard
                icon="fa-upload"
                color="text-slate-600"
                bgColor="bg-slate-100"
                title="Admin Ingest"
                desc="Upload PDFs, create links, and ingest content into the vector database."
                href="/admin/upload"
              />
              <div className="group relative overflow-hidden rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-8 transition-all hover:bg-slate-100">
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="rounded-full bg-slate-200 p-3 mb-4">
                    <i className="fa-solid fa-plus text-xl text-slate-500"></i>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">More Coming Soon</h3>
                  <p className="mt-2 text-sm text-slate-600">Flashcards, quizzes, and more.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tech Stack Banner */}
          <div className="mt-32 border-t border-indigo-100 pt-10 text-center animate-fade-in">
            <p className="text-sm font-semibold uppercase tracking-widest text-slate-400 mb-8">
              Powered by modern tech stack
            </p>
            <div className="flex flex-wrap justify-center gap-x-12 gap-y-8 grayscale opacity-60">
               <TechBadge name="Next.js 16" />
               <TechBadge name="FastAPI" />
               <TechBadge name="PostgreSQL + pgvector" />
               <TechBadge name="Google Gemini 2.0" />
               <TechBadge name="Tailwind CSS v4" />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-col items-center justify-between gap-6 md:flex-row">
          <p className="text-sm text-slate-500">
            &copy; 2026 Course Shera. BUET Hackathon Project.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-slate-400 hover:text-slate-600"><i className="fa-brands fa-github text-xl"></i></Link>
            <Link href="#" className="text-slate-400 hover:text-slate-600"><i className="fa-brands fa-twitter text-xl"></i></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  color,
  bgColor,
  title,
  desc,
  href,
}: {
  icon: string;
  color: string;
  bgColor: string;
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-3xl border-2 border-slate-200 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100"
    >
      <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${bgColor} ${color} transition-transform duration-300 group-hover:scale-110`}>
        <i className={`fa-solid ${icon} text-2xl`}></i>
      </div>
      <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
        {title}
      </h3>
      <p className="mt-3 text-base leading-relaxed text-slate-600">
        {desc}
      </p>
      <div className="mt-6 flex items-center text-sm font-semibold text-indigo-600 opacity-0 transition-all duration-300 group-hover:translate-x-2 group-hover:opacity-100">
        Explore <i className="fa-solid fa-arrow-right ml-2"></i>
      </div>
    </Link>
  );
}

function TechBadge({ name }: { name: string }) {
  return (
    <div className="text-lg font-bold text-slate-500 hover:text-indigo-600 transition-colors cursor-default">
      {name}
    </div>
  );
}
