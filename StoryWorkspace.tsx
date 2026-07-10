/*
  Screen Name: Story Workspace Shell
  Purpose: Authenticated 3-column editor shell for the Story.Menu workspace. Contains the
           top action bar, left sidebar navigation, central view canvas, and right contextual
           inspector panel. Hosts all Phase 2 views: Overview, Outline, Characters, and
           Generate Scenes. Provides Coming Soon placeholder screens for future sections.
  Version: v1.2
  Phase: Phase 4
  Date: 2026-07-08
  What changed in this revision: Added Audio & Narration workspace integration.
*/

import React, { useState, useEffect } from 'react';
import {
  BookOpen, Compass, List, Users, Image as ImageIcon,
  MessageSquare, Globe, Volume2, Download, Eye, Zap,
  CheckCircle, RotateCcw, LogOut, CreditCard,
  Layers, Target, Sparkles, FileText, Save, Wifi,
  ArrowRight, Lock, BellRing, X
} from 'lucide-react';

import { WorkspaceOverview } from './WorkspaceOverview';
import { WorkspaceOutline } from './WorkspaceOutline';
import { WorkspacePages } from './WorkspacePages';
import { WorkspaceTranslation } from './WorkspaceTranslation';
import { WorkspaceAudio } from './WorkspaceAudio';
import { WorkspaceExport } from './WorkspaceExport';
import { WorkspaceCollaboration } from './WorkspaceCollaboration';
import { ChapterGoal } from './types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ComicPage {
  id: string;
  pageIndex: number;
  type: string;
  imageUrl?: string;
  isLoading?: boolean;
  isApproved?: boolean;
  narrative?: {
    caption?: string;
    dialogue?: string;
    scene?: string;
    choices?: string[];
  };
  panelGridStyle?: 'single' | 'split-2' | 'classic-4';
  panelPrompts?: string[];
  panelImages?: string[];
  translation?: {
    caption?: string;
    dialogue?: string;
    status: 'not-translated' | 'draft' | 'needs-review' | 'approved';
  };
  audio?: {
    script?: string;
    status: 'no-audio' | 'draft' | 'needs-review' | 'approved';
  };
}

type WorkspaceSection =
  | 'overview'
  | 'outline'
  | 'characters'
  | 'scenes'
  | 'pages'
  | 'dialogue'
  | 'translation'
  | 'audio'
  | 'collaboration'
  | 'export';

interface StoryWorkspaceProps {
  projectTitle: string;
  projectType: string;
  selectedGenre: string;
  selectedStyle: string;
  selectedLanguage: string;
  customPremise: string;
  storyGoal: string;
  selectedVoice: string;
  soundtrackEnabled: boolean;
  storyBlueprint: ChapterGoal[];
  generalNotes: string;
  onStoryBlueprintChange: (val: ChapterGoal[]) => void;
  onStoryGoalChange: (val: string) => void;
  onGeneralNotesChange: (val: string) => void;
  comicFaces: ComicPage[];
  selectedPageIndex: number;
  selectedPanelIndex: number;
  onSelectPage: (index: number) => void;
  onSelectPanel: (index: number) => void;
  onGenerateBatch: (from: number, count: number) => void;
  onGenerateSinglePage: (type: string, index: number, pageType: string) => void;
  onApprovePage: (pageIndex: number) => void;
  onDuplicatePanel: (pageIndex: number) => void;
  onUpdateText: (pageIndex: number, field: string, text: string) => void;
  onUpdateTranslation: (pageIndex: number, field: string, text: string) => void;
  onUpdateTranslationStatus: (pageIndex: number, status: 'not-translated' | 'draft' | 'needs-review' | 'approved') => void;
  onUpdateAudioScript: (pageIndex: number, text: string) => void;
  onUpdateAudioStatus: (pageIndex: number, status: 'no-audio' | 'draft' | 'needs-review' | 'approved') => void;
  recentActivity: string[];
  onPreviewReader: () => void;
  onDownloadPDF: () => void;
  onReset: () => void;
  currentUser: { id: string; email: string; displayName?: string; tokenBalance?: number; tier?: string } | null;
  onLogOut: () => void;
  onOpenCheckout: () => void;
  totalPages: number;
}

// ─── Sidebar nav items ────────────────────────────────────────────────────────

const NAV_ITEMS: {
  id: WorkspaceSection;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  badge?: string;
}[] = [
  { id: 'overview',    label: 'Project Overview',  icon: <BookOpen size={15} />,       active: true },
  { id: 'outline',     label: 'Story Outline',      icon: <List size={15} />,          active: true },
  { id: 'characters',  label: 'Characters',         icon: <Users size={15} />,         active: true },
  { id: 'scenes',      label: 'Scene Library',      icon: <Layers size={15} />,        active: false, badge: 'Soon' },
  { id: 'pages',       label: 'Build Scenes',       icon: <ImageIcon size={15} />,     active: true },
  { id: 'dialogue',    label: 'Dialogue',           icon: <MessageSquare size={15} />, active: false, badge: 'Soon' },
  { id: 'translation', label: 'Translation',        icon: <Globe size={15} />,         active: true },
  { id: 'audio',       label: 'Audio & Narration',  icon: <Volume2 size={15} />,       active: true },
  { id: 'collaboration', label: 'Team & Sharing',   icon: <Users size={15} />,         active: true },
  { id: 'export',      label: 'Export & Publish',   icon: <Download size={15} />,      active: true },
];

// ─── Coming-soon section metadata ────────────────────────────────────────────

const COMING_SOON_META: Record<string, { emoji: string; title: string; description: string }> = {
  scenes: {
    emoji: '🎬',
    title: 'Scene Library',
    description: 'Browse and reuse illustrated scenes across your projects. Tag, organise, and remix visuals from any story you have created.',
  },
  dialogue: {
    emoji: '💬',
    title: 'Dialogue Editor',
    description: 'Write and refine character dialogue with a dedicated block editor. Control speech bubbles, thought bubbles, and captions page by page.',
  },
  translation: {
    emoji: '🌐',
    title: 'Translation & Dual-Language Mode',
    description: 'Add a second language to any page. Review AI-suggested translations and publish bilingual editions with a single click.',
  },
  audio: {
    emoji: '🎵',
    title: 'Audio & Narration',
    description: 'Add voice narration and background music to every page. Choose from multiple narrator voices or record your own.',
  },
  export: {
    emoji: '📤',
    title: 'Export & Publish',
    description: 'Export your finished story as a print-ready PDF, an interactive digital book, or share a private reading link with your audience.',
  },
};

// ─── Right Inspector Panel ────────────────────────────────────────────────────

const WorkspaceInspector: React.FC<{
  activeSection: WorkspaceSection;
  selectedBeat: ChapterGoal | null;
  selectedPage: ComicPage | null;
  selectedPanelIndex: number;
  projectTitle: string;
  projectType: string;
  selectedGenre: string;
  selectedStyle: string;
  selectedLanguage: string;
  selectedVoice: string;
  storyGoal: string;
  comicFacesCount: number;
  approvedCount: number;
  totalPages: number;
  onNavigateTo: (section: string) => void;
  onApprovePage: (pageIndex: number) => void;
  onDuplicatePanel: (pageIndex: number) => void;
  onGenerateSinglePage: (type: string, index: number, pageType: string) => void;
}> = ({
  activeSection,
  selectedBeat,
  selectedPage,
  selectedPanelIndex,
  projectTitle,
  projectType,
  selectedGenre,
  selectedStyle,
  selectedLanguage,
  selectedVoice,
  storyGoal,
  comicFacesCount,
  approvedCount,
  totalPages,
  onNavigateTo,
  onApprovePage,
  onDuplicatePanel,
  onGenerateSinglePage,
}) => {

  const isBilingual = selectedLanguage.includes('-') && selectedLanguage !== 'en-US';
  const panelNum = selectedPanelIndex + 1;

  // ── OVERVIEW
  if (activeSection === 'overview') {
    return (
      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Story at a glance</h3>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-left">
          <p className="font-extrabold text-sm text-slate-100 leading-snug">{projectTitle}</p>
          <div className="space-y-1.5 text-[10px] text-slate-500">
            {[
              { label: 'Template',     value: projectType },
              { label: 'Genre',        value: selectedGenre },
              { label: 'Art Style',    value: selectedStyle },
              { label: 'Language',     value: selectedLanguage },
              { label: 'Bilingual',    value: isBilingual ? 'Yes' : 'No',
                valueClass: isBilingual ? 'text-emerald-400 font-bold' : undefined },
            ].map(row => (
              <div key={row.label} className="flex justify-between items-center">
                <span>{row.label}</span>
                <span className={row.valueClass ?? 'text-slate-300 font-bold'}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5 text-left">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-bold text-slate-500 uppercase tracking-wider">Progress</span>
            <span className="font-bold text-indigo-400">{Math.max(0, Math.round((comicFacesCount / totalPages) * 100))}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
              style={{ width: `${Math.max(2, Math.round((comicFacesCount / totalPages) * 100))}%` }}
            />
          </div>
          <div className="flex gap-4 text-[10px] text-slate-600">
            <span><strong className="text-slate-400">{comicFacesCount}</strong> built</span>
            <span><strong className="text-emerald-400">{approvedCount}</strong> approved</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/15 space-y-3 text-left">
          <p className="text-xs font-bold text-slate-300 leading-relaxed">
            Ready to start? Finalise your outline, then build your first illustrated pages.
          </p>
          <button
            onClick={() => onNavigateTo('pages')}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all cursor-pointer"
          >
            <Zap size={12} /> Start Building
          </button>
        </div>
      </div>
    );
  }

  // ── OUTLINE
  if (activeSection === 'outline') {
    return (
      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          {selectedBeat ? 'Selected Scene' : 'Outline'}
        </h3>

        {selectedBeat ? (
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-left">
            <div className="flex items-center gap-2 text-[10px] font-bold text-violet-400 font-mono uppercase">
              <Target size={11} /> Scene {selectedBeat.chapterNum}
            </div>
            <p className="font-extrabold text-sm text-slate-100">{selectedBeat.title}</p>
            {selectedBeat.goal ? (
              <p className="text-xs text-slate-400 leading-relaxed">{selectedBeat.goal}</p>
            ) : (
              <p className="text-xs text-slate-600 italic">No scene objective written yet. Add one to improve image quality.</p>
            )}
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={() => onGenerateSinglePage('story', selectedBeat.chapterNum, 'story')}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all cursor-pointer"
              >
                <Zap size={12} /> Build This Scene
              </button>
            </div>
          </div>
        ) : (
          <>
            {storyGoal && (
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-left space-y-1.5">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Story Goal</div>
                <p className="text-xs text-slate-400 leading-relaxed">{storyGoal}</p>
              </div>
            )}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5 text-left">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quick tips</div>
              <ul className="space-y-2 text-[10px] text-slate-500 leading-relaxed">
                <li className="flex gap-2"><span className="text-indigo-400">→</span> Click any scene to view it here</li>
                <li className="flex gap-2"><span className="text-indigo-400">→</span> Use the arrows to reorder scenes</li>
                <li className="flex gap-2"><span className="text-indigo-400">→</span> Each scene maps to one generated page</li>
                <li className="flex gap-2"><span className="text-indigo-400">→</span> Write a scene objective for better visuals</li>
              </ul>
            </div>
          </>
        )}
      </div>
    );
  }

  // ── PAGES
  if (activeSection === 'pages') {
    return (
      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Page Options</h3>

        {selectedPage && (
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-left">
            <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-400 font-mono uppercase">
              <ImageIcon size={11} />
              {selectedPage.type === 'cover' ? 'Cover Page' : `Page ${selectedPage.pageIndex}`}
            </div>
            <div className="space-y-1.5 text-[10px] text-slate-500">
              <div className="flex justify-between">
                <span>Status</span>
                <span className={selectedPage.isApproved ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {selectedPage.isApproved ? 'Approved ✓' : 'In Progress'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Layout</span>
                <span className="text-slate-300 font-bold">
                  {selectedPage.panelGridStyle === 'classic-4' ? '4-Panel Grid'
                    : selectedPage.panelGridStyle === 'split-2' ? '2-Panel Split'
                    : 'Full Page'}
                </span>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => onApprovePage(selectedPage.pageIndex)}
                className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition-all cursor-pointer border ${
                  selectedPage.isApproved
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                {selectedPage.isApproved ? 'Approved ✓' : 'Mark Approved'}
              </button>
              <button
                onClick={() => onDuplicatePanel(selectedPage.pageIndex)}
                className="flex-1 py-2 rounded-xl text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                Duplicate
              </button>
            </div>
          </div>
        )}

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-left">
          <div className="flex items-center gap-2 text-[10px] font-bold text-violet-400 font-mono uppercase">
            <Sparkles size={11} /> Panel {panelNum} — Adjust & Regenerate
          </div>
          <div className="space-y-2">
            <div>
              <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Page layout</label>
              <div className="grid grid-cols-3 gap-1">
                {[{ label: 'Full', val: 'single' }, { label: '2-up', val: 'split-2' }, { label: '4-up', val: 'classic-4' }].map(opt => (
                  <button
                    key={opt.val}
                    className="py-1.5 rounded-lg bg-slate-800 text-[9px] font-bold text-slate-400 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[9px] font-bold text-slate-600 uppercase block mb-1">Revision notes</label>
              <textarea
                rows={2}
                placeholder="Describe what to change on the next try…"
                className="w-full rounded-lg bg-slate-950 border border-slate-800 text-[10px] p-2 text-slate-300 placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed"
              />
            </div>
            {selectedPage && (
              <button
                onClick={() => onGenerateSinglePage('story', selectedPage.pageIndex, 'story')}
                className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-[10px] font-bold text-white transition-all cursor-pointer"
              >
                Rebuild Panel {panelNum}
              </button>
            )}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-1.5 text-left">
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Character Visuals</p>
          <p className="text-[10px] text-slate-700 leading-relaxed">
            Your character portraits are applied automatically to keep the cast consistent across every page.
          </p>
        </div>
      </div>
    );
  }

  // ── CHARACTERS
  if (activeSection === 'characters') {
    return (
      <div className="space-y-4">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cast</h3>
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5 text-left">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">How characters work</p>
          <ul className="space-y-2 text-[10px] text-slate-500 leading-relaxed">
            <li className="flex gap-2"><span className="text-pink-400">→</span> Photos you uploaded are used as visual anchors</li>
            <li className="flex gap-2"><span className="text-pink-400">→</span> The AI keeps your cast consistent page to page</li>
            <li className="flex gap-2"><span className="text-pink-400">→</span> Edit visual notes to refine appearance</li>
          </ul>
        </div>
      </div>
    );
  }

  // ── AUDIO
  if (activeSection === 'audio') {
    return (
      <div className="space-y-4 animate-fadeIn">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Audio Settings</h3>
        
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 text-left">
          
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Narrator Voice</label>
            <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300">
              {selectedVoice || 'None selected'}
            </div>
          </div>
          
          <div className="border-t border-slate-800/80 pt-4 space-y-4">
             <div>
               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Narration Speed</label>
               <div className="flex bg-slate-950 border border-slate-800 rounded-xl overflow-hidden p-0.5">
                 {['0.8x', '1.0x', '1.2x'].map(speed => (
                   <button 
                     key={speed}
                     className={`flex-1 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer ${speed === '1.0x' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'}`}
                   >
                     {speed}
                   </button>
                 ))}
               </div>
             </div>

             <div>
               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Soundtrack Theme</label>
               <select className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-300 outline-none cursor-pointer appearance-none">
                 <option>Cinematic Orchestral</option>
                 <option>Light Acoustic</option>
                 <option>Ambient Electronic</option>
                 <option>No Soundtrack</option>
               </select>
             </div>

             <div className="pt-2 space-y-3">
               <label className="flex items-center gap-2 cursor-pointer group">
                 <input type="checkbox" defaultChecked className="hidden" />
                 <div className="w-4 h-4 rounded border border-indigo-500/50 bg-indigo-500/20 flex items-center justify-center shrink-0">
                   <CheckCircle size={10} className="text-indigo-400" />
                 </div>
                 <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-300 transition-colors">Background music enabled</span>
               </label>

               <label className="flex items-center gap-2 cursor-pointer group">
                 <input type="checkbox" className="hidden" />
                 <div className="w-4 h-4 rounded border border-slate-700 bg-slate-800 flex items-center justify-center shrink-0 group-hover:border-slate-600 transition-all">
                 </div>
                 <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-300 transition-colors">Assign character voices</span>
               </label>
             </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-1.5 text-left">
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <Volume2 size={11} /> Pronunciation Help
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            Ensure names and unique terms are spelled phonetically in the editable read-aloud script for the best results.
          </p>
        </div>
      </div>
    );
  }

  if (activeSection === 'translation') {
    return (
      <div className="space-y-4 animate-fadeIn">
        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Translation Tools</h3>
        
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 text-left">
          
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Source Language</label>
            <div className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-300">
              {selectedLanguage.includes('-') ? selectedLanguage.split(' ')[0] : 'English'}
            </div>
          </div>
          
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Target Language</label>
            <div className="px-3 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-400">
              {selectedLanguage}
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-4 space-y-3">
             <label className="flex items-center gap-2 cursor-pointer group">
               <input type="checkbox" defaultChecked className="hidden" />
               <div className="w-4 h-4 rounded border border-indigo-500/50 bg-indigo-500/20 flex items-center justify-center shrink-0">
                 <CheckCircle size={10} className="text-indigo-400" />
               </div>
               <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-300 transition-colors">Preserve character names</span>
             </label>

             <label className="flex items-center gap-2 cursor-pointer group">
               <input type="checkbox" defaultChecked className="hidden" />
               <div className="w-4 h-4 rounded border border-indigo-500/50 bg-indigo-500/20 flex items-center justify-center shrink-0">
                 <CheckCircle size={10} className="text-indigo-400" />
               </div>
               <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-300 transition-colors">Lock glossary terms</span>
             </label>

             <label className="flex items-center gap-2 cursor-pointer group">
               <input type="checkbox" className="hidden" />
               <div className="w-4 h-4 rounded border border-slate-700 bg-slate-800 flex items-center justify-center shrink-0 group-hover:border-slate-600 transition-all">
               </div>
               <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-300 transition-colors">Simplify vocabulary for early readers</span>
             </label>
          </div>

        </div>

        <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-1.5 text-left">
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <Globe size={11} /> Context Aware
          </p>
          <p className="text-[10px] text-slate-700 leading-relaxed">
            The AI automatically maps dialogue back to characters and tries to match text lengths for layout.
          </p>
        </div>

      </div>
    );
  }

  if (activeSection === 'export') {
    const isReady = approvedCount === totalPages && totalPages > 0;
    
    return (
      <aside className="w-80 bg-[#0f111a] border-l border-slate-800/80 flex flex-col h-full shrink-0">
        <div className="h-14 shrink-0 flex items-center px-5 border-b border-slate-800/80">
          <h2 className="text-xs font-black tracking-widest uppercase text-slate-400 flex items-center gap-2">
            <Download size={14} className="text-slate-500" />
            Publish Checklist
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3">
              <div className={`mt-0.5 ${totalPages > 0 ? 'text-emerald-500' : 'text-slate-600'}`}>
                {totalPages > 0 ? <CheckCircle size={16} /> : <div className="w-4 h-4 rounded-full border-2 border-slate-700" />}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-300">Pages Complete</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {totalPages > 0 ? `${totalPages} generated pages in project.` : 'No pages created yet.'}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3">
              <div className={`mt-0.5 ${approvedCount === totalPages && totalPages > 0 ? 'text-emerald-500' : 'text-slate-600'}`}>
                {approvedCount === totalPages && totalPages > 0 ? <CheckCircle size={16} /> : <div className="w-4 h-4 rounded-full border-2 border-slate-700" />}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-300">Final Review</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {approvedCount} of {totalPages} pages approved for export.
                </div>
              </div>
            </div>
          </div>

          <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 ${
            isReady 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
          }`}>
            {isReady ? (
              <>
                <CheckCircle size={16} />
                Ready to Publish
              </>
            ) : (
              <>
                <Zap size={16} />
                Needs Review
              </>
            )}
          </div>
        </div>
      </aside>
    );
  }

  // ── FALLBACK (coming-soon sections)
  return (
    <div className="space-y-4">
      <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Coming Soon</h3>
      <div className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/60 text-left space-y-2">
        <p className="text-xs text-slate-600 leading-relaxed">
          This section will be available in an upcoming release. Head to{' '}
          <button onClick={() => onNavigateTo('pages')} className="text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer underline underline-offset-2">
            Build Scenes
          </button>{' '}
          to keep creating.
        </p>
      </div>
    </div>
  );
};

// ─── Welcome Banner (first launch only) ──────────────────────────────────────

const WelcomeBanner: React.FC<{ projectTitle: string; onDismiss: () => void }> = ({ projectTitle, onDismiss }) => (
  <div className="mx-7 mt-5 p-4 rounded-2xl bg-gradient-to-r from-indigo-600/15 to-violet-600/10 border border-indigo-500/25 flex items-start gap-4 animate-fadeIn">
    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/20 flex items-center justify-center shrink-0">
      <span className="text-xl">🎉</span>
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-extrabold text-sm text-white">
        Your workspace is ready — welcome, {projectTitle}!
      </p>
      <p className="text-xs text-indigo-200/60 mt-0.5 leading-relaxed">
        Start by reviewing your story outline, then hit <strong className="text-indigo-300">Build Scenes</strong> to generate your first illustrated pages.
      </p>
    </div>
    <button
      onClick={onDismiss}
      className="text-slate-500 hover:text-slate-300 transition-colors cursor-pointer shrink-0 mt-0.5"
      aria-label="Dismiss"
    >
      <X size={14} />
    </button>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const StoryWorkspace: React.FC<StoryWorkspaceProps> = (props) => {
  const {
    projectTitle, projectType, selectedGenre, selectedStyle,
    selectedLanguage, customPremise, storyGoal, selectedVoice,
    soundtrackEnabled, storyBlueprint, generalNotes,
    onStoryBlueprintChange, onStoryGoalChange, onGeneralNotesChange,
    comicFaces, selectedPageIndex, selectedPanelIndex,
    onSelectPage, onSelectPanel, onGenerateBatch,
    onGenerateSinglePage, onApprovePage, onDuplicatePanel,
    onUpdateText, onUpdateTranslation, onUpdateTranslationStatus,
    onUpdateAudioScript, onUpdateAudioStatus, recentActivity, 
    onPreviewReader, onDownloadPDF, onReset, currentUser, 
    onLogOut, onOpenCheckout, totalPages,
  } = props;

  const [activeSection, setActiveSection] = useState<WorkspaceSection>('overview');
  const [selectedBeat, setSelectedBeat] = useState<ChapterGoal | null>(null);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [autoSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  // Dismiss welcome banner after 12 seconds automatically
  useEffect(() => {
    const t = setTimeout(() => setShowWelcome(false), 12000);
    return () => clearTimeout(t);
  }, []);

  const navigateTo = (section: string) => {
    setActiveSection(section as WorkspaceSection);
  };

  const approvedCount = comicFaces.filter(f => f.isApproved).length;
  const builtCount = comicFaces.filter(f => f.imageUrl).length;
  const activePage = comicFaces.find(f => f.pageIndex === selectedPageIndex) || comicFaces[0] || null;

  return (
    <div className="flex flex-col w-full h-screen overflow-hidden bg-[#0c0e14] text-slate-100 font-sans">

      {/* ══════════════════════════════════════════
          TOP ACTION BAR
      ══════════════════════════════════════════ */}
      <header className="h-14 shrink-0 border-b border-slate-800/80 px-5 flex items-center justify-between bg-slate-950/95 backdrop-blur-sm z-30">

        {/* Left: logo + title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/30">
            <BookOpen size={12} className="text-white sm:w-[13px] sm:h-[13px]" />
          </div>
          <div className="hidden sm:block h-5 w-px bg-slate-800 shrink-0" />
          <div className="flex items-center gap-2 min-w-0">
            <h1
              id="workspace-project-title"
              className="text-xs sm:text-sm font-extrabold text-slate-100 truncate max-w-[120px] sm:max-w-[240px]"
            >
              {projectTitle}
            </h1>
            {/* Autosave badge */}
            {autoSaveStatus === 'saved' && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/8 border border-emerald-500/15 shrink-0">
                <Wifi size={9} className="text-emerald-500" />
                <span className="text-[9px] font-bold text-emerald-500">Saved</span>
              </div>
            )}
            {autoSaveStatus === 'saving' && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/8 border border-amber-500/15 shrink-0">
                <Save size={9} className="text-amber-400" />
                <span className="text-[9px] font-bold text-amber-400">Saving…</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto custom-scrollbar pr-2 sm:pr-0">

          {/* Token balance pill */}
          {currentUser && currentUser.tokenBalance !== undefined && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-mono">
              <span className="text-amber-400 font-extrabold">{currentUser.tokenBalance ?? 0}</span>
              <span className="text-slate-600">credits</span>
              <button
                onClick={onOpenCheckout}
                className="px-1.5 py-0.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[8px] cursor-pointer ml-0.5 transition-all"
              >
                + Add
              </button>
            </div>
          )}

          <button
            id="workspace-preview"
            onClick={onPreviewReader}
            className="flex items-center justify-center gap-1.5 p-2 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-700 transition-all cursor-pointer shrink-0"
            title="Preview Book"
          >
            <Eye size={13} /> <span className="hidden sm:inline">Preview Book</span>
          </button>

          <button
            id="workspace-generate"
            onClick={() => { navigateTo('pages'); onGenerateBatch(1, 5); }}
            className="flex items-center justify-center gap-1.5 p-2 sm:px-3.5 sm:py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white transition-all cursor-pointer shadow-md shadow-indigo-600/20 shrink-0"
            title="Build Scenes"
          >
            <Zap size={13} /> <span className="hidden sm:inline">Build Scenes</span>
          </button>

          <button
            id="workspace-export-pdf"
            onClick={onDownloadPDF}
            className="hidden sm:flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white transition-all cursor-pointer shrink-0"
          >
            <Download size={13} /> Export PDF
          </button>

          {/* Account avatar */}
          <div className="relative ml-1">
            <button
              id="workspace-account-menu"
              onClick={() => setShowAccountMenu(v => !v)}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-extrabold text-white cursor-pointer hover:opacity-90 transition-opacity ring-2 ring-transparent hover:ring-indigo-500/30"
            >
              {currentUser?.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
            </button>

            {showAccountMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowAccountMenu(false)} />
                <div className="absolute right-0 top-10 z-50 w-56 bg-slate-900 border border-slate-800 rounded-2xl p-2 shadow-2xl shadow-black/40 text-left">
                  <div className="px-3 py-2.5 border-b border-slate-800 mb-1">
                    <p className="text-xs font-bold text-slate-200 truncate">
                      {currentUser?.displayName || currentUser?.email || 'Creator'}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{currentUser?.email}</p>
                    <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-bold text-indigo-400">
                      {currentUser?.tier || 'Free'} plan
                    </span>
                  </div>
                  <button
                    onClick={() => { setShowAccountMenu(false); onOpenCheckout(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    <CreditCard size={13} /> Upgrade Plan
                  </button>
                  <button
                    onClick={() => { setShowAccountMenu(false); onReset(); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    <FileText size={13} /> Start New Project
                  </button>
                  <div className="border-t border-slate-800 mt-1 pt-1">
                    <button
                      onClick={() => { setShowAccountMenu(false); onLogOut(); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-500/8 transition-all cursor-pointer"
                    >
                      <LogOut size={13} /> Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Welcome banner — shown only on first entry */}
      {showWelcome && (
        <WelcomeBanner projectTitle={projectTitle} onDismiss={() => setShowWelcome(false)} />
      )}

      {/* ══════════════════════════════════════════
          MAIN 3-COLUMN BODY
      ══════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col-reverse md:flex-row overflow-hidden">

        {/* ─── COLUMN 1: LEFT SIDEBAR (Bottom Nav on Mobile) ──────────────────── */}
        <aside className="w-full md:w-58 shrink-0 border-t md:border-t-0 md:border-r border-slate-800/80 flex md:flex-col justify-between bg-slate-950/90 backdrop-blur-md md:bg-slate-950/50 z-20 md:z-0 md:max-w-[232px]">
          <div className="flex-1 md:flex-none flex flex-row md:flex-col items-center md:items-stretch overflow-x-auto md:overflow-y-auto custom-scrollbar md:p-3 p-1 space-x-1 md:space-x-0 md:space-y-5">

            <div className="hidden md:block space-y-0.5 pt-1">
              <span className="text-[9px] font-bold font-mono tracking-widest text-slate-700 uppercase px-3 block pb-1">
                Your Story
              </span>
              {NAV_ITEMS.map(nav => {
                const isActive = activeSection === nav.id;
                const isLocked = !nav.active;

                return (
                  <button
                    key={nav.id}
                    id={`sidebar-nav-${nav.id}`}
                    onClick={() => { if (!isLocked) setActiveSection(nav.id); }}
                    disabled={isLocked}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                      isActive
                        ? 'bg-indigo-600/15 text-white border border-indigo-500/20'
                        : isLocked
                        ? 'text-slate-700 cursor-not-allowed'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isActive ? 'text-indigo-400' : isLocked ? 'text-slate-800' : 'text-slate-600'}>
                        {isLocked ? <Lock size={13} /> : nav.icon}
                      </span>
                      {nav.label}
                    </div>
                    {nav.badge && (
                      <span className="text-[8px] bg-slate-800 text-slate-700 px-1.5 py-0.5 rounded-full font-mono shrink-0">
                        {nav.badge}
                      </span>
                    )}
                    {isActive && !nav.badge && (
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Mobile Nav Row */}
            <div className="flex md:hidden items-center">
              {NAV_ITEMS.map(nav => {
                const isActive = activeSection === nav.id;
                const isLocked = !nav.active;

                return (
                  <button
                    key={`mobile-${nav.id}`}
                    onClick={() => !isLocked && setActiveSection(nav.id)}
                    className={`
                      flex flex-col items-center justify-center gap-1 shrink-0 w-16 h-14 rounded-xl transition-all cursor-pointer
                      ${isActive ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500 hover:text-slate-300'}
                      ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    title={nav.label}
                  >
                    <nav.icon size={18} className={isActive ? 'text-indigo-400' : ''} />
                    <span className="text-[9px] font-bold tracking-tight truncate w-full text-center px-1">{nav.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Progress widget */}
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2 text-left">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-slate-600 uppercase tracking-wider font-mono">Progress</span>
                <span className="font-bold text-indigo-400">{builtCount} / {totalPages}</span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
                  style={{ width: `${Math.max(2, Math.round((builtCount / totalPages) * 100))}%` }}
                />
              </div>
              {approvedCount > 0 && (
                <p className="text-[9px] text-emerald-500 font-bold">{approvedCount} approved ✓</p>
              )}
            </div>

          </div>

          {/* Bottom: new project */}
          <div className="p-3 border-t border-slate-800/60">
            <button
              onClick={onReset}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-bold text-slate-600 hover:text-slate-300 transition-all cursor-pointer"
            >
              <RotateCcw size={12} /> Start New Project
            </button>
          </div>
        </aside>

        {/* ─── COLUMN 2: CENTRAL CANVAS ────────────────── */}
        <main className="flex-1 overflow-y-auto bg-[#0d0f16]">
          <div className="max-w-4xl mx-auto w-full p-7">

            {activeSection === 'overview' && (
              <WorkspaceOverview
                projectTitle={projectTitle}
                projectType={projectType}
                selectedGenre={selectedGenre}
                selectedStyle={selectedStyle}
                selectedLanguage={selectedLanguage}
                customPremise={customPremise}
                storyGoal={storyGoal}
                selectedVoice={selectedVoice}
                soundtrackEnabled={soundtrackEnabled}
                comicFacesCount={builtCount}
                approvedCount={approvedCount}
                totalPages={totalPages}
                recentActivity={recentActivity}
                onNavigateTo={navigateTo}
                onGenerateFirstScene={() => { navigateTo('pages'); onGenerateBatch(1, 5); }}
              />
            )}

            {activeSection === 'outline' && (
              <WorkspaceOutline
                storyBlueprint={storyBlueprint}
                storyGoal={storyGoal}
                generalNotes={generalNotes}
                onStoryBlueprintChange={onStoryBlueprintChange}
                onStoryGoalChange={onStoryGoalChange}
                onGeneralNotesChange={onGeneralNotesChange}
                onSelectBeat={setSelectedBeat}
                selectedBeatNum={selectedBeat?.chapterNum ?? null}
                onNavigateTo={navigateTo}
              />
            )}

            {activeSection === 'characters' && (
              <div className="space-y-6 text-left animate-fadeIn">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-pink-400 text-xs font-bold font-mono uppercase tracking-wider">
                    <Users size={13} /> Characters
                  </div>
                  <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                    Story Cast
                  </h2>
                  <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
                    Your characters were configured during setup and are applied to every generated page automatically.
                  </p>
                </div>

                <div className="p-8 rounded-2xl border border-slate-800 bg-slate-900/30 text-center space-y-4">
                  <div className="text-5xl">🧑‍🎨</div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-extrabold text-slate-200">
                      Dedicated character editor coming soon
                    </h3>
                    <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                      You will be able to edit character appearances, upload new reference photos, and manage supporting cast members here.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-slate-400">
                    <BellRing size={12} className="text-indigo-400" /> You will be notified when this is ready
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'pages' && (
              <WorkspacePages
                comicFaces={comicFaces as any}
                selectedPageIndex={selectedPageIndex}
                selectedPanelIndex={selectedPanelIndex}
                onSelectPage={onSelectPage}
                onSelectPanel={onSelectPanel}
                onGenerateBatch={onGenerateBatch}
                onGenerateSinglePage={onGenerateSinglePage}
                onApprovePage={onApprovePage}
                onDuplicatePanel={onDuplicatePanel}
                onUpdateText={onUpdateText}
                projectTitle={projectTitle}
                totalPages={totalPages}
              />
            )}

            {activeSection === 'translation' && (
              <WorkspaceTranslation
                comicFaces={comicFaces as any}
                selectedPageIndex={selectedPageIndex}
                onSelectPage={onSelectPage}
                onUpdateTranslation={onUpdateTranslation}
                onUpdateTranslationStatus={onUpdateTranslationStatus}
                sourceLanguage="English"
                targetLanguage={selectedLanguage}
                projectTitle={projectTitle}
                onNavigateTo={navigateTo}
              />
            )}

            {activeSection === 'audio' && (
              <WorkspaceAudio
                comicFaces={comicFaces as any}
                selectedPageIndex={selectedPageIndex}
                onSelectPage={onSelectPage}
                onUpdateAudioScript={onUpdateAudioScript}
                onUpdateAudioStatus={onUpdateAudioStatus}
                projectTitle={projectTitle}
                onNavigateTo={navigateTo}
              />
            )}

            {activeSection === 'export' && (
              <WorkspaceExport
                comicFaces={comicFaces as any}
                projectTitle={projectTitle}
                selectedLanguage={selectedLanguage}
                soundtrackEnabled={soundtrackEnabled}
                onDownloadPDF={onDownloadPDF}
                onNavigateTo={navigateTo}
              />
            )}

            {/* ─── COMING SOON SCREENS ─────────────────── */}
            {(['scenes', 'dialogue'] as WorkspaceSection[]).includes(activeSection) && (() => {
              const meta = COMING_SOON_META[activeSection];
              return (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 animate-fadeIn">
                  <div className="w-24 h-24 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-5xl shadow-inner">
                    {meta.emoji}
                  </div>
                  <div className="space-y-3 max-w-sm">
                    <h3 className="text-2xl font-black text-slate-100">{meta.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{meta.description}</p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/8 border border-indigo-500/15 text-xs font-bold text-indigo-400">
                      <BellRing size={12} /> Available in an upcoming release
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => navigateTo('pages')}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-bold text-white transition-all cursor-pointer shadow-md shadow-indigo-600/20"
                    >
                      <Zap size={14} /> Build Scenes Now
                    </button>
                    <button
                      onClick={() => navigateTo('outline')}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm font-bold text-slate-300 hover:text-white transition-all cursor-pointer"
                    >
                      <List size={14} /> View Outline
                    </button>
                  </div>
                </div>
              );
            })()}

          </div>
        </main>

        {/* ─── COLUMN 3: RIGHT INSPECTOR ───────────────── */}
        <aside className="w-64 shrink-0 border-l border-slate-800/80 bg-slate-950/50 overflow-y-auto p-4 space-y-4">
          <WorkspaceInspector
            activeSection={activeSection}
            selectedBeat={selectedBeat}
            selectedPage={activePage as any}
            selectedPanelIndex={selectedPanelIndex}
            projectTitle={projectTitle}
            projectType={projectType}
            selectedGenre={selectedGenre}
            selectedStyle={selectedStyle}
            selectedLanguage={selectedLanguage}
            storyGoal={storyGoal}
            comicFacesCount={builtCount}
            approvedCount={approvedCount}
            totalPages={totalPages}
            onNavigateTo={navigateTo}
            onApprovePage={onApprovePage}
            onDuplicatePanel={onDuplicatePanel}
            onGenerateSinglePage={onGenerateSinglePage}
          />
        </aside>

      </div>
    </div>
  );
};
