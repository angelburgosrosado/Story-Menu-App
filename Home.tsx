import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Spline from '@splinetool/react-spline';
import { CommunityGallery } from './CommunityGallery';
import { 
  Sparkles, Layers, Flame, BookOpen, Star, GitMerge, 
  ArrowRight, PenTool, Globe, Zap, Play, Pause, Volume2, 
  Music, Eye, RotateCw, AlertTriangle, UserCheck, ShieldCheck, Cpu, Sun, Moon, Menu, X, Loader2, Image as ImageIcon
} from 'lucide-react';
import { 
  startProceduralSoundtrack, 
  stopProceduralSoundtrack, 
  playLaserSFX, 
  playExplosionSFX, 
  playPageTurnSFX 
} from './audio';
import { LANGUAGES, ART_STYLES } from './types';

export const Home = ({ onNavigate }: { onNavigate: (view: string, data?: any) => void }) => {
    const { i18n } = useTranslation();
    const { t } = useTranslation();
    
    // Soundtrack state
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const [selectedAudioGenre, setSelectedAudioGenre] = useState('Sci-Fi Cyberpunk');

    // Style selector state
    const [selectedStyleTab, setSelectedStyleTab] = useState('anime');
    const [isLightMode, setIsLightMode] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [landingConfig, setLandingConfig] = useState<any>(null);
    const [plans, setPlans] = useState<any[]>([]);
    const [isSubscription, setIsSubscription] = useState(true);


    useEffect(() => {
        fetch('/api/public/landing')
            .then(res => res.json())
            .then(data => setLandingConfig(data))
            .catch(err => console.error("Failed to load landing config", err));
            
        fetch('/api/public/plans')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    // Sort by price
                    data.sort((a, b) => (a.priceSubscription || 0) - (b.priceSubscription || 0));
                    setPlans(data);
                }
            })
            .catch(err => console.error("Failed to load plans", err));
    }, []);

    const defaultStylePreviews = {
        anime: {
            title: "Retro Anime 90s",
            desc: t('sandbox6.styleDesc1', "Cell-shaded hand-painted watercolor backgrounds, deep cinematic dramatic gradients, classic vintage overlay."),
            cover: "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=800&q=80",
            badge: "Trending"
        },
        noir: {
            title: "Noir Graphic Novel",
            desc: "Heavy shadows, high contrast inks, ink-wash textures, retro comic newsprint halftones.",
            cover: "https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=800&q=80",
            badge: "Classic"
        },
        pixar: {
            title: "Pixar 3D Adventure",
            desc: "Subtle clay shaders, rich global illumination, colorful and expressive caricature models, high depth of field.",
            cover: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80",
            badge: "Kids"
        },
        handdrawn: {
            title: "Artisanal Sketch & Watercolor",
            desc: "Warm textures, sketch lines, watercolor bleeding, personal hand-crafted storytelling ambiance.",
            cover: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80",
            badge: "Artisanal"
        }
    };

    const stylePreviews = landingConfig?.stylePreviews || defaultStylePreviews;

    // Extended mock data for trending stories
    const trendingStories = [
        { id: 1, title: "Neon Nights", creator: "CyberPunk_99", type: "Comic", likes: 342, tags: ["Sci-Fi", "Cyberpunk"], cover: "https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?auto=format&fit=crop&w=400&q=80" },
        { id: 2, title: "The Last Wizard", creator: "FantasyScribe", type: "Ebook", likes: 289, tags: ["Fantasy", "Magic"], cover: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80" },
        { id: 3, title: "Mars Colony", creator: "RedPlanet", type: "Comic", likes: 512, tags: ["Sci-Fi", "Space"], cover: "https://images.unsplash.com/photo-1614729939124-03290b5609ce?auto=format&fit=crop&w=400&q=80" },
        { id: 4, title: "Detective's Shadow", creator: "NoirTales", type: "Comic", likes: 156, tags: ["Mystery", "Noir"], cover: "https://images.unsplash.com/photo-1584351583369-6baf055b51a7?auto=format&fit=crop&w=400&q=80" }
    ];

    // Handle Soundtrack synthesis
    const handleAudioToggle = () => {
        if (isPlayingAudio) {
            stopProceduralSoundtrack();
            setIsPlayingAudio(false);
        } else {
            startProceduralSoundtrack(selectedAudioGenre);
            setIsPlayingAudio(true);
        }
    };

    const handleGenreChange = (genre: string) => {
        setSelectedAudioGenre(genre);
        if (isPlayingAudio) {
            startProceduralSoundtrack(genre);
        }
    };

    // Clean up audio on unmount
    useEffect(() => {
        return () => {
            stopProceduralSoundtrack();
        };
    }, []);

    // Actions triggering state changes inside App.tsx
    const handleActionUnlockCloud = () => {
        if (!localStorage.getItem('infinite_heroes_creator')) {
            window.dispatchEvent(new Event('trigger-auth-dialog'));
        }
        onNavigate('studio');
    };

    const handleActionLaunchSandbox = () => {
        window.dispatchEvent(new Event('trigger-sandbox-mode'));
        onNavigate('studio');
    };

    const handleActionCheckout = (tier: 'Pro' | 'Enterprise') => {
        window.dispatchEvent(new CustomEvent('trigger-checkout-dialog', { detail: tier }));
        onNavigate('studio');
    };

    const handleLaunchStudio = (mode: 'comic' | 'kid-story' | 'writers-journal') => {
        localStorage.setItem('story_menu_skin', mode);
        window.dispatchEvent(new Event('storage'));
        onNavigate('studio');
    };

    return (
        <div className={`min-h-screen w-full transition-colors duration-500 relative ${isLightMode ? 'bg-slate-50 text-slate-900' : 'bg-gray-950 text-white'}`}>
            
            {/* Main Header / Navigation Bar */}
            <header className={`sticky top-0 z-[100] w-full backdrop-blur-md border-b transition-all ${
                isLightMode 
                ? 'bg-white/80 border-slate-200/80 shadow-[0_2px_15px_rgba(0,0,0,0.02)]' 
                : 'bg-gray-950/80 border-white/10 shadow-[0_2px_15px_rgba(0,0,0,0.2)]'
            }`}>
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <img 
                            src="logo.png" 
                            alt="Story.Menu Logo" 
                            className="w-10 h-10 object-contain rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-1 shadow-md shadow-indigo-500/10"
                        />
                        <span className={`text-xl font-extrabold tracking-tight font-sans bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500`}>
                            Story.Menu
                        </span>
                    </div>

                    {/* Desktop Navigation links */}
                    <nav className="hidden md:flex items-center gap-8 text-sm font-semibold">
                        <a href="#showcase" className={`transition-colors hover:text-indigo-500 ${isLightMode ? 'text-slate-600' : 'text-gray-300'}`}>{t('home.nav.showcase', 'Artistic Showcase')}</a>
                        <a href="#soundscapes" className={`transition-colors hover:text-indigo-500 ${isLightMode ? 'text-slate-600' : 'text-gray-300'}`}>{t('home.nav.soundscapes', 'Soundscapes')}</a>
                        <a href="#capabilities" className={`transition-colors hover:text-indigo-500 ${isLightMode ? 'text-slate-600' : 'text-gray-300'}`}>{t('home.nav.capabilities', 'Capabilities')}</a>
                        <a href="#pricing" className={`transition-colors hover:text-indigo-500 ${isLightMode ? 'text-slate-600' : 'text-gray-300'}`}>{t('home.nav.pricing', 'Pricing')}</a>
                        <a href="#trending" className={`transition-colors hover:text-indigo-500 ${isLightMode ? 'text-slate-600' : 'text-gray-300'}`}>{t('home.nav.trending', 'Trending')}</a>
                        <button onClick={() => window.location.href='/admin'} className={`transition-colors font-bold text-indigo-500 hover:text-indigo-400`}>Admin Dashboard</button>
                    </nav>

                    {/* Right side items */}
                    <div className="hidden md:flex items-center gap-4">
                        {/* Language Selector */}
                        <select
                            value={i18n.language || 'en'}
                            onChange={(e) => {
                                const shortCode = e.target.value;
                                const newPath = shortCode === 'en' ? '/' : `/${shortCode}/`;
                                window.history.pushState(null, '', newPath);
                                i18n.changeLanguage(shortCode);
                            }}
                            className={`px-3 py-2.5 rounded-xl border outline-none font-semibold text-sm transition-all cursor-pointer ${
                                isLightMode
                                ? 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.05)]'
                                : 'bg-gray-900 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            {LANGUAGES.map(l => {
                                const langPrefix = l.code.split('-')[0].toLowerCase();
                                // We use a short display to save space
                                const shortDisplay = l.name.split(' ')[0];
                                return (
                                    <option key={l.code} value={langPrefix}>{shortDisplay}</option>
                                );
                            })}
                        </select>
                        {/* Theme Switcher Toggle */}
                        <button
                            onClick={() => {
                                setIsLightMode(!isLightMode);
                                playPageTurnSFX();
                            }}
                            className={`flex items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                                isLightMode 
                                ? 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.05)]' 
                                : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                            }`}
                            aria-label="Toggle Theme"
                        >
                            {isLightMode ? <Moon size={16} /> : <Sun size={16} />}
                        </button>
                        <button 
                            onClick={handleActionUnlockCloud}
                            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:scale-[1.03] transition-all shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:shadow-[0_0_35px_rgba(168,85,247,0.4)] cursor-pointer"
                        >
                            {t('home.nav.launchStudio', 'Launch Studio')}
                        </button>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="flex items-center gap-2 md:hidden">
                        {/* Language Selector Mobile */}
                        <select
                            value={i18n.language || 'en'}
                            onChange={(e) => {
                                const shortCode = e.target.value;
                                const newPath = shortCode === 'en' ? '/' : `/${shortCode}/`;
                                window.history.pushState(null, '', newPath);
                                i18n.changeLanguage(shortCode);
                            }}
                            className={`p-2 rounded-xl border outline-none font-semibold text-sm transition-all cursor-pointer ${
                                isLightMode
                                ? 'bg-white text-slate-800 border-slate-200'
                                : 'bg-gray-900 text-gray-300 border-white/10'
                            }`}
                        >
                            {LANGUAGES.map(l => (
                                <option key={l.code} value={l.code.split('-')[0].toLowerCase()}>{l.code.split('-')[0].toUpperCase()}</option>
                            ))}
                        </select>
                        {/* Theme Switcher Toggle Mobile */}
                        <button
                            onClick={() => {
                                setIsLightMode(!isLightMode);
                                playPageTurnSFX();
                            }}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                                isLightMode 
                                ? 'bg-white text-slate-800 border-slate-200' 
                                : 'bg-white/5 text-gray-300 border-white/10'
                            }`}
                        >
                            {isLightMode ? <Moon size={16} /> : <Sun size={16} />}
                        </button>
                        <button
                            onClick={() => {
                                setIsMobileMenuOpen(!isMobileMenuOpen);
                                playPageTurnSFX();
                            }}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                                isLightMode 
                                ? 'bg-white text-slate-850 border-slate-200' 
                                : 'bg-white/5 text-gray-300 border-white/10'
                            }`}
                        >
                            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Dropdown Menu */}
                {isMobileMenuOpen && (
                    <div className={`md:hidden border-t px-6 py-6 space-y-4 transition-all ${
                        isLightMode 
                        ? 'bg-white border-slate-200' 
                        : 'bg-gray-950 border-white/10'
                    }`}>
                        <div className="flex flex-col gap-4 text-sm font-semibold text-left">
                            <a href="#showcase" onClick={() => setIsMobileMenuOpen(false)} className={`py-1.5 transition-colors hover:text-indigo-500 ${isLightMode ? 'text-slate-600' : 'text-gray-300'}`}>{t('home.nav.showcase', 'Artistic Showcase')}</a>
                            <a href="#soundscapes" onClick={() => setIsMobileMenuOpen(false)} className={`py-1.5 transition-colors hover:text-indigo-500 ${isLightMode ? 'text-slate-600' : 'text-gray-300'}`}>{t('home.nav.soundscapes', 'Soundscapes')}</a>
                            <a href="#capabilities" onClick={() => setIsMobileMenuOpen(false)} className={`py-1.5 transition-colors hover:text-indigo-500 ${isLightMode ? 'text-slate-600' : 'text-gray-300'}`}>{t('home.nav.capabilities', 'Capabilities')}</a>
                            <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className={`py-1.5 transition-colors hover:text-indigo-500 ${isLightMode ? 'text-slate-600' : 'text-gray-300'}`}>{t('home.nav.pricing', 'Pricing')}</a>
                            <a href="#trending" onClick={() => setIsMobileMenuOpen(false)} className={`py-1.5 transition-colors hover:text-indigo-500 ${isLightMode ? 'text-slate-600' : 'text-gray-300'}`}>{t('home.nav.trending', 'Trending')}</a>
                        </div>
                        <div className="pt-4 border-t border-dashed border-indigo-500/20">
                            <button 
                                onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    handleActionUnlockCloud();
                                }}
                                className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white py-3 rounded-xl text-sm font-bold shadow-md cursor-pointer"
                            >
                                {t('home.nav.launchStudio', 'Launch Studio')}
                            </button>
                        </div>
                    </div>
                )}
            </header>

            <div className="max-w-7xl mx-auto px-6 pt-16 pb-24 relative">

                {/* Background glowing ambient grids */}
                <div className="ambient-orb cyan w-[500px] h-[500px] top-10 left-1/4 animate-pulse-glow -z-10 transition-colors absolute pointer-events-none"></div>
                <div className="ambient-orb fuchsia w-[600px] h-[600px] top-1/4 right-1/4 animate-pulse-glow -z-10 transition-colors absolute pointer-events-none" style={{ animationDelay: '3s' }}></div>

                {/* 3D Spline Background */}
                <div className="absolute inset-0 z-0 pointer-events-auto w-full h-[800px] overflow-hidden opacity-80" style={{ transform: 'translateY(-100px)' }}>
                    <Spline scene="https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode" />
                </div>

                {/* Magical Hero Section */}
                <div className="w-full flex flex-col items-center text-center max-w-5xl mx-auto mb-24 relative z-10 pt-10">
                    <div className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border backdrop-blur-md mb-8 ${isLightMode ? 'bg-amber-100 border-amber-300' : 'bg-amber-500/20 border-amber-500/40'}`}>
                        <span className="flex h-3 w-3 rounded-full bg-amber-500 animate-pulse"></span>
                        <span className={`text-sm font-bold tracking-wide ${isLightMode ? 'text-amber-700' : 'text-amber-300'}`}>👑 Premium Features Now Available</span>
                    </div>

                    <h1 className={`text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.15] mb-6 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                        Turn Your Ideas Into <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600">
                            Complete Comic Stories
                        </span>
                    </h1>

                    <p className={`text-xl md:text-2xl font-light leading-relaxed max-w-3xl mx-auto mb-10 ${isLightMode ? 'text-slate-600' : 'text-gray-300'}`}>
                        Showcase Your Talent to the World. Transform everyday ideas...into structured, warm, shareable comic stories.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 w-full max-w-2xl mx-auto">
                        <button 
                            onClick={() => {
                                window.dispatchEvent(new Event('trigger-auth-dialog'));
                            }}
                            className="px-10 py-5 rounded-full font-black text-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-400 text-white shadow-[0_0_40px_rgba(168,85,247,0.4)] transition-all hover:-translate-y-1 hover:shadow-[0_0_60px_rgba(168,85,247,0.6)] border border-white/20"
                        >
                            Sign Up Free ✨
                        </button>
                    </div>

                    <div className={`flex flex-col items-center gap-3 mb-16 ${isLightMode ? 'text-slate-700' : 'text-gray-300'}`}>
                        <div className="flex text-amber-400 text-xl">
                            ★★★★★
                        </div>
                        <p className="font-medium text-sm md:text-base">Trusted by over 300,000 people.</p>
                    </div>

                    {/* Premium Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full max-w-4xl mx-auto">
                        <div className={`p-4 rounded-2xl border backdrop-blur-sm flex flex-col items-center justify-center text-center ${isLightMode ? 'bg-white/80 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                            <Zap className="w-6 h-6 text-orange-400 mb-2" />
                            <h4 className="font-bold text-sm">Enhanced Models</h4>
                            <p className="text-xs opacity-70">Stronger Prompt Following</p>
                        </div>
                        <div className={`p-4 rounded-2xl border backdrop-blur-sm flex flex-col items-center justify-center text-center ${isLightMode ? 'bg-white/80 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                            <ImageIcon className="w-6 h-6 text-purple-400 mb-2" />
                            <h4 className="font-bold text-sm">Higher Resolution</h4>
                            <p className="text-xs opacity-70">Crystal clear artwork</p>
                        </div>
                        <div className={`p-4 rounded-2xl border backdrop-blur-sm flex flex-col items-center justify-center text-center ${isLightMode ? 'bg-white/80 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                            <ShieldCheck className="w-6 h-6 text-cyan-400 mb-2" />
                            <h4 className="font-bold text-sm">Watermark-Free</h4>
                            <p className="text-xs opacity-70">Clean exports</p>
                        </div>
                        <div className={`p-4 rounded-2xl border backdrop-blur-sm flex flex-col items-center justify-center text-center ${isLightMode ? 'bg-white/80 border-slate-200' : 'bg-white/5 border-white/10'}`}>
                            <Globe className="w-6 h-6 text-pink-400 mb-2" />
                            <h4 className="font-bold text-sm">Social-Ready</h4>
                            <p className="text-xs opacity-70">Optimized assets</p>
                        </div>
                    </div>
                    
                    <p className="mt-12 text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-gray-600">
                        Your Imagination, Unleashed by AI.
                    </p>
                </div>

                {/* Visual Style Showcase Grid (Moved Up!) */}
                <div id="showcase" className="mb-24">
                    <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${isLightMode ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'}`}>
                            <PenTool size={12} /> Artistic Diversity
                        </div>
                        <h2 className={`text-3xl md:text-5xl font-extrabold tracking-tight ${isLightMode ? 'text-slate-900' : 'text-white'}`}>Artisanal & Storybook Styles</h2>
                        <p className={`font-light ${isLightMode ? 'text-slate-600' : 'text-gray-400'}`}>Choose a visual framework that aligns with your story's soul. Hand-drawn aesthetics meet modern SaaS tools.</p>
                    </div>

                    {/* Switcher tabs */}
                    <div className="flex justify-center gap-2 mb-8 flex-wrap">
                        {Object.keys(stylePreviews).map((key) => (
                            <button
                                key={key}
                                onClick={() => {
                                    setSelectedStyleTab(key);
                                    playPageTurnSFX();
                                }}
                                className={`px-6 py-2.5 rounded-xl font-semibold transition-all cursor-pointer ${
                                    selectedStyleTab === key 
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                                    : isLightMode 
                                    ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' 
                                    : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
                                }`}
                            >
                                {stylePreviews[key as keyof typeof stylePreviews].title}
                            </button>
                        ))}
                    </div>

                    {/* Showcase Display Card */}
                    <div className={`rounded-[2rem] overflow-hidden border grid grid-cols-1 md:grid-cols-12 gap-8 p-6 md:p-10 items-center transition-all ${
                        isLightMode 
                        ? 'bg-white border-slate-200 shadow-xl' 
                        : 'glass-panel border-white/10'
                    }`}>
                        
                        <div className="md:col-span-5 space-y-6 text-left">
                            <span className="text-xs bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 px-3 py-1 rounded-md font-bold uppercase tracking-wider">
                                {stylePreviews[selectedStyleTab as keyof typeof stylePreviews].badge}
                            </span>
                            <h3 className={`text-3xl font-extrabold ${isLightMode ? 'text-slate-800' : 'text-white'}`}>
                                {stylePreviews[selectedStyleTab as keyof typeof stylePreviews].title}
                            </h3>
                            <p className={`font-light leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-gray-400'}`}>
                                {stylePreviews[selectedStyleTab as keyof typeof stylePreviews].desc}
                            </p>
                            
                            <div className="pt-4 flex gap-4">
                                <button 
                                    onClick={handleActionLaunchSandbox}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all cursor-pointer border ${
                                        isLightMode 
                                        ? 'bg-slate-900 text-white border-slate-800 hover:bg-slate-800' 
                                        : 'bg-white text-black border-transparent hover:bg-gray-200'
                                    }`}
                                >
                                    <Sparkles size={16} className="text-indigo-500" />
                                    Launch with this Style
                                </button>
                            </div>
                        </div>

                        <div className="md:col-span-7">
                            <div className={`relative rounded-2xl overflow-hidden aspect-[16/10] border group shadow-2xl ${isLightMode ? 'border-slate-200' : 'border-white/15'}`}>
                                <img 
                                    src={stylePreviews[selectedStyleTab as keyof typeof stylePreviews].cover} 
                                    alt={stylePreviews[selectedStyleTab as keyof typeof stylePreviews].title} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1.5s]"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent opacity-85"></div>
                                <div className="absolute bottom-6 left-6 text-left">
                                    <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider mb-1">Rendering Lock</p>
                                    <p className="text-lg font-bold text-white">Consistent Art Direction Engine</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Procedural Audio & Interactive SFX Panel (Moved Up!) */}
                <div id="soundscapes" className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-24">
                    
                    {/* Audio Engine Dashboard */}
                    <div className={`lg:col-span-7 rounded-[2rem] p-8 border text-left space-y-6 relative overflow-hidden transition-all ${
                        isLightMode 
                        ? 'bg-white border-slate-200 shadow-xl' 
                        : 'glass-panel border-white/10'
                    }`}>
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px] pointer-events-none"></div>

                        <div className="flex items-center gap-3">
                            <div className="bg-purple-500/20 p-2.5 rounded-xl border border-purple-500/30 text-purple-400">
                                <Music size={24} />
                            </div>
                            <div>
                                <h3 className={`text-2xl font-bold ${isLightMode ? 'text-slate-800' : 'text-white'}`}>Interactive Soundscapes</h3>
                                <p className={`text-xs font-mono ${isLightMode ? 'text-slate-400' : 'text-gray-500'}`}>Web Audio procedural synth engine</p>
                            </div>
                        </div>

                        <p className={`font-light leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-gray-400'}`}>
                            Every multiverse genre carries its own generative procedural theme. Change genres to watch the synthetic frequency arpeggios shift live in your browser's audio nodes.
                        </p>

                        {/* Audio controller display */}
                        <div className={`border rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-center justify-between transition-all ${
                            isLightMode 
                            ? 'bg-slate-55 border-slate-200 bg-slate-50' 
                            : 'border-white/10 bg-black/40'
                        }`}>
                            <div className="flex items-center gap-4">
                                <button 
                                    onClick={handleAudioToggle}
                                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                                        isPlayingAudio 
                                        ? 'bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-600/30' 
                                        : isLightMode 
                                        ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg' 
                                        : 'bg-white text-black hover:bg-gray-200 shadow-lg'
                                    }`}
                                >
                                    {isPlayingAudio ? <Pause size={28} fill="currentColor" /> : <Play size={28} className="translate-x-0.5" fill="currentColor" />}
                                </button>
                                <div>
                                    <p className={`text-xs uppercase font-bold tracking-wider ${isLightMode ? 'text-slate-400' : 'text-gray-500'}`}>Soundtrack Status</p>
                                    <p className={`text-lg font-bold ${isLightMode ? 'text-slate-800' : 'text-white'}`}>{isPlayingAudio ? 'Procedural Audio Running' : 'Synthesizer Standby'}</p>
                                </div>
                            </div>

                            {/* Selector for soundtrack themes */}
                            <div className="flex flex-wrap gap-2 justify-center">
                                {['Sci-Fi Cyberpunk', 'Magic Fantasy', 'Slice of Life'].map((theme) => (
                                    <button
                                        key={theme}
                                        onClick={() => handleGenreChange(theme)}
                                        className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                                            selectedAudioGenre === theme 
                                            ? 'bg-purple-600/20 text-purple-600 border-purple-500/40' 
                                            : isLightMode 
                                            ? 'bg-white hover:bg-slate-100 text-slate-600 border-slate-200' 
                                            : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border-transparent'
                                        }`}
                                    >
                                        {theme}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Animated wave bars */}
                        <div className={`flex items-end justify-between h-16 px-4 rounded-xl border ${isLightMode ? 'bg-slate-50 border-slate-200' : 'bg-black/20 border-white/5'}`}>
                            {Array.from({ length: 24 }).map((_, idx) => {
                                const heights = [20, 40, 15, 60, 30, 48, 24, 55, 38, 12, 45, 64, 20, 32, 40, 15, 60, 24, 48, 35, 12, 50, 22, 10];
                                const currentHeight = heights[idx % heights.length];
                                
                                const animClass = idx % 4 === 0 
                                    ? 'waveform-bar-delayed-1' 
                                    : idx % 4 === 1 
                                    ? 'waveform-bar-delayed-2' 
                                    : idx % 4 === 2 
                                    ? 'waveform-bar-delayed-3' 
                                    : 'waveform-bar-delayed-4';

                                return (
                                    <div 
                                        key={idx}
                                        style={{ height: `${currentHeight}%`, animationPlayState: isPlayingAudio ? 'running' : 'paused' }}
                                        className={`w-1.5 bg-gradient-to-t from-indigo-500 via-purple-500 to-pink-500 rounded-t-sm waveform-bar ${animClass}`}
                                    />
                                );
                            })}
                        </div>
                    </div>

                    {/* SFX triggers pad */}
                    <div className={`lg:col-span-5 rounded-[2rem] p-8 border text-left flex flex-col justify-between space-y-6 transition-all ${
                        isLightMode 
                        ? 'bg-white border-slate-200 shadow-xl' 
                        : 'glass-panel border-white/10'
                    }`}>
                        <div>
                            <h3 className={`text-2xl font-bold flex items-center gap-2 ${isLightMode ? 'text-slate-800' : 'text-white'}`}>
                                <Volume2 className="text-pink-500" />
                                {t('sandbox6.sfxTitle', 'Spatial SFX Board')}
                            </h3>
                            <p className={`text-sm mt-2 ${isLightMode ? 'text-slate-500' : 'text-gray-400'}`}>
                                Click any trigger block to command the sound synthesis engine directly.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={playLaserSFX}
                                className={`border rounded-2xl p-5 text-center transition-all cursor-pointer group ${
                                    isLightMode 
                                    ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-pink-500/40 shadow-sm' 
                                    : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-pink-500/40'
                                }`}
                            >
                                <span className="block text-2xl mb-1">⚡</span>
                                <span className="block text-xs uppercase font-mono tracking-widest text-gray-500 group-hover:text-pink-500">Laser Beam</span>
                            </button>
                            <button 
                                onClick={playExplosionSFX}
                                className={`border rounded-2xl p-5 text-center transition-all cursor-pointer group ${
                                    isLightMode 
                                    ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-pink-500/40 shadow-sm' 
                                    : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-pink-500/40'
                                }`}
                            >
                                <span className="block text-2xl mb-1">💥</span>
                                <span className="block text-xs uppercase font-mono tracking-widest text-gray-500 group-hover:text-pink-500">Explosion</span>
                            </button>
                            <button 
                                onClick={playPageTurnSFX}
                                className={`border rounded-2xl p-5 text-center transition-all cursor-pointer group ${
                                    isLightMode 
                                    ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-pink-500/40 shadow-sm' 
                                    : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-pink-500/40'
                                }`}
                            >
                                <span className="block text-2xl mb-1">📖</span>
                                <span className="block text-xs uppercase font-mono tracking-widest text-gray-500 group-hover:text-pink-500">Page Turn</span>
                            </button>
                            <button 
                                onClick={() => {
                                    playPageTurnSFX();
                                    setTimeout(playLaserSFX, 200);
                                }}
                                className="bg-gradient-to-r from-pink-500/10 to-indigo-500/10 hover:from-pink-500/20 hover:to-indigo-500/20 border border-indigo-500/30 rounded-2xl p-5 text-center transition-all cursor-pointer group"
                            >
                                <span className="block text-2xl mb-1">🚀</span>
                                <span className={`block text-xs uppercase font-mono tracking-widest group-hover:text-indigo-600 ${isLightMode ? 'text-slate-500' : 'text-gray-400'}`}>Combo Synthesis</span>
                            </button>
                        </div>

                        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs ${isLightMode ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'bg-yellow-500/5 border-yellow-500/20 text-yellow-400/80'}`}>
                            <AlertTriangle size={14} className="flex-shrink-0" />
                            {t('sandbox6.audioWarn', 'Ensure your system audio is enabled to hear procedural sounds.')}
                        </div>
                    </div>
                </div>

                {/* Core Capabilities Section (Repurposed from original page bento grid) */}
                <div id="capabilities" className="mb-24">
                    <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${isLightMode ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'}`}>
                            <Cpu size={12} /> {landingConfig?.capabilitiesBadge || "Chassis v3.11 Publishing Workshop"}
                        </div>
                        <h2 className={`text-3xl md:text-5xl font-extrabold tracking-tight ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{landingConfig?.capabilitiesTitle || "Built For Dynamic Multi-Tenant Publishing"}</h2>
                        <p className={`font-light ${isLightMode ? 'text-slate-600' : 'text-gray-400'}`}>{landingConfig?.capabilitiesDesc || "A high-end creative workshop structured to keep your graphic novels continuous, atmospheric, and visually arresting."}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Feature 1: Story Blueprint Architect */}
                        <div className={`rounded-3xl p-8 text-left border flex flex-col justify-between transition-all ${
                            isLightMode 
                            ? 'bg-white border-slate-200 shadow-md hover:border-indigo-500/30' 
                            : 'glass-panel border-white/10 hover:border-indigo-500/30'
                        }`}>
                            <div>
                                <div className="w-14 h-14 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/20 shadow-inner">
                                    <Layers size={26} />
                                </div>
                                <h3 className={`text-xl font-bold mb-3 ${isLightMode ? 'text-slate-800' : 'text-white'}`}>Story Blueprint Architect</h3>
                                <p className={`text-sm leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-gray-400'}`}>Map chapter goals from inciting incident triggers on page 1 to decision branches on page 3, climbing to the climax on page 9. Strictly structured outline grids.</p>
                            </div>
                            <span className="text-[10px] font-mono font-semibold text-indigo-400 uppercase mt-6 block">● CHAPTER CONTROL ACTIVE</span>
                        </div>

                        {/* Feature 2: Multi-Tenant Casting Vault */}
                        <div className={`rounded-3xl p-8 text-left border flex flex-col justify-between transition-all ${
                            isLightMode 
                            ? 'bg-white border-slate-200 shadow-md hover:border-purple-500/30' 
                            : 'glass-panel border-white/10 hover:border-purple-500/30'
                        }`}>
                            <div>
                                <div className="w-14 h-14 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center mb-6 border border-purple-500/20 shadow-inner">
                                    <PenTool size={26} />
                                </div>
                                <h3 className={`text-xl font-bold mb-3 ${isLightMode ? 'text-slate-800' : 'text-white'}`}>Multi-Tenant Casting Vault</h3>
                                <p className={`text-sm leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-gray-400'}`}>Forge persistent files containing character biometrics, facial weights, clothing references, and style lock keys. Keep heroes and archenemies consistent.</p>
                            </div>
                            <span className="text-[10px] font-mono font-semibold text-purple-400 uppercase mt-6 block">● MODEL SYNTAX LOCKED</span>
                        </div>

                        {/* Feature 3: Multi-Engine Diffusion Router */}
                        <div className={`rounded-3xl p-8 text-left border flex flex-col justify-between transition-all ${
                            isLightMode 
                            ? 'bg-white border-slate-200 shadow-md hover:border-cyan-500/30' 
                            : 'glass-panel border-white/10 hover:border-cyan-500/30'
                        }`}>
                            <div>
                                <div className="w-14 h-14 bg-cyan-500/10 text-cyan-400 rounded-2xl flex items-center justify-center mb-6 border border-cyan-500/20 shadow-inner">
                                    <Cpu size={26} />
                                </div>
                                <h3 className={`text-xl font-bold mb-3 ${isLightMode ? 'text-slate-800' : 'text-white'}`}>Multi-Engine Diffusion Router</h3>
                                <p className={`text-sm leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-gray-400'}`}>Choose your renderer: LlamaGen.ai (Comic API) for panel grids, Stable Diffusion (via ComfyUI) for raw workflow control, Leonardo.ai (CharRef), or Gemini 2.5 Flash.</p>
                            </div>
                            <span className="text-[10px] font-mono font-semibold text-cyan-400 uppercase mt-6 block">● DIFFUSION ENGINES STABLE</span>
                        </div>

                        {/* Feature 4: Synthesized Speech Narration */}
                        <div className={`rounded-3xl p-8 text-left border flex flex-col justify-between transition-all ${
                            isLightMode 
                            ? 'bg-white border-slate-200 shadow-md hover:border-pink-500/30' 
                            : 'glass-panel border-white/10 hover:border-pink-500/30'
                        }`}>
                            <div>
                                <div className="w-14 h-14 bg-pink-500/10 text-pink-400 rounded-2xl flex items-center justify-center mb-6 border border-pink-500/20 shadow-inner">
                                    <Volume2 size={26} />
                                </div>
                                <h3 className={`text-xl font-bold mb-3 ${isLightMode ? 'text-slate-800' : 'text-white'}`}>Synthesized Speech Narration</h3>
                                <p className={`text-sm leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-gray-400'}`}>Hear dialogue panels narrated instantly! Generates character text-to-speech outputs in multiple actor voice accents alongside backing audio.</p>
                            </div>
                            <span className="text-[10px] font-mono font-semibold text-pink-400 uppercase mt-6 block">● VOICE ENGINES READY</span>
                        </div>

                        {/* Feature 5: Procedural Soundscapes */}
                        <div className={`rounded-3xl p-8 text-left border flex flex-col justify-between transition-all ${
                            isLightMode 
                            ? 'bg-white border-slate-200 shadow-md hover:border-emerald-500/30' 
                            : 'glass-panel border-white/10 hover:border-emerald-500/30'
                        }`}>
                            <div>
                                <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/20 shadow-inner">
                                    <Music size={26} />
                                </div>
                                <h3 className={`text-xl font-bold mb-3 ${isLightMode ? 'text-slate-800' : 'text-white'}`}>Procedural Soundscapes</h3>
                                <p className={`text-sm leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-gray-400'}`}>Generative arpeggios, frequency oscillators, and synthesized background themes that adapt dynamically to your selected story genres.</p>
                            </div>
                            <span className="text-[10px] font-mono font-semibold text-emerald-400 uppercase mt-6 block">● AUDIOPROCESSOR OPERATIONAL</span>
                        </div>

                        {/* Feature 6: Publishing & Export Hub */}
                        <div className={`rounded-3xl p-8 text-left border flex flex-col justify-between transition-all ${
                            isLightMode 
                            ? 'bg-white border-slate-200 shadow-md hover:border-yellow-500/30' 
                            : 'glass-panel border-white/10 hover:border-yellow-500/30'
                        }`}>
                            <div>
                                <div className="w-14 h-14 bg-yellow-500/10 text-yellow-400 rounded-2xl flex items-center justify-center mb-6 border border-yellow-500/20 shadow-inner">
                                    <BookOpen size={26} />
                                </div>
                                <h3 className={`text-xl font-bold mb-3 ${isLightMode ? 'text-slate-800' : 'text-white'}`}>Unified Book & PDF Export</h3>
                                <p className={`text-sm leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-gray-400'}`}>Compile completed comics directly to high-fidelity PDF documents. Automatically packages page layouts, panels, speech bubbles, and text logs.</p>
                            </div>
                            <span className="text-[10px] font-mono font-semibold text-yellow-400 uppercase mt-6 block">● EXPORTER STANDBY</span>
                        </div>
                    </div>
                </div>

                {/* Upgraded Trending Universes Feed */}
                <div id="trending" className={`flex items-center justify-between mb-10 pt-8 border-t ${isLightMode ? 'border-slate-200' : 'border-white/10'}`}>
                    <div className="flex items-center gap-3">
                        <div className="bg-pink-500/20 p-2.5 rounded-xl border border-pink-500/30 text-pink-500">
                            <Flame size={24} />
                        </div>
                        <h2 className={`text-3xl md:text-4xl font-extrabold tracking-tight ${isLightMode ? 'text-slate-900' : 'text-white'}`}>Trending Multiverses</h2>
                    </div>
                    <button 
                        onClick={handleActionLaunchSandbox}
                        className={`flex items-center gap-1.5 text-sm font-semibold transition-colors cursor-pointer ${isLightMode ? 'text-slate-500 hover:text-slate-800' : 'text-gray-400 hover:text-white'}`}
                    >
                        Create Your Story <ArrowRight size={16} />
                    </button>
                </div>

                <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 mb-24 pb-8 -mx-6 px-6 hide-scrollbar" style={{ scrollbarWidth: 'none' }}>
                    {trendingStories.map(story => (
                        <div 
                            key={story.id} 
                            onClick={() => onNavigate('reader', { id: story.id })}
                            className={`min-w-[85vw] sm:min-w-[45vw] lg:min-w-[22vw] snap-center shrink-0 rounded-2xl overflow-hidden border transition-all duration-300 group cursor-pointer flex flex-col ${
                                isLightMode 
                                ? 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-lg' 
                                : 'glass-panel border-white/10 hover:border-indigo-500/40 hover:shadow-[0_10px_30px_rgba(99,102,241,0.15)]'
                            }`}
                        >
                            <div className="h-56 overflow-hidden relative">
                                <img src={story.cover} alt={story.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1.2s] ease-out" />
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent opacity-85"></div>
                                
                                {/* Tags overlay */}
                                <div className="absolute top-4 left-4 flex gap-2">
                                    <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1.5 border border-white/10 text-gray-250">
                                        {story.type === 'Comic' ? <BookOpen size={10} className="text-indigo-400" /> : <Layers size={10} className="text-pink-400"/>}
                                        {story.type}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-5 relative flex-1 flex flex-col justify-between">
                                <div>
                                    <h3 className={`text-lg font-bold mb-1 group-hover:text-indigo-500 transition-colors line-clamp-1 text-left ${isLightMode ? 'text-slate-800' : 'text-white'}`}>{story.title}</h3>
                                    <p className={`text-xs mb-3 text-left ${isLightMode ? 'text-slate-400' : 'text-gray-400'}`}>by @{story.creator}</p>
                                    
                                    <div className="flex flex-wrap gap-1.5 mb-4 justify-start">
                                        {story.tags.map(tag => (
                                            <span key={tag} className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${isLightMode ? 'text-slate-600 bg-slate-100 border-slate-200' : 'text-gray-400 bg-white/5 border-white/5'}`}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className={`flex justify-between items-center text-xs font-semibold pt-3 border-t ${isLightMode ? 'border-slate-100' : 'border-white/5'}`}>
                                    <div className={`flex items-center gap-1 ${isLightMode ? 'text-slate-600' : 'text-gray-300'}`}>
                                        <Star size={14} className="text-amber-400 fill-amber-400" /> {story.likes}
                                    </div>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onNavigate('remix', { id: story.id });
                                        }}
                                        className="flex items-center gap-1 text-indigo-400 hover:text-white bg-indigo-500/10 hover:bg-indigo-600 px-3.5 py-1.5 rounded-lg transition-all border border-indigo-500/20 cursor-pointer"
                                    >
                                        <GitMerge size={12} /> Remix
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pricing Section (Original copy, repurposed in high-end Glassmorphic styles) */}
                <div id="pricing" className={`mb-24 pt-8 border-t ${isLightMode ? 'border-slate-200' : 'border-white/10'}`}>
                    <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
                        <h2 className={`text-3xl md:text-5xl font-extrabold tracking-tight ${isLightMode ? 'text-slate-900' : 'text-white'}`}>Choose Your Multiverse Studio Tier</h2>
                        <p className={`font-light ${isLightMode ? 'text-slate-600' : 'text-gray-400'}`}>Instantly deploy professional-grade publication features and take your original comics directly to your global audience.</p>
                    </div>

                    <div className="flex justify-center mb-8">
                        <div className={`p-1 rounded-xl flex items-center gap-2 border ${isLightMode ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                            <button 
                                onClick={() => setIsSubscription(true)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${isSubscription ? (isLightMode ? 'bg-white shadow text-indigo-600' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20') : (isLightMode ? 'text-slate-500 hover:text-slate-700' : 'text-gray-400 hover:text-gray-200')}`}
                            >
                                Monthly Subscription
                            </button>
                            <button 
                                onClick={() => setIsSubscription(false)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${!isSubscription ? (isLightMode ? 'bg-white shadow text-indigo-600' : 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20') : (isLightMode ? 'text-slate-500 hover:text-slate-700' : 'text-gray-400 hover:text-gray-200')}`}
                            >
                                One-Time Purchase
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {plans.length > 0 ? plans.map((plan, idx) => {
                            const isMiddle = idx === 1; // Highlight the middle tier
                            const price = isSubscription ? plan.priceSubscription : plan.priceOneTime;
                            
                            return (
                                <div key={plan.id} className={`p-8 rounded-3xl text-left transition-all flex flex-col justify-between relative border ${
                                    isMiddle 
                                        ? (isLightMode ? 'bg-white border-indigo-400 shadow-[0_0_30px_rgba(99,102,241,0.1)] border-2 hover:shadow-xl' : 'glass-panel border-indigo-500/50 shadow-[0_0_30px_rgba(99,102,241,0.1)] border-2 hover:border-indigo-400/80 hover:-translate-y-1')
                                        : (isLightMode ? 'bg-white border-slate-200 shadow-md hover:border-slate-350' : 'glass-panel border-white/10 hover:border-indigo-500/20 shadow-2xl hover:-translate-y-1')
                                }`}>
                                    {isMiddle && (
                                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded-full border border-indigo-400/30 shadow-md">
                                            ✨ Recommended
                                        </div>
                                    )}
                                    <div className="space-y-4">
                                        <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-md uppercase border ${isLightMode ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-white/5 text-gray-300 border-white/10'}`}>Tier {idx + 1}</span>
                                        <h3 className={`text-2xl font-bold mt-2 ${isLightMode ? 'text-slate-800' : 'text-white'}`}>{plan.name}</h3>
                                        <div className="flex items-baseline py-2">
                                            <span className={`text-4xl font-extrabold font-mono ${isMiddle ? 'text-indigo-500' : (isLightMode ? 'text-slate-800' : 'text-white')}`}>${price}</span>
                                            <span className={`text-xs ml-1 font-mono ${isLightMode ? 'text-slate-500' : 'text-gray-400'}`}>/{isSubscription ? 'month' : 'forever'}</span>
                                        </div>

                                        <ul className={`space-y-2.5 text-xs border-t pt-4 ${isLightMode ? 'text-slate-600 border-slate-100' : 'border-white/5 text-gray-300'}`}>
                                            {plan.features.map((f: string, i: number) => (
                                                <li key={i} className={isMiddle && i === 0 ? (isLightMode ? 'text-indigo-600 font-semibold' : 'text-indigo-300 font-semibold') : ''}>✓ {f}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <button 
                                        onClick={() => handleActionCheckout(plan.name)}
                                        className={`mt-8 w-full font-semibold py-3.5 rounded-xl border transition-all cursor-pointer ${
                                            isMiddle
                                            ? 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-indigo-400/30 shadow-lg shadow-indigo-600/20'
                                            : (isLightMode ? 'bg-slate-900 text-white border-slate-800 hover:bg-slate-800 shadow-sm' : 'bg-white/5 hover:bg-white/10 text-white border-white/15')
                                        }`}
                                    >
                                        {price === 0 ? 'Start Creating Free' : 'Build Your Plan'}
                                    </button>
                                </div>
                            );
                        }) : (
                            <div className="col-span-3 text-center text-gray-500">Loading plans...</div>
                        )}
                </div>
                </div>

                {/* Bottom CTA Section */}
                <div className={`rounded-[2.5rem] p-12 text-center max-w-5xl mx-auto space-y-6 relative overflow-hidden mb-12 border ${
                    isLightMode 
                    ? 'bg-white border-slate-200 shadow-xl text-slate-800' 
                    : 'glass-panel border-white/10 text-white'
                }`}>
                    <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none"></div>
                    <h2 className={`text-2xl sm:text-4xl font-extrabold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                        Ready to claim your place in the multiverse?
                    </h2>
                    <p className={`text-sm max-w-xl mx-auto leading-relaxed ${isLightMode ? 'text-slate-500' : 'text-gray-400'}`}>
                        Unlock the creative potential of multimodal artificial intelligence. Draft script blueprints, mold actors, and release immersive visual graphic books safely stored in Firestore today.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-sm mx-auto">
                        <button
                            onClick={handleActionUnlockCloud}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3.5 rounded-xl transition-all cursor-pointer border border-indigo-400/20 shadow-lg"
                        >
                            Access Creative Console
                        </button>
                        <button
                            onClick={handleActionLaunchSandbox}
                            className={`font-semibold px-8 py-3.5 rounded-xl transition-all cursor-pointer border ${
                                isLightMode 
                                ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800' 
                                : 'bg-white/5 hover:bg-white/10 text-slate-350 border-white/10'
                            }`}
                        >
                            Launch local sandbox
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}