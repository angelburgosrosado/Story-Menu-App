/*
  Screen Name: Saved Library
  Purpose: A user-facing library where people can view and manage their saved stories.
  Version: v1.0
  Phase: Phase 8
  Date: 2026-07-08
  What changed in this revision: Initial creation.
*/

import React from 'react';
import { ArrowLeft, BookmarkMinus, Compass, BookMarked, User, Star } from 'lucide-react';
import { PublishedStory, MOCK_STORIES } from './PublicGallery';

interface SavedLibraryProps {
  onBack: () => void;
  onNavigateToStory: (storyId: string) => void;
  onNavigateToCreator: (creatorId: string) => void;
  savedStoryIds: string[];
  onRemoveSaved: (storyId: string) => void;
}

export const SavedLibrary: React.FC<SavedLibraryProps> = ({
  onBack,
  onNavigateToStory,
  onNavigateToCreator,
  savedStoryIds,
  onRemoveSaved
}) => {
  const savedStories = MOCK_STORIES.filter(s => savedStoryIds.includes(s.id));

  return (
    <div className="min-h-screen bg-[#0c0e14] text-slate-100 flex flex-col font-sans">
      
      {/* Top Nav */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md sticky top-0 z-50 flex items-center px-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Gallery
        </button>
        <div className="mx-auto font-extrabold tracking-tight text-lg flex items-center gap-2">
          <BookMarked size={18} className="text-indigo-400" />
          Your Library
        </div>
        <div className="w-[120px]" /> {/* Spacer for centering */}
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-black text-white mb-2">Saved Collections</h1>
            <p className="text-slate-400">Stories and lessons you've bookmarked for later.</p>
          </div>
          <div className="text-sm font-bold text-slate-500 bg-slate-900 px-4 py-2 rounded-xl border border-slate-800">
            {savedStories.length} {savedStories.length === 1 ? 'Item' : 'Items'}
          </div>
        </div>

        {savedStories.length === 0 ? (
          <div className="w-full flex flex-col items-center justify-center p-20 text-center bg-slate-900/50 border border-slate-800 border-dashed rounded-3xl mt-12">
            <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-6">
              <BookMarked size={32} className="text-slate-500" />
            </div>
            <h2 className="text-2xl font-black text-white mb-3">Your library is empty</h2>
            <p className="text-slate-400 max-w-md mx-auto mb-8">
              Discover and collect stories that inspire you. Save visual lessons, bilingual adventures, and comic stories to build your personal library.
            </p>
            <button 
              onClick={onBack}
              className="px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
            >
              <Compass size={18} />
              Start Exploring
            </button>
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {savedStories.map(story => (
              <div key={story.id} className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-600 transition-colors flex flex-col h-full cursor-pointer relative" onClick={() => onNavigateToStory(story.id)}>
                
                {/* Remove Action */}
                <button 
                  onClick={(e) => { e.stopPropagation(); onRemoveSaved(story.id); }}
                  className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100"
                  title="Remove from library"
                >
                  <BookmarkMinus size={16} />
                </button>

                {/* Card Cover */}
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-800">
                  <img 
                    src={story.coverUrl} 
                    alt={story.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span className="px-2 py-1 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-bold text-white border border-white/10 uppercase tracking-wider">
                      {story.category}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-base text-white mb-1 line-clamp-1 group-hover:text-indigo-400 transition-colors">
                    {story.title}
                  </h3>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onNavigateToCreator(story.creatorId); }}
                    className="text-xs text-slate-400 mb-3 hover:text-indigo-400 transition-colors text-left"
                  >
                    By {story.creatorName}
                  </button>
                  
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 flex-1">
                    {story.description}
                  </p>

                  {/* Tags & Meta */}
                  <div className="space-y-3 mt-auto">
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2 py-1 rounded bg-slate-800 text-[10px] font-medium text-slate-300">
                        {story.languageTag}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-800/80">
                      <div className="flex items-center gap-1">
                        <Star size={12} className="text-amber-400 fill-amber-400" />
                        <span className="font-bold text-slate-300">{story.rating}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User size={12} />
                        {story.readerCount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </section>
        )}
      </main>
    </div>
  );
};
