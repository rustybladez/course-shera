import React, { useState } from 'react';
import { ValidationReport } from '../types';

interface ValidationBadgeProps {
  validation: ValidationReport;
  compact?: boolean;
}

const ValidationBadge: React.FC<ValidationBadgeProps> = ({ validation, compact = false }) => {
  const [expanded, setExpanded] = useState(false);

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'PASS':
        return 'bg-emerald-50 border-emerald-200 text-emerald-700';
      case 'REVIEW':
        return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'FAIL':
        return 'bg-rose-50 border-rose-200 text-rose-700';
      default:
        return 'bg-slate-50 border-slate-200 text-slate-700';
    }
  };

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'PASS':
        return '✅';
      case 'REVIEW':
        return '⚠️';
      case 'FAIL':
        return '❌';
      default:
        return '🔍';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-emerald-600';
    if (score >= 0.6) return 'text-amber-600';
    return 'text-rose-600';
  };

  if (compact) {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold ${getVerdictColor(validation.verdict)} cursor-pointer hover:shadow-md transition-all`}
        onClick={() => setExpanded(!expanded)}
      >
        <span>{getVerdictIcon(validation.verdict)}</span>
        <span>Quality: {validation.verdict}</span>
        <span className={`${getScoreColor(validation.final_score)}`}>
          {(validation.final_score * 100).toFixed(0)}%
        </span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-sm">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">{getVerdictIcon(validation.verdict)}</span>
          <div>
            <h3 className="text-lg font-bold text-slate-800">Content Validation</h3>
            <p className="text-sm text-slate-600">Multi-layer quality check</p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-black ${getScoreColor(validation.final_score)}`}>
            {(validation.final_score * 100).toFixed(0)}%
          </div>
          <div className={`text-xs font-semibold ${getVerdictColor(validation.verdict)} px-3 py-1 rounded-full inline-block mt-1`}>
            {validation.verdict}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="mt-6 space-y-4 animate-fade-in">
          {/* Score Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="text-xs text-slate-600 mb-1">Syntax</div>
              <div className={`text-2xl font-bold ${getScoreColor(validation.syntax_score)}`}>
                {(validation.syntax_score * 100).toFixed(0)}%
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="text-xs text-slate-600 mb-1">Grounding</div>
              <div className={`text-2xl font-bold ${getScoreColor(validation.grounding_score)}`}>
                {(validation.grounding_score * 100).toFixed(0)}%
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="text-xs text-slate-600 mb-1">Structure</div>
              <div className={`text-2xl font-bold ${getScoreColor(validation.rubric_score)}`}>
                {(validation.rubric_score * 100).toFixed(0)}%
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-3">
              <div className="text-xs text-slate-600 mb-1">AI Quality</div>
              <div className={`text-2xl font-bold ${getScoreColor(validation.ai_eval_score)}`}>
                {(validation.ai_eval_score * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Notes */}
          {validation.notes && validation.notes.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-semibold text-slate-700">Quality Notes:</div>
              {validation.notes.map((note, idx) => (
                <div key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                  <span className="mt-0.5">•</span>
                  <span>{note}</span>
                </div>
              ))}
            </div>
          )}

          {/* AI Explanation */}
          {validation.ai_explanation && (
            <div className="border-t border-slate-200 pt-4">
              <div className="text-sm font-semibold text-slate-700 mb-2">AI Evaluator:</div>
              <div className="text-sm text-slate-600 leading-relaxed bg-indigo-50/50 p-3 rounded-lg">
                {validation.ai_explanation}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ValidationBadge;
