/*
  Screen Name: Workspace Reader Preview
  Purpose: A dedicated viewing mode for reviewing the generated visual story in a presentation-quality format.
  Version: v1.0
  Phase: Phase 5
  Date: 2026-07-08
  What changed in this revision: Initial creation. Supports single, spread, and mobile view modes.
*/

import React, { useState } from 'react';
import {
  X, ChevronLeft, ChevronRight, Layout, LayoutPanelLeft, Smartphone,
  Languages, Download, Play, Pause, Zap, BookOpen, AlertTriangle, Book
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
  audio?: {
    script?: string;
    status: 'no-audio' | 'draft' | 'needs-review' | 'approved';
  };
}

interface WorkspaceReaderProps {
  projectTitle: string;
  comicFaces: ComicPage[];
  selectedLanguage: string;
  onClose: () => void;
  onEditPage: (pageIndex: number) => void;
  onExport: () => void;
}

export const WorkspaceReader: React.FC<WorkspaceReaderProps> = ({
  projectTitle,
  comicFaces,
  selectedLanguage,
  onClose,
  onEditPage,
  onExport,
}) => {
  const [viewMode, setViewMode] = useState<'single' | 'spread' | 'mobile'>('single');
  const [langMode, setLangMode] = useState<'original' | 'translated' | 'bilingual'>('original');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const isBilingual = selectedLanguage && selectedLanguage !== 'en-US';
  const builtPages = comicFaces.filter(f => f.imageUrl);
  const hasPages = builtPages.length > 0;

  if (!hasPages) {
    return (
      <div className="absolute inset-0 z-[120] flex items-center justify-center bg-slate-950/95 backdrop-blur-md animate-fadeIn">
        <div className="flex flex-col items-center justify-center p-8 max-w-md text-center space-y-6">
          <div className="w-24 h-24 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-inner">
            <BookOpen className="text-slate-600" size={48} />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-slate-100">Your story is almost ready</h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              You haven’t generated any pages yet. Go to Build Scenes to create your first illustrated pages and dialogue.
            </p>
          </div>
          <div className="pt-4 flex gap-4">
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-bold text-white transition-all cursor-pointer shadow-md shadow-indigo-600/20"
            >
              <Zap size={16} /> Go to Build Scenes
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Ensure index bounds
  const safeIndex = Math.min(Math.max(0, currentIndex), builtPages.length - 1);
  const activePage = builtPages[safeIndex];
  
  // For spread view
  const isLeftPage = safeIndex % 2 !== 0; // page 0 is right (cover), 1 is left, 2 is right...
  const leftPage = isLeftPage ? builtPages[safeIndex] : (safeIndex > 0 ? builtPages[safeIndex - 1] : null);
  const rightPage = isLeftPage ? (safeIndex + 1 < builtPages.length ? builtPages[safeIndex + 1] : null) : builtPages[safeIndex];

  const handlePrev = () => {
    if (viewMode === 'spread') {
      setCurrentIndex(Math.max(0, safeIndex - 2));
    } else {
      setCurrentIndex(Math.max(0, safeIndex - 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'spread') {
      setCurrentIndex(Math.min(builtPages.length - 1, safeIndex + 2));
    } else {
      setCurrentIndex(Math.min(builtPages.length - 1, safeIndex + 1));
    }
  };

  const renderTextContent = (page: ComicPage) => {
    const origText = [page.narrative?.caption, page.narrative?.dialogue].filter(Boolean).join('\n\n');
    const transText = [page.translation?.caption, page.translation?.dialogue].filter(Boolean).join('\n\n');

    return (
      <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 text-left">
        {(langMode === 'original' || langMode === 'bilingual') && origText && (
          <p className="text-sm text-slate-300 font-serif leading-relaxed whitespace-pre-wrap">{origText}</p>
        )}
        {langMode === 'bilingual' && origText && transText && (
          <div className="h-px bg-slate-800 w-full" />
        )}
        {(langMode === 'translated' || langMode === 'bilingual') && transText && (
          <p className="text-sm text-indigo-300 font-serif leading-relaxed whitespace-pre-wrap">{transText}</p>
        )}
        
        {langMode !== 'original' && !transText && (
          <div className="flex items-center gap-2 text-[10px] font-bold text-amber-500 uppercase">
            <AlertTriangle size={12} /> Missing Translation
          </div>
        )}
      </div>
    );
  };

  const renderPage = (page: ComicPage | null) => {
    if (!page) return <div className="flex-1 opacity-10" />; // Empty slot in spread
    
    return (
      <div className="flex-1 h-full flex flex-col relative group max-w-2xl mx-auto">
        <div className="flex-1 relative rounded-lg overflow-hidden shadow-2xl bg-black min-h-0">
          <img src={page.imageUrl} className="w-full h-full object-contain" alt={`Page ${page.pageIndex}`} />
        </div>
        {renderTextContent(page)}
        
        {/* Editor Edit Shortcut Hover */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => { onClose(); onEditPage(page.pageIndex); }}
            className="px-3 py-1.5 rounded-lg bg-indigo-600/90 text-[10px] font-bold text-white shadow-xl backdrop-blur-md cursor-pointer hover:bg-indigo-500"
          >
            Edit Page
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[120] flex flex-col bg-slate-950/95 backdrop-blur-xl animate-fadeIn">
      {/* Top Toolbar */}
      <header className="sm:h-16 py-3 sm:py-0 border-b border-slate-900 px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center shrink-0 bg-slate-950/80 gap-3 sm:gap-0">
        <div className="flex items-center justify-between w-full sm:w-auto sm:gap-6">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center group-hover:bg-slate-800 transition-colors">
              <X size={16} />
            </div>
            <span className="hidden sm:inline">Exit Reader</span>
          </button>
          
          <div className="hidden sm:block h-8 w-px bg-slate-800" />
          
          <div className="space-y-0.5 text-right sm:text-left">
            <h2 className="text-sm font-black text-slate-100 truncate max-w-[150px] sm:max-w-none">{projectTitle}</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Page {activePage.pageIndex === 0 ? 'Cover' : activePage.pageIndex} of {builtPages.length}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 w-full sm:w-auto">
          
          {/* Audio Controls */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 mr-2">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <span className="text-[10px] font-bold text-slate-500 uppercase">Narration</span>
          </div>

          {/* Language Mode */}
          {isBilingual && (
            <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-800">
              <button
                onClick={() => setLangMode('original')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${langMode === 'original' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-300'}`}
                title="Original"
              >
                <Book size={14} className="sm:hidden" />
                <span className="hidden sm:inline">Original</span>
              </button>
              <button
                onClick={() => setLangMode('translated')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${langMode === 'translated' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-300'}`}
                title="Translated"
              >
                <BookOpen size={14} className="sm:hidden" />
                <span className="hidden sm:inline">Translated</span>
              </button>
              <button
                onClick={() => setLangMode('bilingual')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${langMode === 'bilingual' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-300'}`}
                title="Bilingual"
              >
                <Languages size={14} /> <span className="hidden sm:inline">Bilingual</span>
              </button>
            </div>
          )}

          {/* View Mode */}
          <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-800">
            <button
              onClick={() => setViewMode('single')}
              title="Single Page"
              className={`p-2 rounded-lg transition-all cursor-pointer ${viewMode === 'single' ? 'bg-slate-800 text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Layout size={16} />
            </button>
            <button
              onClick={() => setViewMode('spread')}
              title="Two-Page Spread"
              className={`p-2 rounded-lg transition-all cursor-pointer ${viewMode === 'spread' ? 'bg-slate-800 text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <LayoutPanelLeft size={16} />
            </button>
            <button
              onClick={() => setViewMode('mobile')}
              title="Mobile Preview"
              className={`p-2 rounded-lg transition-all cursor-pointer ${viewMode === 'mobile' ? 'bg-slate-800 text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Smartphone size={16} />
            </button>
          </div>

          <div className="hidden sm:block h-8 w-px bg-slate-800 mx-1" />

          <button
            onClick={onExport}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-white text-slate-900 text-xs font-bold transition-all cursor-pointer shadow-lg"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </header>

      {/* Main Canvas */}
      <main className="flex-1 flex flex-col min-h-0 relative">
        <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto min-h-0">
          
          {viewMode === 'single' && (
            <div className="w-full max-w-2xl h-full flex items-center justify-center">
              {renderPage(activePage)}
            </div>
          )}

          {viewMode === 'spread' && (
            <div className="w-full max-w-5xl h-full flex items-stretch justify-center gap-8">
              {renderPage(leftPage)}
              {renderPage(rightPage)}
            </div>
          )}

          {viewMode === 'mobile' && (
            <div className="w-full max-w-[375px] h-full max-h-[812px] bg-black rounded-[3rem] border-[14px] border-slate-900 overflow-hidden shadow-2xl relative flex flex-col mx-auto">
              <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 z-10 flex items-end justify-center rounded-b-3xl w-40 mx-auto" />
              <img src={activePage.imageUrl} className="w-full h-[60%] object-cover opacity-90" alt="" />
              <div className="flex-1 bg-slate-950 p-6 overflow-y-auto border-t border-slate-900">
                <h3 className="text-[10px] font-bold text-slate-500 uppercase mb-3">Page {activePage.pageIndex}</h3>
                {(langMode === 'original' || langMode === 'bilingual') && (
                  <p className="text-sm text-slate-300 font-serif leading-relaxed mb-4">
                    {[activePage.narrative?.caption, activePage.narrative?.dialogue].filter(Boolean).join('\n\n')}
                  </p>
                )}
                {(langMode === 'translated' || langMode === 'bilingual') && (
                  <p className="text-sm text-indigo-300 font-serif leading-relaxed">
                    {[activePage.translation?.caption, activePage.translation?.dialogue].filter(Boolean).join('\n\n')}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Overlays */}
        <button 
          onClick={handlePrev}
          disabled={safeIndex === 0}
          className="absolute left-2 sm:left-8 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-slate-900/70 hover:bg-slate-800 border border-slate-800/50 flex items-center justify-center text-slate-300 disabled:opacity-30 transition-all cursor-pointer z-10 shadow-lg backdrop-blur-md"
        >
          <ChevronLeft size={28} />
        </button>
        <button 
          onClick={handleNext}
          disabled={safeIndex === builtPages.length - 1 || (viewMode === 'spread' && rightPage === builtPages[builtPages.length - 1])}
          className="absolute right-2 sm:right-8 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-slate-900/70 hover:bg-slate-800 border border-slate-800/50 flex items-center justify-center text-slate-300 disabled:opacity-30 transition-all cursor-pointer z-10 shadow-lg backdrop-blur-md"
        >
          <ChevronRight size={28} />
        </button>

        {/* Progress Scrubber */}
        <div className="h-16 border-t border-slate-900 flex items-center justify-center px-12 bg-slate-950/80 shrink-0">
          <div className="w-full max-w-3xl flex gap-1 items-center">
            {builtPages.map((page, i) => (
              <button
                key={page.id}
                onClick={() => setCurrentIndex(i)}
                className={`h-2 rounded-full flex-1 transition-all cursor-pointer ${i === safeIndex || (viewMode === 'spread' && page.id === rightPage?.id) ? 'bg-indigo-500 scale-y-150' : 'bg-slate-800 hover:bg-slate-700'}`}
                title={`Page ${page.pageIndex}`}
              />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};
