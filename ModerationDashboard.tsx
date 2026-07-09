/*
  Screen Name: Moderation Dashboard
  Purpose: An admin-facing queue to manage reported content and platform trust.
  Version: v1.2
  Phase: Phase 10
  Date: 2026-07-08
  What changed in this revision: Audited and refined empty states and premium layout.
*/

import React, { useState } from 'react';
import { Shield, Search, CheckCircle2, AlertTriangle } from 'lucide-react';

export interface ReportItem {
  id: string;
  targetId: string;
  targetType: 'story' | 'creator';
  targetName: string;
  reason: string;
  status: 'pending' | 'resolved' | 'escalated';
  createdAt: string;
  reporterId: string;
}

// Mock Data
export const MOCK_REPORTS: ReportItem[] = [
  {
    id: 'rep-001',
    targetId: 'story-123',
    targetType: 'story',
    targetName: 'The Dark Forest',
    reason: 'inappropriate_content',
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    reporterId: 'user-789'
  },
  {
    id: 'rep-002',
    targetId: 'story-456',
    targetType: 'story',
    targetName: 'Super Spidey Adventures',
    reason: 'plagiarism',
    status: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    reporterId: 'user-111'
  },
  {
    id: 'rep-003',
    targetId: 'creator-999',
    targetType: 'creator',
    targetName: 'SpammyBot',
    reason: 'misleading',
    status: 'resolved',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    reporterId: 'user-444'
  }
];

interface ModerationDashboardProps {
  onBack: () => void;
  onReviewReport: (reportId: string) => void;
  reports: ReportItem[];
}

export const ModerationDashboard: React.FC<ModerationDashboardProps> = ({ onBack, onReviewReport, reports }) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('pending');
  const [search, setSearch] = useState('');

  const filteredReports = reports.filter(r => {
    if (filter !== 'all' && r.status !== filter) return false;
    if (search && !r.targetName.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const getReasonLabel = (reason: string) => {
    switch(reason) {
      case 'inappropriate_content': return 'Inappropriate';
      case 'wrong_audience': return 'Wrong Audience';
      case 'plagiarism': return 'Plagiarism / IP';
      case 'harassment': return 'Harassment';
      case 'misleading': return 'Misleading / Spam';
      default: return reason;
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0e14] text-slate-200 p-4 sm:p-8 flex flex-col font-sans overflow-y-auto">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">Trust & Safety</h1>
            <p className="text-sm text-slate-400">Manage reports and content visibility.</p>
          </div>
        </div>
        <button 
          onClick={onBack}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 font-bold text-sm transition-colors text-white self-start sm:self-auto"
        >
          Exit Dashboard
        </button>
      </header>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search by target name..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>
        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 self-start">
          {(['pending', 'resolved', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-colors ${filter === f ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Queue */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col">
        {filteredReports.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-500 mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">All caught up!</h3>
            <p className="text-slate-400">No {filter === 'pending' ? 'pending ' : ''}reports need your attention right now.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Target</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Type</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Reason</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Status</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredReports.map(report => (
                  <tr key={report.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{report.targetName}</div>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">{report.targetId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-800 text-xs font-medium capitalize text-slate-300">
                        {report.targetType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-rose-400 font-medium">
                        <AlertTriangle size={14} />
                        {getReasonLabel(report.reason)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {report.status === 'pending' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-500 text-xs font-bold uppercase tracking-wide">
                          Needs Review
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 text-slate-400 text-xs font-bold uppercase tracking-wide">
                          Resolved
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => onReviewReport(report.id)}
                        className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors shadow-lg shadow-indigo-600/20"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
