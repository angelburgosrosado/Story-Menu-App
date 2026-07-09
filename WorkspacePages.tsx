/*
  Screen/Component Name: Workspace Pages (Build Scenes)
  Purpose: Central scene generation, style selection, character consistency, and page management view.
  Version: v1.3
  Phase/Refinement: Phase 4 - Image Generation Integration
  Date: 2026-07-09
  Change summary: Integrated managed style cards, character consistency metadata boxes, image generation jobs tracking, and cover/panel sibling generation triggers with simulated AI loading states.
*/

import React, { useState, useEffect } from 'react';
import {
  ImageIcon, Zap, ChevronLeft, ChevronRight, CheckCircle,
  Maximize2, Edit3, RefreshCw, Volume2, AlignLeft,
  MessageSquare, Layers, Plus, Loader, BookOpen, Sparkles, Check, Info, Trash2
} from 'lucide-react';
import { StyleRecord, ImageGenerationJob, PanelGenerationRequest, CoverGenerationRequest, GeneratedAsset } from './types';

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
  };
  panelGridStyle?: 'single' | 'split-2' | 'classic-4';
  panelPrompts?: string[];
  panelImages?: string[];
}

interface WorkspacePagesProps {
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
  projectTitle: string;
  totalPages: number;
}

const PageThumbnail: React.FC<{
  page: ComicPage;
  isSelected: boolean;
  onClick: () => void;
}> = ({ page, isSelected, onClick }) => {
  const label = page.type === 'cover' ? 'Cover' : `Page ${page.pageIndex}`;
  const isBuilding = page.isLoading;
  const hasImage = !!page.imageUrl;

  return (
    <button
      id={`page-thumb-${page.pageIndex}`}
      onClick={onClick}
      className={`relative group flex-shrink-0 w-20 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
        isSelected
          ? 'border-indigo-500 ring-2 ring-indigo-500/20'
          : 'border-slate-800 hover:border-slate-600'
      }`}
      style={{ aspectRatio: '3/4' }}
    >
      {hasImage ? (
        <img
          src={page.imageUrl}
          alt={label}
          className="w-full h-full object-cover"
        />
      ) : isBuilding ? (
        <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center gap-2">
          <Loader size={16} className="text-indigo-400 animate-spin" />
          <span className="text-[8px] text-indigo-400 font-bold font-mono">Building…</span>
        </div>
      ) : (
        <div className="w-full h-full bg-slate-900 flex items-center justify-center">
          <ImageIcon size={16} className="text-slate-700" />
        </div>
      )}

      {/* Approved badge */}
      {page.isApproved && (
        <div className="absolute top-1 right-1">
          <CheckCircle size={12} className="text-emerald-400 fill-emerald-400/30" />
        </div>
      )}

      {/* Label */}
      <div className="absolute bottom-0 inset-x-0 px-1.5 py-1 bg-gradient-to-t from-slate-950 to-transparent">
        <p className="text-[8px] font-bold text-slate-400 text-center truncate">{label}</p>
      </div>
    </button>
  );
};

export const WorkspacePages: React.FC<WorkspacePagesProps> = ({
  comicFaces,
  selectedPageIndex,
  selectedPanelIndex,
  onSelectPage,
  onSelectPanel,
  onGenerateBatch,
  onGenerateSinglePage,
  onApprovePage,
  onDuplicatePanel,
  onUpdateText,
  projectTitle,
  totalPages,
}) => {
  const [activeTab, setActiveTab] = useState<'scene' | 'dialogue' | 'caption'>('scene');
  const [styles, setStyles] = useState<StyleRecord[]>([]);
  const [selectedStyleId, setSelectedStyleId] = useState<string>('style-pixar-3d');
  const [jobs, setJobs] = useState<ImageGenerationJob[]>([]);
  const [isGeneratingScene, setIsGeneratingScene] = useState<boolean>(false);
  const [isGeneratingCover, setIsGeneratingCover] = useState<boolean>(false);
  const [selectedLanguageMode, setSelectedLanguageMode] = useState<'original' | 'bilingual-parallel' | 'bilingual-alternating'>('original');

  // Load styles
  useEffect(() => {
    fetch('/api/styles')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setStyles(data);
          if (data.length > 0) {
            setSelectedStyleId(data[0].id);
          }
        }
      })
      .catch(err => console.error("Error fetching styles:", err));
  }, []);

  // Fetch recent jobs
  const fetchJobs = () => {
    fetch('/api/image/jobs')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setJobs(data);
        }
      })
      .catch(err => console.error("Error fetching jobs:", err));
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 8000);
    return () => clearInterval(interval);
  }, []);

  const activePage = comicFaces.find(f => f.pageIndex === selectedPageIndex) || comicFaces[0] || null;
  const hasPages = comicFaces.length > 0;
  const builtCount = comicFaces.filter(f => f.imageUrl).length;
  const pageLabel = activePage?.type === 'cover' ? 'Cover' : `Page ${activePage?.pageIndex ?? 0}`;

  // Triggers panel generation endpoint
  const handleGeneratePanelScene = async () => {
    if (!activePage) return;
    setIsGeneratingScene(true);
    try {
      const response = await fetch('/api/image/generate-panel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'current-workspace-project',
          panelTitle: pageLabel,
          beatSummary: activePage.narrative?.scene || 'A mysterious introduction beat.',
          styleId: selectedStyleId,
          personaIds: [],
          languageHandlingMode: selectedLanguageMode
        })
      });
      if (response.ok) {
        fetchJobs();
        // Invoke local callback to refresh state
        onGenerateSinglePage('story', activePage.pageIndex, activePage.type);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingScene(false);
    }
  };

  // Triggers cover generation endpoint
  const handleGenerateCoverScene = async () => {
    setIsGeneratingCover(true);
    try {
      const response = await fetch('/api/image/generate-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: 'current-workspace-project',
          title: projectTitle,
          subtitle: 'An Illustrated Adventure Story',
          styleId: selectedStyleId,
          personaIds: []
        })
      });
      if (response.ok) {
        fetchJobs();
        onGenerateSinglePage('cover', 0, 'cover');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingCover(false);
    }
  };

  return (
    <div className="space-y-5 text-left animate-fadeIn">

      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold font-mono uppercase tracking-wider">
            <ImageIcon size={13} />
            <span>Build Scenes</span>
          </div>
          <h2 className="text-2xl font-black text-slate-100">
            {projectTitle}
          </h2>
          <p className="text-sm text-slate-500">
            {hasPages
              ? `${builtCount} of ${totalPages} pages built`
              : 'No pages yet — generate your first scene below'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleGenerateCoverScene}
            disabled={isGeneratingCover}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-all border border-slate-700"
          >
            {isGeneratingCover ? <Loader size={12} className="animate-spin text-slate-400" /> : <Sparkles size={12} className="text-purple-400" />}
            Create Cover
          </button>
          <button
            id="pages-build-all"
            onClick={() => onGenerateBatch(1, totalPages)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-xs font-extrabold text-white transition-all cursor-pointer shadow-md shadow-indigo-600/20"
          >
            <Zap size={13} /> Build All Scenes
          </button>
        </div>
      </div>

      {/* STYLE SELECTION MATRIX */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">
            Choose an Illustration Style
          </h4>
          <span className="text-[9px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold">
            Managed Library
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {styles.map((style) => (
            <div
              key={style.id}
              onClick={() => setSelectedStyleId(style.id)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between text-left space-y-2 ${
                selectedStyleId === style.id
                  ? 'bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/5'
                  : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-slate-200">{style.title}</span>
                  {selectedStyleId === style.id && (
                    <span className="w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center">
                      <Check size={8} className="text-white" />
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">{style.shortDescription}</p>
              </div>
              <div className="flex flex-wrap gap-1 pt-1">
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                  {style.styleFamily}
                </span>
                {style.featured && (
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                    Popular
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* THUMBNAIL STRIP */}
      {hasPages && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-bold text-slate-600 uppercase tracking-wider font-mono">Pages</span>
            <div className="flex gap-2">
              <button
                onClick={() => onSelectPage(Math.max(0, selectedPageIndex - 1))}
                className="p-1 rounded-lg bg-slate-800 text-slate-500 hover:text-white transition-all cursor-pointer"
              >
                <ChevronLeft size={12} />
              </button>
              <button
                onClick={() => onSelectPage(Math.min(comicFaces.length - 1, selectedPageIndex + 1))}
                className="p-1 rounded-lg bg-slate-800 text-slate-500 hover:text-white transition-all cursor-pointer"
              >
                <ChevronRight size={12} />
              </button>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {comicFaces
              .slice()
              .sort((a, b) => (a.pageIndex || 0) - (b.pageIndex || 0))
              .map(page => (
                <PageThumbnail
                  key={page.id}
                  page={page}
                  isSelected={page.pageIndex === selectedPageIndex}
                  onClick={() => onSelectPage(page.pageIndex)}
                />
              ))}
          </div>
        </div>
      )}

      {/* MAIN HERO PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* Left: primary page canvas */}
        <div className="lg:col-span-3 space-y-3">
          <div
            id="pages-hero-panel"
            className={`relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center ${
              activePage?.imageUrl ? '' : 'aspect-[3/4]'
            }`}
            style={activePage?.imageUrl ? { aspectRatio: '3/4' } : undefined}
          >
            {activePage?.isLoading || isGeneratingScene ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-900">
                <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                  <Loader size={26} className="text-indigo-400 animate-spin" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-extrabold text-slate-200">Building {pageLabel}…</p>
                  <p className="text-xs text-slate-600">Generating your illustrated scene</p>
                </div>
              </div>
            ) : activePage?.imageUrl ? (
              <>
                <img
                  src={activePage.imageUrl}
                  alt={pageLabel}
                  className="w-full h-full object-cover"
                />
                {/* Overlay controls */}
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    onClick={handleGeneratePanelScene}
                    title="Regenerate panel"
                    className="p-2 rounded-lg bg-slate-900/80 backdrop-blur border border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
                  >
                    <RefreshCw size={13} />
                  </button>
                </div>
                {activePage.isApproved && (
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/30 backdrop-blur">
                    <CheckCircle size={12} className="text-emerald-400" />
                    <span className="text-[10px] font-bold text-emerald-400">Approved</span>
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <BookOpen size={26} className="text-slate-600" />
                </div>
                <div className="space-y-1.5">
                  <p className="font-extrabold text-sm text-slate-300">Ready to generate</p>
                  <p className="text-xs text-slate-600 max-w-xs leading-relaxed">
                    Click <strong className="text-indigo-400">Build All Scenes</strong> to generate your full story, or build individual pages from the outline.
                  </p>
                </div>
                <button
                  id="pages-first-generate"
                  onClick={handleGeneratePanelScene}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-sm font-extrabold text-white transition-all cursor-pointer shadow-md shadow-indigo-600/20"
                >
                  <Zap size={14} /> Build First Page
                </button>
              </div>
            )}
          </div>

          {/* Page action bar */}
          {activePage && (
            <div className="flex items-center gap-2">
              <button
                id="pages-approve-page"
                onClick={() => onApprovePage(activePage.pageIndex)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  activePage.isApproved
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <CheckCircle size={13} />
                {activePage.isApproved ? 'Approved ✓' : 'Mark as Approved'}
              </button>
              <button
                id="pages-rebuild-page"
                onClick={handleGeneratePanelScene}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <RefreshCw size={13} /> Regenerate panel
              </button>
              <button
                id="pages-duplicate-page"
                onClick={() => onDuplicatePanel(activePage.pageIndex)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <Layers size={13} /> Duplicate
              </button>
            </div>
          )}
        </div>

        {/* Right: text & details editor + visual consistency settings */}
        <div className="lg:col-span-2 space-y-4">
          {activePage ? (
            <>
              {/* Character consistency preparation */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">
                    Visual Consistency
                  </span>
                  <span className="text-[9px] text-slate-500">Step 4 Persona Inherited</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800 text-[10px] text-slate-400 space-y-1.5 leading-relaxed">
                  <div className="flex items-center gap-1.5 text-indigo-400 font-bold">
                    <Sparkles size={11} />
                    <span>Appearance Lock Hints:</span>
                  </div>
                  <p>• Cast members are mapped automatically based on the story outline and casting configurations.</p>
                  <p>• Preferred illustration style prompts are concatenated to enforce layout grids and style-family constants.</p>
                </div>
              </div>

              {/* Page info */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-[10px] uppercase font-mono">
                  <ImageIcon size={11} /> {pageLabel}
                </div>
                <div className="flex gap-4 text-[10px] text-slate-600">
                  <span>Layout: <strong className="text-slate-400">
                    {activePage.panelGridStyle === 'classic-4' ? '4-Panel Grid'
                      : activePage.panelGridStyle === 'split-2' ? '2-Panel Split'
                      : 'Full Page'}
                  </strong></span>
                  <span>Status: <strong className={activePage.isApproved ? 'text-emerald-400' : 'text-amber-400'}>
                    {activePage.isApproved ? 'Approved' : 'In Progress'}
                  </strong></span>
                </div>
              </div>

              {/* Text editor — tabs */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex gap-1 bg-slate-950 rounded-xl p-1">
                  {[
                    { key: 'scene' as const,    icon: <AlignLeft size={11} />,     label: 'Scene' },
                    { key: 'dialogue' as const, icon: <MessageSquare size={11} />, label: 'Dialogue' },
                    { key: 'caption' as const,  icon: <Edit3 size={11} />,         label: 'Caption' },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        activeTab === tab.key
                          ? 'bg-slate-800 text-white'
                          : 'text-slate-600 hover:text-slate-400'
                      }`}
                    >
                      {tab.icon} {tab.label}
                    </button>
                  ))}
                </div>

                <textarea
                  rows={4}
                  value={
                    activeTab === 'scene'
                      ? activePage.narrative?.scene ?? ''
                      : activeTab === 'dialogue'
                      ? activePage.narrative?.dialogue ?? ''
                      : activePage.narrative?.caption ?? ''
                  }
                  onChange={(e) => onUpdateText(activePage.pageIndex, activeTab, e.target.value)}
                  placeholder={
                    activeTab === 'scene'
                      ? 'Describe the setting and action in this scene…'
                      : activeTab === 'dialogue'
                      ? 'Add character dialogue, speech bubbles, or exchanges…'
                      : 'Add a narration caption or page note…'
                  }
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 text-xs p-3 text-slate-300 placeholder:text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none leading-relaxed"
                />

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Language Handling Mode</label>
                  <select
                    value={selectedLanguageMode}
                    onChange={(e) => setSelectedLanguageMode(e.target.value as any)}
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 text-xs p-2 text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="original">Original Text Only</option>
                    <option value="bilingual-parallel">Bilingual Parallel Text</option>
                    <option value="bilingual-alternating">Bilingual Alternating Beats</option>
                  </select>
                </div>

                <button
                  onClick={handleGeneratePanelScene}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all cursor-pointer"
                >
                  <RefreshCw size={12} /> Apply & Rebuild
                </button>
              </div>

              {/* Recent Generation Jobs Feed */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono block">
                  Image Generation Jobs
                </span>
                <div className="space-y-1.5 max-h-32 overflow-y-auto scrollbar-thin">
                  {jobs.length > 0 ? (
                    jobs.slice(0, 3).map((job) => (
                      <div key={job.id} className="flex justify-between items-center text-[10px] p-1.5 rounded bg-slate-950/40 border border-slate-850">
                        <span className="text-slate-400 truncate max-w-[150px] font-mono">{job.id.substring(0, 8)}... ({job.requestType})</span>
                        <span className={`px-1.5 py-0.5 rounded font-bold ${
                          job.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-yellow-500/10 text-yellow-400'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-600 italic block">No jobs recorded yet.</span>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col items-center text-center gap-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                Select a page from the strip above to view and edit its content.
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
