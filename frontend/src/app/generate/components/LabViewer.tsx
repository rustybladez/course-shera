
import React from 'react';
import { LabExercise, ValidationReport } from '../types';
import ValidationBadge from './ValidationBadge';

interface LabViewerProps {
  lab: LabExercise;
  validation?: ValidationReport;
}

const LabViewer: React.FC<LabViewerProps> = ({ lab, validation }) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {validation && (
        <ValidationBadge validation={validation} />
      )}
      
      <div className="bg-white rounded-2xl shadow-sm border p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
            <i className="fas fa-flask"></i>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{lab.title}</h2>
            <p className="text-slate-500">{lab.language} Programming Lab</p>
          </div>
        </div>
        
        <p className="text-slate-700 leading-relaxed mb-8">
          {lab.description}
        </p>

        <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-xl border border-slate-800">
          <div className="px-4 py-3 bg-slate-800 flex justify-between items-center">
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">{lab.language}</span>
          </div>
          <pre className="p-6 overflow-x-auto">
            <code className="text-emerald-400 font-mono text-sm leading-relaxed">
              {lab.code}
            </code>
          </pre>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8">
        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
          <i className="fas fa-lightbulb text-yellow-500"></i>
          Code Explanation
        </h3>
        <div className="text-slate-600 leading-relaxed space-y-4">
          {lab.explanation.split('\n').map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LabViewer;
