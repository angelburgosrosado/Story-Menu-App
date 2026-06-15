import React from 'react';
import { Sparkles, Layers, Flame, BookOpen, Star, GitMerge, ArrowRight, PenTool, Globe, Zap } from 'lucide-react';

export const Home = ({ onNavigate }: { onNavigate: (view: string, data?: any) => void }) => {
    // Extended mock data to fill out the grid
    const trendingStories = [
        { id: 1, title: "Neon Nights", creator: "CyberPunk_99", type: "Comic", likes: 342, tags: ["Sci-Fi", "Cyberpunk"], cover: "https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?auto=format&fit=crop&w=400&q=80" },
        { id: 2, title: "The Last Wizard", creator: "FantasyScribe", type: "Ebook", likes: 289, tags: ["Fantasy", "Magic"], cover: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80" },
        { id: 3, title: "Mars Colony", creator: "RedPlanet", type: "Comic", likes: 512, tags: ["Sci-Fi", "Space"], cover: "https://images.unsplash.com/photo-1614729939124-03290b5609ce?auto=format&fit=crop&w=400&q=80" },
        { id: 4, title: "Detective's Shadow", creator: "NoirTales", type: "Comic", likes: 156, tags: ["Mystery", "Noir"], cover: "https://images.unsplash.com/photo-1584351583369-6baf055b51a7?auto=format&fit=crop&w=400&q=80" },
        { id: 5, title: "Echoes of Time", creator: "TimeWeaver", type: "Ebook", likes: 421, tags: ["Historical", "Drama"], cover: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=400&q=80" },
        { id: 6, title: "Mecha Rumble", creator: "IronGiant", type: "Comic", likes: 892, tags: ["Action", "Mecha"], cover: "https://images.unsplash.com/photo-1535295972055-1c762f4483e5?auto=format&fit=crop&w=400&q=80" },
        { id: 7, title: "Whispering Woods", creator: "FairyTale", type: "Ebook", likes: 204, tags: ["Fantasy", "Nature"], cover: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=400&q=80" },
        { id: 8, title: "Urban Legends", creator: "CityMyth", type: "Comic", likes: 377, tags: ["Horror", "Urban"], cover: "https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?auto=format&fit=crop&w=400&q=80" }
    ];

    return (
        <div className="max-w-7xl mx-auto px-6 py-12 text-white">
            {/* Hero Section */}
            <div className="relative rounded-[2rem] overflow-hidden bg-gray-900 border border-gray-800 shadow-2xl mb-24 group">
                {/* Animated Background Mesh */}
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/40 via-gray-900 to-pink-900/20 z-0 opacity-80 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px] -translate-y-1/2 translate-x-1/3"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500/10 rounded-full blur-[128px] translate-y-1/3 -translate-x-1/3"></div>
                
                <div className="relative z-10 py-32 px-8 flex flex-col items-center text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-800/80 border border-gray-700 backdrop-blur-md mb-8">
                        <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-sm font-medium text-gray-300">Gemini 3 Pro Generation Now Live</span>
                    </div>

                    <h1 className="text-6xl md:text-8xl font-black mb-8 tracking-tighter leading-tight">
                        Stories, <br className="md:hidden" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">Visualized.</span>
                    </h1>
                    
                    <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl font-light leading-relaxed">
                        The ultimate creator studio for AI-assisted comics and ebooks. Generate entire universes from a single prompt, share with the community, and remix the multiverse.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto">
                        <button 
                            onClick={() => onNavigate('studio')} 
                            className="flex items-center justify-center gap-3 bg-white text-gray-950 px-10 py-5 rounded-full text-lg font-bold hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] group"
                        >
                            <Sparkles size={22} className="text-pink-600 group-hover:rotate-12 transition-transform" /> 
                            Start Creating Free
                        </button>
                        <button 
                            onClick={() => {
                                document.getElementById('trending')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className="flex items-center justify-center gap-3 bg-gray-800/80 hover:bg-gray-700 backdrop-blur-md border border-gray-700 px-10 py-5 rounded-full text-lg font-bold transition-all"
                        >
                            <Globe size={22} className="text-blue-400" /> 
                            Browse Community
                        </button>
                    </div>
                </div>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
                <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-3xl">
                    <div className="w-14 h-14 bg-blue-900/30 text-blue-400 rounded-2xl flex items-center justify-center mb-6 border border-blue-500/20">
                        <PenTool size={28} />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">Consistent Characters</h3>
                    <p className="text-gray-400 leading-relaxed">Our custom pipeline ensures your heroes look the same from panel 1 to page 10. No more random face changes.</p>
                </div>
                <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-3xl">
                    <div className="w-14 h-14 bg-purple-900/30 text-purple-400 rounded-2xl flex items-center justify-center mb-6 border border-purple-500/20">
                        <Zap size={28} />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">Instant Panels</h3>
                    <p className="text-gray-400 leading-relaxed">Type a script, and watch the AI auto-generate layouts, speech bubbles, and sound effects in seconds.</p>
                </div>
                <div className="bg-gray-900/50 border border-gray-800 p-8 rounded-3xl">
                    <div className="w-14 h-14 bg-pink-900/30 text-pink-400 rounded-2xl flex items-center justify-center mb-6 border border-pink-500/20">
                        <GitMerge size={28} />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">Remix Engine</h3>
                    <p className="text-gray-400 leading-relaxed">Love a community story? Click 'Remix' to fork their characters and continue the timeline in your own direction.</p>
                </div>
            </div>

            {/* Trending Feed */}
            <div id="trending" className="flex items-center justify-between mb-10 pt-8 border-t border-gray-800">
                <div className="flex items-center gap-4">
                    <div className="bg-pink-500/20 p-2 rounded-xl border border-pink-500/30">
                        <Flame className="text-pink-500" size={24} />
                    </div>
                    <h2 className="text-4xl font-black tracking-tight">Trending Universes</h2>
                </div>
                <button className="hidden sm:flex items-center gap-2 text-gray-400 hover:text-white font-medium transition-colors">
                    View All <ArrowRight size={18} />
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {trendingStories.map(story => (
                    <div 
                        key={story.id} 
                        onClick={() => onNavigate('reader', { id: story.id })}
                        className="bg-gray-900 rounded-[1.5rem] border border-gray-800 overflow-hidden hover:border-gray-600 transition-all group cursor-pointer hover:shadow-2xl hover:-translate-y-1"
                    >
                        <div className="h-72 overflow-hidden relative">
                            <img src={story.cover} alt={story.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" />
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-80"></div>
                            
                            {/* Tags overlay */}
                            <div className="absolute top-4 left-4 flex gap-2">
                                <div className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border border-gray-700 text-gray-200">
                                    {story.type === 'Comic' ? <BookOpen size={12} className="text-blue-400" /> : <Layers size={12} className="text-pink-400"/>}
                                    {story.type}
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6 relative">
                            {/* Floating Avatar */}
                            <div className="absolute -top-6 right-6 w-12 h-12 bg-gray-800 rounded-full border-2 border-gray-900 flex items-center justify-center overflow-hidden shadow-lg">
                                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center text-sm font-bold">
                                    {story.creator.charAt(0)}
                                </div>
                            </div>
                            
                            <h3 className="text-xl font-bold mb-1 group-hover:text-blue-400 transition-colors line-clamp-1">{story.title}</h3>
                            <p className="text-gray-400 text-sm mb-4">by @{story.creator}</p>
                            
                            <div className="flex gap-2 mb-6">
                                {story.tags.map(tag => (
                                    <span key={tag} className="text-xs font-medium text-gray-500 bg-gray-800/50 px-2 py-1 rounded-md">
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            <div className="flex justify-between items-center text-sm font-medium pt-4 border-t border-gray-800/80">
                                <div className="flex items-center gap-1.5 text-gray-300">
                                    <Star size={16} className="text-yellow-500" /> {story.likes}
                                </div>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onNavigate('remix', { id: story.id });
                                    }}
                                    className="flex items-center gap-1.5 text-blue-400 hover:text-white bg-blue-900/20 hover:bg-blue-600 px-4 py-2 rounded-xl transition-all"
                                >
                                    <GitMerge size={16} /> Remix
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            {/* Mobile View All */}
            <button className="w-full sm:hidden mt-8 flex items-center justify-center gap-2 bg-gray-900 border border-gray-800 py-4 rounded-2xl text-gray-300 hover:text-white transition-colors">
                View All Community Creations <ArrowRight size={18} />
            </button>
        </div>
    );
}