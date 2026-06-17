import React, { useState, useEffect } from 'react';
import { Home } from './Home';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';

/** Read the active app skin from localStorage (mirrors Setup.tsx / Account.tsx logic). */
const getActiveSkin = (): 'comic' | 'editorial' => {
    try {
        return (localStorage.getItem('story_menu_skin') as any) || 'comic';
    } catch {
        return 'comic';
    }
};

// This acts as the main router shell for the new UI.
// It wraps your existing App (Creator Studio) inside the 'studio' route.
export const MainLayout = ({ StudioComponent }: { StudioComponent: React.ReactNode }) => {
    const { t, i18n } = useTranslation();
    const [currentView, setCurrentView] = useState<'home' | 'studio' | 'reader'>('home');
    const [selectedStoryId, setSelectedStoryId] = useState<number | null>(null);
    const [skin, setSkin] = useState<'comic' | 'editorial'>(getActiveSkin);

    // Sync skin from localStorage reactively
    useEffect(() => {
        const syncSkin = () => setSkin(getActiveSkin());
        window.addEventListener('storage', syncSkin);
        const interval = setInterval(syncSkin, 800);
        return () => {
            window.removeEventListener('storage', syncSkin);
            clearInterval(interval);
        };
    }, []);

    const isEditorial = skin === 'editorial';

    useEffect(() => {
        if (currentView === 'studio') {
            document.body.classList.add('comic-theme');
        } else {
            document.body.classList.remove('comic-theme');
        }
    }, [currentView]);

    useEffect(() => {
        const handleGoHome = () => {
            setCurrentView('home');
            window.scrollTo(0, 0);
        };
        window.addEventListener('navigate-home', handleGoHome);
        return () => window.removeEventListener('navigate-home', handleGoHome);
    }, []);

    const handleNavigate = (view: string, data?: any) => {
        if (view === 'reader' && data?.id) {
            setSelectedStoryId(data.id);
            setCurrentView('reader');
            window.scrollTo(0, 0);
        } else if (view === 'remix') {
            // For now, remix just opens the studio. Later we can pass the story data.
            console.log("Remixing story:", data?.id);
            setCurrentView('studio');
            window.scrollTo(0, 0);
        } else {
            setCurrentView(view as 'home' | 'studio');
            window.scrollTo(0, 0);
        }
    };

    // ── Nav style tokens ─────────────────────────────────────────────────────
    const navClass = isEditorial
        ? 'sticky top-0 z-50 flex justify-between items-center px-6 py-4 border-b border-stone-200 bg-[#faf8f5]/90 backdrop-blur-lg'
        : 'sticky top-0 z-50 flex justify-between items-center px-6 py-4 border-b border-gray-800 bg-gray-950/80 backdrop-blur-lg';

    const logoBox = isEditorial
        ? 'w-10 h-10 rounded-xl bg-gradient-to-br from-stone-600 to-stone-800 flex items-center justify-center shadow-sm group-hover:shadow-stone-500/20 transition-all'
        : 'w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:shadow-pink-500/20 transition-all';

    const logoText = isEditorial
        ? 'text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-stone-800 to-stone-500'
        : 'text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400';

    const navLinks = isEditorial
        ? 'flex items-center gap-6 text-sm font-semibold text-stone-500'
        : 'flex items-center gap-6 text-sm font-semibold text-gray-400';

    const linkHover = isEditorial ? 'hover:text-stone-900 transition-colors cursor-pointer' : 'hover:text-white transition-colors cursor-pointer';

    const primaryCTA = isEditorial
        ? 'bg-stone-800 hover:bg-stone-700 text-white px-5 py-2 rounded-xl shadow-sm transition-all cursor-pointer font-semibold border border-stone-700'
        : 'bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.3)] transition-all cursor-pointer font-bold border border-indigo-400/20';

    const navSeparator = isEditorial ? 'w-[1px] h-4 bg-stone-200' : 'w-[1px] h-4 bg-gray-800';

    const bgClass = isEditorial
        ? 'min-h-screen bg-[#f5f3ef] text-stone-900 font-sans selection:bg-stone-400/30'
        : 'min-h-screen bg-gray-950 text-white font-sans selection:bg-pink-500/30';

    return (
        <div className={bgClass}>
            <Helmet>
                <html lang={i18n.language || 'en'} />
            </Helmet>
            {/* Global Navigation */}
            {currentView !== 'home' && (
                <nav className={navClass}>
                    <div
                        className="flex items-center gap-3 cursor-pointer group"
                        onClick={() => handleNavigate('home')}
                    >
                        <div className={logoBox}>
                            <span className="font-extrabold text-lg tracking-tighter text-white">
                                {isEditorial ? 'WJ' : 'SM'}
                            </span>
                        </div>
                        <span className={logoText}>
                            {isEditorial ? t('layout.nav.logoEditorial', "Writer's Journal") : t('layout.nav.logoComic', 'Story Menu')}
                        </span>
                    </div>

                    <div className={navLinks}>
                        <button 
                            onClick={() => {
                                handleNavigate('home');
                                setTimeout(() => {
                                    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                                }, 100);
                            }} 
                            className={linkHover}
                        >
                            {isEditorial ? t('layout.nav.featuresEditorial', '📖 Features') : t('layout.nav.featuresComic', '✨ Features')}
                        </button>
                        <button 
                            onClick={() => {
                                handleNavigate('home');
                                setTimeout(() => {
                                    document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                                }, 100);
                            }} 
                            className={linkHover}
                        >
                            {isEditorial ? t('layout.nav.pricingEditorial', '💳 Pricing') : t('layout.nav.pricingComic', '💰 Pricing')}
                        </button>
                        <button 
                            onClick={() => handleNavigate('home')} 
                            className={`${linkHover} ${currentView === 'home' ? (isEditorial ? 'text-stone-800 font-bold' : 'text-indigo-400 font-bold') : ''}`}
                        >
                            {isEditorial ? t('layout.nav.discover', 'Discover') : t('layout.nav.explore', 'Explore')}
                        </button>
                        
                        <span className={navSeparator}></span>

                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${isEditorial ? 'bg-stone-100 border-stone-200 text-stone-700' : 'bg-slate-800 border-slate-700 text-slate-300'}`}>
                            <span className="text-[10px] font-mono font-bold">50</span>
                            <span className="text-[10px] uppercase tracking-wider font-semibold opacity-70">Credits</span>
                        </div>

                        <button 
                            onClick={() => {
                                window.dispatchEvent(new Event('trigger-auth-dialog'));
                                handleNavigate('studio');
                            }}
                            className={linkHover}
                        >
                            {t('layout.nav.signIn', 'Sign In')}
                        </button>

                        <button
                            onClick={() => {
                                window.dispatchEvent(new Event('trigger-sandbox-mode'));
                                handleNavigate('studio');
                            }}
                            className={primaryCTA}
                        >
                            {isEditorial ? t('layout.nav.studioEditorial', '🖋️ Writing Studio') : t('layout.nav.studioComic', 'Studio Hub')}
                        </button>
                    </div>
                </nav>
            )}

            {/* Router View */}
            <main>
                {currentView === 'home' && <Home onNavigate={handleNavigate} />}
                {currentView === 'studio' && StudioComponent}
                {currentView === 'reader' && (
                    <div className="max-w-4xl mx-auto py-24 text-center">
                        <h2 className="text-3xl font-bold mb-4">{t('layout.reader.comingSoon', 'Reading View (Coming Soon)')}</h2>
                        <p className={isEditorial ? 'text-stone-500' : 'text-gray-400'}>
                            {t('layout.reader.storyId', 'You clicked on story ID: {{id}}', { id: selectedStoryId })}
                        </p>
                        <button 
                            onClick={() => handleNavigate('home')}
                            className={`mt-8 px-6 py-2 rounded-full transition-colors ${isEditorial ? 'bg-stone-200 text-stone-800 hover:bg-stone-300' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
                        >
                            {t('layout.reader.backToFeed', 'Back to Feed')}
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}