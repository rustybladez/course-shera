
import React from 'react';
import Link from 'next/link';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onExportPDF: () => void;
  hasMaterials: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, onExportPDF, hasMaterials }) => {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside className="w-72 bg-indigo-950 text-white flex-shrink-0 flex flex-col no-print hidden md:flex">
        <div className="p-6 border-b border-indigo-900/50">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <i className="fas fa-graduation-cap text-white text-xl"></i>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight">Course Shera</span>
              <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-semibold">AI Learning Engine</span>
            </div>
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-8 overflow-y-auto mt-4">
          {/* Navigation Links */}
          <div className="space-y-1">
            <Link
              href="/library"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-indigo-300 hover:bg-white/5 hover:text-white"
            >
              <i className="fas fa-book w-5"></i>
              <span className="font-medium">Library</span>
            </Link>
            
            <Link
              href="/search"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-indigo-300 hover:bg-white/5 hover:text-white"
            >
              <i className="fas fa-search w-5"></i>
              <span className="font-medium">Search</span>
            </Link>
            
            <Link
              href="/chat"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-indigo-300 hover:bg-white/5 hover:text-white"
            >
              <i className="fas fa-comments w-5"></i>
              <span className="font-medium">Chat</span>
            </Link>
          </div>

          {/* Generate Module Section */}
          <div className="space-y-2">
            <h3 className="px-4 text-[11px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Generate Module</h3>
            <div className="space-y-1">
              <button
                onClick={() => onTabChange('dashboard')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === 'dashboard' 
                    ? 'bg-indigo-600 text-white shadow-lg' 
                    : 'text-indigo-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <i className="fas fa-columns w-5"></i>
                <span className="font-medium">Overview</span>
              </button>
            </div>
          </div>

          {/* Theory Section */}
          <div className="space-y-2">
            <h3 className="px-4 text-[11px] font-bold text-indigo-400 uppercase tracking-[0.2em]">Theory Module</h3>
            <div className="space-y-1">
              <button
                disabled={!hasMaterials}
                onClick={() => onTabChange('notes')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                  activeTab === 'notes' 
                    ? 'bg-indigo-800/50 text-white ring-1 ring-indigo-700/50' 
                    : 'text-indigo-300 hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed'
                }`}
              >
                <i className="fas fa-file-lines w-5 text-indigo-400"></i>
                <span className="text-sm font-medium">Reading Notes</span>
              </button>
              
              <button
                disabled={!hasMaterials}
                onClick={() => onTabChange('slides')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                  activeTab === 'slides' 
                    ? 'bg-indigo-800/50 text-white ring-1 ring-indigo-700/50' 
                    : 'text-indigo-300 hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed'
                }`}
              >
                <i className="fas fa-display w-5 text-indigo-400"></i>
                <span className="text-sm font-medium">Interactive Slides</span>
              </button>

              <button
                disabled={!hasMaterials}
                onClick={onExportPDF}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-indigo-300 hover:bg-white/5 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
              >
                <i className="fas fa-file-pdf w-5 text-rose-400 group-hover:scale-110 transition-transform"></i>
                <span className="text-sm font-medium">Export as PDF</span>
              </button>
            </div>
          </div>

          {/* Lab Section */}
          <div className="space-y-2">
            <h3 className="px-4 text-[11px] font-bold text-emerald-400 uppercase tracking-[0.2em]">Lab & Practice</h3>
            <div className="space-y-1">
              <button
                disabled={!hasMaterials}
                onClick={() => onTabChange('lab')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                  activeTab === 'lab' 
                    ? 'bg-emerald-900/40 text-white ring-1 ring-emerald-700/50' 
                    : 'text-emerald-300/70 hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed'
                }`}
              >
                <i className="fas fa-code w-5 text-emerald-400"></i>
                <span className="text-sm font-medium">Code Sandbox</span>
              </button>
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 no-print">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-slate-500">
              <i className="fas fa-bars text-xl"></i>
            </button>
            <h1 className="text-sm font-bold text-slate-400 uppercase tracking-widest">
              {activeTab === 'dashboard' ? 'Learning Dashboard' : `Module / ${activeTab}`}
            </h1>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto bg-slate-50/50">
          <div className="max-w-6xl mx-auto p-4 md:p-12 min-h-full">
            {children}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Layout;
