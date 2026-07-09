/*
  Screen Name: Remix Modal
  Purpose: A prompt/modal explaining what gets carried over when remixing a story.
  Version: v1.0
  Phase: Phase 8
  Date: 2026-07-08
  What changed in this revision: Initial creation.
*/

import React from 'react';
import { X, Copy, Palette, Users, Globe, LayoutTemplate, Zap } from 'lucide-react';
import { PublishedStory } from './PublicGallery';

interface RemixModalProps {
  story: PublishedStory;
  onClose: () => void;
  onConfirmRemix: (storyId: string) => void;
}

export const RemixModal: React.FC<RemixModalProps> = ({ story, onClose, onConfirmRemix }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl shadow-indigo-900/20 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <Copy size={20} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">Create your own version</h2>
              <p className="text-xs text-slate-400">Based on "{story.title}"</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <p className="text-slate-300 text-sm leading-relaxed">
            Remixing allows you to use this story as a creative foundation. It's perfectly safe—you won't modify the original author's work. 
          </p>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">What gets carried over:</h3>
            
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex flex-shrink-0 items-center justify-center text-slate-400">
                  <LayoutTemplate size={16} />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">Story Structure</div>
                  <div className="text-xs text-slate-500">The pacing, scenes, and panel layouts will be pre-filled.</div>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex flex-shrink-0 items-center justify-center text-slate-400">
                  <Palette size={16} />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">Visual Style</div>
                  <div className="text-xs text-slate-500">The art direction and tone directives are preserved.</div>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex flex-shrink-0 items-center justify-center text-slate-400">
                  <Globe size={16} />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">Bilingual Settings</div>
                  <div className="text-xs text-slate-500">Target languages and audience templates remain intact.</div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800/80 bg-slate-950/50 flex flex-col sm:flex-row gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-3 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-white transition-colors flex-1"
          >
            Cancel
          </button>
          <button 
            onClick={() => onConfirmRemix(story.id)}
            className="px-6 py-3 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-600/20 flex-1 flex items-center justify-center gap-2"
          >
            <Zap size={16} />
            Use this Template
          </button>
        </div>
      </div>
    </div>
  );
};
