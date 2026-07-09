import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useScrollReveal } from './useScrollReveal';
import Spline from '@splinetool/react-spline';
import { 
  Sparkles, Layers, BookOpen, Star, 
  ArrowRight, PenTool, Globe, Zap, Play, Pause, Volume2, 
  Sun, Moon, Menu, X, Image as ImageIcon, Laptop
} from 'lucide-react';
import { 
  startProceduralSoundtrack, 
  stopProceduralSoundtrack, 
  playLaserSFX, 
  playExplosionSFX, 
  playPageTurnSFX,
  playSparkleSFX
} from './audio';

// Dummy translations for DB-driven plans so the translation script picks them up:
const _dummyTranslations = (t: any) => [
    t('home.planName.Free', 'Free'),
    t('home.planName.Starter', 'Starter'),
    t('home.planName.Pro', 'Pro'),
    t('home.planFeature.Basic_Art_Styles', 'Basic Art Styles'),
    t('home.planFeature.Standard_Generation_Queue', 'Standard Generation Speed'),
    t('home.planFeature.Priority_GPU_Queue', 'Instant Generation Speed'),
    t('home.planFeature.Advanced_Art_Styles', 'Premium Art Styles & Outlines'),
    t('home.planFeature.Watermark_Removal', 'Watermark-Free PDF Exports'),
    t('home.planFeature.Commercial_Usage_Rights', 'Commercial Publishing Rights'),
    t('home.planFeature.Premium_LLMs', 'Consistent Character Engine & Narrator Voice Accents')
];

// Fallback pricing configuration in case backend load fails or is slow
const defaultPlans = [
    {
        id: 'free',
        name: 'Free Plan',
        priceSubscription: 0,
        priceOneTime: 0,
        features: [
            'Basic Art Styles',
            'Standard Generation Queue'
        ]
    },
    {
        id: 'pro',
        name: 'Pro Educator',
        priceSubscription: 19,
        priceOneTime: 149,
        features: [
            'Priority GPU Queue',
            'Advanced Art Styles',
            'Watermark Removal',
            'Premium LLMs'
        ]
    },
    {
        id: 'creator',
        name: 'Publisher Studio',
        priceSubscription: 49,
        priceOneTime: 399,
        features: [
            'Priority GPU Queue',
            'Advanced Art Styles',
            'Watermark Removal',
            'Commercial Usage Rights',
            'Premium LLMs'
        ]
    }
];

export const Home = ({ onNavigate }: { onNavigate: (view: string, data?: any) => void }) => {
    const { i18n } = useTranslation();
    const { t } = useTranslation();
    
    // Core Layout scroll reveal hooks
    const [heroRef, heroVisible] = useScrollReveal() as [any, boolean];
    const [useCasesRef, useCasesVisible] = useScrollReveal() as [any, boolean];
    const [examplesRef, examplesVisible] = useScrollReveal() as [any, boolean];
    const [howItWorksRef, howItWorksVisible] = useScrollReveal() as [any, boolean];
    const [featuresRef, featuresVisible] = useScrollReveal() as [any, boolean];
    const [previewRef, previewVisible] = useScrollReveal() as [any, boolean];
    const [pricingRef, pricingVisible] = useScrollReveal() as [any, boolean];

    // Local state options
    const [isLightMode, setIsLightMode] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [plans, setPlans] = useState<any[]>([]);
    const [isSubscription, setIsSubscription] = useState(true);

    // Interactive Product Preview ("Inside the Studio") state
    const [previewStyle, setPreviewStyle] = useState<'pixar' | 'anime' | 'noir'>('pixar');
    const [previewLang, setPreviewLang] = useState<'en' | 'es' | 'bilingual'>('bilingual');
    const [previewAudioActive, setPreviewAudioActive] = useState(false);
    const [previewAudioGenre, setPreviewAudioGenre] = useState('Slice of Life');
    const [waveformHeights, setWaveformHeights] = useState<number[]>([30, 60, 40, 80, 50, 90, 30, 70, 40, 60, 20, 50]);

    // Animate the soundtrack waveform dynamically in React
    useEffect(() => {
        if (!previewAudioActive) return;
        const interval = setInterval(() => {
            setWaveformHeights(Array.from({ length: 12 }, () => Math.floor(Math.random() * 70) + 20));
        }, 120);
        return () => clearInterval(interval);
    }, [previewAudioActive]);

    // Load pricing plans from backend
    useEffect(() => {
        fetch('/api/public/plans')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    data.sort((a, b) => (a.priceSubscription || 0) - (b.priceSubscription || 0));
                    setPlans(data);
                }
            })
            .catch(err => console.error("Could not fetch pricing plans, using fallbacks.", err));
    }, []);

    const isUserLoggedIn = !!localStorage.getItem('infinite_heroes_creator');

    // Soundtrack logic inside the studio preview mockup
    const handlePreviewAudioToggle = () => {
        if (previewAudioActive) {
            stopProceduralSoundtrack();
            setPreviewAudioActive(false);
        } else {
            startProceduralSoundtrack(previewAudioGenre);
            setPreviewAudioActive(true);
        }
    };

    const handlePreviewGenreChange = (genre: string) => {
        setPreviewAudioGenre(genre);
        if (previewAudioActive) {
            startProceduralSoundtrack(genre);
        }
    };

    // Clean up audio procedural generation on unmount
    useEffect(() => {
        return () => {
            stopProceduralSoundtrack();
        };
    }, []);

    // Concrete Edutainment Example Outputs
    const exampleOutputs = [
        {
            id: 'history',
            title: t('home.examples.historyTitle', 'History Lesson Comic'),
            subtitle: t('home.examples.historySub', 'The Yorktown Campaign'),
            desc: t('home.examples.historyDesc', 'Explain historical turning points through dramatic, ink-wash panels. Perfect for supplementing high school and middle school social studies curricula with visual storytelling.'),
            cover: '/noir.png',
            badge: t('home.examples.historyBadge', 'Social Studies'),
            style: 'Noir Inks'
        },
        {
            id: 'bilingual',
            title: t('home.examples.bilingualTitle', 'Bilingual Children\'s Story'),
            subtitle: t('home.examples.bilingualSub', 'The Brave Lost Puppy / El Cachorro Perdido'),
            desc: t('home.examples.bilingualDesc', 'Bilingual columns displaying English and Spanish side-by-side. Reinforces reading comprehension and language acquisition naturally through contextual graphics.'),
            cover: '/handdrawn.png',
            badge: t('home.examples.bilingualBadge', 'Language Learning'),
            style: 'Handdrawn Sketch'
        },
        {
            id: 'science',
            title: t('home.examples.scienceTitle', 'Narrated Science Explainer'),
            subtitle: t('home.examples.scienceSub', 'Photosynthesis: How Plants Breathe'),
            desc: t('home.examples.scienceDesc', 'Simplify complex science standards using expressive 3D character avatars. Illustrate step-by-step biological processes that students easily digest.'),
            cover: '/pixar.png',
            badge: t('home.examples.scienceBadge', 'Biology & Science'),
            style: 'Pixar 3D'
        },
        {
            id: 'manga',
            title: t('home.examples.mangaTitle', 'Manga-Style Chapter'),
            subtitle: t('home.examples.mangaSub', 'Neon Chronicles: Spark of Light'),
            desc: t('home.examples.mangaDesc', 'Creative writing projects formatted with classic 90s vintage anime line art. Helps students write scripts, outline chapters, and build vocabulary.'),
            cover: '/anime.png',
            badge: t('home.examples.mangaBadge', 'Creative Writing'),
            style: 'Retro Anime'
        },
        {
            id: 'language',
            title: t('home.examples.langLearningTitle', 'Visual Vocabulary Story'),
            subtitle: t('home.examples.langLearningSub', 'Ordering Food at the Cafe'),
            desc: t('home.examples.langLearningDesc', 'Conversational speech bubble layouts featuring common dialogue models. Helps ESL students map visual contexts to newly acquired phrases.'),
            cover: '/handdrawn.png',
            badge: t('home.examples.langLearningBadge', 'ESL & Vocabulary'),
            style: 'Artisanal Sketch'
        }
    ];

    const [activeExampleIndex, setActiveExampleIndex] = useState(2);

    // Dynamic pricing list (database plans or local fallback config)
    const activePlans = plans.length > 0 ? plans : defaultPlans;

    return (
        <div className={`min-h-screen w-full transition-colors duration-500 relative overflow-hidden ${isLightMode ? 'bg-slate-50 text-slate-900' : 'bg-gray-950 text-white'}`}>
            
            <Helmet>
                <title>{t('home.seoTitle', 'Story.Menu - Create Visual Lessons & Bilingual Stories')}</title>
                <meta name="description" content={t('home.seoDesc', 'Create, translate, and narrate stunning AI-assisted comics, visual lessons, and bilingual stories. Perfect for teachers, parents, and students.')} />
                <meta property="og:title" content={t('home.seoTitle', 'Story.Menu - Create Visual Lessons & Bilingual Stories')} />
                <meta property="og:description" content={t('home.seoDesc', 'Create, translate, and narrate stunning AI-assisted comics, visual lessons, and bilingual stories. Perfect for teachers, parents, and students.')} />
            </Helmet>

            {/* 1. Header Navigation Bar */}
            <header className={`sticky top-0 z-[100] w-full backdrop-blur-md border-b transition-all ${
                isLightMode 
                ? 'bg-white/85 border-slate-200/80 shadow-[0_2px_15px_rgba(0,0,0,0.02)]' 
                : 'bg-gray-950/80 border-white/10 shadow-[0_2px_15px_rgba(0,0,0,0.2)]'
            }`}>
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    {/* Logo / Brand Area */}
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('home')}>
                        <img 
                            src="logo.png" 
                            alt={t('home.logoAlt', 'Story.Menu Logo')} 
                            className="w-10 h-10 object-contain rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-1 shadow-md"
                        />
                        <span className={`text-xl font-extrabold tracking-tight font-sans bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500`}>
                            {t('home.logoText', 'Story.Menu')}
                        </span>
                    </div>

                    {/* Navigation links */}
                    <nav className="hidden md:flex items-center gap-8 text-sm font-semibold">
                        <a href="#use-cases" className={`transition-colors hover:text-indigo-500 ${isLightMode ? 'text-slate-650' : 'text-gray-350'}`}>{t('home.nav.usecases', 'Use Cases')}</a>
                        <a href="#examples" className={`transition-colors hover:text-indigo-500 ${isLightMode ? 'text-slate-650' : 'text-gray-350'}`}>{t('home.nav.examples', 'Examples')}</a>
                        <a href="#features" className={`transition-colors hover:text-indigo-500 ${isLightMode ? 'text-slate-650' : 'text-gray-355'}`}>{t('home.nav.features', 'Features')}</a>
                        <a href="#inside-studio" className={`transition-colors hover:text-indigo-500 ${isLightMode ? 'text-slate-655' : 'text-gray-350'}`}>{t('home.nav.studioPreview', 'Inside the Studio')}</a>
                        <a href="#pricing" className={`transition-colors hover:text-indigo-500 ${isLightMode ? 'text-slate-650' : 'text-gray-350'}`}>{t('home.nav.pricing', 'Pricing')}</a>
                    </nav>

                    {/* Header CTAs */}
                    <div className="hidden md:flex items-center gap-4">
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

                        {isUserLoggedIn ? (
                            <button 
                                onClick={() => onNavigate('studio')}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_35px_rgba(99,102,241,0.4)] cursor-pointer"
                            >
                                {t('home.nav.enterStudio', 'Enter Studio')}
                            </button>
                        ) : (
                            <>
                                <button 
                                    onClick={() => onNavigate('login')}
                                    className={`px-4 py-2 text-sm font-bold transition-all ${
                                        isLightMode ? 'text-slate-705 hover:text-slate-900' : 'text-gray-300 hover:text-white'
                                    }`}
                                >
                                    {t('home.nav.login', 'Sign In')}
                                </button>
                                <button 
                                    onClick={() => onNavigate('signup')}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_35px_rgba(99,102,241,0.4)] cursor-pointer"
                                >
                                    {t('home.nav.startFree', 'Start Free')}
                                </button>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Toggle */}
                    <div className="flex items-center gap-2 md:hidden">
                        <button
                            onClick={() => {
                                setIsLightMode(!isLightMode);
                                playPageTurnSFX();
                            }}
                            className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                                isLightMode ? 'bg-white text-slate-800 border-slate-200' : 'bg-white/5 text-gray-300 border-white/10'
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
                                isLightMode ? 'bg-white text-slate-850 border-slate-200' : 'bg-white/5 text-gray-300 border-white/10'
                            }`}
                        >
                            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Dropdown Menu */}
                {isMobileMenuOpen && (
                    <div className={`md:hidden border-t px-6 py-6 space-y-4 transition-all ${
                        isLightMode ? 'bg-white border-slate-200' : 'bg-gray-950 border-white/10'
                    }`}>
                        <div className="flex flex-col gap-4 text-sm font-semibold text-left">
                            <a href="#use-cases" onClick={() => setIsMobileMenuOpen(false)} className={`py-1.5 transition-colors hover:text-indigo-500 ${isLightMode ? 'text-slate-600' : 'text-gray-305'}`}>{t('home.nav.usecases', 'Use Cases')}</a>
                            <a href="#examples" onClick={() => setIsMobileMenuOpen(false)} className={`py-1.5 transition-colors hover:text-indigo-500 ${isLightMode ? 'text-slate-600' : 'text-gray-305'}`}>{t('home.nav.examples', 'Examples')}</a>
                            <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className={`py-1.5 transition-colors hover:text-indigo-500 ${isLightMode ? 'text-slate-600' : 'text-gray-305'}`}>{t('home.nav.features', 'Features')}</a>
                            <a href="#inside-studio" onClick={() => setIsMobileMenuOpen(false)} className={`py-1.5 transition-colors hover:text-indigo-500 ${isLightMode ? 'text-slate-600' : 'text-gray-305'}`}>{t('home.nav.studioPreview', 'Inside the Studio')}</a>
                            <a href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className={`py-1.5 transition-colors hover:text-indigo-500 ${isLightMode ? 'text-slate-600' : 'text-gray-305'}`}>{t('home.nav.pricing', 'Pricing')}</a>
                        </div>
                        <div className="pt-4 border-t border-dashed border-indigo-500/20 flex flex-col gap-3">
                            {isUserLoggedIn ? (
                                <button 
                                    onClick={() => {
                                        setIsMobileMenuOpen(false);
                                        onNavigate('studio');
                                    }}
                                    className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-bold shadow-md cursor-pointer"
                                >
                                    {t('home.nav.enterStudio', 'Enter Studio')}
                                </button>
                            ) : (
                                <>
                                    <button 
                                        onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            onNavigate('login');
                                        }}
                                        className={`w-full py-3 rounded-xl text-sm font-bold text-center border ${
                                            isLightMode ? 'border-slate-200 text-slate-700 bg-slate-50' : 'border-white/10 text-gray-300 bg-white/5'
                                        }`}
                                    >
                                        {t('home.nav.login', 'Sign In')}
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setIsMobileMenuOpen(false);
                                            onNavigate('signup');
                                        }}
                                        className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-bold shadow-md cursor-pointer"
                                    >
                                        {t('home.nav.startFree', 'Start Free')}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </header>

            {/* Ambient Background Character Rings */}
            <div className="absolute top-0 left-0 w-full h-[650px] z-0 pointer-events-auto overflow-hidden opacity-90 flex items-center justify-center [mask-image:linear-gradient(to_bottom,white_50%,transparent_100%)] -webkit-mask-image:linear-gradient(to_bottom,white_50%,transparent_100%)">
                <Spline 
                    scene="/animated_characters.splinecode" 
                    style={{ width: '100%', height: '100%' }}
                />
            </div>

            <div className="max-w-7xl mx-auto px-6 pt-12 pb-24 relative z-10">

                {/* 2. Hero Section */}
                <div ref={heroRef} className="w-full flex flex-col items-center text-center max-w-5xl mx-auto mb-24 pt-10">
                    <div className={`inline-flex items-center gap-2 px-5 py-2 rounded-full border backdrop-blur-md mb-8 ${isLightMode ? 'bg-indigo-100/80 border-indigo-300/60' : 'bg-indigo-500/10 border-indigo-500/30'}`}>
                        <Sparkles size={16} className="text-indigo-500 animate-spin-slow" />
                        <span className={`text-xs font-extrabold tracking-wide ${isLightMode ? 'text-indigo-700' : 'text-indigo-300'}`}>
                            {t('home.heroBadge', 'INTERACTIVE EDUTAINMENT PLATFORM')}
                        </span>
                    </div>

                    <h1 className={`text-4xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6 ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                        {t('home.heroTitle1', 'Create visual lessons,')} <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-405 via-pink-500 to-indigo-500">
                            {t('home.heroTitle2', 'bilingual stories, and comics')}
                        </span>
                    </h1>

                    <p className={`text-lg md:text-xl font-medium leading-relaxed max-w-3xl mx-auto mb-10 ${isLightMode ? 'text-slate-650' : 'text-gray-300'}`}>
                        {t('home.heroSub2', 'Write, illustrate, translate, and narrate stories for classrooms, homeschool, family reading, and creative publishing.')}
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 w-full max-w-md mx-auto">
                        <button 
                            onClick={() => onNavigate('signup')}
                            className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_30px_rgba(99,102,241,0.3)] transition-all hover:-translate-y-0.5 border border-indigo-400/20 cursor-pointer"
                        >
                            {t('home.heroSignupBtn', 'Start free')}
                        </button>
                        <a 
                            href="#examples"
                            className={`w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-lg text-center transition-all hover:-translate-y-0.5 border ${
                                isLightMode 
                                ? 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50 shadow-sm' 
                                : 'bg-transparent text-white border-white/10 hover:bg-white/5'
                            }`}
                        >
                            {t('home.heroExploreBtn', 'See examples')}
                        </a>
                    </div>

                    <p className={`text-xs font-semibold uppercase tracking-wider ${isLightMode ? 'text-slate-500' : 'text-gray-400'}`}>
                        🌐 {t('home.heroLanguages', 'Create, translate, and narrate in English, Spanish, French, Japanese, and more.')}
                    </p>

                    {/* Social Proof */}
                    <div className="flex items-center gap-3 mt-8">
                        <div className="flex text-amber-400 text-sm">★★★★★</div>
                        <p className={`font-semibold text-xs uppercase tracking-wider ${isLightMode ? 'text-slate-500' : 'text-gray-400'}`}>
                            {t('home.socialProof', 'Visual storytelling platform for teachers, homeschool families, parents, students, and creators')}
                        </p>
                    </div>
                </div>

                {/* 3. Audience / Use Cases Section */}
                <div id="use-cases" ref={useCasesRef} className={`mb-24 pt-8 border-t transition-all duration-1000 transform ${useCasesVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"} ${isLightMode ? 'border-slate-200' : 'border-white/10'}`}>
                    <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${isLightMode ? 'bg-purple-500/10 border-purple-500/20 text-purple-600' : 'bg-purple-500/10 border-purple-500/20 text-purple-400'}`}>
                            <BookOpen size={12} /> {t('home.audienceBadge', 'EDUTAINMENT USE CASES')}
                        </div>
                        <h2 className={`text-3xl md:text-5xl font-black tracking-tight ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{t('home.usecaseTitle', 'Built for Classrooms, Home, and Publishers')}</h2>
                        <p className={`font-medium ${isLightMode ? 'text-slate-600' : 'text-gray-400'}`}>{t('home.usecaseSub', 'Clear storytelling frameworks designed to bring educational concepts to life.')}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Teachers */}
                        <div className={`rounded-2xl p-6 text-left border flex flex-col justify-between transition-all ${
                            isLightMode ? 'bg-white border-slate-200 shadow-md' : 'glass-panel border-white/10'
                        }`}>
                            <div>
                                <span className="text-3xl mb-4 block">👩‍🏫</span>
                                <h3 className={`text-lg font-extrabold mb-2 ${isLightMode ? 'text-slate-800' : 'text-white'}`}>{t('home.forTeachers', 'For Teachers')}</h3>
                                <p className={`text-xs leading-relaxed ${isLightMode ? 'text-slate-605' : 'text-gray-400'}`}>
                                    {t('home.forTeachersDesc', 'Convert curriculum goals into illustrated slides, science explainer guides, or history comics. Keep students actively engaged and improve reading retention.')}
                                </p>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase mt-6 block">★ {t('home.roleTeacher', 'Visual Lesson Guides')}</span>
                        </div>

                        {/* Parents */}
                        <div className={`rounded-2xl p-6 text-left border flex flex-col justify-between transition-all ${
                            isLightMode ? 'bg-white border-slate-200 shadow-md' : 'glass-panel border-white/10'
                        }`}>
                            <div>
                                <span className="text-3xl mb-4 block">❤️</span>
                                <h3 className={`text-lg font-extrabold mb-2 ${isLightMode ? 'text-slate-800' : 'text-white'}`}>{t('home.forParents', 'For Parents')}</h3>
                                <p className={`text-xs leading-relaxed ${isLightMode ? 'text-slate-605' : 'text-gray-400'}`}>
                                    {t('home.forParentsDesc', 'Co-create personalized bedtime books and phonics lessons. Reinforce language learning using characters your child loves to read along with.')}
                                </p>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-purple-400 uppercase mt-6 block">★ {t('home.roleParent', 'Bedtime storybooks')}</span>
                        </div>

                        {/* Students */}
                        <div className={`rounded-2xl p-6 text-left border flex flex-col justify-between transition-all ${
                            isLightMode ? 'bg-white border-slate-200 shadow-md' : 'glass-panel border-white/10'
                        }`}>
                            <div>
                                <span className="text-3xl mb-4 block">🎒</span>
                                <h3 className={`text-lg font-extrabold mb-2 ${isLightMode ? 'text-slate-800' : 'text-white'}`}>{t('home.forStudents', 'For Students')}</h3>
                                <p className={`text-xs leading-relaxed ${isLightMode ? 'text-slate-605' : 'text-gray-400'}`}>
                                    {t('home.forStudentsDesc', 'Bring school assignments, book reports, and creative writing to life. Drag in panels, write speech bubble captions, and share your projects.')}
                                </p>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-pink-400 uppercase mt-6 block">★ {t('home.roleStudent', 'School Assignments')}</span>
                        </div>

                        {/* Creators */}
                        <div className={`rounded-2xl p-6 text-left border flex flex-col justify-between transition-all ${
                            isLightMode ? 'bg-white border-slate-200 shadow-md' : 'glass-panel border-white/10'
                        }`}>
                            <div>
                                <span className="text-3xl mb-4 block">🎨</span>
                                <h3 className={`text-lg font-extrabold mb-2 ${isLightMode ? 'text-slate-800' : 'text-white'}`}>{t('home.forCreators', 'For Creators')}</h3>
                                <p className={`text-xs leading-relaxed ${isLightMode ? 'text-slate-605' : 'text-gray-400'}`}>
                                    {t('home.forCreatorsDesc', 'Draft comic scripts, prototype webtoon storyboards, and build multi-chapter graphic novels with fully consistent character profiles.')}
                                </p>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-orange-400 uppercase mt-6 block">★ {t('home.roleCreator', 'Comic Publishing')}</span>
                        </div>
                    </div>
                </div>

                {/* 4. Example Outputs Section */}
                <div id="examples" ref={examplesRef} className={`mb-24 pt-8 border-t transition-all duration-1000 transform ${examplesVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"} ${isLightMode ? 'border-slate-200' : 'border-white/10'}`}>
                    <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${isLightMode ? 'bg-pink-500/10 border-pink-500/20 text-pink-600' : 'bg-pink-500/10 border-pink-500/20 text-pink-400'}`}>
                            <ImageIcon size={12} /> {t('home.examplesBadge', 'WHAT YOU CAN CREATE')}
                        </div>
                        <h2 className={`text-3xl md:text-5xl font-black tracking-tight ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{t('home.samplesTitle', 'Concrete Story Formats')}</h2>
                        <p className={`font-medium ${isLightMode ? 'text-slate-600' : 'text-gray-400'}`}>{t('home.samplesSub', 'Explore beautiful, educational creations from history comics to science explainers.')}</p>
                    </div>

                    {/* Example Showcase Card and Tabs */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                        {/* Selector Tabs (Left) */}
                        <div className="lg:col-span-4 flex flex-col gap-3 justify-center">
                            {exampleOutputs.map((item, idx) => (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        setActiveExampleIndex(idx);
                                        playPageTurnSFX();
                                    }}
                                    className={`p-4 rounded-xl text-left border transition-all cursor-pointer flex flex-col gap-1 ${
                                        activeExampleIndex === idx
                                        ? (isLightMode ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-sm' : 'bg-indigo-500/10 border-indigo-500/40 text-white')
                                        : (isLightMode ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100' : 'bg-white/5 border-white/5 text-gray-400 hover:text-white')
                                    }`}
                                >
                                    <span className="text-[10px] font-bold tracking-wider uppercase opacity-60">{item.badge}</span>
                                    <span className="text-sm font-extrabold">{item.title}</span>
                                </button>
                            ))}
                        </div>

                        {/* Display Area (Right) */}
                        <div className="lg:col-span-8">
                            <div className={`rounded-3xl border overflow-hidden p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8 items-center h-full transition-all ${
                                isLightMode ? 'bg-white border-slate-200 shadow-xl' : 'glass-panel border-white/10'
                            }`}>
                                {/* Image cover */}
                                <div className="w-full md:w-1/2 aspect-[4/3] rounded-2xl overflow-hidden relative shadow-md">
                                    <img 
                                        src={exampleOutputs[activeExampleIndex].cover} 
                                        alt={exampleOutputs[activeExampleIndex].title} 
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90"></div>
                                    <span className="absolute bottom-4 left-4 text-xs font-mono font-bold text-indigo-300">
                                        Style: {exampleOutputs[activeExampleIndex].style}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="w-full md:w-1/2 text-left space-y-4 flex flex-col justify-between h-full py-2">
                                    <div>
                                        <span className="text-xs bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-3 py-1 rounded-md font-bold uppercase tracking-wider">
                                            {exampleOutputs[activeExampleIndex].badge}
                                        </span>
                                        <h3 className={`text-2xl font-black mt-3 ${isLightMode ? 'text-slate-800' : 'text-white'}`}>
                                            {exampleOutputs[activeExampleIndex].title}
                                        </h3>
                                        <p className={`text-sm italic font-semibold ${isLightMode ? 'text-slate-500' : 'text-indigo-300'}`}>
                                            Featured Output: "{exampleOutputs[activeExampleIndex].subtitle}"
                                        </p>
                                        <p className={`text-xs md:text-sm leading-relaxed mt-4 ${isLightMode ? 'text-slate-600' : 'text-gray-400'}`}>
                                            {exampleOutputs[activeExampleIndex].desc}
                                        </p>
                                    </div>
                                    
                                    <button
                                        onClick={() => onNavigate('signup')}
                                        className="inline-flex items-center gap-2 text-xs font-bold text-indigo-500 hover:text-indigo-400 uppercase tracking-widest pt-4"
                                    >
                                        {t('home.useTemplate', 'Create this Story Format')} <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. How It Works Section */}
                <div id="how-it-works" ref={howItWorksRef} className={`mb-24 pt-8 border-t transition-all duration-1000 transform ${howItWorksVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"} ${isLightMode ? 'border-slate-200' : 'border-white/10'}`}>
                    <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${isLightMode ? 'bg-orange-500/10 border-orange-500/20 text-orange-600' : 'bg-orange-500/10 border-orange-500/20 text-orange-400'}`}>
                            <Zap size={12} /> {t('home.howItWorksBadge', 'CREATIVE PROCESS')}
                        </div>
                        <h2 className={`text-3xl md:text-5xl font-black tracking-tight ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{t('home.howItWorksTitle', 'Tell Stories in 5 Easy Steps')}</h2>
                        <p className={`font-medium ${isLightMode ? 'text-slate-600' : 'text-gray-400'}`}>{t('home.howItWorksSub', 'A clean, step-by-step path from a simple idea to a published comic.')}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
                        {/* Step 1: Idea */}
                        <div className="space-y-3 text-left">
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow">1</span>
                                <h4 className={`font-extrabold ${isLightMode ? 'text-slate-800' : 'text-white'}`}>{t('home.stepIdea', 'Pick a Story Idea')}</h4>
                            </div>
                            <p className={`text-xs leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-gray-400'}`}>
                                {t('home.stepIdeaDesc', 'Type a script or educational standard. Let the visual builder draft a complete page storyboard outline.')}
                            </p>
                        </div>

                        {/* Step 2: Generate */}
                        <div className="space-y-3 text-left">
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow">2</span>
                                <h4 className={`font-extrabold ${isLightMode ? 'text-slate-800' : 'text-white'}`}>{t('home.stepPages', 'Generate Scenes')}</h4>
                            </div>
                            <p className={`text-xs leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-gray-400'}`}>
                                {t('home.stepPagesDesc', 'Render beautiful panels containing consistent character faces and clothing, matching your visual theme.')}
                            </p>
                        </div>

                        {/* Step 3: Translate */}
                        <div className="space-y-3 text-left">
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow">3</span>
                                <h4 className={`font-extrabold ${isLightMode ? 'text-slate-800' : 'text-white'}`}>{t('home.stepTranslate', 'Translate')}</h4>
                            </div>
                            <p className={`text-xs leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-gray-400'}`}>
                                {t('home.stepTranslateDesc', 'Instantly translate text and place bilingual speech bubbles side-by-side for language learners.')}
                            </p>
                        </div>

                        {/* Step 4: Voice */}
                        <div className="space-y-3 text-left">
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow">4</span>
                                <h4 className={`font-extrabold ${isLightMode ? 'text-slate-800' : 'text-white'}`}>{t('home.stepVoice', 'Add Voices')}</h4>
                            </div>
                            <p className={`text-xs leading-relaxed ${isLightMode ? 'text-slate-650' : 'text-gray-400'}`}>
                                {t('home.stepVoiceDesc', 'Select natural read-aloud narrator voices and backing audio tracks that fit the story atmosphere.')}
                            </p>
                        </div>

                        {/* Step 5: Export */}
                        <div className="space-y-3 text-left">
                            <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow">5</span>
                                <h4 className={`font-extrabold ${isLightMode ? 'text-slate-805' : 'text-white'}`}>{t('home.stepPublish', 'Export & Share')}</h4>
                            </div>
                            <p className={`text-xs leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-gray-400'}`}>
                                {t('home.stepPublishDesc', 'Compile layouts into print-ready PDF files, or share interactive web storybook links.')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 6. Feature Highlights Section */}
                <div id="features" ref={featuresRef} className={`mb-24 pt-8 border-t transition-all duration-1000 transform ${featuresVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"} ${isLightMode ? 'border-slate-200' : 'border-white/10'}`}>
                    <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${isLightMode ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'}`}>
                            <BookOpen size={12} /> {t('home.featuresBadge', 'EDUTAINMENT FEATURES')}
                        </div>
                        <h2 className={`text-3xl md:text-5xl font-black tracking-tight ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{t('home.benefitsTitle', 'Features That Make Learning Visual')}</h2>
                        <p className={`font-medium ${isLightMode ? 'text-slate-600' : 'text-gray-400'}`}>{t('home.benefitsSub', 'Simplify reading comprehension, lesson design, and multilingual instruction.')}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Consistent Character Locker */}
                        <div className={`rounded-3xl p-6 text-left border flex flex-col justify-between transition-all ${
                            isLightMode ? 'bg-white border-slate-200 shadow-md hover:border-indigo-500/30' : 'glass-panel border-white/10 hover:border-indigo-500/30'
                        }`}>
                            <div>
                                <div className="w-12 h-12 bg-indigo-500/10 text-indigo-405 rounded-xl flex items-center justify-center mb-6 border border-indigo-500/20">
                                    <PenTool size={20} />
                                </div>
                                <h3 className={`text-lg font-extrabold mb-2 ${isLightMode ? 'text-slate-800' : 'text-white'}`}>{t('home.consistentCharacters', 'Keep characters visually consistent')}</h3>
                                <p className={`text-xs leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-gray-400'}`}>{t('home.consistentCharactersDesc', 'Lock in character outlines, clothing models, and traits. Your characters maintain their look from scene to scene, allowing readers to focus on the story.')}</p>
                            </div>
                            <span className="text-[9px] font-mono font-semibold text-indigo-400 uppercase mt-6 block">✓ {t('home.consistentStatus', 'No character drift')}</span>
                        </div>

                        {/* Create in multiple languages */}
                        <div className={`rounded-3xl p-6 text-left border flex flex-col justify-between transition-all ${
                            isLightMode ? 'bg-white border-slate-200 shadow-md hover:border-purple-500/30' : 'glass-panel border-white/10 hover:border-purple-500/30'
                        }`}>
                            <div>
                                <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center mb-6 border border-purple-500/20">
                                    <Globe size={20} />
                                </div>
                                <h3 className={`text-lg font-extrabold mb-2 ${isLightMode ? 'text-slate-800' : 'text-white'}`}>{t('home.bilingualStories', 'Create in multiple languages')}</h3>
                                <p className={`text-xs leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-gray-400'}`}>{t('home.bilingualStoriesDesc', 'Instantly translate speech bubbles and dialogue scripts. Render bilingual columns side-by-side to reinforce language immersion and vocabulary.')}</p>
                            </div>
                            <span className="text-[9px] font-mono font-semibold text-purple-400 uppercase mt-6 block">✓ {t('home.bilingualStatus', 'Multilingual classroom ready')}</span>
                        </div>

                        {/* Add narration and sound */}
                        <div className={`rounded-3xl p-6 text-left border flex flex-col justify-between transition-all ${
                            isLightMode ? 'bg-white border-slate-200 shadow-md hover:border-pink-500/30' : 'glass-panel border-white/10 hover:border-pink-500/30'
                        }`}>
                            <div>
                                <div className="w-12 h-12 bg-pink-500/10 text-pink-400 rounded-xl flex items-center justify-center mb-6 border border-pink-500/20">
                                    <Volume2 size={20} />
                                </div>
                                <h3 className={`text-lg font-extrabold mb-2 ${isLightMode ? 'text-slate-800' : 'text-white'}`}>{t('home.readAloud', 'Add narration and sound')}</h3>
                                <p className={`text-xs leading-relaxed ${isLightMode ? 'text-slate-605' : 'text-gray-400'}`}>{t('home.readAloudDesc', 'Give actors natural voice narration and backing audio. Early readers can click speech panels to hear dialogue spoken in realistic accents.')}</p>
                            </div>
                            <span className="text-[9px] font-mono font-semibold text-pink-400 uppercase mt-6 block">✓ {t('home.readAloudStatus', 'Immersive audio narration')}</span>
                        </div>

                        {/* Export stories for reading or sharing */}
                        <div className={`rounded-3xl p-6 text-left border flex flex-col justify-between transition-all ${
                            isLightMode ? 'bg-white border-slate-200 shadow-md hover:border-cyan-500/30' : 'glass-panel border-white/10 hover:border-cyan-500/30'
                        }`}>
                            <div>
                                <div className="w-12 h-12 bg-cyan-500/10 text-cyan-400 rounded-xl flex items-center justify-center mb-6 border border-cyan-500/20">
                                    <BookOpen size={20} />
                                </div>
                                <h3 className={`text-lg font-extrabold mb-2 ${isLightMode ? 'text-slate-800' : 'text-white'}`}>{t('home.storyExport', 'Export stories for reading or sharing')}</h3>
                                <p className={`text-xs leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-gray-400'}`}>{t('home.storyExportDesc', 'Compile pages into layout-accurate PDF files for print, or share interactive links for reading online in a beautiful visual theater mode.')}</p>
                            </div>
                            <span className="text-[9px] font-mono font-semibold text-cyan-400 uppercase mt-6 block">✓ {t('home.builderStatus', 'Print & digital publishing')}</span>
                        </div>

                        {/* Build stories faster with AI assistance */}
                        <div className={`rounded-3xl p-6 text-left border flex flex-col justify-between transition-all ${
                            isLightMode ? 'bg-white border-slate-200 shadow-md hover:border-orange-500/30' : 'glass-panel border-white/10 hover:border-orange-500/30'
                        }`}>
                            <div>
                                <div className="w-12 h-12 bg-orange-500/10 text-orange-400 rounded-xl flex items-center justify-center mb-6 border border-orange-500/20">
                                    <Zap size={20} />
                                </div>
                                <h3 className={`text-lg font-extrabold mb-2 ${isLightMode ? 'text-slate-800' : 'text-white'}`}>{t('home.storyBuilder', 'Build stories faster with AI')}</h3>
                                <p className={`text-xs leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-gray-400'}`}>{t('home.storyBuilderDesc', 'Instantly outline storyboard grids and dialog drafts from a single curriculum standard. Generate visual scripts in a fraction of the time.')}</p>
                            </div>
                            <span className="text-[9px] font-mono font-semibold text-orange-400 uppercase mt-6 block">✓ {t('home.builderStatusStatus', 'Outline lesson structures')}</span>
                        </div>

                        {/* Simple Art Style Frameworks */}
                        <div className={`rounded-3xl p-6 text-left border flex flex-col justify-between transition-all ${
                            isLightMode ? 'bg-white border-slate-200 shadow-md hover:border-yellow-500/30' : 'glass-panel border-white/10 hover:border-yellow-500/30'
                        }`}>
                            <div>
                                <div className="w-12 h-12 bg-yellow-500/10 text-yellow-400 rounded-xl flex items-center justify-center mb-6 border border-yellow-500/20">
                                    <Layers size={20} />
                                </div>
                                <h3 className={`text-lg font-extrabold mb-2 ${isLightMode ? 'text-slate-800' : 'text-white'}`}>{t('home.artStyles', 'Choose matching illustration styles')}</h3>
                                <p className={`text-xs leading-relaxed ${isLightMode ? 'text-slate-600' : 'text-gray-400'}`}>{t('home.artStylesDesc', 'Render scenes in styles that fit your readers: Pixar 3D adventure for kids, artisanal sketches for bedtime books, or retro noir comic inks.')}</p>
                            </div>
                            <span className="text-[9px] font-mono font-semibold text-yellow-400 uppercase mt-6 block">✓ {t('home.artStatus', '3D, Sketch, or Anime rendering')}</span>
                        </div>
                    </div>
                </div>

                {/* 7. Product Preview Section ("Inside the Studio") */}
                <div id="inside-studio" ref={previewRef} className={`mb-24 pt-8 border-t transition-all duration-1000 transform ${previewVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"} ${isLightMode ? 'border-slate-200' : 'border-white/10'}`}>
                    <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
                        <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${isLightMode ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'}`}>
                            <Laptop size={12} /> {t('home.previewBadge', 'PRODUCT DEMO')}
                        </div>
                        <h2 className={`text-3xl md:text-5xl font-black tracking-tight ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{t('home.previewTitle', 'Inside the Studio')}</h2>
                        <p className={`font-medium ${isLightMode ? 'text-slate-600' : 'text-gray-400'}`}>{t('home.previewSub', 'Preview how easy it is to draft outlines, change styles, translate, and narrate inside the studio workspace.')}</p>
                    </div>

                    {/* Interactive Mockup Container */}
                    <div className={`rounded-3xl border overflow-hidden p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 text-left ${
                        isLightMode ? 'bg-white border-slate-200 shadow-xl' : 'glass-panel border-white/10'
                    }`}>
                        
                        {/* Control Sidebar Mockup (Left 5 columns) */}
                        <div className="lg:col-span-5 space-y-6">
                            <div className="pb-4 border-b border-inherit">
                                <h4 className="font-extrabold text-sm uppercase tracking-wider text-indigo-400">Mockup Workspace Panel</h4>
                                <p className={`text-xs ${isLightMode ? 'text-slate-500' : 'text-gray-400'}`}>Click buttons below to see how visual outputs shift</p>
                            </div>

                            {/* Art Style selection */}
                            <div>
                                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isLightMode ? 'text-slate-500' : 'text-gray-400'}`}>1. Choose Art Direction Style</label>
                                <div className="flex gap-2">
                                    {(['pixar', 'anime', 'noir'] as const).map((style) => (
                                        <button
                                            key={style}
                                            onClick={() => {
                                                setPreviewStyle(style);
                                                playPageTurnSFX();
                                            }}
                                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                                                previewStyle === style
                                                ? 'bg-indigo-600 text-white border-transparent'
                                                : (isLightMode ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' : 'bg-white/5 hover:bg-white/10 border-white/5 text-gray-450')
                                            }`}
                                        >
                                            {style === 'pixar' && 'Pixar 3D'}
                                            {style === 'anime' && 'Retro Anime'}
                                            {style === 'noir' && 'Noir Inks'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Translation Language toggle */}
                            <div>
                                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isLightMode ? 'text-slate-500' : 'text-gray-400'}`}>2. Choose Language Translation Layout</label>
                                <div className="flex gap-2">
                                    {(['en', 'es', 'bilingual'] as const).map((lang) => (
                                        <button
                                            key={lang}
                                            onClick={() => {
                                                setPreviewLang(lang);
                                                playPageTurnSFX();
                                            }}
                                            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                                                previewLang === lang
                                                ? 'bg-indigo-600 text-white border-transparent'
                                                : (isLightMode ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700' : 'bg-white/5 hover:bg-white/10 border-white/5 text-gray-450')
                                            }`}
                                        >
                                            {lang === 'en' && 'English Only'}
                                            {lang === 'es' && 'Spanish Only'}
                                            {lang === 'bilingual' && 'Bilingual (Side-by-Side)'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Narration soundtrack selection */}
                            <div>
                                <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isLightMode ? 'text-slate-500' : 'text-gray-400'}`}>3. Audio Soundtrack Theme</label>
                                <div className="flex items-center gap-4">
                                    <button 
                                        onClick={handlePreviewAudioToggle}
                                        className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all ${
                                            previewAudioActive 
                                            ? 'bg-purple-600 text-white shadow-lg' 
                                            : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-sm'
                                        }`}
                                    >
                                        {previewAudioActive ? <Pause size={20} fill="currentColor" /> : <Play size={20} className="translate-x-0.5" fill="currentColor" />}
                                    </button>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold">{previewAudioActive ? 'Soundtrack Active' : 'Soundtrack Off'}</p>
                                        <div className="flex gap-1.5 mt-1">
                                            {['Slice of Life', 'Magic Fantasy', 'Sci-Fi Cyberpunk'].map((genre) => (
                                                <button
                                                    key={genre}
                                                    onClick={() => handlePreviewGenreChange(genre)}
                                                    className={`px-2 py-1 rounded text-[9px] font-bold border transition-all ${
                                                        previewAudioGenre === genre
                                                        ? 'bg-purple-600/20 text-purple-400 border-purple-500/40'
                                                        : (isLightMode ? 'bg-slate-100 border-slate-200 text-slate-650 hover:bg-slate-200' : 'bg-white/5 border-transparent text-gray-400 hover:text-white')
                                                    }`}
                                                >
                                                    {genre.split(' ')[0]}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Sandbox simulation */}
                            <div className="pt-4">
                                <button
                                    onClick={() => onNavigate('signup')}
                                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-650 hover:to-purple-700 text-white py-3.5 rounded-xl text-sm font-bold shadow-md hover:scale-[1.01] transition-all cursor-pointer text-center"
                                >
                                    Generate Pages inside the Studio
                                </button>
                            </div>
                        </div>

                        {/* Generated Output Preview Mockup (Right 7 columns) */}
                        <div className="lg:col-span-7 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-inherit pt-6 lg:pt-0 lg:pl-8">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">Generated Comic Panel Preview</span>
                                    <div className="flex items-center gap-1.5">
                                        {/* Play triggers */}
                                        <button onClick={playLaserSFX} className="text-sm hover:scale-110 transition-transform" title="Play laser beam SFX">⚡</button>
                                        <button onClick={playExplosionSFX} className="text-sm hover:scale-110 transition-transform" title="Play explosion SFX">💥</button>
                                        <button onClick={playPageTurnSFX} className="text-sm hover:scale-110 transition-transform" title="Play page turn SFX">📖</button>
                                        <button onClick={playSparkleSFX} className="text-sm hover:scale-110 transition-transform" title="Play magic sparkle SFX">✨</button>
                                    </div>
                                </div>

                                {/* Simulated panel image */}
                                <div className="aspect-[16/10] w-full rounded-2xl overflow-hidden relative shadow-lg border border-white/5">
                                    <img 
                                        src={
                                            previewStyle === 'pixar' ? '/pixar.png' :
                                            previewStyle === 'anime' ? '/anime.png' : '/noir.png'
                                        } 
                                        alt="Generated Story Panel" 
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90"></div>
                                    
                                    {/* Dialogue panel overlays */}
                                    <div className="absolute bottom-4 left-4 right-4 text-white text-xs md:text-sm space-y-2 text-left">
                                        {previewLang !== 'es' && (
                                            <div className="bg-black/60 backdrop-blur-sm p-3 rounded-lg border border-white/10">
                                                <p className="font-bold text-[9px] uppercase tracking-wider text-indigo-400">🇺🇸 English dialogue</p>
                                                <p className="font-medium mt-0.5">
                                                    {previewStyle === 'pixar' && "The plant absorbs sunlight to synthesize sugar and breathe!"}
                                                    {previewStyle === 'anime' && "We are arriving at Mars Colony base, commander. Prepare landing protocols!"}
                                                    {previewStyle === 'noir' && "General Washington gave the final order. The Yorktown campaign must succeed."}
                                                </p>
                                            </div>
                                        )}
                                        {previewLang !== 'en' && (
                                            <div className="bg-black/60 backdrop-blur-sm p-3 rounded-lg border border-white/10">
                                                <p className="font-bold text-[9px] uppercase tracking-wider text-orange-400">🇪🇸 Spanish dialogue</p>
                                                <p className="font-medium mt-0.5">
                                                    {previewStyle === 'pixar' && "¡La planta absorbe la luz solar para sintetizar azúcar y respirar!"}
                                                    {previewStyle === 'anime' && "Estamos llegando a la base de la Colonia Marte, comandante. ¡Prepare los protocolos de aterrizaje!"}
                                                    {previewStyle === 'noir' && "El General Washington dio la orden final. La campaña de Yorktown debe tener éxito."}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Animated waveform connection */}
                            <div className="pt-4 flex items-center justify-between gap-4">
                                <span className={`text-[10px] font-mono ${isLightMode ? 'text-slate-400' : 'text-gray-550'}`}>Web Audio procedurals active</span>
                                <div className="flex gap-0.5 h-6 items-end">
                                    {waveformHeights.map((h, i) => (
                                        <div 
                                            key={i} 
                                            style={{ 
                                                height: `${h}%`,
                                                transition: 'height 0.12s ease-in-out'
                                            }}
                                            className="w-1 bg-indigo-500 rounded-t-sm"
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 8. Pricing Section */}
                <div id="pricing" ref={pricingRef} className={`mb-24 pt-8 border-t transition-all duration-1000 transform ${pricingVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"} ${isLightMode ? 'border-slate-200' : 'border-white/10'}`}>
                    <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
                        <h2 className={`text-3xl md:text-5xl font-black tracking-tight ${isLightMode ? 'text-slate-900' : 'text-white'}`}>{t('home.auto41', 'Simple, Clear Pricing')}</h2>
                        <p className={`font-medium ${isLightMode ? 'text-slate-650' : 'text-gray-400'}`}>{t('home.auto42', 'Unlock professional storytelling and lesson planning features tailored to your needs.')}</p>
                    </div>

                    <div className="flex justify-center mb-8">
                        <div className={`p-1 rounded-xl flex items-center gap-2 border ${isLightMode ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                            <button 
                                onClick={() => setIsSubscription(true)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${isSubscription ? (isLightMode ? 'bg-white shadow text-indigo-650' : 'bg-indigo-650 text-white shadow-lg') : (isLightMode ? 'text-slate-500 hover:text-slate-700' : 'text-gray-400 hover:text-gray-200')}`}
                            >
                                {t('home.pricingMonthly', 'Monthly Plan')}
                            </button>
                            <button 
                                onClick={() => setIsSubscription(false)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${!isSubscription ? (isLightMode ? 'bg-white shadow text-indigo-655' : 'bg-indigo-650 text-white shadow-lg') : (isLightMode ? 'text-slate-500 hover:text-slate-700' : 'text-gray-400 hover:text-gray-205')}`}
                            >
                                {t('home.pricingOneTime', 'Lifetime Access')}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {activePlans.map((plan, idx) => {
                            const isMiddle = idx === 1; // Highlight Tier 2 (Pro)
                            const price = isSubscription ? plan.priceSubscription : plan.priceOneTime;
                            
                            // Map technical feature strings into benefit feature strings
                            const featureMap: Record<string, string> = {
                                'Basic Art Styles': t('home.planFeature.Basic_Art_Styles', 'Basic art styles'),
                                'Standard Generation Queue': t('home.planFeature.Standard_Generation_Queue', 'Standard generation speed'),
                                'Priority GPU Queue': t('home.planFeature.Priority_GPU_Queue', 'Instant generation speed'),
                                'Advanced Art Styles': t('home.planFeature.Advanced_Art_Styles', 'Premium art styles & layout outlines'),
                                'Watermark Removal': t('home.planFeature.Watermark_Removal', 'Watermark-free PDF exports'),
                                'Commercial Usage Rights': t('home.planFeature.Commercial_Usage_Rights', 'Commercial publishing rights'),
                                'Premium LLMs': t('home.planFeature.Premium_LLMs', 'Consistent character engine & voice narration accents')
                            };

                            return (
                                <div key={plan.id} className={`p-8 rounded-3xl text-left transition-all flex flex-col justify-between relative border ${
                                    isMiddle 
                                        ? (isLightMode ? 'bg-white border-indigo-500 shadow-xl border-2 hover:shadow-2xl' : 'glass-panel border-indigo-500 shadow-2xl border-2 hover:-translate-y-0.5')
                                        : (isLightMode ? 'bg-white border-slate-200 shadow-md hover:border-slate-300' : 'glass-panel border-white/10 hover:-translate-y-0.5')
                                }`}>
                                    {isMiddle && (
                                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-indigo-650 text-white px-4 py-1 text-[10px] font-black uppercase tracking-wider rounded-full border border-indigo-400/20 shadow-md">
                                            {t('home.recommendedBadge', '✨ Recommended')}
                                        </div>
                                    )}
                                    <div className="space-y-4">
                                        <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-md uppercase border ${isLightMode ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-white/5 text-gray-300 border-white/10'}`}>{t('home.tier', 'Tier')} {idx + 1}</span>
                                        <h3 className={`text-2xl font-bold mt-2 ${isLightMode ? 'text-slate-805' : 'text-white'}`}>{t(`home.planName.${plan.name.replace(/\s+/g, '_')}`, plan.name)}</h3>
                                        <div className="flex items-baseline py-2">
                                            <span className={`text-4xl font-extrabold font-mono ${isMiddle ? 'text-indigo-500' : (isLightMode ? 'text-slate-855' : 'text-white')}`}>${price}</span>
                                            <span className={`text-xs ml-1 font-mono ${isLightMode ? 'text-slate-500' : 'text-gray-400'}`}>/{isSubscription ? t('home.month', 'month') : t('home.forever', 'forever')}</span>
                                        </div>

                                        <ul className={`space-y-3 text-xs border-t pt-4 ${isLightMode ? 'text-slate-600 border-slate-100' : 'border-white/5 text-gray-300'}`}>
                                            {plan.features.map((f: string, i: number) => {
                                                const featureText = featureMap[f] || f;
                                                return (
                                                    <li key={i} className="flex items-center gap-2">
                                                        <span className="text-indigo-500 text-sm">✓</span>
                                                        <span className={isMiddle && i === 0 ? 'font-bold text-indigo-455' : ''}>{featureText}</span>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                    
                                    <button 
                                        onClick={() => {
                                            if (isUserLoggedIn) {
                                                onNavigate('studio');
                                            } else {
                                                onNavigate('signup');
                                            }
                                        }}
                                        className={`mt-8 w-full font-bold py-3.5 rounded-xl border transition-all cursor-pointer text-center ${
                                            isMiddle
                                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-transparent shadow-lg shadow-indigo-600/20'
                                            : (isLightMode ? 'bg-slate-900 text-white border-slate-800 hover:bg-slate-800 shadow-sm' : 'bg-white/5 hover:bg-white/10 text-white border-white/15')
                                        }`}
                                    >
                                        {price === 0 ? t('home.startFreeBtn', 'Start Free') : t('home.buildPlanBtn', 'Get Started')}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 9. Final CTA Section */}
                <div className={`rounded-[2.5rem] p-12 text-center max-w-5xl mx-auto space-y-6 relative overflow-hidden border ${
                    isLightMode 
                    ? 'bg-white border-slate-200 shadow-xl text-slate-850' 
                    : 'glass-panel border-white/10 text-white'
                }`}>
                    <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none"></div>
                    <h2 className={`text-2xl sm:text-4xl font-extrabold ${isLightMode ? 'text-slate-900' : 'text-white'}`}>
                        {t('home.bottomCtaTitle', 'Ready to create and share your stories?')}
                    </h2>
                    <p className={`text-sm max-w-xl mx-auto leading-relaxed ${isLightMode ? 'text-slate-500' : 'text-gray-400'}`}>
                        {t('home.bottomCtaDesc', 'Unlock visual lesson builders, character profiles, bilingual translation panels, and read-aloud voice actors inside the workspace.')}
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-xs mx-auto">
                        <button
                            onClick={() => onNavigate('signup')}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-3.5 rounded-xl transition-all cursor-pointer border border-indigo-400/20 shadow-lg"
                        >
                            {t('home.accessConsoleBtn', 'Start Free')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}