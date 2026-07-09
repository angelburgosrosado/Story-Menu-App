/*
  Screen Name: Workspace Audio & Narration
  Purpose: Dedicated surface for previewing, editing, and managing read-aloud scripts and audio narration.
  Version: v2.0
  Phase: Phase 6
  Date: 2026-07-09
  What changed in this revision: Added dynamic voices and soundtracks fetched from the backend, pacing/style controls, and linked generation to the mock TTS execution endpoint.
*/

import React, { useState, useEffect } from 'react';
import {
  Volume2, Play, Pause, CheckCircle, Clock,
  ChevronLeft, ChevronRight, Zap, LayoutTemplate, Send, Check, Mic, Music, Wand2, RefreshCw
} from 'lucide-react';
import { VoiceRecord, SoundtrackAmbienceItem } from './types';

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
  audio?: {
    script?: string;
    status: 'no-audio' | 'draft' | 'needs-review' | 'approved';
    audioUrl?: string;
    durationMs?: number;
  };
}

interface WorkspaceAudioProps {
  comicFaces: ComicPage[];
  selectedPageIndex: number;
  onSelectPage: (index: number) => void;
  onUpdateAudioScript: (pageIndex: number, text: string) => void;
  onUpdateAudioStatus: (pageIndex: number, status: 'no-audio' | 'draft' | 'needs-review' | 'approved') => void;
  projectTitle: string;
  onNavigateTo: (section: string) => void;
}

export const WorkspaceAudio: React.FC<WorkspaceAudioProps> = ({
  comicFaces,
  selectedPageIndex,
  onSelectPage,
  onUpdateAudioScript,
  onUpdateAudioStatus,
  projectTitle,
  onNavigateTo,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [voices, setVoices] = useState<VoiceRecord[]>([]);
  const [soundtracks, setSoundtracks] = useState<SoundtrackAmbienceItem[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState('voice-narrator-1');
  const [selectedTrackId, setSelectedTrackId] = useState('track-1');
  const [pacing, setPacing] = useState<'slow' | 'standard' | 'fast'>('standard');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchVoices();
    fetchSoundtracks();
  }, []);

  const fetchVoices = async () => {
    try {
      const res = await fetch('/api/narration/voices');
      if (res.ok) {
        const data = await res.json();
        setVoices(data);
      }
    } catch (e) {
      console.error("Failed to fetch voices in workspace", e);
    }
  };

  const fetchSoundtracks = async () => {
    try {
      const res = await fetch('/api/narration/soundtracks');
      if (res.ok) {
        const data = await res.json();
        setSoundtracks(data);
      }
    } catch (e) {
      console.error("Failed to fetch soundtracks in workspace", e);
    }
  };

  // We only narrate story pages that exist
  const builtPages = comicFaces.filter(f => f.imageUrl);
  const hasPages = builtPages.length > 0;
  const activePage = builtPages.find(f => f.pageIndex === selectedPageIndex) || builtPages[0] || null;

  const pageLabel = activePage?.type === 'cover' ? 'Cover' : `Page ${activePage?.pageIndex ?? 0}`;

  // Combine original text as a fallback starting point for the read-aloud script
  const originalText = [activePage?.narrative?.caption, activePage?.narrative?.dialogue].filter(Boolean).join('\n\n');

  const handleGenerateAudioReal = async () => {
    if (!activePage) return;
    const textToNarrate = activePage.audio?.script || originalText;
    if (!textToNarrate) return;

    setIsGenerating(true);
    try {
      const res = await fetch('/api/narration/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToNarrate,
          voiceId: selectedVoiceId,
          projectId: 'current-workspace-project',
          parentContentId: activePage.id
        })
      });
      if (res.ok) {
        const data = await res.json();
        // Update page script and status
        onUpdateAudioScript(activePage.pageIndex, textToNarrate);
        onUpdateAudioStatus(activePage.pageIndex, 'needs-review');
        // Cache audio reference
        if (activePage) {
          activePage.audio = {
            ...activePage.audio,
            script: textToNarrate,
            status: 'needs-review',
            audioUrl: data.audioUrl,
            durationMs: data.durationMs
          };
        }
      }
    } catch (e) {
      console.error("Failed to execute TTS generation", e);
    } finally {
      setIsGenerating(false);
    }
  };

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
      case 'approved': return 'Approved for playback';
      case 'needs-review': return 'Needs review';
      case 'draft': return 'Draft narration';
      default: return 'No audio';
    }
  };

  const handleStatusChange = (status: 'no-audio' | 'draft' | 'needs-review' | 'approved') => {
    if (activePage) onUpdateAudioStatus(activePage.pageIndex, status);
  };

  const togglePlayback = () => {
    const audioUrl = activePage?.audio?.audioUrl || "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
    if (isPlaying) {
      if (currentAudio) {
        currentAudio.pause();
      }
      setIsPlaying(false);
    } else {
      const audio = new Audio(audioUrl);
      audio.play();
      setCurrentAudio(audio);
      setIsPlaying(true);
      audio.onended = () => {
        setIsPlaying(false);
      };
    }
  };

  const hasGeneratedAudio = activePage?.audio?.status === 'needs-review' || activePage?.audio?.status === 'approved' || activePage?.audio?.audioUrl;

  if (!hasPages) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 animate-fadeIn">
        <div className="w-24 h-24 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-5xl shadow-inner">
          <Volume2 className="text-slate-600" size={48} />
        </div>
        <div className="space-y-3 max-w-sm">
          <h3 className="text-2xl font-black text-slate-100">No scenes to narrate yet</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            Generate your story scenes first. Once your pages are built, you can preview and adjust the narration audio here.
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

  return (
    <div className="space-y-5 text-left animate-fadeIn h-full flex flex-col">
      {/* PAGE HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shrink-0 bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold font-mono uppercase tracking-wider">
            <Mic size={13} />
            <span>Audio & Narration Canvas</span>
          </div>
          <h2 className="text-xl font-black text-slate-100">{projectTitle}</h2>
          <p className="text-xs text-slate-400">
            Configure narrator voice controls, backing soundtrack music, and pacing scripts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div>
            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Narrator voice</label>
            <select
              value={selectedVoiceId}
              onChange={e => setSelectedVoiceId(e.target.value)}
              className="bg-slate-950 border border-slate-800 p-2 rounded text-xs text-white"
            >
              {voices.map(v => (
                <option key={v.id} value={v.id}>{v.displayName} ({v.accentLabel})</option>
              ))}
            </select>
            {voices.find(v => v.id === selectedVoiceId) && (
              <span className={`block text-[9px] mt-0.5 font-bold ${
                voices.find(v => v.id === selectedVoiceId)?.primaryLanguageCode === 'en-US' ? 'text-emerald-400' : 'text-amber-400 animate-pulse'
              }`}>
                {voices.find(v => v.id === selectedVoiceId)?.primaryLanguageCode === 'en-US' ? '✓ Language match' : '⚠ Language mismatch'}
              </span>
            )}
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Soundtrack</label>
            <select
              value={selectedTrackId}
              onChange={e => setSelectedTrackId(e.target.value)}
              className="bg-slate-950 border border-slate-800 p-2 rounded text-xs text-white"
            >
              {soundtracks.map(s => (
                <option key={s.id} value={s.id}>{s.title} - {s.mood}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Pacing</label>
            <select
              value={pacing}
              onChange={e => setPacing(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 p-2 rounded text-xs text-white"
            >
              <option value="slow">Slow & Guided</option>
              <option value="standard">Standard Pacing</option>
              <option value="fast">Fast & Animated</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-1 gap-4 overflow-hidden min-h-0">
        {/* Left Column: Thumbnail Strip & Player Preview */}
        <div className="w-1/3 flex flex-col space-y-3 shrink-0">
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
              const statusClass = getStatusColor(page.audio?.status);
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

          {/* Active Preview & Mock Player */}
          <div className="flex-1 relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 min-h-0 flex flex-col group">
            <div className="flex-1 min-h-0 relative bg-black">
              <img
                src={activePage?.imageUrl}
                alt={pageLabel}
                className={`w-full h-full object-contain transition-opacity duration-550 ${isPlaying ? 'opacity-40 scale-102' : 'opacity-100'}`}
              />
              
              {/* Playback Overlay or Generate Button */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover:bg-black/45 transition-colors">
                 {hasGeneratedAudio ? (
                   <button 
                     onClick={togglePlayback}
                     className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-all transform hover:scale-105 shadow-xl ${
                       isPlaying ? 'bg-indigo-600/90 shadow-indigo-600/30 backdrop-blur-sm' : 'bg-black/60 backdrop-blur-md border border-white/20 hover:bg-black/80'
                     }`}
                   >
                     {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
                   </button>
                 ) : (
                   <button 
                     disabled={isGenerating}
                     onClick={handleGenerateAudioReal}
                     className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center gap-2 shadow-xl transform transition-transform hover:scale-105 disabled:opacity-50"
                   >
                     {isGenerating ? <RefreshCw size={16} className="animate-spin" /> : <Wand2 size={16} />}
                     {isGenerating ? 'Synthesizing...' : 'Generate Narration'}
                   </button>
                 )}
              </div>

              {/* Waveform timeline simulator */}
              {hasGeneratedAudio && (
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end px-4 pb-3">
                  <div className="w-full h-1 bg-white/20 rounded-full mb-3 relative cursor-pointer overflow-hidden">
                    <div className={`absolute left-0 top-0 bottom-0 bg-indigo-500 transition-all ${isPlaying ? 'w-full duration-[4500ms] ease-linear' : 'w-0'}`} />
                  </div>
                  {isPlaying && (
                    <div className="flex items-end justify-center gap-1 opacity-90 h-6">
                       {[...Array(32)].map((_, i) => (
                         <div 
                           key={i} 
                           className="w-1 bg-indigo-400 rounded-t-sm animate-pulse" 
                           style={{ 
                             height: `${20 + Math.random() * 80}%`,
                           }} 
                         />
                       ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Status bar */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex justify-between items-center shrink-0">
               <span className="text-xs font-bold text-slate-400">{pageLabel}</span>
               <div className={`px-2.5 py-1 rounded text-[10px] font-bold border flex items-center gap-1 ${getStatusColor(activePage?.audio?.status)}`}>
                 {getStatusLabel(activePage?.audio?.status)}
               </div>
            </div>
          </div>
        </div>

        {/* Right Column: Audio Script Editor */}
        <div className="flex-1 flex flex-col min-h-0 bg-slate-900/40 rounded-2xl border border-slate-800 overflow-y-auto relative pb-20">
          <div className="grid grid-cols-2 border-b border-slate-800 sticky top-0 bg-slate-900/95 backdrop-blur z-10 shrink-0">
             <div className="p-3 px-5 border-r border-slate-800 flex items-center gap-2 text-xs font-bold text-slate-300">
               Original Dialogue/Caption <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] text-slate-400 ml-auto font-mono">Reference</span>
             </div>
             <div className="p-3 px-5 flex items-center gap-2 text-xs font-bold text-indigo-300">
               Pronunciation Script <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[10px] text-indigo-400 ml-auto font-mono">Editable</span>
             </div>
          </div>

          <div className="p-5 space-y-6 flex-1">
            <div className="space-y-2 h-full flex flex-col">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <LayoutTemplate size={12} /> Narration Content
              </label>
              <div className="grid grid-cols-2 gap-4 flex-1">
                {/* Left: Original Context */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-sm text-slate-350 leading-relaxed whitespace-pre-wrap cursor-not-allowed overflow-y-auto">
                  {originalText || <span className="text-slate-655 italic">No text generated for this page.</span>}
                </div>
                {/* Right: Editable Script */}
                <div className="relative">
                  <textarea
                    value={activePage?.audio?.script !== undefined ? activePage.audio.script : originalText}
                    onChange={(e) => {
                      onUpdateAudioScript(activePage?.pageIndex ?? 0, e.target.value);
                      if (activePage?.audio?.status !== 'draft') handleStatusChange('draft');
                    }}
                    placeholder="Enter the exact script you want read aloud..."
                    className="w-full h-full rounded-xl bg-indigo-950/10 border border-indigo-500/30 text-sm p-4 text-indigo-100 placeholder:text-indigo-400/30 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-indigo-950/20 resize-none leading-relaxed transition-all shadow-inner"
                  />
                </div>
              </div>
            </div>

            {/* Helper Text */}
            <div className="pt-4 border-t border-slate-800">
               <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1">
                 <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                   <Volume2 size={12} /> Pronunciation Notes
                 </h4>
                 <p className="text-xs text-slate-400 leading-relaxed">
                   Use the read-aloud script to spell out difficult words phonetically, or add pauses using punctuation like ellipsis (...) or dashes (-). Modifying the read-aloud script will not change the text printed on the page itself.
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
               Approve for Playback
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
