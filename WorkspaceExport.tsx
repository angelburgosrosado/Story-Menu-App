/*
  Screen Name: Workspace Export & Publish
  Purpose: Final delivery workflow for packaging, exporting, sharing, and publishing stories.
  Version: v1.1
  Phase: Phase 6
  Date: 2026-07-08
  What changed in this revision: Improved separation of local export vs web publishing, dynamic button labels, better commercial copy, and refined visual hierarchy.
*/

import React, { useState } from 'react';
import {
  Download, Globe, FileText, Image as ImageIcon, Link as LinkIcon,
  BookOpen, Lock, Unlock, EyeOff, Sparkles, Target, CheckCircle
} from 'lucide-react';
import { PremiumGate } from './PremiumGate';

interface ComicPage {
  id: string;
  pageIndex: number;
  type: string;
  imageUrl?: string;
  isApproved?: boolean;
}

interface WorkspaceExportProps {
  comicFaces: ComicPage[];
  projectTitle: string;
  selectedLanguage: string;
  soundtrackEnabled: boolean;
  isPremiumUser: boolean;
  onDownloadPDF: () => void;
  onNavigateTo: (section: string) => void;
  onUpgrade: () => void;
}

export const WorkspaceExport: React.FC<WorkspaceExportProps> = ({
  comicFaces,
  projectTitle,
  selectedLanguage,
  soundtrackEnabled,
  isPremiumUser,
  onDownloadPDF,
  onNavigateTo,
  onUpgrade
}) => {
  const [deliveryMethod, setDeliveryMethod] = useState<'download' | 'publish'>('download');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'images'>('pdf');
  const [exportLanguage, setExportLanguage] = useState<'source' | 'translated' | 'bilingual'>('source');
  const [includeCover, setIncludeCover] = useState(true);
  
  const [publishTitle, setPublishTitle] = useState(projectTitle);
  const [publishDesc, setPublishDesc] = useState("");
  const [visibility, setVisibility] = useState<'private' | 'unlisted' | 'public'>('private');
  
  const [allowComments, setAllowComments] = useState(true);

  const approvedPagesCount = comicFaces.filter(p => p.isApproved).length;
  const builtPagesCount = comicFaces.filter(p => p.imageUrl).length;
  const totalPages = comicFaces.length;

  const isReady = approvedPagesCount === totalPages && totalPages > 0;

  if (totalPages === 0 || builtPagesCount === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center h-full">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 border border-indigo-500/20">
          <Sparkles className="text-indigo-400" size={28} />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Bring your story to life first</h2>
        <p className="text-sm text-slate-400 max-w-sm mb-8 leading-relaxed">
          Your project needs generated visuals before it can be exported or published. Head back to the builder to create your pages.
        </p>
        <button
          onClick={() => onNavigateTo('pages')}
          className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2"
        >
          <BookOpen size={16} />
          Go to Scene Builder
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0c0e14]">
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-3xl mx-auto p-10 space-y-10">

          {/* Header */}
          <div>
            <h2 className="text-3xl font-black text-white tracking-tight mb-3">Delivery & Export</h2>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xl">
              Choose how you want to share your finished story. Download a high-quality file for local use, or publish it online for easy sharing.
            </p>
          </div>

          {/* Delivery Method Toggle */}
          <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md">
            <button
              onClick={() => setDeliveryMethod('download')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                deliveryMethod === 'download' 
                  ? 'bg-slate-800 text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Download size={16} />
              Download File
            </button>
            <button
              onClick={() => setDeliveryMethod('publish')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                deliveryMethod === 'publish' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Globe size={16} />
              Publish Online
            </button>
          </div>

          {/* ─────────────────────────────────────────────────────────────
              DOWNLOAD MODE
              ───────────────────────────────────────────────────────────── */}
          {deliveryMethod === 'download' && (
            <div className="space-y-8 animate-fadeIn">
              
              {/* File Format */}
              <section className="space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Format</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setExportFormat('pdf')}
                    className={`p-5 rounded-2xl border text-left transition-all ${
                      exportFormat === 'pdf' ? 'bg-indigo-500/10 border-indigo-500/50 shadow-sm' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <PremiumGate isPremium={isPremiumUser} featureName="PDF Export" onUpgrade={onUpgrade} inline>
                      <div className="pointer-events-none">
                        <FileText className={`mb-3 ${exportFormat === 'pdf' ? 'text-indigo-400' : 'text-slate-500'}`} size={24} />
                        <div className="font-bold text-base text-white mb-1.5">Printable PDF</div>
                        <div className="text-xs text-slate-400 leading-relaxed">High-resolution book format. Best for printing or reading on tablets.</div>
                      </div>
                    </PremiumGate>
                  </button>
                  <button
                    onClick={() => setExportFormat('images')}
                    className={`p-5 rounded-2xl border text-left transition-all ${
                      exportFormat === 'images' ? 'bg-indigo-500/10 border-indigo-500/50 shadow-sm' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <ImageIcon className={`mb-3 ${exportFormat === 'images' ? 'text-indigo-400' : 'text-slate-500'}`} size={24} />
                    <div className="font-bold text-base text-white mb-1.5">Image Archive</div>
                    <div className="text-xs text-slate-400 leading-relaxed">A ZIP file containing individual high-res PNG pages.</div>
                  </button>
                </div>
              </section>

              {/* Download Settings */}
              <section className="space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Content Settings</h3>
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-3">Which languages should be included?</label>
                    <div className="flex gap-2">
                      {(['source', 'translated', 'bilingual'] as const).map(mode => (
                        <button
                          key={mode}
                          onClick={() => setExportLanguage(mode)}
                          className={`px-5 py-2 text-sm font-bold rounded-xl capitalize transition-all ${
                            exportLanguage === mode ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          {mode === 'source' ? 'Original Only' : mode === 'translated' ? 'Translation Only' : 'Bilingual Layout'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-px bg-slate-800/50 w-full" />

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <div className="mt-0.5">
                      <input 
                        type="checkbox" 
                        checked={includeCover} 
                        onChange={(e) => setIncludeCover(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-500 bg-slate-950 border-slate-700 focus:ring-offset-slate-900" 
                      />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">Include Cover Pages</div>
                      <div className="text-xs text-slate-500 mt-1">Generate a front and back cover for the downloaded document.</div>
                    </div>
                  </label>
                </div>
              </section>

            </div>
          )}

          {/* ─────────────────────────────────────────────────────────────
              PUBLISH MODE
              ───────────────────────────────────────────────────────────── */}
          {deliveryMethod === 'publish' && (
            <div className="space-y-8 animate-fadeIn">
              
              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-sm text-indigo-200 leading-relaxed">
                <span className="font-bold text-indigo-400">Interactive Web Reader:</span> Publishing your story creates a beautiful, interactive digital link that supports audio narration and immersive layouts.
              </div>

              {/* Project Details */}
              <section className="space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Story Details</h3>
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Display Title</label>
                    <input
                      type="text"
                      value={publishTitle}
                      onChange={(e) => setPublishTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Synopsis / Description</label>
                    <textarea
                      value={publishDesc}
                      onChange={(e) => setPublishDesc(e.target.value)}
                      placeholder="Give readers a quick summary of what to expect..."
                      rows={3}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none"
                    />
                  </div>
                </div>
              </section>

              {/* Visibility */}
              <section className="space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Access & Visibility</h3>
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      onClick={() => setVisibility('private')}
                      className={`p-4 rounded-xl border flex flex-col gap-2 transition-all ${
                        visibility === 'private' ? 'bg-slate-800 border-slate-600 shadow-sm' : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <Lock className={visibility === 'private' ? 'text-white' : 'text-slate-500'} size={20} />
                      <div className="text-left mt-1">
                        <div className={`text-sm font-bold mb-1 ${visibility === 'private' ? 'text-white' : 'text-slate-300'}`}>Private</div>
                        <div className="text-[11px] text-slate-500 leading-snug">Only you can view this story.</div>
                      </div>
                    </button>
                    <button
                      onClick={() => setVisibility('unlisted')}
                      className={`p-4 rounded-xl border flex flex-col gap-2 transition-all ${
                        visibility === 'unlisted' ? 'bg-slate-800 border-slate-600 shadow-sm' : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <EyeOff className={visibility === 'unlisted' ? 'text-white' : 'text-slate-500'} size={20} />
                      <div className="text-left mt-1">
                        <div className={`text-sm font-bold mb-1 ${visibility === 'unlisted' ? 'text-white' : 'text-slate-300'}`}>Unlisted</div>
                        <div className="text-[11px] text-slate-500 leading-snug">Anyone with the link can view it.</div>
                      </div>
                    </button>
                    <button
                      onClick={() => setVisibility('public')}
                      className={`p-4 rounded-xl border flex flex-col gap-2 transition-all ${
                        visibility === 'public' ? 'bg-slate-800 border-slate-600 shadow-sm' : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <Unlock className={visibility === 'public' ? 'text-white' : 'text-slate-500'} size={20} />
                      <div className="text-left mt-1">
                        <div className={`text-sm font-bold mb-1 ${visibility === 'public' ? 'text-white' : 'text-slate-300'}`}>Public Gallery</div>
                        <div className="text-[11px] text-slate-500 leading-snug">Featured on the community page.</div>
                      </div>
                    </button>
                  </div>

                  {visibility === 'public' && (
                    <>
                      <div className="h-px bg-slate-800/50 w-full" />
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="mt-0.5">
                          <input 
                            type="checkbox" 
                            checked={allowComments} 
                            onChange={(e) => setAllowComments(e.target.checked)}
                            className="w-4 h-4 rounded text-indigo-500 bg-slate-950 border-slate-700 focus:ring-offset-slate-900" 
                          />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">Allow community comments</div>
                          <div className="text-xs text-slate-500 mt-1">Let readers leave feedback and emojis on your public story.</div>
                        </div>
                      </label>
                    </>
                  )}
                </div>
              </section>

            </div>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          STICKY FOOTER ACTIONS
          ───────────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-slate-800/80 bg-slate-950/95 backdrop-blur-sm p-5 flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm">
          {!isReady ? (
            <div className="flex items-center gap-2 text-amber-400 font-medium">
              <Target size={16} />
              Approve all pages to unlock delivery options
            </div>
          ) : (
            <div className="flex items-center gap-2 text-emerald-400 font-medium">
              <CheckCircle size={16} />
              Project ready for delivery
            </div>
          )}
        </div>

        <div className="flex gap-3">
          {deliveryMethod === 'publish' && isReady && (
            <button
              onClick={() => {
                console.log("Generating share link...");
                alert("Share link generated and copied to clipboard!");
              }}
              className="px-6 py-2.5 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-white transition-colors flex items-center gap-2"
            >
              <LinkIcon size={16} />
              Copy Link
            </button>
          )}

          <button
            onClick={() => {
              if (deliveryMethod === 'download') {
                if (exportFormat === 'pdf') onDownloadPDF();
                else console.log('Downloading ZIP archive...');
              } else {
                console.log('Publishing project...', { publishTitle, visibility });
                alert('Project Published successfully!');
              }
            }}
            disabled={!isReady}
            className={`px-8 py-2.5 rounded-xl font-bold text-sm transition-all shadow-md flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
              deliveryMethod === 'publish'
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {deliveryMethod === 'download' ? (
              <>
                <Download size={16} />
                {exportFormat === 'pdf' ? 'Download PDF' : 'Download ZIP'}
              </>
            ) : (
              <>
                <Globe size={16} />
                Publish Story
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
