/*
  Screen Name: Workspace Translation
  Purpose: Dedicated surface for side-by-side translation review, bilingual content editing, and glossary preservation settings.
  Version: v2.0
  Phase: Phase 5
  Date: 2026-07-09
  What changed in this revision: Connected to languages API, integrated a glossary management card, and added a simulated translation API executor that keeps names and terms unchanged.
*/

import React, { useState, useEffect } from 'react';
import {
  Globe, SplitSquareHorizontal, CheckCircle, Clock,
  ChevronLeft, ChevronRight, Zap, LayoutTemplate, Send, Check, Plus, Trash, Sparkles
} from 'lucide-react';
import { LanguageRecord, GlossaryEntry } from './types';

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
  sourceLanguage: initialSourceLanguage,
  targetLanguage: initialTargetLanguage,
  projectTitle,
  onNavigateTo,
}) => {
  const [bilingualPreview, setBilingualPreview] = useState(false);
  const [languages, setLanguages] = useState<LanguageRecord[]>([]);
  const [sourceLang, setSourceLang] = useState(initialSourceLanguage === 'English' ? 'en-US' : 'en-US');
  const [targetLang, setTargetLang] = useState(initialTargetLanguage === 'Spanish' ? 'es-MX' : 'es-MX');
  const [glossary, setGlossary] = useState<GlossaryEntry[]>([]);
  const [newSourceTerm, setNewSourceTerm] = useState('');
  const [newPreferredTranslation, setNewPreferredTranslation] = useState('');
  const [newTermType, setNewTermType] = useState<'Name' | 'Science Term' | 'Recurring Phrase'>('Name');
  const [isTranslating, setIsTranslating] = useState(false);

  // Fetch languages and glossary terms
  useEffect(() => {
    fetchLanguages();
    fetchGlossary();
  }, []);

  const fetchLanguages = async () => {
    try {
      const res = await fetch('/api/languages');
      if (res.ok) {
        const data = await res.json();
        setLanguages(data);
      }
    } catch (e) {
      console.error("Failed to fetch languages in workspace", e);
    }
  };

  const fetchGlossary = async () => {
    try {
      const res = await fetch('/api/glossary');
      if (res.ok) {
        const data = await res.json();
        setGlossary(data);
      }
    } catch (e) {
      console.error("Failed to fetch glossary in workspace", e);
    }
  };

  const handleAddGlossaryTerm = async () => {
    if (!newSourceTerm || !newPreferredTranslation) return;
    try {
      const res = await fetch('/api/admin/glossary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceTerm: newSourceTerm,
          preferredTranslation: newPreferredTranslation,
          sourceLanguageCode: sourceLang,
          targetLanguageCode: targetLang,
          termType: newTermType,
          preserveTerm: true,
          scopeType: 'Global',
          internalTestingOnly: false
        })
      });
      if (res.ok) {
        setNewSourceTerm('');
        setNewPreferredTranslation('');
        fetchGlossary();
      }
    } catch (e) {
      console.error("Failed to add glossary term", e);
    }
  };

  const handleDeleteGlossaryTerm = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/glossary/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchGlossary();
      }
    } catch (e) {
      console.error("Failed to delete glossary term", e);
    }
  };

  const handleAutoTranslate = async (field: 'caption' | 'dialogue') => {
    if (!activePage) return;
    const textToTranslate = field === 'caption' ? activePage.narrative?.caption : activePage.narrative?.dialogue;
    if (!textToTranslate) return;

    setIsTranslating(true);
    try {
      const res = await fetch('/api/translation/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToTranslate,
          sourceLang,
          targetLang,
          projectId: 'workspace-project'
        })
      });
      if (res.ok) {
        const data = await res.json();
        onUpdateTranslation(activePage.pageIndex, field, data.translatedText);
        handleStatusChange('draft');
      }
    } catch (e) {
      console.error("Failed to execute translation job", e);
    } finally {
      setIsTranslating(false);
    }
  };

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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0 bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold font-mono uppercase tracking-wider">
            <Globe size={13} />
            <span>Bilingual Translation Operations</span>
          </div>
          <h2 className="text-xl font-black text-slate-100">{projectTitle}</h2>
          <p className="text-xs text-slate-400">
            Configure language settings, protect glossary terms, and approve translated dialogue layers.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div>
            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Source</label>
            <select
              value={sourceLang}
              onChange={e => setSourceLang(e.target.value)}
              className="bg-slate-950 border border-slate-800 p-2 rounded text-xs text-white"
            >
              {languages.map(l => (
                <option key={l.id} value={l.code}>{l.displayName} ({l.nativeName})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Translate into</label>
            <select
              value={targetLang}
              onChange={e => setTargetLang(e.target.value)}
              className="bg-slate-950 border border-slate-800 p-2 rounded text-xs text-white"
            >
              {languages.map(l => (
                <option key={l.id} value={l.code}>{l.displayName} ({l.nativeName})</option>
              ))}
            </select>
          </div>
          <div className="pt-4">
            <button
              onClick={() => setBilingualPreview(!bilingualPreview)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                bilingualPreview 
                  ? 'bg-indigo-600 border border-indigo-500 text-white shadow-md shadow-indigo-600/20' 
                  : 'bg-slate-800 border border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <SplitSquareHorizontal size={13} />
              {bilingualPreview ? 'Bilingual Overlay' : 'Original Only'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden min-h-0">
        {/* Left Column: Thumbnail Strip & Preview & Glossary */}
        <div className="w-1/3 flex flex-col space-y-3 shrink-0 overflow-y-auto pr-1">
          {/* Page nav controls */}
          <div className="flex items-center justify-between text-[10px] shrink-0">
            <span className="font-bold text-slate-500 uppercase tracking-wider font-mono">Pages</span>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  const currentIndex = builtPages.findIndex(p => p.pageIndex === activePage.pageIndex);
                  if (currentIndex > 0) onSelectPage(builtPages[currentIndex - 1].pageIndex);
                }}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <ChevronLeft size={12} />
              </button>
              <button
                onClick={() => {
                  const currentIndex = builtPages.findIndex(p => p.pageIndex === activePage.pageIndex);
                  if (currentIndex < builtPages.length - 1) onSelectPage(builtPages[currentIndex + 1].pageIndex);
                }}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <ChevronRight size={12} />
              </button>
            </div>
          </div>
          
          {/* Thumbnails strip */}
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
                  <div className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full border ${statusClass}`} />
                </button>
              );
            })}
          </div>

          {/* Active Preview */}
          <div className="aspect-[3/4] relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex flex-col group shrink-0">
            <div className="flex-1 min-h-0 relative">
              <img
                src={activePage?.imageUrl}
                alt={pageLabel}
                className="w-full h-full object-contain bg-black/40"
              />
              {bilingualPreview && (activePage?.narrative?.dialogue || activePage?.translation?.dialogue) && (
                <div className="absolute inset-0 p-4 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/30 to-transparent">
                  <div className="p-3 rounded-xl bg-white/95 text-slate-900 shadow-xl space-y-1 transform translate-y-1 transition-all">
                    <p className="text-[9px] font-bold text-slate-500 uppercase">English</p>
                    <p className="text-xs leading-snug">{activePage.narrative?.dialogue}</p>
                    <div className="w-full h-px bg-slate-200 my-1" />
                    <p className="text-[9px] font-bold text-indigo-500 uppercase">Español</p>
                    <p className="text-xs font-bold leading-snug text-indigo-950">
                      {activePage.translation?.dialogue || <span className="text-indigo-900/40 italic">Waiting...</span>}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-between items-center shrink-0">
               <span className="text-xs font-bold text-slate-400">{pageLabel}</span>
               <div className={`px-2.5 py-1 rounded text-[10px] font-bold border flex items-center gap-1 ${getStatusColor(activePage?.translation?.status)}`}>
                 {getStatusLabel(activePage?.translation?.status)}
               </div>
            </div>
          </div>

          {/* Glossary Panel Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3 shrink-0">
            <div className="flex justify-between items-center">
              <h4 className="font-extrabold text-xs text-indigo-400 flex items-center gap-1.5 uppercase">
                <Globe size={13} />
                Protected Glossary Terms
              </h4>
            </div>
            <div className="space-y-1.5 max-h-32 overflow-y-auto scrollbar-thin text-xs">
              {glossary.filter(g => g.sourceLanguageCode === sourceLang && g.targetLanguageCode === targetLang).map(entry => (
                <div key={entry.id} className="flex justify-between items-center bg-slate-950 p-2 rounded border border-slate-805">
                  <div>
                    <span className="font-bold text-white">{entry.sourceTerm}</span>
                    <span className="text-slate-500 mx-2">→</span>
                    <span className="text-indigo-300 font-bold">{entry.preferredTranslation}</span>
                    <span className="ml-2 text-[9px] bg-slate-800 px-1 rounded text-slate-400">{entry.termType}</span>
                  </div>
                  <button onClick={() => handleDeleteGlossaryTerm(entry.id)} className="text-red-400 hover:text-red-300 transition-colors">
                    <Trash size={12} />
                  </button>
                </div>
              ))}
            </div>
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Original name"
                  value={newSourceTerm}
                  onChange={e => setNewSourceTerm(e.target.value)}
                  className="bg-slate-950 border border-slate-800 p-1.5 rounded text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Translation"
                  value={newPreferredTranslation}
                  onChange={e => setNewPreferredTranslation(e.target.value)}
                  className="bg-slate-950 border border-slate-800 p-1.5 rounded text-xs text-white"
                />
              </div>
              <div className="flex justify-between items-center gap-2">
                <select
                  value={newTermType}
                  onChange={e => setNewTermType(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 p-1 rounded text-[10px] text-white"
                >
                  <option value="Name">Name</option>
                  <option value="Science Term">Science Term</option>
                  <option value="Recurring Phrase">Recurring Phrase</option>
                </select>
                <button
                  onClick={handleAddGlossaryTerm}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={10} /> Keep Name Unchanged
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Side-by-Side Editor */}
        <div className="flex-1 flex flex-col min-h-0 bg-slate-900/40 rounded-2xl border border-slate-800 overflow-y-auto relative pb-20">
          <div className="grid grid-cols-2 border-b border-slate-800 sticky top-0 bg-slate-900/95 backdrop-blur z-10 shrink-0">
             <div className="p-3 px-5 border-r border-slate-800 flex items-center gap-2 text-xs font-bold text-slate-300">
               Original Text <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-400 ml-auto font-mono">Source</span>
             </div>
             <div className="p-3 px-5 flex items-center gap-2 text-xs font-bold text-indigo-300">
               Translated Content <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-400 ml-auto font-mono">Target</span>
             </div>
          </div>

          <div className="p-5 space-y-6 flex-1">
            
            {/* Caption Block */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <LayoutTemplate size={12} /> Caption / Narration
                </label>
                <button
                  disabled={isTranslating}
                  onClick={() => handleAutoTranslate('caption')}
                  className="bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/30 text-indigo-300 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles size={11} /> Auto Translate
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-sm text-slate-350 leading-relaxed whitespace-pre-wrap cursor-not-allowed">
                  {activePage?.narrative?.caption || <span className="text-slate-655 italic">No caption generated for this page.</span>}
                </div>
                <div className="relative">
                  <textarea
                    rows={4}
                    value={activePage?.translation?.caption ?? ''}
                    onChange={(e) => {
                      onUpdateTranslation(activePage?.pageIndex ?? 0, 'caption', e.target.value);
                      if (activePage?.translation?.status !== 'draft') handleStatusChange('draft');
                    }}
                    placeholder="Enter translated caption..."
                    className="w-full h-full rounded-xl bg-indigo-950/10 border border-indigo-500/30 text-sm p-4 text-indigo-100 placeholder:text-indigo-400/30 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-indigo-950/20 resize-none leading-relaxed transition-all shadow-inner"
                  />
                </div>
              </div>
            </div>

            {/* Dialogue Block */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Globe size={12} /> Dialogue
                </label>
                <button
                  disabled={isTranslating}
                  onClick={() => handleAutoTranslate('dialogue')}
                  className="bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/30 text-indigo-300 px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles size={11} /> Auto Translate
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-sm text-slate-350 leading-relaxed whitespace-pre-wrap cursor-not-allowed">
                  {activePage?.narrative?.dialogue || <span className="text-slate-655 italic">No dialogue generated for this page.</span>}
                </div>
                <div>
                  <textarea
                    rows={6}
                    value={activePage?.translation?.dialogue ?? ''}
                    onChange={(e) => {
                      onUpdateTranslation(activePage?.pageIndex ?? 0, 'dialogue', e.target.value);
                      if (activePage?.translation?.status !== 'draft') handleStatusChange('draft');
                    }}
                    placeholder="Enter translated dialogue..."
                    className="w-full h-full rounded-xl bg-indigo-950/10 border border-indigo-500/30 text-sm p-4 text-indigo-100 placeholder:text-indigo-400/30 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-indigo-950/20 resize-none leading-relaxed transition-all shadow-inner"
                  />
                </div>
              </div>
            </div>

            {/* Context Notes */}
            <div className="pt-4 border-t border-slate-800">
               <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1">
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
