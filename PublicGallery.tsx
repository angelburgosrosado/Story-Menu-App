/*
  Screen Name: Public Gallery / Discover
  Purpose: Main discovery page for the community ecosystem where published stories can be explored.
  Version: v1.1
  Phase: Phase 8
  Date: 2026-07-08
  What changed in this revision: Added return-driving widgets (Continue Reading, Followed Creators) and save action to cards.
*/

import React, { useState } from 'react';
import { Search, Flame, Clock, Star, BookOpen, Layers, Zap, User, Bookmark, ChevronRight, BookMarked } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

export interface PublishedStory {
  id: string;
  title: string;
  creatorId: string;
  creatorName: string;
  coverUrl: string;
  description: string;
  category: string;
  formatTags: string[];
  languageTag: string;
  audienceTag: string;
  rating: number;
  readerCount: number;
}

// Mock Data
export const MOCK_STORIES: PublishedStory[] = [
  {
    id: 'story-1',
    title: 'The Alchemist’s Apprentice',
    creatorId: 'creator-1',
    creatorName: 'Elena Rios',
    coverUrl: 'https://images.unsplash.com/photo-1618365908648-e71bd5716cba?auto=format&fit=crop&q=80&w=600',
    description: 'A young apprentice discovers a forbidden formula that could change the fate of their kingdom forever.',
    category: 'Fantasy',
    formatTags: ['Comic', 'Magic'],
    languageTag: 'Bilingual (EN/ES)',
    audienceTag: 'Young Adult',
    rating: 4.8,
    readerCount: 1240
  },
  {
    id: 'story-2',
    title: 'Solar Winds',
    creatorId: 'creator-2',
    creatorName: 'Marco Vance',
    coverUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600',
    description: 'When the sun’s flares knock out Earth’s communications, a rogue pilot must navigate the stars manually.',
    category: 'Sci-Fi',
    formatTags: ['Visual Lesson', 'Space'],
    languageTag: 'English',
    audienceTag: 'Teen',
    rating: 4.5,
    readerCount: 890
  },
  {
    id: 'story-3',
    title: 'Luna and the Firefly',
    creatorId: 'creator-3',
    creatorName: 'Sarah Jenkins',
    coverUrl: 'https://images.unsplash.com/photo-1516104863920-5f212fb9c35a?auto=format&fit=crop&q=80&w=600',
    description: 'A bedtime story about a curious bear and her luminous friend exploring the midnight forest.',
    category: 'Fairy Tale',
    formatTags: ['Kid Story', 'Bedtime'],
    languageTag: 'Bilingual (EN/FR)',
    audienceTag: 'Children',
    rating: 4.9,
    readerCount: 3200
  },
  {
    id: 'story-4',
    title: 'Cyber City Neo',
    creatorId: 'creator-4',
    creatorName: 'J.T. Ronin',
    coverUrl: 'https://images.unsplash.com/photo-1601042879364-f3947d3f9c16?auto=format&fit=crop&q=80&w=600',
    description: 'A detective story set in a neon-drenched metropolis where nothing is as it seems.',
    category: 'Cyberpunk',
    formatTags: ['Comic', 'Mystery'],
    languageTag: 'Japanese',
    audienceTag: 'Adult',
    rating: 4.6,
    readerCount: 450
  }
];

interface PublicGalleryProps {
  onNavigateToStory: (storyId: string) => void;
  onNavigateToCreator: (creatorId: string) => void;
  onReturnToStudio: () => void;
  onOpenLibrary?: () => void;
  savedStoryIds?: string[];
  onToggleSave?: (storyId: string) => void;
}

export const PublicGallery: React.FC<PublicGalleryProps> = ({
  onNavigateToStory,
  onNavigateToCreator,
  onReturnToStudio,
  onOpenLibrary,
  savedStoryIds = [],
  onToggleSave
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'featured' | 'trending' | 'recent' | 'lessons' | 'bilingual'>('featured');

  const tabs = [
    { id: 'featured', label: 'Featured', icon: <Star size={16} /> },
    { id: 'trending', label: 'Trending', icon: <Flame size={16} /> },
    { id: 'recent', label: 'Recent', icon: <Clock size={16} /> },
    { id: 'lessons', label: 'Visual Lessons', icon: <BookOpen size={16} /> },
    { id: 'bilingual', label: 'Bilingual Stories', icon: <Layers size={16} /> },
  ] as const;

  const renderStoryCard = (story: PublishedStory) => {
    const isSaved = savedStoryIds.includes(story.id);

    return (
      <div key={story.id} className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-600 transition-colors flex flex-col h-full cursor-pointer relative" onClick={() => onNavigateToStory(story.id)}>
        
        {/* Save Action */}
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleSave?.(story.id); }}
          className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all ${isSaved ? 'bg-indigo-600 text-white' : 'bg-black/60 backdrop-blur-md text-slate-300 hover:text-white hover:bg-black/80 opacity-0 group-hover:opacity-100'}`}
          title={isSaved ? "Saved for later" : "Save story"}
          aria-label={isSaved ? "Remove from saved stories" : "Save this story"}
        >
          <Bookmark size={16} className={isSaved ? "fill-white" : ""} />
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
              <span className="px-2 py-1 rounded bg-slate-800 text-[10px] font-medium text-slate-300">
                {story.audienceTag}
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
    );
  };

  return (
    <div className="min-h-screen bg-[#0c0e14] text-slate-100 flex flex-col font-sans">
      <Helmet>
        <title>Gallery — Story.Menu | AI-Generated Comics & Stories</title>
        <meta name="description" content="Browse AI-generated comic books, stories, and illustrations. Discover multiverse adventures created with Gemini AI." />
        <meta property="og:title" content="Gallery — Story.Menu" />
        <meta property="og:description" content="Browse AI-generated comic books and stories" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://storymenu.app/gallery" />
        <link rel="canonical" href="https://storymenu.app/gallery" />
      </Helmet>
      
      {/* Top Navigation */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md">
            <BookOpen size={16} className="text-white" />
          </div>
          <span className="font-extrabold tracking-tight text-lg">Story.Menu Gallery</span>
        </div>

        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
              type="text" 
              placeholder="Search stories, creators, or topics..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-full py-2 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button 
            onClick={onOpenLibrary}
            className="text-sm font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-2"
          >
            <BookMarked size={16} />
            Library
          </button>
          <div className="w-px h-4 bg-slate-800" />
          <button 
            onClick={onReturnToStudio}
            className="text-sm font-bold text-slate-300 hover:text-white transition-colors flex items-center gap-2"
          >
            <Zap size={16} className="text-amber-400" />
            Go to Studio
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-12">
        
        {/* Hero Section */}
        <section className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 h-[320px] flex items-center">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent z-10" />
          <img 
            src="https://images.unsplash.com/photo-1535905557558-afc4877a26fc?auto=format&fit=crop&q=80&w=2000" 
            alt="Featured Collection" 
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
          <div className="relative z-20 p-12 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-xs font-bold mb-4">
              <Star size={12} /> Spotlight
            </div>
            <h1 className="text-4xl font-black text-white mb-4 leading-tight">Discover visually stunning stories created by the community.</h1>
            <p className="text-slate-300 text-lg mb-8">From bilingual adventures to visual classroom lessons, explore the infinite multiverse of creations.</p>
            <button className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-colors shadow-lg">
              Explore Featured
            </button>
          </div>
        </section>

        {/* Engagement Widgets */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Continue Reading Widget */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-white flex items-center gap-2"><Clock size={16} className="text-indigo-400" /> Continue reading</h3>
              <button className="text-xs font-bold text-slate-500 hover:text-white transition-colors flex items-center">See all <ChevronRight size={14} /></button>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors w-full" onClick={() => onNavigateToStory('story-1')}>
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-800 shrink-0">
                <img src={MOCK_STORIES[0].coverUrl} alt="Cover" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-white truncate">{MOCK_STORIES[0].title}</div>
                <div className="text-xs text-slate-500 mb-2 truncate">Page 4 of 12</div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 w-1/3 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Creators You Follow Widget */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-white flex items-center gap-2"><User size={16} className="text-indigo-400" /> From creators you follow</h3>
              <button className="text-xs font-bold text-slate-500 hover:text-white transition-colors flex items-center">See all <ChevronRight size={14} /></button>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {[MOCK_STORIES[1], MOCK_STORIES[2]].map(story => (
                <div key={story.id} className="flex-1 flex items-center gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700 transition-colors" onClick={() => onNavigateToCreator(story.creatorId)}>
                  <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white shrink-0">
                    {story.creatorName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs text-white truncate">{story.creatorName}</div>
                    <div className="text-[10px] text-slate-500 truncate">New story published</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tab Navigation */}
        <section>
          <div className="flex items-center gap-2 border-b border-slate-800/80 pb-px">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
                  activeTab === tab.id 
                    ? 'border-indigo-500 text-indigo-400' 
                    : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-700'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {/* Story Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-20">
          {MOCK_STORIES.map(renderStoryCard)}
        </section>

      </main>
    </div>
  );
};
