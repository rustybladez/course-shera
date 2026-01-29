
import React, { useState, useRef } from 'react';
import Layout from './components/Layout';
import MaterialGenerator from './components/MaterialGenerator';
import TheoryViewer, { TheoryViewerHandle } from './components/TheoryViewer';
import SlidesViewer from './components/SlidesViewer';
import LabViewer from './components/LabViewer';
// import VoiceAssistant from './components/VoiceAssistant';
import { GeminiService } from './services/geminiService';
import { LearningMaterials, AppState } from './types';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    materials: null,
    isLoading: false,
    error: null,
    isGeneratingImages: false
  });
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const theoryRef = useRef<TheoryViewerHandle>(null);

  const handleGenerate = async (prompt: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await GeminiService.generateMaterials(prompt);
      setState(prev => ({ ...prev, materials: result, isLoading: false }));
      setActiveTab('notes');
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message || 'Generation failed' }));
    }
  };

  const handleSidebarExportPDF = () => {
    // If not on notes tab, switch to it first so the ref is available, 
    // or we can store the export function more globally.
    // For simplicity, we ensure we're in 'notes' view or use a hidden component.
    if (activeTab !== 'notes') {
      setActiveTab('notes');
      // Small delay to allow ref to mount if it wasn't
      setTimeout(() => theoryRef.current?.exportPDF(), 100);
    } else {
      theoryRef.current?.exportPDF();
    }
  };

  const renderContent = () => {
    if (state.isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full py-20 text-center animate-pulse">
          <div className="relative mb-12">
            <div className="w-32 h-32 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <i className="fas fa-microchip text-indigo-600 text-3xl animate-bounce"></i>
            </div>
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">Synthesizing Education...</h2>
          <p className="text-slate-500 max-w-lg mx-auto text-lg leading-relaxed font-medium">
            Cross-referencing global knowledge bases and generating grounded theory, visual aids, and coding challenges.
          </p>
          <div className="mt-8 flex gap-2">
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></span>
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></span>
          </div>
        </div>
      );
    }

    if (!state.materials || activeTab === 'dashboard') {
      return (
        <div className="space-y-12">
          <div className="animate-fade-in-up">
            <MaterialGenerator onGenerate={handleGenerate} isGenerating={state.isLoading} />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex-shrink-0 flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <i className="fas fa-globe-americas text-xl"></i>
              </div>
              <h4 className="font-bold text-slate-800 text-lg mb-2">Web Grounded</h4>
              <p className="text-sm text-slate-500 leading-relaxed">Verified against real-time academic sources and documentation via Google Search integration.</p>
            </div>
            
            <div className="group bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex-shrink-0 flex items-center justify-center mb-6 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <i className="fas fa-brain text-xl"></i>
              </div>
              <h4 className="font-bold text-slate-800 text-lg mb-2">Reasoning Core</h4>
              <p className="text-sm text-slate-500 leading-relaxed">Uses Gemini 3 Pro with deep-thinking capabilities to explain complex logical concepts clearly.</p>
            </div>

            <div className="group bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex-shrink-0 flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <i className="fas fa-code-branch text-xl"></i>
              </div>
              <h4 className="font-bold text-slate-800 text-lg mb-2">Practice Ready</h4>
              <p className="text-sm text-slate-500 leading-relaxed">Automatically generates syntactically correct code labs and exercises for immediate practical application.</p>
            </div>
          </div>

          {state.error && (
            <div className="p-6 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-center font-bold shadow-sm animate-shake">
              <i className="fas fa-triangle-exclamation mr-3"></i>
              {state.error}
            </div>
          )}
        </div>
      );
    }

    switch (activeTab) {
      case 'notes':
        return <TheoryViewer ref={theoryRef} topic={state.materials.topic} notes={state.materials.readingNotes} sources={state.materials.groundingSources} />;
      case 'slides':
        return <SlidesViewer slides={state.materials.slides} />;
      case 'lab':
        return <LabViewer lab={state.materials.lab} />;
      default:
        return null;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab} 
      onExportPDF={handleSidebarExportPDF}
      hasMaterials={!!state.materials}
    >
      {renderContent()}
      
    </Layout>
  );
};

export default App;
