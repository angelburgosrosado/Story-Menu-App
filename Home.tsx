import React from 'react';
import { Sparkles, Layers, Flame, BookOpen, Star, GitMerge } from 'lucide-react';

export const Home = ({ onNavigate }: { onNavigate: (view: string) => void }) => {
  const trendingStories = [
    { id: 1, title: "Neon Nights", creator: "CyberPunk_99", type: "Comic", likes: 342, cover: "https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?auto=format&fit=crop&w=400&q=80" },
    { id: 2, title: "The Last Wizard", creator: "FantasyScribe", type: "Ebook", likes: 289, cover: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80" },
    { id: 3, title: "Mars Colony", creator: "RedPlanet", type: "Comic", likes: 512, cover: "https://images.unsplash.com/photo-1614729939124-03290b5609ce?auto=format&fit=crop&w=400&q=80" },
    { id: 4, title: "Detective's Shadow", creator: "NoirTales", type: "Comic", likes: 156, cover: "https://images.unsplash.com/photo-1584351583369-6baf055b51a7?auto=format&fit=crop&w=400&q=80" }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 text-white">
      <div className="relative rounded-3xl overflow-hidden bg-gray-900 border border-gray-800 shadow-2xl mb-16">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-gray-900 to-pink-900/20 z-0"></div>
        <div className="relative z-10 py-24 px-8 flex flex-col items-center text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight">
            Create. Share. <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-blue-500">Remix.</span>
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl">
            Story Menu is the community for AI-powered comics and short stories.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => onNavigate('studio')}
              className="flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-blue-600 px-8 py-4 rounded-full text-lg font-bold hover:scale-105 transition-all"
            >
              <Sparkles size={20} /> Open Creator Studio
            </button>
            <button className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 px-8 py-4 rounded-full text-lg font-bold transition-all">
              <Layers size={20} /> Explore Universes
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-8">
        <Flame className="text-pink-500" size={28} />
        <h2 className="text-3xl font-bold tracking-tight">Trending This Week</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {trendingStories.map((story) => (
          <div key={story.id} className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden hover:border-blue-500 transition-colors group cursor-pointer">
            <div className="h-64 overflow-hidden relative">
              <img src={story.cover} alt={story.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border border-gray-700">
                {story.type === 'Comic' ? <BookOpen size={12} className="text-blue-400" /> : <Layers size={12} className="text-pink-400" />}
                {story.type}
              </div>
            </div>
            <div className="p-5">
              <h3 className="text-xl font-bold mb-1 group-hover:text-blue-400 transition-colors">{story.title}</h3>
              <p className="text-gray-400 text-sm mb-4">by @{story.creator}</p>
              <div className="flex justify-between items-center text-sm font-medium">
                <div className="flex items-center gap-1 text-gray-300 bg-gray-800 px-3 py-1.5 rounded-lg">
                  <Star size={14} className="text-yellow-400" /> {story.likes}
                </div>
                <button className="flex items-center gap-1 text-blue-400 hover:text-white bg-blue-900/30 hover:bg-blue-600 px-3 py-1.5 rounded-lg transition-colors">
                  <GitMerge size={14} /> Remix
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};