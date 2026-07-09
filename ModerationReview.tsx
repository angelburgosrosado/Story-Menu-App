/*
  Screen Name: Moderation Review
  Purpose: An admin-facing detail screen to review reported content and take action.
  Version: v1.2
  Phase: Phase 10
  Date: 2026-07-08
  What changed in this revision: Audited and refined action groups and premium layout.
*/

import React from 'react';
import { Shield, ArrowLeft, AlertTriangle, CheckCircle2, EyeOff, MessageSquareWarning, Trash2 } from 'lucide-react';
import type { ReportItem } from './ModerationDashboard';

interface ModerationReviewProps {
  report: ReportItem;
  onBack: () => void;
  onAction: (reportId: string, action: 'keep_public' | 'unlist' | 'hide' | 'request_changes' | 'mark_resolved') => void;
}

export const ModerationReview: React.FC<ModerationReviewProps> = ({ report, onBack, onAction }) => {
  const getReasonLabel = (reason: string) => {
    switch(reason) {
      case 'inappropriate_content': return 'Inappropriate Content';
      case 'wrong_audience': return 'Wrong Audience Label';
      case 'plagiarism': return 'Plagiarism / IP';
      case 'harassment': return 'Harassment';
      case 'misleading': return 'Misleading / Spam';
      default: return reason;
    }
  };

  const getReasonDescription = (reason: string) => {
    switch(reason) {
      case 'inappropriate_content': return 'Contains adult themes, excessive violence, or dangerous behavior.';
      case 'wrong_audience': return 'Mislabeled age rating (e.g., adult content labeled as children\'s).';
      case 'plagiarism': return 'Uses someone else\'s work without permission or credit.';
      case 'harassment': return 'Attacks or demeans a person or group.';
      case 'misleading': return 'Deceptive content, clickbait, or unauthorized advertising.';
      default: return 'No additional description.';
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0e14] text-slate-200 flex flex-col font-sans overflow-y-auto">
      
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0c0e14]/90 backdrop-blur border-b border-slate-800 p-4 sm:p-6 flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-black text-white flex items-center gap-2">
            Review {report.targetType === 'story' ? 'Story' : 'Creator'}
          </h1>
          <div className="text-xs text-slate-500 font-mono">Report ID: {report.id}</div>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-8 max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Report Details */}
        <div className="lg:col-span-2 space-y-6">
          
          <section className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Report Reason</div>
                <h2 className="text-xl font-bold text-white mb-2">{getReasonLabel(report.reason)}</h2>
                <p className="text-sm text-slate-400 leading-relaxed">{getReasonDescription(report.reason)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-800/80">
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Reporter</div>
                <div className="font-mono text-sm text-slate-300">{report.reporterId}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Date</div>
                <div className="text-sm text-slate-300">{new Date(report.createdAt).toLocaleString()}</div>
              </div>
            </div>
          </section>

          <section className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Target Content</div>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-800 text-xs font-medium capitalize text-slate-300">
                  {report.targetType}
                </span>
                <span className="font-mono text-xs text-slate-500">{report.targetId}</span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{report.targetName}</h3>
              {report.targetType === 'story' && (
                <div className="aspect-video bg-slate-900 rounded-lg flex items-center justify-center border border-slate-800 mt-4">
                  <span className="text-slate-500 text-sm">[Story Preview Placeholder]</span>
                </div>
              )}
            </div>
          </section>

        </div>

        {/* Right Col: Actions */}
        <div className="space-y-6">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl sticky top-24">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Shield size={16} className="text-indigo-400" />
              Moderation Actions
            </h3>

            <div className="space-y-6 mt-6">
              
              {/* Safe / No Action Group */}
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Safe / No Action</div>
                <div className="space-y-3">
                  <button 
                    onClick={() => onAction(report.id, 'keep_public')}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500/50 hover:bg-indigo-500/10 text-left transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                      <Shield size={16} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-indigo-400">Approve & Keep Active</div>
                      <div className="text-xs text-slate-500">Content is acceptable, close report</div>
                    </div>
                  </button>

                  <button 
                    onClick={() => onAction(report.id, 'mark_resolved')}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-emerald-500/10 text-left transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500/20 transition-colors">
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-emerald-400">Dismiss Report</div>
                      <div className="text-xs text-slate-500">No action needed, report is invalid</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Restrict / Enforce Group */}
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Restrict / Enforce</div>
                <div className="space-y-3">
                  <button 
                    onClick={() => onAction(report.id, 'unlist')}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-amber-500/10 text-left transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:bg-amber-500/20 transition-colors">
                      <EyeOff size={16} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-amber-400">Unlist Content</div>
                      <div className="text-xs text-slate-500">Remove from public gallery</div>
                    </div>
                  </button>

                  <button 
                    onClick={() => onAction(report.id, 'request_changes')}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-amber-500/10 text-left transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 group-hover:bg-amber-500/20 transition-colors">
                      <MessageSquareWarning size={16} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-amber-400">Request Changes</div>
                      <div className="text-xs text-slate-500">Hide and message creator</div>
                    </div>
                  </button>

                  <button 
                    onClick={() => onAction(report.id, 'hide')}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-rose-900/50 hover:border-rose-500/50 hover:bg-rose-500/10 text-left transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500 group-hover:bg-rose-500/20 transition-colors">
                      <Trash2 size={16} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-rose-400">Hide & Suspend</div>
                      <div className="text-xs text-slate-500">Remove completely from platform</div>
                    </div>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

      </main>
    </div>
  );
};
