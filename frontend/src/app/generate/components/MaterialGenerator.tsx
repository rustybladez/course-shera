
import React, { useState } from 'react';

interface MaterialGeneratorProps {
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
}

const MaterialGenerator: React.FC<MaterialGeneratorProps> = ({ onGenerate, isGenerating }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onGenerate(prompt);
    }
  };

  const suggestions = [
    "Quantum Computing Basics",
    "Modern Web Accessibility",
    "Principles of Macroeconomics",
    "Introduction to Rust Programming"
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-8 max-w-3xl mx-auto text-center">
      <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <i className="fas fa-magic text-2xl"></i>
      </div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">What would you like to learn today?</h2>
      <p className="text-slate-500 mb-8">Enter a topic and our AI will generate reading notes, slides, and code labs for you.</p>
      
      <form onSubmit={handleSubmit} className="relative mb-6">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., Deep Learning Architecture"
          disabled={isGenerating}
          className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-lg text-slate-900 placeholder:text-slate-400"
        />
        <button
          type="submit"
          disabled={isGenerating || !prompt.trim()}
          className="absolute right-2 top-2 bottom-2 px-6 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-slate-300 transition-colors flex items-center gap-2"
        >
          {isGenerating ? (
            <i className="fas fa-circle-notch fa-spin"></i>
          ) : (
            <i className="fas fa-sparkles"></i>
          )}
          Generate
        </button>
      </form>

      <div className="flex flex-wrap justify-center gap-2">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => setPrompt(s)}
            className="px-3 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-500 rounded-full text-sm transition-colors"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MaterialGenerator;
