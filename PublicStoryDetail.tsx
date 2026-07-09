/*
  Screen Name: Public Story Detail
  Purpose: Dedicated page for viewing a published story's details before reading it.
  Version: v1.0
  Phase: Phase 7
  Date: 2026-07-08
  What changed in this revision: Initial creation.
*/

import React from 'react';
import { ArrowLeft, Play, Bookmark, Share2, Star, User, MessageSquare, Repeat, Zap, Flag } from 'lucide-react';
import { PublishedStory, MOCK_STORIES } from './PublicGallery';

interface PublicStoryDetailProps {
  storyId: string;
  onBack: () => void;
  onNavigateToCreator: (creatorId: string) => void;
  onReadStory: () => void;
  isSaved?: boolean;
  onToggleSave?: (storyId: string) => void;
  isFollowing?: boolean;
  onToggleFollow?: (creatorId: string) => void;
  onRemix?: (storyId: string) => void;
  onReportStory?: (storyId: string) => void;
}

export const PublicStoryDetail: React.FC<PublicStoryDetailProps> = ({
  storyId,
  onBack,
  onNavigateToCreator,
  onReadStory,
  isSaved,
  onToggleSave,
  isFollowing,
  onToggleFollow,
  onRemix,
  onReportStory
}) => {
  const story = MOCK_STORIES.find(s => s.id === storyId) || MOCK_STORIES[0];

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
      <main className="flex-1 overflow-y-auto">
        
        {/* Hero Section */}
        <section className="relative w-full h-[400px] md:h-[500px] flex items-end">
          <div className="absolute inset-0 bg-slate-900">
            <img 
              src={story.coverUrl} 
              alt={story.title} 
              className="w-full h-full object-cover opacity-40 blur-sm"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0e14] via-[#0c0e14]/80 to-transparent" />
          </div>
          
          <div className="relative z-10 w-full max-w-5xl mx-auto px-8 pb-12 flex flex-col md:flex-row gap-8 items-end">
            
            {/* Cover Art */}
            <div className="w-48 md:w-64 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-900 shrink-0 bg-slate-800">
              <img 
                src={story.coverUrl} 
                alt={story.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Title & Actions */}
            <div className="flex-1 pb-4">
              <div className="flex gap-2 mb-4">
                <span className="px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider">
                  {story.category}
                </span>
                <span className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold uppercase tracking-wider">
                  {story.audienceTag}
                </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-2 leading-tight">
                {story.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-slate-300 mb-8">
                <span>By <button onClick={() => onNavigateToCreator(story.creatorId)} className="font-bold text-indigo-400 hover:underline">{story.creatorName}</button></span>
                <div className="w-1 h-1 rounded-full bg-slate-700" />
                <div className="flex items-center gap-1">
                  <Star size={14} className="text-amber-400 fill-amber-400" />
                  <span className="font-bold text-white">{story.rating}</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-slate-700" />
                <div className="flex items-center gap-1">
                  <User size={14} className="text-slate-500" />
                  <span>{story.readerCount.toLocaleString()} readers</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button 
                  onClick={onReadStory}
                  className="px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
                >
                  <Play size={18} className="fill-white" />
                  Read Story
                </button>
                <button 
                  onClick={() => onToggleSave?.(story.id)}
                  className={`p-3.5 rounded-xl transition-colors border tooltip ${isSaved ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700'}`} 
                  title={isSaved ? "Saved for later" : "Save story"}
                >
                  <Bookmark size={18} className={isSaved ? "fill-white" : ""} />
                </button>
                <button className="p-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-colors border border-slate-700 tooltip" title="Share story">
                  <Share2 size={18} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Details & Community */}
        <section className="max-w-5xl mx-auto px-8 py-12 grid grid-cols-1 md:grid-cols-3 gap-12">
          
          {/* Main Column */}
          <div className="md:col-span-2 space-y-12">
            
            {/* Synopsis */}
            <div>
              <h3 className="text-lg font-black text-white mb-4">Synopsis</h3>
              <p className="text-slate-300 leading-relaxed text-lg">
                {story.description}
                <br/><br/>
                Dive into a world where magic and mystery intertwine. This story was generated using the state-of-the-art Story.Menu engine, combining beautiful visuals with compelling narrative structures to create an unforgettable reading experience.
              </p>
            </div>

            {/* Community Placeholder */}
            <div>
              <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                <MessageSquare size={20} className="text-indigo-400" />
                Community Discussion
              </h3>
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-slate-800 mx-auto flex items-center justify-center">
                  <MessageSquare size={20} className="text-slate-500" />
                </div>
                <div>
                  <div className="font-bold text-white mb-1">Join the conversation</div>
                  <div className="text-sm text-slate-400">Leave a comment or review after reading this story.</div>
                </div>
                <button className="px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-bold text-white transition-colors border border-slate-700">
                  Write a Review
                </button>
              </div>
            </div>

          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            
            {/* Metadata Card */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Available Languages</div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-lg bg-slate-800 text-sm font-medium text-slate-200">
                    {story.languageTag}
                  </span>
                </div>
              </div>
              
              <div className="h-px w-full bg-slate-800" />

              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Format Tags</div>
                <div className="flex flex-wrap gap-2">
                  {story.formatTags.map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-medium text-slate-400">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="h-px w-full bg-slate-800" />

              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Permissions</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Repeat size={16} className="text-emerald-400" />
                    Remix allowed
                  </div>
                  <button 
                    onClick={() => onRemix?.(story.id)}
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Zap size={14} />
                    Use this template
                  </button>
                </div>
              </div>
            </div>

            {/* Creator Card */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 transition-colors">
              <div 
                className="flex items-center gap-4 mb-4 cursor-pointer group" 
                onClick={() => onNavigateToCreator(story.creatorId)}
              >
                <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-lg font-black text-white shrink-0">
                  {story.creatorName.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">Created By</div>
                  <div className="font-bold text-white group-hover:text-indigo-400 transition-colors">{story.creatorName}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => onToggleFollow?.(story.creatorId)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all border ${isFollowing ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-500 text-white'}`}
                >
                  {isFollowing ? 'Following' : 'Follow creator'}
                </button>
                <button 
                  onClick={() => onNavigateToCreator(story.creatorId)}
                  className="flex-1 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-bold text-white transition-colors border border-slate-700"
                >
                  View Profile
                </button>
              </div>
            </div>

            {/* Trust & Safety Action */}
            <div className="flex justify-center mt-4">
              <button 
                onClick={() => onReportStory?.(story.id)}
                className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-rose-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-rose-500/10"
              >
                <Flag size={14} />
                Report Story
              </button>
            </div>

          </div>

        </section>
      </main>
    </div>
  );
};
