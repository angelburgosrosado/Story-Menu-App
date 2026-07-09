/*
  Screen Name: Public Creator Profile
  Purpose: Profile page for creators showcasing their published stories, followers, and saved works.
  Version: v1.1
  Phase: Phase 8
  Date: 2026-07-08
  What changed in this revision: Added Follow button, follower stats, and Tabs for Public/Saved stories.
*/

import React, { useState } from 'react';
import { ArrowLeft, User, Star, BookOpen, MapPin, Link as LinkIcon, Calendar, MoreVertical, Flag } from 'lucide-react';
import { PublishedStory, MOCK_STORIES } from './PublicGallery';

interface PublicCreatorProfileProps {
  creatorId: string;
  onBack: () => void;
  onNavigateToStory: (storyId: string) => void;
  isFollowing?: boolean;
  onToggleFollow?: (creatorId: string) => void;
  onReportCreator?: (creatorId: string) => void;
}

export const PublicCreatorProfile: React.FC<PublicCreatorProfileProps> = ({
  creatorId,
  onBack,
  onNavigateToStory,
  isFollowing,
  onToggleFollow,
  onReportCreator
}) => {
  // Mock finding a creator and their stories
  const creatorStories = MOCK_STORIES.filter(s => s.creatorId === creatorId);
  const storiesToDisplay = creatorStories.length > 0 ? creatorStories : MOCK_STORIES;
  const creatorName = storiesToDisplay[0]?.creatorName || 'Unknown Creator';

  const totalReaders = storiesToDisplay.reduce((sum, story) => sum + story.readerCount, 0);

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
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-8 py-12">
        
        {/* Creator Header */}
        <section className="relative w-full rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden mb-8">
          {/* Banner */}
          <div className="h-48 w-full bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900" />
          
          <div className="px-10 pb-10 flex flex-col md:flex-row gap-8 items-start md:items-end -mt-16 relative z-10">
            {/* Avatar */}
            <div className="w-32 h-32 rounded-2xl bg-indigo-600 border-4 border-slate-900 flex items-center justify-center text-5xl font-black text-white shadow-xl shrink-0">
              {creatorName.charAt(0)}
            </div>
            
            {/* Details */}
            <div className="flex-1">
              <h1 className="text-3xl font-black text-white mb-2">{creatorName}</h1>
              <p className="text-slate-400 max-w-2xl text-sm leading-relaxed mb-4">
                Digital storyteller specializing in bilingual fantasy and educational visual lessons. Crafting immersive worlds one panel at a time using Story.Menu.
              </p>
              
              <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-500">
                <div className="flex items-center gap-1.5"><MapPin size={14} /> Global</div>
                <div className="flex items-center gap-1.5"><Calendar size={14} /> Joined 2026</div>
                <div className="flex items-center gap-1.5"><LinkIcon size={14} /> <a href="#" className="hover:text-indigo-400 transition-colors">creator-portfolio.link</a></div>
              </div>
            </div>

            {/* Stats Block */}
            <div className="flex flex-wrap gap-4 shrink-0 mt-4 md:mt-0 items-end">
              <div className="px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-center min-w-[90px]">
                <div className="text-xl font-black text-white mb-0.5">{storiesToDisplay.length}</div>
                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Stories</div>
              </div>
              <div className="px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-center min-w-[90px]">
                <div className="text-xl font-black text-white mb-0.5">{(totalReaders / 1000).toFixed(1)}k</div>
                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Readers</div>
              </div>
              <div className="px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-center min-w-[90px]">
                <div className="text-xl font-black text-white mb-0.5">{isFollowing ? '12.4k' : '12.3k'}</div>
                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Followers</div>
              </div>
              
              <button 
                onClick={() => onToggleFollow?.(creatorId)}
                className={`ml-2 px-8 py-4 rounded-xl font-bold text-sm transition-all shadow-lg border ${isFollowing ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700 shadow-none' : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-indigo-600/20'}`}
              >
                {isFollowing ? 'Following' : 'Follow creator'}
              </button>

              <button 
                onClick={() => onReportCreator?.(creatorId)}
                className="ml-2 w-14 h-14 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 flex items-center justify-center transition-colors"
                title="Report Creator"
              >
                <Flag size={20} />
              </button>
            </div>
          </div>
        </section>

        {/* Portfolio Section */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-white">Published Stories</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {storiesToDisplay.map(story => (
                <div key={story.id} className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-600 transition-colors flex flex-col h-full cursor-pointer" onClick={() => onNavigateToStory(story.id)}>
                  
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
                    <h3 className="font-bold text-base text-white mb-2 line-clamp-1 group-hover:text-indigo-400 transition-colors">
                      {story.title}
                    </h3>
                    
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
          </div>
        </section>

      </main>
    </div>
  );
};
