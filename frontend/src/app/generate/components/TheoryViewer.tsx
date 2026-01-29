
import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { jsPDF } from 'jspdf';
import { ValidationReport } from '../types';
import ValidationBadge from './ValidationBadge';

interface TheoryViewerProps {
  topic?: string;
  notes: string;
  sources?: Array<{ title: string; uri: string }>;
  validation?: ValidationReport;
}

export interface TheoryViewerHandle {
  exportPDF: () => void;
}

const TheoryViewer = forwardRef<TheoryViewerHandle, TheoryViewerProps>(({ topic, notes, sources, validation }, ref) => {
  const [isExporting, setIsExporting] = useState(false);

  const exportToPDF = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);
      let cursorY = 20;

      // Header Decoration
      doc.setFillColor(79, 70, 229);
      doc.rect(0, 0, pageWidth, 5, 'F');

      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.setTextColor(30, 41, 59); 
      doc.text(topic || "Learning Notes", margin, cursorY + 10);
      cursorY += 22;

      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184); 
      doc.text(`AI-Synthesized Learning Material • Generated ${new Date().toLocaleDateString()}`, margin, cursorY);
      cursorY += 15;

      // Divider
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, cursorY, pageWidth - margin, cursorY);
      cursorY += 12;

      // Content
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85); 
      doc.setLineHeightFactor(1.5);

      const lines = doc.splitTextToSize(notes.replace(/[#*`_]/g, ''), contentWidth);
      
      lines.forEach((line: string) => {
        if (cursorY > 270) {
          doc.addPage();
          cursorY = 20;
        }
        doc.text(line, margin, cursorY);
        cursorY += 7;
      });

      // Grounding Sources
      if (sources && sources.length > 0) {
        cursorY += 15;
        if (cursorY > 240) {
          doc.addPage();
          cursorY = 20;
        }
        
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.setTextColor(30, 41, 59);
        doc.text("Grounded Academic Sources", margin, cursorY);
        cursorY += 8;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(79, 70, 229);

        sources.forEach(source => {
          if (cursorY > 275) {
            doc.addPage();
            cursorY = 20;
          }
          doc.text(`[Ref] ${source.title}`, margin, cursorY);
          cursorY += 5;
          doc.setTextColor(148, 163, 184);
          doc.text(`URL: ${source.uri}`, margin + 5, cursorY);
          cursorY += 6;
          doc.setTextColor(79, 70, 229);
        });
      }

      doc.save(`${(topic || 'learning-notes').toLowerCase().replace(/\s+/g, '-')}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  // Expose function to parent
  useImperativeHandle(ref, () => ({
    exportPDF: exportToPDF
  }));

  return (
    <div className="space-y-8 animate-fade-in-up">
      {validation && (
        <ValidationBadge validation={validation} />
      )}
      
      <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center no-print">
          <div className="flex items-center gap-3">
             <div className="w-2 h-8 bg-indigo-500 rounded-full"></div>
             <div>
               <h3 className="font-black text-slate-800 tracking-tight">Theory Documentation</h3>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Master the concept</p>
             </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={exportToPDF}
              disabled={isExporting}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isExporting ? 'bg-indigo-100 text-indigo-600' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'}`}
            >
              <i className={`fas ${isExporting ? 'fa-circle-notch fa-spin' : 'fa-download'}`}></i>
              {isExporting ? 'Preparing...' : 'Download PDF'}
            </button>
          </div>
        </div>
        <div className="p-10 md:p-14 prose prose-indigo max-w-none">
          <h2 className="text-4xl font-black text-slate-900 mb-8 tracking-tighter leading-none">{topic}</h2>
          <div className="space-y-6 text-lg text-slate-600 leading-relaxed font-medium">
            {notes.split('\n').map((line, i) => (
              <p key={i}>
                {line.startsWith('#') ? (
                  <span className="block text-2xl font-bold text-slate-800 mt-8 mb-4 border-l-4 border-indigo-200 pl-4">{line.replace(/#/g, '').trim()}</span>
                ) : line}
              </p>
            ))}
          </div>
        </div>
      </div>

      {sources && sources.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-50 to-white rounded-[2rem] p-10 border border-indigo-100 no-print shadow-sm">
          <h4 className="text-indigo-900 font-black text-xl mb-8 flex items-center gap-3">
            <i className="fas fa-microscope text-indigo-500"></i>
            Knowledge Verification
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sources.map((source, i) => (
              <a
                key={i}
                href={source.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-4 p-5 bg-white rounded-2xl border border-indigo-50 hover:border-indigo-400 transition-all hover:shadow-xl hover:-translate-y-1"
              >
                <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex-shrink-0 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <i className="fas fa-arrow-up-right-from-square text-xs"></i>
                </div>
                <div className="overflow-hidden">
                  <div className="font-bold text-slate-800 truncate text-base mb-1">{source.title}</div>
                  <div className="text-xs text-slate-400 font-mono truncate">{source.uri}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

export default TheoryViewer;
