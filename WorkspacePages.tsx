/*
  Screen Name: Workspace Pages (Build Scenes)
  Purpose: Central scene generation and page management view. Lets the creator generate,
           browse, approve, and edit individual story pages. Each page corresponds to one
           illustrated scene in the finished book.
  Version: v1.1
  Phase: Phase 2
  Date: 2026-07-08
  What changed in this revision: Audit pass. Renamed "Generate Scenes" to "Build Scenes"
           throughout (consistent with top bar). Replaced "Preview mode — sample scenes shown"
           with a calm, friendly helper note. Added a loading-state indicator on thumbnails.
           Improved the hero panel empty state — no "mode" language. Tightened panel toolbar
           copy. Improved dialogue/caption field labels. Fixed the "Generate All" button label
           to "Build All Scenes". Improved hero panel fallback message. Added subtle animation
           to generating thumbnails.
*/

import React, { useState } from 'react';
import {
  ImageIcon, Zap, ChevronLeft, ChevronRight, CheckCircle,
  Maximize2, Edit3, RefreshCw, Volume2, AlignLeft,
  MessageSquare, Layers, Plus, Loader, BookOpen
} from 'lucide-react';

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

// ─── Page Thumbnail ───────────────────────────────────────────────────────────

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
          <span className="text-[8px] text-indigo-400 font-bold">Building…</span>
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

// ─── Main Component ───────────────────────────────────────────────────────────

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
  const [showGrid, setShowGrid] = useState(false);

  const activePage = comicFaces.find(f => f.pageIndex === selectedPageIndex) || comicFaces[0] || null;
  const hasPages = comicFaces.length > 0;
  const builtCount = comicFaces.filter(f => f.imageUrl).length;
  const pageLabel = activePage?.type === 'cover' ? 'Cover' : `Page ${activePage?.pageIndex ?? 0}`;

  return (
    <div className="space-y-5 text-left animate-fadeIn">

      {/* PAGE HEADER */}
      <div className="flex items-start justify-between gap-4">
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
            id="pages-build-all"
            onClick={() => onGenerateBatch(1, totalPages)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-xs font-extrabold text-white transition-all cursor-pointer shadow-md shadow-indigo-600/20"
          >
            <Zap size={13} /> Build All Scenes
          </button>
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
            {activePage?.isLoading ? (
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
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => activePage && onGenerateSinglePage('story', activePage.pageIndex, 'story')}
                    title="Rebuild this page"
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
                  onClick={() => onGenerateBatch(1, 5)}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-sm font-extrabold text-white transition-all cursor-pointer shadow-md shadow-indigo-600/20"
                >
                  <Zap size={14} /> Build First 5 Pages
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
                onClick={() => onGenerateSinglePage('story', activePage.pageIndex, 'story')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <RefreshCw size={13} /> Rebuild
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

        {/* Right: text & details editor */}
        <div className="lg:col-span-2 space-y-4">
          {activePage ? (
            <>
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
                  rows={5}
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

                <button
                  onClick={() => onGenerateSinglePage('story', activePage.pageIndex, 'story')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all cursor-pointer"
                >
                  <RefreshCw size={12} /> Apply & Rebuild
                </button>
              </div>

              {/* Narration */}
              <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                  <Volume2 size={14} className="text-violet-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400">Narration</p>
                  <p className="text-[10px] text-slate-700 leading-relaxed">
                    Audio narration is generated when you play this page in the book reader.
                  </p>
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
