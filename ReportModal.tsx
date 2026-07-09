/*
  Screen Name: Report Modal
  Purpose: A lightweight modal for users to report inappropriate or mislabeled content/creators.
  Version: v1.2
  Phase: Phase 10
  Date: 2026-07-08
  What changed in this revision: Audited and refined capitalization and premium layout.
*/

import React, { useState } from 'react';
import { X, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';

export type ReportReason = 
  | 'inappropriate_content'
  | 'misleading'
  | 'plagiarism'
  | 'harassment'
  | 'wrong_audience';

export interface ReportModalProps {
  targetId: string;
  targetType: 'story' | 'creator';
  onClose: () => void;
  onSubmit: (targetId: string, targetType: 'story' | 'creator', reason: ReportReason, details: string) => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ targetId, targetType, onClose, onSubmit }) => {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const reasons: { id: ReportReason; label: string; description: string }[] = [
    { id: 'inappropriate_content', label: 'Inappropriate content', description: 'Contains adult themes, excessive violence, or dangerous behavior.' },
    { id: 'wrong_audience', label: 'Wrong audience label', description: 'Mislabeled age rating (e.g., adult content labeled as children\'s).' },
    { id: 'plagiarism', label: 'Plagiarism or Copyright', description: 'Uses someone else\'s work without permission or credit.' },
    { id: 'harassment', label: 'Harassment or Hate Speech', description: 'Attacks or demeans a person or group.' },
    { id: 'misleading', label: 'Misleading or Spam', description: 'Deceptive content, clickbait, or unauthorized advertising.' },
  ];

  const handleSubmit = () => {
    if (!selectedReason) return;
    setIsSubmitted(true);
    // Simulate network delay before actual submission
    setTimeout(() => {
      onSubmit(targetId, targetType, selectedReason, details);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl shadow-indigo-900/20 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Report {targetType === 'story' ? 'Story' : 'Creator'}</h2>
              <p className="text-xs text-slate-400">Help us keep the community safe.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-slate-800">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSubmitted ? (
            <div className="py-12 flex flex-col items-center justify-center text-center animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Report Submitted</h3>
              <p className="text-sm text-slate-400 max-w-xs mx-auto">
                Thank you for looking out for the community. Our moderation team will review this shortly.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select a reason</label>
                <div className="space-y-2">
                  {reasons.map((reason) => (
                    <label 
                      key={reason.id} 
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${selectedReason === reason.id ? 'bg-indigo-600/10 border-indigo-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'}`}
                    >
                      <input 
                        type="radio" 
                        name="report_reason" 
                        value={reason.id} 
                        checked={selectedReason === reason.id}
                        onChange={() => setSelectedReason(reason.id)}
                        className="mt-0.5 w-4 h-4 text-indigo-600 bg-slate-900 border-slate-700 focus:ring-indigo-600 focus:ring-2"
                      />
                      <div className="flex-1">
                        <div className={`text-sm font-bold ${selectedReason === reason.id ? 'text-indigo-400' : 'text-slate-200'}`}>
                          {reason.label}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">{reason.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Additional details (Optional)</label>
                <textarea 
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Provide any extra context..."
                  className="w-full h-24 p-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none transition-colors"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isSubmitted && (
          <div className="p-6 border-t border-slate-800/80 bg-slate-950/50 flex flex-col sm:flex-row gap-3">
            <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-white transition-colors flex-1">
              Cancel
            </button>
            <button 
              onClick={handleSubmit}
              disabled={!selectedReason}
              className={`px-6 py-3 rounded-xl font-bold text-sm transition-all flex-1 flex items-center justify-center gap-2 ${!selectedReason ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20'}`}
            >
              <AlertTriangle size={16} />
              Submit Report
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
