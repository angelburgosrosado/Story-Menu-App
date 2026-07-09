/*
  Screen Name: Workspace Overview
  Purpose: Post-onboarding landing view inside the authenticated workspace. Shows a calm,
           well-organised summary of the project setup with quick-action cards and guidance
           on what to do next.
  Version: v1.1
  Phase: Phase 2
  Date: 2026-07-08
  What changed in this revision: Audit pass. Tightened guidance banner copy. Replaced
           audience-tag placeholder pills with actual content. Removed placeholder "helper
           text" that read as internal. Improved card spacing and typographic hierarchy.
           Removed the unused "Target Audience" card (no data to populate it). Tightened
           quick-action card descriptions. Improved Recent Activity empty state.
*/

import React from 'react';
import {
  BookOpen, Globe, Palette, Volume2, Zap, CheckCircle,
  ArrowRight, Target, Layers, Star, Clock, FileText, Users
} from 'lucide-react';

interface WorkspaceOverviewProps {
  projectTitle: string;
  projectType: string;
  selectedGenre: string;
  selectedStyle: string;
  selectedLanguage: string;
  customPremise: string;
  storyGoal: string;
  selectedVoice: string;
  soundtrackEnabled: boolean;
  comicFacesCount: number;
  approvedCount: number;
  totalPages: number;
  recentActivity: string[];
  onNavigateTo: (section: string) => void;
  onGenerateFirstScene: () => void;
}

const STYLE_LABELS: Record<string, string> = {
  storybook:   'Storybook Illustration',
  crayon:      'Crayon Drawing',
  popup:       'Pop-Up Book',
  claymation:  'Claymation',
  noir:        'Noir Inks',
  watercolor:  'Watercolor',
  manga:       'Manga Style',
};

const LANGUAGE_LABELS: Record<string, string> = {
  'en-US': 'English (US)',
  'es-MX': 'Spanish (Mexico)',
  'fr-FR': 'French',
  'de-DE': 'German',
  'zh-CN': 'Chinese (Simplified)',
  'pt-BR': 'Portuguese (Brazil)',
  'ja-JP': 'Japanese',
  'ko-KR': 'Korean',
};

export const WorkspaceOverview: React.FC<WorkspaceOverviewProps> = ({
  projectTitle,
  projectType,
  selectedGenre,
  selectedStyle,
  selectedLanguage,
  customPremise,
  storyGoal,
  selectedVoice,
  soundtrackEnabled,
  comicFacesCount,
  approvedCount,
  totalPages,
  recentActivity,
  onNavigateTo,
  onGenerateFirstScene,
}) => {
  const progressPct = Math.round((comicFacesCount / totalPages) * 100);
  const styleLabel  = STYLE_LABELS[selectedStyle] || selectedStyle;
  const langLabel   = LANGUAGE_LABELS[selectedLanguage] || selectedLanguage;
  const isBilingual = selectedLanguage.includes('-') && selectedLanguage !== 'en-US';

  return (
    <div className="space-y-8 text-left animate-fadeIn">

      {/* PAGE HEADER */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold font-mono uppercase tracking-wider">
          <BookOpen size={13} />
          <span>Project Overview</span>
        </div>
        <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 leading-tight">
          {projectTitle}
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
          Your workspace is set up and ready. Review your story configuration below, then move to the outline or jump straight into building scenes.
        </p>
      </div>

      {/* GUIDANCE CARD */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-600/8 to-violet-600/5 border border-indigo-500/15 flex gap-4 items-start">
        <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center shrink-0">
          <Star size={16} className="text-indigo-300" />
        </div>
        <div className="space-y-1 flex-1">
          <h3 className="font-extrabold text-sm text-white">Where to start</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Review your <span className="text-indigo-300 font-bold">Story Outline</span> to make sure your chapters are in the right order.
            When you are ready, use <span className="text-indigo-300 font-bold">Build Scenes</span> to generate illustrated pages from your outline.
          </p>
        </div>
      </div>

      {/* SETUP SUMMARY — card grid */}
      <div>
        <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-600 mb-3">Setup Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Story details */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-[10px] uppercase font-mono">
              <FileText size={12} />
              <span>Story Details</span>
            </div>
            <div>
              <p className="font-extrabold text-sm text-slate-100 leading-snug">{projectTitle}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className="px-2 py-0.5 bg-slate-800 rounded-lg text-[10px] font-bold text-slate-400">{projectType}</span>
                <span className="px-2 py-0.5 bg-slate-800 rounded-lg text-[10px] font-bold text-slate-400">{selectedGenre}</span>
              </div>
            </div>
            {customPremise ? (
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{customPremise}</p>
            ) : (
              <p className="text-xs text-slate-700 italic">No premise description added.</p>
            )}
          </div>

          {/* Story goal */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-[10px] uppercase font-mono">
              <Target size={12} />
              <span>Story Goal</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {storyGoal || 'No story goal set. Add one in the Outline view.'}
            </p>
            <button
              onClick={() => onNavigateTo('outline')}
              className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
            >
              Edit in Outline <ArrowRight size={10} />
            </button>
          </div>

          {/* Visual style */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex gap-4 items-start">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/8 border border-amber-500/15 flex items-center justify-center text-2xl shrink-0">
              🎨
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-[10px] uppercase font-mono">
                <Palette size={11} />
                <span>Visual Style</span>
              </div>
              <p className="font-extrabold text-sm text-slate-100">{styleLabel}</p>
              <p className="text-[10px] text-slate-600">Applied across all illustrated pages</p>
            </div>
          </div>

          {/* Language */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-[10px] uppercase font-mono">
              <Globe size={12} />
              <span>Language</span>
            </div>
            <div className="space-y-1">
              <p className="font-extrabold text-sm text-slate-100">{langLabel}</p>
              {isBilingual ? (
                <p className="text-[10px] text-emerald-400 font-bold">✓ Dual-language dialogue bubbles active</p>
              ) : (
                <p className="text-[10px] text-slate-600">Single-language mode</p>
              )}
            </div>
          </div>

          {/* Narration */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 md:col-span-2">
            <div className="flex items-center gap-2 text-violet-400 font-bold text-[10px] uppercase font-mono">
              <Volume2 size={12} />
              <span>Narration</span>
            </div>
            <div className="flex items-center gap-8">
              <div className="space-y-0.5">
                <p className="text-[10px] text-slate-600">Voice</p>
                <p className="font-bold text-sm text-slate-200">{selectedVoice}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] text-slate-600">Background music</p>
                <p className={`font-bold text-sm ${soundtrackEnabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                  {soundtrackEnabled ? 'Enabled' : 'Off'}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* PROGRESS */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold font-mono uppercase text-slate-600 tracking-wider">Story Progress</span>
          <span className="text-xs font-bold text-indigo-400">{progressPct}% complete</span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 transition-all duration-700 rounded-full"
            style={{ width: `${Math.max(progressPct, 2)}%` }}
          />
        </div>
        <div className="flex gap-6 text-[10px] text-slate-600">
          <span><strong className="text-slate-300">{comicFacesCount}</strong> scenes built</span>
          <span><strong className="text-emerald-400">{approvedCount}</strong> approved</span>
          <span><strong className="text-slate-500">{totalPages - comicFacesCount}</strong> remaining</span>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-600">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">

          <button
            id="overview-action-outline"
            onClick={() => onNavigateTo('outline')}
            className="group p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/30 hover:bg-slate-800/50 text-left transition-all duration-200 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-500/8 border border-indigo-500/15 flex items-center justify-center mb-3 group-hover:bg-indigo-500/15 transition-all">
              <Layers size={16} className="text-indigo-400" />
            </div>
            <p className="font-extrabold text-sm text-slate-100">Story Outline</p>
            <p className="text-[10px] text-slate-600 mt-0.5 leading-relaxed">Arrange your chapters and scene beats</p>
            <div className="flex items-center gap-1 mt-3 text-[10px] font-bold text-indigo-400 group-hover:text-indigo-300 transition-colors">
              Open <ArrowRight size={10} />
            </div>
          </button>

          <button
            id="overview-action-generate"
            onClick={onGenerateFirstScene}
            className="group p-5 rounded-2xl bg-gradient-to-br from-indigo-600/15 to-violet-600/8 border border-indigo-500/25 hover:border-indigo-400/40 hover:from-indigo-600/25 text-left transition-all duration-200 cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-3 right-3">
              <span className="text-[8px] bg-indigo-500/25 text-indigo-300 px-2 py-0.5 rounded-full font-bold font-mono uppercase">Start here</span>
            </div>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-400/20 flex items-center justify-center mb-3 group-hover:bg-indigo-500/25 transition-all">
              <Zap size={16} className="text-indigo-300" />
            </div>
            <p className="font-extrabold text-sm text-white">Build Scenes</p>
            <p className="text-[10px] text-indigo-200/60 mt-0.5 leading-relaxed">Generate your first illustrated pages</p>
            <div className="flex items-center gap-1 mt-3 text-[10px] font-bold text-indigo-300">
              Start creating <ArrowRight size={10} />
            </div>
          </button>

          <button
            id="overview-action-characters"
            onClick={() => onNavigateTo('characters')}
            className="group p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-violet-500/30 hover:bg-slate-800/50 text-left transition-all duration-200 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-violet-500/8 border border-violet-500/15 flex items-center justify-center mb-3 group-hover:bg-violet-500/15 transition-all">
              <Globe size={16} className="text-violet-400" />
            </div>
            <p className="font-extrabold text-sm text-slate-100">Characters</p>
            <p className="text-[10px] text-slate-600 mt-0.5 leading-relaxed">Review your cast and visual settings</p>
            <div className="flex items-center gap-1 mt-3 text-[10px] font-bold text-violet-400 group-hover:text-violet-300 transition-colors">
              View <ArrowRight size={10} />
            </div>
          </button>

          <button
            id="overview-action-collaboration"
            onClick={() => onNavigateTo('collaboration')}
            className="group p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/30 hover:bg-slate-800/50 text-left transition-all duration-200 cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/8 border border-emerald-500/15 flex items-center justify-center mb-3 group-hover:bg-emerald-500/15 transition-all">
              <Users size={16} className="text-emerald-400" />
            </div>
            <p className="font-extrabold text-sm text-slate-100">Team & Sharing</p>
            <p className="text-[10px] text-slate-600 mt-0.5 leading-relaxed">Manage collaborators and approvals</p>
            <div className="flex items-center gap-1 mt-3 text-[10px] font-bold text-emerald-400 group-hover:text-emerald-300 transition-colors">
              Open <ArrowRight size={10} />
            </div>
          </button>

        </div>
      </div>

      {/* RECENT ACTIVITY */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-slate-600 font-bold text-[10px] uppercase font-mono tracking-wider">
          <Clock size={11} />
          <span>Recent Activity</span>
        </div>
        {recentActivity.length > 0 ? (
          <ul className="space-y-2">
            {recentActivity.slice(0, 5).map((act, i) => (
              <li key={i} className="flex gap-2.5 items-start text-xs text-slate-400">
                <CheckCircle size={12} className="text-emerald-500 shrink-0 mt-0.5" />
                <span>{act}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-slate-700 italic">
            Activity will appear here as you build your story.
          </p>
        )}
      </div>

    </div>
  );
};
