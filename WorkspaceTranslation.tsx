/*
  Screen Name: Workspace Translation
  Purpose: Dedicated surface for side-by-side translation review and bilingual content editing.
  Version: v1.1
  Phase: Phase 3
  Date: 2026-07-08
  What changed in this revision: Added realistic bilingual preview overlay, clearer status workflow actions, 
           and improved visual separation between source and translated text.
*/

import React, { useState } from 'react';
import {
  Globe, SplitSquareHorizontal, CheckCircle, Clock,
  ChevronLeft, ChevronRight, Zap, LayoutTemplate, Send, Check
} from 'lucide-react';

interface ComicPage {
  id: string;
  pageIndex: number;
  type: string;
  imageUrl?: string;
  narrative?: {
    caption?: string;
    dialogue?: string;
    scene?: string;
  };
  translation?: {
    caption?: string;
    dialogue?: string;
    status: 'not-translated' | 'draft' | 'needs-review' | 'approved';
  };
}

interface WorkspaceTranslationProps {
  comicFaces: ComicPage[];
  selectedPageIndex: number;
  onSelectPage: (index: number) => void;
  onUpdateTranslation: (pageIndex: number, field: string, text: string) => void;
  onUpdateTranslationStatus: (pageIndex: number, status: 'not-translated' | 'draft' | 'needs-review' | 'approved') => void;
  sourceLanguage: string;
  targetLanguage: string;
  projectTitle: string;
  onNavigateTo: (section: string) => void;
}

export const WorkspaceTranslation: React.FC<WorkspaceTranslationProps> = ({
  comicFaces,
  selectedPageIndex,
  onSelectPage,
  onUpdateTranslation,
  onUpdateTranslationStatus,
  sourceLanguage,
  targetLanguage,
  projectTitle,
  onNavigateTo,
}) => {
  const [bilingualPreview, setBilingualPreview] = useState(false);

  // We only translate story pages
  const builtPages = comicFaces.filter(f => f.imageUrl);
  const hasPages = builtPages.length > 0;
  const activePage = builtPages.find(f => f.pageIndex === selectedPageIndex) || builtPages[0] || null;

  const pageLabel = activePage?.type === 'cover' ? 'Cover' : `Page ${activePage?.pageIndex ?? 0}`;

  if (!hasPages) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 animate-fadeIn">
        <div className="w-24 h-24 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-5xl shadow-inner">
          <Globe className="text-slate-600" size={48} />
        </div>
        <div className="space-y-3 max-w-sm">
          <h3 className="text-2xl font-black text-slate-100">No scenes to translate yet</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Generate your story scenes first. Once your visual pages are built, you can translate and review the text here.
          </p>
        </div>
        <div className="pt-2">
          <button
            onClick={() => onNavigateTo('pages')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-bold text-white transition-all cursor-pointer shadow-md shadow-indigo-600/20"
          >
            <Zap size={14} /> Go to Build Scenes
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'approved': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'needs-review': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'draft': return 'text-sky-400 bg-sky-400/10 border-sky-400/20';
      default: return 'text-slate-500 bg-slate-800 border-slate-700';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'approved': return 'Approved for publishing';
      case 'needs-review': return 'Needs review';
      case 'draft': return 'Draft translation';
      default: return 'Not translated';
    }
  };

  const handleStatusChange = (status: 'not-translated' | 'draft' | 'needs-review' | 'approved') => {
    if (activePage) onUpdateTranslationStatus(activePage.pageIndex, status);
  };

  return (
    <div className="space-y-5 text-left animate-fadeIn h-full flex flex-col">
      {/* PAGE HEADER */}
      <div className="flex items-start justify-between gap-4 shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold font-mono uppercase tracking-wider">
            <Globe size={13} />
            <span>Translation Editor</span>
          </div>
          <h2 className="text-2xl font-black text-slate-100">
            {projectTitle}
          </h2>
          <p className="text-sm text-slate-500">
            Translate and review the dialogue and narration for your story pages.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setBilingualPreview(!bilingualPreview)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              bilingualPreview 
                ? 'bg-indigo-600 border border-indigo-500 text-white shadow-md shadow-indigo-600/20' 
                : 'bg-slate-800 border border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <SplitSquareHorizontal size={14} />
            {bilingualPreview ? 'Show Both Languages' : 'Show Original Only'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden min-h-0">
        {/* Left Column: Thumbnail Strip & Preview */}
        <div className="w-1/3 flex flex-col space-y-3 shrink-0">
          {/* Controls */}
          <div className="flex items-center justify-between text-[10px] shrink-0">
            <span className="font-bold text-slate-600 uppercase tracking-wider font-mono">Pages</span>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  const currentIndex = builtPages.findIndex(p => p.pageIndex === activePage.pageIndex);
                  if (currentIndex > 0) onSelectPage(builtPages[currentIndex - 1].pageIndex);
                }}
                className="p-1 rounded-lg bg-slate-800 text-slate-500 hover:text-white transition-all cursor-pointer"
              >
                <ChevronLeft size={12} />
              </button>
              <button
                onClick={() => {
                  const currentIndex = builtPages.findIndex(p => p.pageIndex === activePage.pageIndex);
                  if (currentIndex < builtPages.length - 1) onSelectPage(builtPages[currentIndex + 1].pageIndex);
                }}
                className="p-1 rounded-lg bg-slate-800 text-slate-500 hover:text-white transition-all cursor-pointer"
              >
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
          
          {/* Strip */}
          <div className="flex gap-2 overflow-x-auto pb-1 shrink-0 scrollbar-thin">
            {builtPages.map((page) => {
              const isSelected = page.pageIndex === selectedPageIndex;
              const statusClass = getStatusColor(page.translation?.status);
              return (
                <button
                  key={page.id}
                  onClick={() => onSelectPage(page.pageIndex)}
                  className={`relative group flex-shrink-0 w-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                      : 'border-slate-800 hover:border-slate-600'
                  }`}
                  style={{ aspectRatio: '3/4' }}
                >
                  <img
                    src={page.imageUrl}
                    alt={`Page ${page.pageIndex}`}
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100"
                  />
                  {/* Status Indicator */}
                  <div className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full border ${statusClass}`} />
                </button>
              );
            })}
          </div>

          {/* Active Preview */}
          <div className="flex-1 relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 min-h-0 flex flex-col group">
            <div className="flex-1 min-h-0 relative">
              <img
                src={activePage?.imageUrl}
                alt={pageLabel}
                className="w-full h-full object-contain bg-black/40"
              />
              {/* Realistic Bilingual Preview Overlay */}
              {bilingualPreview && (activePage?.narrative?.dialogue || activePage?.translation?.dialogue) && (
                <div className="absolute inset-0 p-4 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/20 to-transparent">
                  <div className="p-3 rounded-xl bg-white/95 text-slate-900 shadow-xl space-y-1.5 transform translate-y-2 group-hover:translate-y-0 transition-all">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">{sourceLanguage}</p>
                    <p className="text-xs font-medium leading-snug">{activePage.narrative?.dialogue}</p>
                    <div className="w-full h-px bg-slate-200 my-2" />
                    <p className="text-[10px] font-bold text-indigo-500 uppercase">{targetLanguage}</p>
                    <p className="text-xs font-bold leading-snug text-indigo-950">
                      {activePage.translation?.dialogue || <span className="text-indigo-900/40 italic">Waiting for translation...</span>}
                    </p>
                  </div>
                </div>
              )}
            </div>
            {/* Status bar */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-between items-center shrink-0">
               <span className="text-xs font-bold text-slate-400">{pageLabel}</span>
               <div className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border flex items-center gap-1.5 ${getStatusColor(activePage?.translation?.status)}`}>
                 {activePage?.translation?.status === 'approved' ? <CheckCircle size={11} /> : <Clock size={11} />}
                 {getStatusLabel(activePage?.translation?.status)}
               </div>
            </div>
          </div>
        </div>

        {/* Right Column: Side-by-Side Editor */}
        <div className="flex-1 flex flex-col min-h-0 bg-slate-900/40 rounded-2xl border border-slate-800 overflow-y-auto relative">
          {/* Header */}
          <div className="grid grid-cols-2 border-b border-slate-800 sticky top-0 bg-slate-900/95 backdrop-blur z-10 shrink-0">
             <div className="p-3 px-5 border-r border-slate-800 flex items-center gap-2 text-xs font-bold text-slate-300">
               Original Text <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-400 ml-auto font-mono">{sourceLanguage}</span>
             </div>
             <div className="p-3 px-5 flex items-center gap-2 text-xs font-bold text-indigo-300">
               Translated Content <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-400 ml-auto font-mono">{targetLanguage}</span>
             </div>
          </div>

          <div className="p-5 space-y-6 flex-1 pb-24">
            
            {/* Caption Block */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <LayoutTemplate size={12} /> Caption / Narration
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap cursor-not-allowed">
                  {activePage?.narrative?.caption || <span className="text-slate-600 italic">No caption generated for this page.</span>}
                </div>
                <div className="relative">
                  <textarea
                    rows={4}
                    value={activePage?.translation?.caption ?? ''}
                    onChange={(e) => {
                      onUpdateTranslation(activePage?.pageIndex ?? 0, 'caption', e.target.value);
                      if (activePage?.translation?.status !== 'draft') handleStatusChange('draft');
                    }}
                    placeholder={`Enter ${targetLanguage} translation here...`}
                    className="w-full h-full rounded-xl bg-indigo-950/10 border border-indigo-500/30 text-sm p-4 text-indigo-100 placeholder:text-indigo-400/30 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-indigo-950/20 resize-none leading-relaxed transition-all shadow-inner"
                  />
                </div>
              </div>
            </div>

            {/* Dialogue Block */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Globe size={12} /> Dialogue
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap cursor-not-allowed">
                  {activePage?.narrative?.dialogue || <span className="text-slate-600 italic">No dialogue generated for this page.</span>}
                </div>
                <div>
                  <textarea
                    rows={6}
                    value={activePage?.translation?.dialogue ?? ''}
                    onChange={(e) => {
                      onUpdateTranslation(activePage?.pageIndex ?? 0, 'dialogue', e.target.value);
                      if (activePage?.translation?.status !== 'draft') handleStatusChange('draft');
                    }}
                    placeholder={`Enter ${targetLanguage} translation here...`}
                    className="w-full h-full rounded-xl bg-indigo-950/10 border border-indigo-500/30 text-sm p-4 text-indigo-100 placeholder:text-indigo-400/30 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-indigo-950/20 resize-none leading-relaxed transition-all shadow-inner"
                  />
                </div>
              </div>
            </div>

            {/* Context Notes */}
            <div className="pt-4 border-t border-slate-800">
               <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-2">
                 <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Scene Context</h4>
                 <p className="text-xs text-slate-400 leading-relaxed">
                   {activePage?.narrative?.scene || "No scene context available."}
                 </p>
               </div>
            </div>
          </div>

          {/* Workflow Actions Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-slate-900/95 backdrop-blur border-t border-slate-800 flex items-center justify-end gap-3 shrink-0">
             <button
               onClick={() => handleStatusChange('needs-review')}
               className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
             >
               <Send size={14} className="text-amber-400" />
               Submit for Review
             </button>
             <button
               onClick={() => handleStatusChange('approved')}
               className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-colors cursor-pointer shadow-md shadow-emerald-600/20"
             >
               <Check size={14} />
               Approve Translation
             </button>
          </div>
        </div>

      </div>
    </div>
  );
};
