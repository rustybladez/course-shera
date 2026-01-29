
import React from 'react';

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
        <div className="p-6 border-b border-indigo-900/50 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <i className="fas fa-graduation-cap text-white text-xl"></i>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight">EduGenius</span>
            <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-semibold">AI Learning Engine</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-8 overflow-y-auto mt-4">
          {/* Main Dashboard Link */}
          <div>
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
              
              <button
                disabled={true} // Placeholder for future feature
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-emerald-300/30 cursor-not-allowed opacity-50"
              >
                <i className="fas fa-flask-vial w-5"></i>
                <span className="text-sm font-medium">Hands-on Exercises</span>
              </button>
            </div>
          </div>
        </nav>
        
        <div className="p-6 border-t border-indigo-900/50">
          <div className="flex items-center gap-3 bg-indigo-900/40 p-3 rounded-xl border border-indigo-800/50">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 overflow-hidden flex items-center justify-center">
              <img src="https://picsum.photos/seed/ai-tutor/100" alt="avatar" className="opacity-80" />
            </div>
            <div className="text-sm overflow-hidden">
              <div className="font-bold truncate">Prof. Gemini</div>
              <div className="text-indigo-400 text-[10px] uppercase font-bold">Level 10 Assistant</div>
            </div>
          </div>
        </div>
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
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
               {[1,2,3].map(i => (
                 <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden">
                    <img src={`https://i.pravatar.cc/150?u=${i}`} alt="user" />
                 </div>
               ))}
            </div>
            <div className="h-6 w-[1px] bg-slate-200 mx-2"></div>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200">
              Save Session
            </button>
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
