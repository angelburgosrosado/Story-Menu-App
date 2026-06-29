import React, { useState, useEffect } from 'react';
import { Globe, Heart, Eye, Share2, Copy, X, Sparkles } from 'lucide-react';

interface PublishedWork {
  id: string;
  title: string;
  synopsis: string;
  cover_image_url: string;
  language: string;
  region: string;
  upvotes: number;
  views: number;
  author: string;
}

interface CommunityGalleryProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommunityGallery: React.FC<CommunityGalleryProps> = ({ isOpen, onClose }) => {
  const [works, setWorks] = useState<PublishedWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredCategories, setFeaturedCategories] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Fetch dynamic categories
      fetch('/api/categories')
        .then(res => res.json())
        .then(data => {
            setFeaturedCategories(data.filter((c: any) => c.is_featured));
        })
        .catch(e => console.error("Failed to load gallery tags", e));

      // Mock fetch until real API is hooked up for public works
      setTimeout(() => {
        setWorks([
          {
            id: '1',
            title: 'Neon Drift: Tokyo 2099',
            synopsis: 'A cyberpunk detective story set in the underbelly of Neo-Tokyo.',
            cover_image_url: 'https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?q=80&w=600&auto=format&fit=crop',
            language: 'en',
            region: 'global',
            upvotes: 1420,
            views: 5300,
            author: 'CyberScribe'
          },
          {
            id: '2',
            title: 'El Bosque Mágico',
            synopsis: 'Una historia para niños sobre animales que hablan y descubren la magia.',
            cover_image_url: 'https://images.unsplash.com/photo-1542353436-18cc16d21461?q=80&w=600&auto=format&fit=crop',
            language: 'es',
            region: 'latam',
            upvotes: 890,
            views: 2100,
            author: 'CuentosInfantiles'
          }
        ]);
        setLoading(false);
      }, 800);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[10000] overflow-y-auto">
      <div className="max-w-7xl mx-auto p-6 md:p-12">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 to-cyan-400 flex items-center gap-4">
            <Globe size={48} className="text-cyan-400" />
            Global Multiverse Gallery
          </h1>
          <button onClick={onClose} className="bg-slate-800 text-white p-3 hover:bg-slate-700 transition-colors">
            <X size={24} />
          </button>
        </div>

        <p className="text-xl text-gray-400 font-mono mb-8 max-w-3xl">
          Discover visions from creators around the globe. Read their stories, listen to their generative audio, and "fork" their creative DNA to build your own universe.
        </p>

        {featuredCategories.length > 0 && (
            <div className="mb-12 flex flex-wrap gap-3">
                <button 
                    onClick={() => setActiveFilter(null)}
                    className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${!activeFilter ? 'bg-fuchsia-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                >
                    All Works
                </button>
                {featuredCategories.map(cat => (
                    <button 
                        key={cat.id}
                        onClick={() => setActiveFilter(cat.name)}
                        className={`px-4 py-2 rounded-full font-bold text-sm transition-all border ${
                            activeFilter === cat.name 
                            ? 'bg-cyan-900 border-cyan-400 text-cyan-50 shadow-[0_0_10px_rgba(34,211,238,0.5)]' 
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-cyan-700 hover:text-cyan-400'
                        }`}
                    >
                        {cat.emoji} {cat.name}
                    </button>
                ))}
            </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-fuchsia-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {works.map((work) => (
              <div key={work.id} className="bg-slate-900 border-2 border-slate-800 hover:border-fuchsia-500/50 transition-colors group cursor-pointer">
                <div className="h-64 overflow-hidden relative">
                  <img 
                    src={work.cover_image_url} 
                    alt={work.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 bg-slate-950/80 backdrop-blur-sm px-3 py-1 font-mono text-xs text-white border border-slate-700 uppercase">
                    {work.region} • {work.language.toUpperCase()}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-black text-white uppercase mb-2 line-clamp-1">{work.title}</h3>
                  <div className="text-cyan-400 font-mono text-sm mb-4">By @{work.author}</div>
                  <p className="text-gray-400 text-sm line-clamp-3 mb-6 h-16">
                    {work.synopsis}
                  </p>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                    <div className="flex gap-4 text-gray-500 font-mono text-xs">
                      <span className="flex items-center gap-1 hover:text-fuchsia-400"><Heart size={14} /> {work.upvotes}</span>
                      <span className="flex items-center gap-1"><Eye size={14} /> {work.views}</span>
                    </div>
                    <div className="flex gap-2">
                      <button className="text-gray-400 hover:text-white p-2 bg-slate-800 hover:bg-slate-700 transition-colors" title="Share">
                        <Share2 size={16} />
                      </button>
                      <button className="text-cyan-400 hover:text-white p-2 bg-slate-800 hover:bg-cyan-600 transition-colors flex items-center gap-2 font-bold text-xs uppercase" title="Clone DNA to your vault">
                        <Copy size={16} /> Fork DNA
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
