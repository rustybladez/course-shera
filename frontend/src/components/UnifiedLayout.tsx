import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface UnifiedLayoutProps {
  children: React.ReactNode;
}

export const UnifiedLayout: React.FC<UnifiedLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  
  const isActive = (path: string) => pathname === path;
  
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside className="w-72 bg-indigo-950 text-white flex-shrink-0 flex flex-col no-print hidden md:flex">
        <div className="p-6 border-b border-indigo-900/50">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <i className="fas fa-graduation-cap text-white text-xl"></i>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight">Course Shera</span>
              <span className="text-[10px] uppercase tracking-widest text-indigo-400 font-semibold">AI Learning Platform</span>
            </div>
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto mt-4">
          <Link
            href="/library"
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              isActive('/library')
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'text-indigo-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <i className="fas fa-book w-5"></i>
            <span className="font-medium">Library</span>
          </Link>
          
          <Link
            href="/search"
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              isActive('/search')
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'text-indigo-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <i className="fas fa-search w-5"></i>
            <span className="font-medium">Search</span>
          </Link>
          
          <Link
            href="/generate"
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              isActive('/generate')
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'text-indigo-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <i className="fas fa-magic w-5"></i>
            <span className="font-medium">Generate</span>
          </Link>
          
          <Link
            href="/chat"
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              isActive('/chat')
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'text-indigo-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <i className="fas fa-comments w-5"></i>
            <span className="font-medium">Chat</span>
          </Link>
          
          <div className="h-px bg-indigo-800/50 my-4"></div>
          
          <Link
            href="/admin/upload"
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              isActive('/admin/upload')
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'text-indigo-300 hover:bg-white/5 hover:text-white'
            }`}
          >
            <i className="fas fa-upload w-5"></i>
            <span className="font-medium">Admin Upload</span>
          </Link>
        </nav>
        
        <div className="p-6 border-t border-indigo-900/50">
          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-800/50 hover:bg-indigo-800 text-white rounded-xl transition-all font-medium"
          >
            <i className="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
};
