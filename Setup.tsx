/*
Screen Name: New Project Onboarding Wizard
Purpose: Helps users configure templates, metadata, goals, visual styles, languages, and narration before launching a story project
Version: v0.8
Phase: Phase 1
Date: 2026-07-08
What changed in this revision: Replaced all custom slate-955/855/880 Tailwind fallbacks with standard classes (slate-950/800/700) to ensure correct visual styling. Polished labeling and copy to improve scanability and clarity.
*/

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Sparkles, BookOpen, Layers, Globe, Volume2, Zap, Check, 
  FolderOpen, ArrowRight, ArrowLeft, Trash2, LogOut, FileText, Info, Play, Square, Edit2
} from 'lucide-react';
import { 
  getProjectsFromFirestore, 
  getDraftsFromFirestore, 
  deleteProjectFromFirestore, 
  deleteDraftFromFirestore, 
  saveDraftToFirestore
} from './storageFirestore';
import { Persona, ChapterGoal, CharacterIdentitySchema } from './types';
import { playPageTurnSFX, playSparkleSFX } from './audio';

interface LaunchConfig {
  title: string;
  desc: string;
  audience: string;
  grade: string;
  level: string;
  goal: string;
  genre: string;
  tone: string;
  style: string;
  language: string;
  bilingual: boolean;
  narration: boolean;
  voice: string;
  soundtrack: string;
}

interface SetupProps {
    show: boolean;
    isTransitioning: boolean;
    hero: Persona | null;
    friend: Persona | null;
    villain: Persona | null;
    selectedGenre: string;
    selectedArtStyle?: string;
    onArtStyleChange?: (styleId: string) => void;
    selectedLanguage: string;
    customPremise: string;
    richMode: boolean;
    selectedVoice: string;
    soundtrackEnabled: boolean;
    activeCreator: { id: string; email: string; tier?: string };
    onCreatorChange: (creator: { id: string; email: string; tier?: string }) => void;
    onHeroUpload: (file: File) => void;
    onFriendUpload: (file: File) => void;
    onVillainUpload: (file: File) => void;
    onGenreChange: (val: string) => void;
    onLanguageChange: (val: string) => void;
    onPremiseChange: (val: string) => void;
    onRichModeChange: (val: boolean) => void;
    onVoiceChange: (val: string) => void;
    onSoundtrackChange: (val: boolean) => void;
    onLaunch: (config: LaunchConfig) => void;
    onSelectHero: (p: Persona | null) => void;
    onSelectFriend: (p: Persona | null) => void;
    onSelectVillain: (p: Persona | null) => void;
    onLoadProject: (project: any) => void;
    creativeDirectives: string;
    onCreativeDirectivesChange: (val: string) => void;
    heroVisuals: string;
    onHeroVisualsChange: (val: string) => void;
    friendVisuals: string;
    onFriendVisualsChange: (val: string) => void;
    villainVisuals: string;
    onVillainVisualsChange: (val: string) => void;
    villainDna: string;
    onVillainDnaChange: (val: string) => void;
    nemesisDNA: CharacterIdentitySchema;
    onNemesisDnaChange: (val: CharacterIdentitySchema) => void;
    soundPrompt: string;
    onSoundPromptChange: (val: string) => void;
    storyTone?: string;
    storyBlueprint: ChapterGoal[];
    onStoryBlueprintChange: (val: ChapterGoal[]) => void;
    onLoadDraft?: (draft: any) => void;
    comicFaces?: any[];
    onLogOut?: () => void;
}

// Onboarding wizard templates definition
const TEMPLATES = [
    {
        id: 'classroom',
        name: 'Classroom History Lesson',
        desc: 'Teach history standards with character-driven panels.',
        icon: '🏫',
        defaultTitle: 'The American Revolution: Siege of Yorktown',
        defaultDesc: 'A visual journey through General Washington\'s decisive campaign.',
        audience: 'Teachers',
        grade: 'Grade 6-8',
        readingLevel: 'Lexile 700L',
        goal: 'Explain the tactics, key figures, and timeline of the Siege of Yorktown.',
        genre: 'Historical Archeology Tales',
        tone: 'EDUCATIONAL',
        style: 'Noir Inks',
        srcLang: 'en',
        tgtLang: 'es',
        bilingual: false,
        soundtrack: 'Magic Fantasy',
        voice: 'Zephyr'
    },
    {
        id: 'bedtime',
        name: 'Bilingual Bedtime Story',
        desc: 'Co-create dual-language books for early readers.',
        icon: '🧸',
        defaultTitle: 'The Lost Forest Adventure',
        defaultDesc: 'A brave puppy explores the woods and learns new words.',
        audience: 'Parents',
        grade: 'Grade K-2',
        readingLevel: 'Lexile 300L',
        goal: 'Introduce Spanish vocabulary through a heartwarming character quest.',
        genre: 'Custom',
        tone: 'WHOLESOME',
        style: 'Handdrawn Sketch',
        srcLang: 'en',
        tgtLang: 'es',
        bilingual: true,
        soundtrack: 'Slice of Life',
        voice: 'Nova'
    },
    {
        id: 'science',
        name: 'Science Explainer Comic',
        desc: 'Visual layouts demonstrating nature or technology.',
        icon: '🧬',
        defaultTitle: 'Photosynthesis: Energy from Light',
        defaultDesc: 'Avatars trace the molecular path of oxygen and glucose.',
        audience: 'Students',
        grade: 'Grade 3-5',
        readingLevel: 'Lexile 500L',
        goal: 'Illustrate how chlorophyll transforms carbon dioxide and water.',
        genre: 'Custom',
        tone: 'INQUISITIVE',
        style: 'Pixar 3D',
        srcLang: 'en',
        tgtLang: 'fr',
        bilingual: false,
        soundtrack: 'Magic Fantasy',
        voice: 'Orion'
    },
    {
        id: 'manga',
        name: 'Creative Manga Chapter',
        desc: 'Classic graphic novel outlines with vintage aesthetics.',
        icon: '🌸',
        defaultTitle: 'Neon Chronicles: Spark of Light',
        defaultDesc: 'A young hacker uncovers a system conspiracy in the cyber grid.',
        audience: 'Creators',
        grade: 'Teens',
        readingLevel: 'General',
        goal: 'Draft chapter 1 of a science-fiction graphic novel series.',
        genre: 'Anime Story',
        tone: 'SUSPENSEFUL',
        style: 'Retro Anime',
        srcLang: 'en',
        tgtLang: 'ja',
        bilingual: false,
        soundtrack: 'Sci-Fi Cyberpunk',
        voice: 'Orion'
    },
    {
        id: 'custom',
        name: 'Custom Story Canvas',
        desc: 'Configure all project parameters from scratch.',
        icon: '✨',
        defaultTitle: 'A Brand New Tale',
        defaultDesc: 'Describe your outline premise here...',
        audience: 'Creators',
        grade: 'General',
        readingLevel: 'General',
        goal: 'Write a custom graphic novel chapter.',
        genre: 'Custom',
        tone: 'EXCITING',
        style: 'Pixar 3D',
        srcLang: 'en',
        tgtLang: 'es',
        bilingual: false,
        soundtrack: 'Slice of Life',
        voice: 'Zephyr'
    }
];

export const Setup: React.FC<SetupProps> = (props) => {
    // Wizard Step state
    const [activeStep, setActiveStep] = useState(1);

    // Form fields
    const [projectTitle, setProjectTitle] = useState('A Brand New Tale');
    const [projectDesc, setProjectDesc] = useState('');
    const [audienceType, setAudienceType] = useState('Creators');
    const [ageGrade, setAgeGrade] = useState('General');
    const [readingLevel, setReadingLevel] = useState('General');
    const [storyGoal, setStoryGoal] = useState('');
    const [wizardGenre, setWizardGenre] = useState('Custom');
    const [wizardTone, setWizardTone] = useState('EXCITING');
    const [stylePreset, setStylePreset] = useState('Pixar 3D');
    
    // Step 5: Language fields
    const [bilingualMode, setBilingualMode] = useState(false);
    const [sourceLanguage, setSourceLanguage] = useState('en');
    const [targetLanguage, setTargetLanguage] = useState('es');
    const [readingMode, setReadingMode] = useState<'single' | 'side-by-side' | 'alternating'>('single');
    const [lockedGlossary, setLockedGlossary] = useState(true);
    const [preserveCharacterNames, setPreserveCharacterNames] = useState(true);
    const [simplifyVocabulary, setSimplifyVocabulary] = useState(false);
    const [readingLevelAdaptation, setReadingLevelAdaptation] = useState(true);

    // Step 6: Audio fields
    const [narrationEnabled, setNarrationEnabled] = useState(true);
    const [voiceStyle, setVoiceStyle] = useState('Zephyr');
    const [soundtrackTheme, setSoundtrackTheme] = useState('Slice of Life');
    const [characterVoiceMode, setCharacterVoiceMode] = useState(true);
    const [voiceLanguageAlignment, setVoiceLanguageAlignment] = useState('US English');
    const [voiceTone, setVoiceTone] = useState('warm');
    const [musicIntensity, setMusicIntensity] = useState('subtle');
    const [showAdvancedAudio, setShowAdvancedAudio] = useState(false);
    
    // Audio mock player state
    const [isPlayingMockAudio, setIsPlayingMockAudio] = useState(false);

    // Saved Library view
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [savedProjects, setSavedProjects] = useState<any[]>([]);
    const [savedDrafts, setSavedDrafts] = useState<any[]>([]);
    const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);

    // Load library drafts and projects
    const fetchLibrary = async () => {
        if (!props.activeCreator.id) return;
        setIsLoadingLibrary(true);
        try {
            const [projs, drfts] = await Promise.all([
                getProjectsFromFirestore(props.activeCreator.id).catch(() => []),
                getDraftsFromFirestore(props.activeCreator.id).catch(() => [])
            ]);
            setSavedProjects(projs || []);
            setSavedDrafts(drfts || []);
        } catch (e) {
            console.error("Failed to load library items", e);
        } finally {
            setIsLoadingLibrary(false);
        }
    };

    useEffect(() => {
        if (props.show && props.activeCreator.id) {
            fetchLibrary();
        }
    }, [props.show, props.activeCreator.id]);

    const handleSelectTemplate = (tpl: typeof TEMPLATES[0]) => {
        setProjectTitle(tpl.defaultTitle);
        setProjectDesc(tpl.defaultDesc);
        setAudienceType(tpl.audience);
        setAgeGrade(tpl.grade);
        setReadingLevel(tpl.readingLevel);
        setStoryGoal(tpl.goal);
        setWizardGenre(tpl.genre);
        setWizardTone(tpl.tone);
        setStylePreset(tpl.style);
        setSourceLanguage(tpl.srcLang);
        setTargetLanguage(tpl.tgtLang);
        setBilingualMode(tpl.bilingual);
        setReadingMode(tpl.bilingual ? 'side-by-side' : 'single');
        setSoundtrackTheme(tpl.soundtrack);
        setVoiceStyle(tpl.voice);
        
        // Propagate style change immediately
        if (props.onArtStyleChange) {
            props.onArtStyleChange(tpl.style);
        }
        props.onGenreChange(tpl.genre);

        setActiveStep(2);
        playPageTurnSFX();
    };

    const handleNextStep = () => {
        if (activeStep < 7) {
            setActiveStep(prev => prev + 1);
            playPageTurnSFX();
        }
    };

    const handleBackStep = () => {
        if (activeStep > 1) {
            setActiveStep(prev => prev - 1);
            playPageTurnSFX();
        }
    };

    // Execute Wizard Creation and Boot Studio
    const handleCreateProject = async () => {
        // Sync states to parent setup props
        props.onGenreChange(wizardGenre);
        props.onLanguageChange(bilingualMode ? `${sourceLanguage}-${targetLanguage}` : sourceLanguage);
        props.onPremiseChange(projectDesc);
        props.onVoiceChange(voiceStyle);
        props.onSoundtrackChange(soundtrackTheme !== 'None');

        // Fallback default blueprint beats in case server-side Gemini suggest fails
        const defaultBlueprint: ChapterGoal[] = [
            { chapterNum: 1, title: "Inciting Incident", goal: `Introduce characters inside the ${wizardGenre} setting.` },
            { chapterNum: 2, title: "Initial Pursuit", goal: `Establish the primary objective: ${storyGoal || 'Explore the world'}` },
            { chapterNum: 3, title: "The Crossroads", goal: "Introduce a central obstacle or choice related to the premise." },
            { chapterNum: 4, title: "Confrontation & Growth", goal: "Resolve the story objective, delivering the core learning message." }
        ];

        props.onStoryBlueprintChange(defaultBlueprint);

        // Play startup sound and launch studio
        playSparkleSFX();
        props.onLaunch({
            title: projectTitle,
            desc: projectDesc,
            audience: audienceType,
            grade: ageGrade,
            level: readingLevel,
            goal: storyGoal,
            genre: wizardGenre,
            tone: wizardTone,
            style: stylePreset,
            language: bilingualMode ? `${sourceLanguage}-${targetLanguage}` : sourceLanguage,
            bilingual: bilingualMode,
            narration: narrationEnabled,
            voice: voiceStyle,
            soundtrack: soundtrackTheme
        });
    };

    const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this project?")) return;
        try {
            await deleteProjectFromFirestore(props.activeCreator.id, id);
            fetchLibrary();
        } catch (err) {
            alert("Failed to delete project");
        }
    };

    const handleDeleteDraft = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this draft snapshot?")) return;
        try {
            await deleteDraftFromFirestore(props.activeCreator.id, id);
            fetchLibrary();
        } catch (err) {
            alert("Failed to delete draft");
        }
    };

    // Style helper map for preview panel image cards
    const styleImages: Record<string, string> = {
        'Pixar 3D': '/pixar.png',
        'Retro Anime': '/anime.png',
        'Noir Inks': '/noir.png',
        'Handdrawn Sketch': '/handdrawn.png'
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
            <div className="w-full max-w-7xl h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col text-white">
                
                {/* Header Toolbar */}
                <header className="px-8 py-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/90 shrink-0">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">⚙️</span>
                        <div>
                            <h2 className="text-lg font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                                Create visual lessons and bilingual stories your learners will love.
                            </h2>
                            <p className="text-xs text-slate-400 font-medium">Create illustrated, bilingual, and narrated stories easily</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsLibraryOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white transition-all cursor-pointer shadow-sm"
                        >
                            <FolderOpen size={14} /> Open Saved Project
                        </button>
                        {props.onLogOut && (
                            <button
                                onClick={props.onLogOut}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-red-950/30 border border-red-900/20 text-red-400 hover:bg-red-900/40 hover:text-red-300 transition-all cursor-pointer"
                            >
                                <LogOut size={14} /> Sign Out
                            </button>
                        )}
                    </div>
                </header>

                {/* Main Body */}
                <div className="flex-1 flex overflow-hidden">
                    
                    {/* Left Step Rail */}
                    <aside className="w-64 border-r border-slate-800 p-6 flex flex-col gap-2 shrink-0 bg-slate-900/50">
                        <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase mb-4 block">Wizard Progress</span>
                        {[
                            { step: 1, title: 'Pick a starting format', desc: 'Choose starting layout' },
                            { step: 2, title: 'Who is this for?', desc: 'Title, metadata & audience' },
                            { step: 3, title: 'Set learning and story goals', desc: 'Genre, goals and tones' },
                            { step: 4, title: 'Pick illustration style', desc: 'Art style and camera' },
                            { step: 5, title: 'Choose languages & translation', desc: 'Bilingual options' },
                            { step: 6, title: 'Choose narrator & soundtrack', desc: 'Voices and music' },
                            { step: 7, title: 'Review and generate your book', desc: 'Launch book sequence' }
                        ].map((rail) => {
                            const isActive = activeStep === rail.step;
                            const isCompleted = activeStep > rail.step;
                            return (
                                <div 
                                    key={rail.step}
                                    className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
                                        isActive 
                                        ? 'bg-indigo-600/10 border border-indigo-500/20 text-white' 
                                        : 'border border-transparent text-slate-500'
                                    }`}
                                >
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                                        isCompleted ? 'bg-emerald-500 text-white shadow' :
                                        isActive ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800 text-slate-400'
                                    }`}>
                                        {isCompleted ? <Check size={12} /> : rail.step}
                                    </div>
                                    <div className="text-left">
                                        <p className={`text-xs font-bold leading-tight ${isActive ? 'text-indigo-400' : isCompleted ? 'text-slate-300' : 'text-slate-500'}`}>{rail.title}</p>
                                        <p className="text-[9px] font-semibold text-slate-500/80 mt-0.5">{rail.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </aside>

                    {/* Center Form Card Area */}
                    <main className="flex-1 p-8 overflow-y-auto flex flex-col justify-between">
                        <div className="max-w-2xl mx-auto w-full space-y-6">
                            
                            {/* Step 1: Choose Template */}
                            {activeStep === 1 && (
                                <div className="space-y-6 text-left">
                                    <div>
                                        <h3 className="text-xl font-bold tracking-tight text-white">Pick a starting format</h3>
                                        <p className="text-sm text-slate-400">Choose the format that best fits your lesson or story</p>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3">
                                        {TEMPLATES.map((tpl) => (
                                            <button
                                                key={tpl.id}
                                                onClick={() => handleSelectTemplate(tpl)}
                                                className="w-full p-4 rounded-xl border text-left flex items-center gap-4 transition-all bg-slate-950/20 border-slate-800 hover:border-indigo-500/50 hover:bg-slate-950/40 cursor-pointer"
                                            >
                                                <span className="text-3xl p-3 rounded-lg bg-slate-800 border border-slate-700 shrink-0">{tpl.icon}</span>
                                                <div className="flex-1">
                                                    <h4 className="font-extrabold text-sm text-slate-200">{tpl.name}</h4>
                                                    <p className="text-xs text-slate-400 mt-0.5">{tpl.desc}</p>
                                                    <span className="text-[9px] font-mono text-indigo-400 uppercase mt-1.5 block">Pre-configures: {tpl.audience} • {tpl.style}</span>
                                                </div>
                                                <ArrowRight size={16} className="text-slate-500" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Project Basics */}
                            {activeStep === 2 && (
                                <div className="space-y-5 text-left">
                                    <div>
                                        <h3 className="text-xl font-bold tracking-tight text-white">Who is this for?</h3>
                                        <p className="text-sm text-slate-400">Set the title and define the audience for this story or lesson</p>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Project Title */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-300">Project Title</label>
                                            <input 
                                                type="text" 
                                                value={projectTitle}
                                                onChange={(e) => setProjectTitle(e.target.value)}
                                                placeholder="e.g. The Brave Astronaut"
                                                className="w-full rounded-xl bg-slate-955/45 border border-slate-800 text-slate-100 p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                            />
                                            <span className="text-[10px] text-slate-500 mt-1 block">Give your story project a clear, memorable title.</span>
                                        </div>

                                        {/* Short Description */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-300">Short Description / Premise</label>
                                            <textarea 
                                                rows={3}
                                                value={projectDesc}
                                                onChange={(e) => setProjectDesc(e.target.value)}
                                                placeholder="e.g. A tiny seed travels across desert winds to find a patch of fertile soil..."
                                                className="w-full rounded-xl bg-slate-950/50 border border-slate-800 text-slate-100 p-3.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                            />
                                            <span className="text-[10px] text-slate-500 mt-1 block">Describe the core story premise or characters in 2-3 sentences.</span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* Audience Type */}
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-305 font-medium">Target User</label>
                                                <select
                                                    value={audienceType}
                                                    onChange={(e) => setAudienceType(e.target.value)}
                                                    className="w-full rounded-xl bg-slate-950 border border-slate-800 text-slate-100 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                                >
                                                    {['Teachers', 'Parents', 'Students', 'Creators'].map(aud => (
                                                        <option key={aud} value={aud}>{aud}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Age or Grade */}
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-300">Age / Grade</label>
                                                <select
                                                    value={ageGrade}
                                                    onChange={(e) => setAgeGrade(e.target.value)}
                                                    className="w-full rounded-xl bg-slate-955 border border-slate-800 text-slate-100 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                                >
                                                    {['Grade K-2', 'Grade 3-5', 'Grade 6-8', 'Teens', 'General'].map(grade => (
                                                        <option key={grade} value={grade}>{grade}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Reading Level */}
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-300">Reading Level</label>
                                                <select
                                                    value={readingLevel}
                                                    onChange={(e) => setReadingLevel(e.target.value)}
                                                    className="w-full rounded-xl bg-slate-950 border border-slate-800 text-slate-100 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                                >
                                                    {['Lexile 300L', 'Lexile 500L', 'Lexile 700L', 'General'].map(level => (
                                                        <option key={level} value={level}>{level}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Story Goal */}
                            {activeStep === 3 && (
                                <div className="space-y-5 text-left">
                                    <div>
                                        <h3 className="text-xl font-bold tracking-tight text-white">Set learning and story goals</h3>
                                        <p className="text-sm text-slate-400">Define what the reader should learn or experience</p>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Story Goal */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-300">Story Goal / Lesson Objective</label>
                                            <input 
                                                type="text" 
                                                value={storyGoal}
                                                onChange={(e) => setStoryGoal(e.target.value)}
                                                placeholder="e.g. Introduce gravity concepts, teach sharing, explain historical trade routes"
                                                className="w-full rounded-xl bg-slate-950/50 border border-slate-800 text-slate-100 p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                            />
                                            <span className="text-[10px] text-slate-500 mt-1 block">What should readers learn or experience after reading this story?</span>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Genre */}
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-300">Syllabus Genre</label>
                                                <select
                                                    value={wizardGenre}
                                                    onChange={(e) => setWizardGenre(e.target.value)}
                                                    className="w-full rounded-xl bg-slate-950 border border-slate-800 text-slate-100 p-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                                >
                                                    {['Superhero Action', 'High Fantasy', 'Neon Noir Detective', 'Classic Horror', 'Historical Archeology Tales', 'Custom'].map(g => (
                                                        <option key={g} value={g}>{g}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Tone */}
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-300">Story Tone</label>
                                                <select
                                                    value={wizardTone}
                                                    onChange={(e) => setWizardTone(e.target.value)}
                                                    className="w-full rounded-xl bg-slate-950 border border-slate-800 text-slate-100 p-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                                >
                                                    {['EDUCATIONAL', 'WHOLESOME', 'SUSPENSEFUL', 'LIGHTHEARTED', 'EXCITING'].map(t => (
                                                        <option key={t} value={t}>{t}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Visual Style */}
                            {activeStep === 4 && (
                                <div className="space-y-5 text-left">
                                    <div>
                                        <h3 className="text-xl font-bold tracking-tight text-white">Pick illustration style</h3>
                                        <p className="text-xs text-slate-400 mt-1">Choose an illustration template preset that fits your readers.</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        {[
                                            { id: 'Pixar 3D', name: 'Pixar 3D Adventure', desc: 'Warm glossy 3D renders, perfect for children.', cover: '/pixar.png' },
                                            { id: 'Retro Anime', name: 'Retro Anime Vectors', desc: 'Classic cel-shaded anime illustration styles.', cover: '/anime.png' },
                                            { id: 'Noir Inks', name: 'Noir Comic Inks', desc: 'Heavy ink washes and dramatic contrast.', cover: '/noir.png' },
                                            { id: 'Handdrawn Sketch', name: 'Handdrawn Crayon', desc: 'Soft pastel sketches, ideal for bedside books.', cover: '/handdrawn.png' }
                                        ].map((style) => (
                                            <button
                                                key={style.id}
                                                onClick={() => {
                                                    setStylePreset(style.id);
                                                    if (props.onArtStyleChange) {
                                                        props.onArtStyleChange(style.id);
                                                    }
                                                    playPageTurnSFX();
                                                }}
                                                className={`p-4 rounded-2xl border text-left transition-all overflow-hidden flex flex-col justify-between h-48 cursor-pointer relative ${
                                                    stylePreset === style.id
                                                    ? 'bg-indigo-600/10 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                                                    : 'bg-slate-950/20 border-slate-800 hover:border-slate-700'
                                                }`}
                                            >
                                                <div className="absolute inset-0 z-0 opacity-40">
                                                    <img src={style.cover} alt={style.name} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
                                                </div>
                                                <div className="relative z-10 flex flex-col justify-between h-full w-full">
                                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] ${
                                                        stylePreset === style.id ? 'bg-indigo-600 text-white border-transparent' : 'border-slate-600'
                                                    }`}>
                                                        {stylePreset === style.id && '✓'}
                                                    </span>
                                                    <div>
                                                        <h4 className="font-extrabold text-sm text-slate-100">{style.name}</h4>
                                                        <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{style.desc}</p>
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Step 5: Language Tracks */}
                            {activeStep === 5 && (
                                <div className="space-y-6 text-left">
                                    <div>
                                        <h3 className="text-xl font-bold tracking-tight text-white">Choose languages & translation</h3>
                                        <p className="text-sm text-slate-400">Configure bilingual text layout and language pairs</p>
                                    </div>

                                    <div className="space-y-5">
                                        
                                        {/* Bilingual Mode Toggle Card */}
                                        <div className="flex items-center justify-between p-5 bg-slate-950/40 border border-slate-800 rounded-2xl">
                                            <div className="flex gap-3 items-center">
                                                <Globe className="text-indigo-400 shrink-0" size={24} />
                                                <div className="text-left">
                                                    <h4 className="font-bold text-sm text-slate-200">Enable Bilingual Mode</h4>
                                                    <p className="text-[10px] text-slate-500 mt-0.5">Translate and display dialogues in two languages side-by-side or alternating.</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input 
                                                    type="checkbox"
                                                    checked={bilingualMode}
                                                    onChange={(e) => {
                                                        setBilingualMode(e.target.checked);
                                                        setReadingMode(e.target.checked ? 'side-by-side' : 'single');
                                                    }}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                            </label>
                                        </div>

                                        {/* Language Dropdown Selectors */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-300">Original language</label>
                                                <select
                                                    value={sourceLanguage}
                                                    onChange={(e) => setSourceLanguage(e.target.value)}
                                                    className="w-full rounded-xl bg-slate-950 border border-slate-800 text-slate-100 p-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                                >
                                                    <option value="en">English (US)</option>
                                                    <option value="es">Spanish (Español)</option>
                                                    <option value="fr">French (Français)</option>
                                                    <option value="ja">Japanese (日本語)</option>
                                                    <option value="de">German (Deutsch)</option>
                                                    <option value="ko">Korean (한국어)</option>
                                                </select>
                                            </div>

                                            {bilingualMode && (
                                                <div>
                                                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-300">Translation language</label>
                                                    <select
                                                        value={targetLanguage}
                                                        onChange={(e) => setTargetLanguage(e.target.value)}
                                                        className="w-full rounded-xl bg-slate-955 border border-slate-800 text-slate-100 p-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                                    >
                                                        <option value="es">Spanish (Español)</option>
                                                        <option value="en">English (US)</option>
                                                        <option value="fr">French (Français)</option>
                                                        <option value="ja">Japanese (日本語)</option>
                                                        <option value="de">German (Deutsch)</option>
                                                        <option value="ko">Korean (한국어)</option>
                                                    </select>
                                                </div>
                                            )}
                                        </div>

                                        {/* Reading Mode Options Cards */}
                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">Reading mode options</label>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                
                                                <button
                                                    onClick={() => setReadingMode('single')}
                                                    className={`p-4 rounded-xl border text-left flex flex-col justify-between min-h-[100px] cursor-pointer transition-all ${
                                                        readingMode === 'single'
                                                        ? 'bg-indigo-600/10 border-indigo-500'
                                                        : 'bg-slate-955 border-slate-800 hover:border-slate-700'
                                                    }`}
                                                >
                                                    <span className="font-extrabold text-xs text-slate-200">Single language layout</span>
                                                    <p className="text-[10px] text-slate-400 leading-relaxed mt-1">Render dialogues strictly in the original selected track.</p>
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setBilingualMode(true);
                                                        setReadingMode('side-by-side');
                                                    }}
                                                    className={`p-4 rounded-xl border text-left flex flex-col justify-between min-h-[100px] cursor-pointer transition-all ${
                                                        readingMode === 'side-by-side'
                                                        ? 'bg-indigo-600/10 border-indigo-500'
                                                        : 'bg-slate-950/20 border-slate-800 hover:border-slate-700'
                                                    }`}
                                                >
                                                    <span className="font-extrabold text-xs text-slate-200">Show both languages together</span>
                                                    <p className="text-[10px] text-slate-400 leading-relaxed mt-1">Render side-by-side dialogues inside the same page canvas.</p>
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setBilingualMode(true);
                                                        setReadingMode('alternating');
                                                    }}
                                                    className={`p-4 rounded-xl border text-left flex flex-col justify-between min-h-[100px] cursor-pointer transition-all ${
                                                        readingMode === 'alternating'
                                                        ? 'bg-indigo-600/10 border-indigo-500'
                                                        : 'bg-slate-955 border-slate-800 hover:border-slate-700'
                                                    }`}
                                                >
                                                    <span className="font-extrabold text-xs text-slate-200">Alternating pages layout</span>
                                                    <p className="text-[10px] text-slate-400 leading-relaxed mt-1">Flip between original and translated pages sequentially.</p>
                                                </button>

                                            </div>
                                        </div>

                                        {/* Additional Settings & Toggles */}
                                        <div className="space-y-3 pt-2">
                                            <span className="block text-xs font-bold uppercase tracking-wider text-slate-300">Translation Parameters</span>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-950/20 p-4 border border-slate-800 rounded-2xl">
                                                
                                                <label className="flex items-center gap-3 cursor-pointer select-none">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={lockedGlossary} 
                                                        onChange={(e) => setLockedGlossary(e.target.checked)} 
                                                        className="w-4 h-4 rounded accent-indigo-600"
                                                    />
                                                    <div className="text-left">
                                                        <span className="block text-xs font-bold text-slate-200">Use locked glossary lookup</span>
                                                        <span className="block text-[9px] text-slate-550">Ensure specific target words are translated consistently.</span>
                                                    </div>
                                                </label>

                                                <label className="flex items-center gap-3 cursor-pointer select-none">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={preserveCharacterNames} 
                                                        onChange={(e) => setPreserveCharacterNames(e.target.checked)} 
                                                        className="w-4 h-4 rounded accent-indigo-650"
                                                    />
                                                    <div className="text-left">
                                                        <span className="block text-xs font-bold text-slate-200">Preserve Key Terms</span>
                                                        <span className="block text-[9px] text-slate-500">Keep key terms and character names consistent across translations</span>
                                                    </div>
                                                </label>

                                                <label className="flex items-center gap-3 cursor-pointer select-none">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={simplifyVocabulary} 
                                                        onChange={(e) => setSimplifyVocabulary(e.target.checked)} 
                                                        className="w-4 h-4 rounded accent-indigo-655"
                                                    />
                                                    <div className="text-left">
                                                        <span className="block text-xs font-bold text-slate-200">Adjust vocabulary for readers</span>
                                                        <span className="block text-[9px] text-slate-500">Simplify complex phrases to match reading levels.</span>
                                                    </div>
                                                </label>

                                                <label className="flex items-center gap-3 cursor-pointer select-none">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={readingLevelAdaptation} 
                                                        onChange={(e) => setReadingLevelAdaptation(e.target.checked)} 
                                                        className="w-4 h-4 rounded accent-indigo-650"
                                                    />
                                                    <div className="text-left">
                                                        <span className="block text-xs font-bold text-slate-200">Adapt sentence lengths</span>
                                                        <span className="block text-[9px] text-slate-500">Keep sentence lengths appropriate for younger readers.</span>
                                                    </div>
                                                </label>

                                            </div>
                                        </div>

                                        {/* Helper Text block */}
                                        <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/15 text-[10px] text-indigo-300 leading-relaxed text-left flex gap-2">
                                            <Info size={14} className="shrink-0 mt-0.5 text-indigo-450 animate-bounce" />
                                            <p>💡 <strong>Bilingual tracks:</strong> Displaying both languages side-by-side helps teachers, parents, and students build vocabulary context clues naturally by seeing translation alignments in real-time.</p>
                                        </div>

                                    </div>
                                </div>
                            )}

                            {/* Step 6: Audio */}
                            {activeStep === 6 && (
                                <div className="space-y-6 text-left">
                                    <div>
                                        <h3 className="text-xl font-bold tracking-tight text-white">Choose narrator & soundtrack</h3>
                                        <p className="text-sm text-slate-400">Add a voice to your story and pick background music</p>
                                    </div>

                                    <div className="space-y-5">
                                        
                                        {/* Narration enabled toggle */}
                                        <div className="flex items-center justify-between p-5 bg-slate-950/40 border border-slate-800 rounded-2xl">
                                            <div className="flex gap-3 items-center">
                                                <Volume2 className="text-indigo-400 shrink-0" size={24} />
                                                <div className="text-left">
                                                    <h4 className="font-bold text-sm text-slate-200">Add narration</h4>
                                                    <p className="text-[10px] text-slate-500 mt-0.5">Let readers play narration voiceovers by tapping bubbles or panel boxes.</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input 
                                                    type="checkbox"
                                                    checked={narrationEnabled}
                                                    onChange={(e) => setNarrationEnabled(e.target.checked)}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-11 h-6 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                            </label>
                                        </div>

                                        {/* Narration parameters (visible if narration enabled) */}
                                        {narrationEnabled && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                
                                                {/* Narrator Voice */}
                                                <div>
                                                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-300">Choose a narrator voice</label>
                                                    <select
                                                        value={voiceStyle}
                                                        onChange={(e) => setVoiceStyle(e.target.value)}
                                                        className="w-full rounded-xl bg-slate-950 border border-slate-800 text-slate-100 p-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                                    >
                                                        <option value="Zephyr">Zephyr (Heroic & Enunciated)</option>
                                                        <option value="Nova">Nova (Warm & Narrative)</option>
                                                        <option value="Orion">Orion (Action & Dramatic)</option>
                                                        <option value="Puck">Puck (Playful & High Pitch)</option>
                                                    </select>
                                                </div>

                                                {/* Accent/language alignment */}
                                                <div>
                                                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-300">Match voice to story language</label>
                                                    <select
                                                        value={voiceLanguageAlignment}
                                                        onChange={(e) => setVoiceLanguageAlignment(e.target.value)}
                                                        className="w-full rounded-xl bg-slate-950 border border-slate-800 text-slate-100 p-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                                    >
                                                        <option value="US English">Standard US English Accent</option>
                                                        <option value="UK English">British UK English Accent</option>
                                                        <option value="Castilian Spanish">Spanish Castilian Accent</option>
                                                        <option value="Mexican Spanish">Spanish Latin American Accent</option>
                                                        <option value="Japanese">Japanese Accent</option>
                                                    </select>
                                                </div>

                                            </div>
                                        )}

                                        {/* Audio Preview Widget Card */}
                                        {narrationEnabled && (
                                            <div className="p-4 rounded-xl bg-slate-950/20 border border-slate-800 flex items-center justify-between">
                                                <div className="flex gap-3 items-center">
                                                    <button 
                                                        type="button"
                                                        onClick={() => setIsPlayingMockAudio(!isPlayingMockAudio)}
                                                        className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center cursor-pointer transition-all shadow-md"
                                                    >
                                                        {isPlayingMockAudio ? <Square size={14} fill="white" /> : <Play size={14} fill="white" className="ml-0.5" />}
                                                    </button>
                                                    <div className="text-left">
                                                        <span className="block font-bold text-xs text-slate-200">Sample Voice Preview</span>
                                                        <span className="block text-[9px] text-slate-500">Listen to voice actor {voiceStyle} read-aloud accent sample.</span>
                                                    </div>
                                                </div>
                                                
                                                {isPlayingMockAudio && (
                                                    <div className="flex gap-0.5 items-end h-6">
                                                        {[2, 5, 8, 4, 9, 3, 6, 8, 2, 7].map((h, idx) => (
                                                            <div key={idx} className="w-1 bg-indigo-500 rounded-full animate-bounce" style={{ height: `${h * 10}%`, animationDelay: `${idx * 0.1}s` }}></div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Soundtrack settings */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            
                                            {/* Add background music */}
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-300">Add background music</label>
                                                <select
                                                    value={soundtrackTheme}
                                                    onChange={(e) => setSoundtrackTheme(e.target.value)}
                                                    className="w-full rounded-xl bg-slate-950 border border-slate-800 text-slate-100 p-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                                >
                                                    <option value="Slice of Life">Slice of Life (Subtle Acoustic)</option>
                                                    <option value="Magic Fantasy">Magic Fantasy (Cinematic Orchestral)</option>
                                                    <option value="Sci-Fi Cyberpunk">Sci-Fi Cyberpunk (Synthesized Beats)</option>
                                                    <option value="None">None (Silence)</option>
                                                </select>
                                            </div>

                                            {/* Music Intensity */}
                                            {soundtrackTheme !== 'None' && (
                                                <div>
                                                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-300">Keep music subtle or cinematic</label>
                                                    <select
                                                        value={musicIntensity}
                                                        onChange={(e) => setMusicIntensity(e.target.value)}
                                                        className="w-full rounded-xl bg-slate-955 border border-slate-800 text-slate-100 p-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                                    >
                                                        <option value="subtle">Subtle Background Bed</option>
                                                        <option value="cinematic">Cinematic Mid-Levels</option>
                                                        <option value="energetic">Energetic Front-Focus</option>
                                                    </select>
                                                </div>
                                            )}

                                        </div>

                                        {/* Progressive Disclosure for Advanced Audio Options */}
                                        <div className="pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowAdvancedAudio(!showAdvancedAudio)}
                                                className="w-full flex items-center justify-between py-1 text-[10px] font-bold text-slate-500 hover:text-slate-400 uppercase cursor-pointer"
                                            >
                                                <span>Advanced narration options</span>
                                                {showAdvancedAudio ? <Check size={12} /> : <ArrowRight size={12} />}
                                            </button>
                                            
                                            {showAdvancedAudio && (
                                                <div className="space-y-3 pt-2 text-[10px] text-slate-405">
                                                    <label className="flex items-center gap-3 cursor-pointer select-none bg-slate-950/25 p-3 rounded-lg border border-slate-800">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={characterVoiceMode} 
                                                            onChange={(e) => setCharacterVoiceMode(e.target.checked)} 
                                                            className="w-4 h-4 rounded accent-indigo-650"
                                                        />
                                                        <div className="text-left">
                                                            <span className="block text-xs font-bold text-slate-200">Character voice mode</span>
                                                            <span className="block text-[9px] text-slate-500">Auto-detect character dialogue and assign unique voices.</span>
                                                        </div>
                                                    </label>

                                                    <div className="space-y-1">
                                                        <label className="block text-[9px] font-bold text-slate-500 uppercase">Voice Tone Pitch</label>
                                                        <select
                                                            value={voiceTone}
                                                            onChange={(e) => setVoiceTone(e.target.value)}
                                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-[9px] outline-none text-slate-300"
                                                        >
                                                            <option value="warm">Warm & Cozy storytelling pitch</option>
                                                            <option value="energetic">Energetic & Kinetic dialogue pitch</option>
                                                            <option value="calm">Calm & Enunciated classroom pitch</option>
                                                            <option value="dramatic">Dramatic & Slow theatrical pitch</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Helper Text block */}
                                        <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/15 text-[10px] text-indigo-300 leading-relaxed text-left flex gap-2">
                                            <Info size={14} className="shrink-0 mt-0.5 text-indigo-400" />
                                            <p>🔊 <strong>Narration benefits:</strong> Audio narration supports accessibility guidelines (a11y) for visually impaired readers, reinforces phonetic learning in classroom lessons, and creates soothing bedtime stories for early childhood engagement.</p>
                                        </div>

                                    </div>
                                </div>
                            )}

                            {/* Step 7: Review & Create */}
                            {activeStep === 7 && (
                                <div className="space-y-6 text-left">
                                    <div>
                                        <h3 className="text-xl font-bold tracking-tight text-white">Review and generate your book</h3>
                                        <p className="text-sm text-slate-400 mt-1">Review your storybook setup details below. You can fine-tune everything inside the editor.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        
                                        {/* Basics review card */}
                                        <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-3 relative">
                                            <button 
                                                onClick={() => setActiveStep(2)}
                                                className="absolute top-4 right-4 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                                            >
                                                <Edit2 size={10} /> Change
                                            </button>
                                            <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider block">1. Basics & Target</span>
                                            <h4 className="font-extrabold text-sm text-slate-200 line-clamp-1">{projectTitle}</h4>
                                            <p className="text-[10px] text-slate-400 line-clamp-2">{projectDesc || 'No premise description written yet.'}</p>
                                            <span className="block text-[10px] text-slate-300 font-semibold">{audienceType} • {ageGrade} ({readingLevel})</span>
                                        </div>

                                        {/* Goals & Tone review card */}
                                        <div className="p-5 rounded-2xl bg-slate-955/40 border border-slate-800 space-y-3 relative">
                                            <button 
                                                onClick={() => setActiveStep(3)}
                                                className="absolute top-4 right-4 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                                            >
                                                <Edit2 size={10} /> Change
                                            </button>
                                            <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider block">2. Goals & Format</span>
                                            <h4 className="font-extrabold text-xs text-slate-200">Syllabus Objective</h4>
                                            <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{storyGoal || 'General creative story adventure development.'}</p>
                                            <span className="block text-[10px] text-slate-300 font-semibold">{wizardGenre} ({wizardTone.toLowerCase()})</span>
                                        </div>

                                        {/* Visual Preset review card */}
                                        <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-3 relative">
                                            <button 
                                                onClick={() => setActiveStep(4)}
                                                className="absolute top-4 right-4 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                                            >
                                                <Edit2 size={10} /> Change
                                            </button>
                                            <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider block">3. Visual Presets</span>
                                            <div className="flex gap-3 items-center">
                                                <div className="w-10 h-10 rounded-lg bg-slate-950 overflow-hidden shrink-0 border border-slate-800">
                                                    <img src={styleImages[stylePreset] || '/pixar.png'} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="text-left">
                                                    <h4 className="font-extrabold text-xs text-slate-200">{stylePreset} preset</h4>
                                                    <p className="text-[9px] text-slate-500">Consistency guidance active</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Language tracks review card */}
                                        <div className="p-5 rounded-2xl bg-slate-955/40 border border-slate-800 space-y-3 relative">
                                            <button 
                                                onClick={() => setActiveStep(5)}
                                                className="absolute top-4 right-4 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                                            >
                                                <Edit2 size={10} /> Change
                                            </button>
                                            <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider block">4. Language Setup</span>
                                            <h4 className="font-extrabold text-xs text-slate-200">
                                                {bilingualMode ? 'Bilingual Translation Track' : 'Single Language Track'}
                                            </h4>
                                            <p className="text-[10px] text-slate-300">
                                                {bilingualMode ? `${sourceLanguage.toUpperCase()} ↔ ${targetLanguage.toUpperCase()} (${readingMode})` : `${sourceLanguage.toUpperCase()} original`}
                                            </p>
                                            <p className="text-[9px] text-slate-500">
                                                Glossary {lockedGlossary ? 'Locked' : 'Off'} • Names {preserveCharacterNames ? 'Preserved' : 'Normal'}
                                            </p>
                                        </div>

                                    </div>

                                    {/* Audio Narration review row */}
                                    <div className="p-5 rounded-2xl bg-slate-955/40 border border-slate-800 relative flex justify-between items-center">
                                        <button 
                                            onClick={() => setActiveStep(6)}
                                            className="absolute top-4 right-4 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                                        >
                                            <Edit2 size={10} /> Change
                                        </button>
                                        <div className="text-left space-y-1">
                                            <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider block">5. Audio Narration & Soundtrack</span>
                                            <p className="text-xs font-bold text-slate-200">
                                                {narrationEnabled ? `Voice Narrator: ${voiceStyle} (${voiceTone})` : 'Speech Narration Off'}
                                            </p>
                                            <p className="text-[10px] text-slate-400">
                                                Background music soundtrack: {soundtrackTheme !== 'None' ? `${soundtrackTheme} theme (${musicIntensity})` : 'Silent / Muted'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Reassurance note */}
                                    <div className="flex gap-2.5 p-4.5 rounded-xl bg-indigo-500/5 border border-indigo-500/20 text-indigo-300 text-xs">
                                        <Info size={16} className="shrink-0 mt-0.5 text-indigo-400" />
                                        <p>✨ Settings are not permanent. Start building your pages, scenes, and dialogue next, and adjust visual steerage and audio models anytime inside the studio workspace.</p>
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Navigation CTA Bar */}
                        <div className="max-w-2xl mx-auto w-full pt-6 border-t border-slate-800 flex justify-between items-center bg-slate-900 shrink-0">
                            <button
                                onClick={handleBackStep}
                                disabled={activeStep === 1}
                                className="px-5 py-3 rounded-xl text-xs font-bold bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-30 transition-all cursor-pointer flex items-center gap-1.5"
                            >
                                <ArrowLeft size={14} /> Back
                            </button>

                            {activeStep < 7 ? (
                                <button
                                    onClick={handleNextStep}
                                    className="px-6 py-3 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer ml-auto"
                                >
                                    Next Step <ArrowRight size={14} />
                                </button>
                            ) : (
                                <button
                                    onClick={handleCreateProject}
                                    className="px-8 py-3.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 text-white shadow-xl shadow-purple-500/20 flex items-center gap-2 cursor-pointer ml-auto animate-pulse"
                                >
                                    Launch Story Workspace <Zap size={14} />
                                </button>
                            )}
                        </div>
                    </main>

                    {/* Right Summary Preview Panel */}
                    <aside className="w-80 border-l border-slate-800 p-6 flex flex-col justify-between shrink-0 bg-slate-900/40">
                        <div className="space-y-6">
                            <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase block">Live Summary Card</span>
                            
                            {/* Project Mock Preview Card */}
                            <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-lg flex flex-col text-left">
                                <div className="aspect-[4/3] w-full relative overflow-hidden bg-slate-900 border-b border-slate-800">
                                    <img 
                                        src={styleImages[stylePreset] || '/pixar.png'} 
                                        alt={stylePreset} 
                                        className="w-full h-full object-cover opacity-80"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                                    <span className="absolute bottom-3 left-3 text-[9px] font-mono font-bold bg-indigo-600 px-2 py-0.5 rounded text-white shadow">
                                        Style: {stylePreset}
                                    </span>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div>
                                        <span className="text-[9px] font-mono text-purple-400 font-bold uppercase tracking-wider">{audienceType} • {ageGrade}</span>
                                        <h4 className="font-extrabold text-sm text-slate-200 tracking-tight mt-0.5 line-clamp-1">{projectTitle || 'Untitled Story'}</h4>
                                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{projectDesc || 'A brand new story outline, ready to generate illustrated chapters.'}</p>
                                    </div>
                                    
                                    {/* Live language configuration mapping */}
                                    <div className="border-t border-slate-900 pt-3 space-y-1.5 text-[9px] font-medium text-slate-400">
                                        {storyGoal && (
                                            <p className="line-clamp-1">🎯 Goal: {storyGoal}</p>
                                        )}
                                        <p>📂 Format: {wizardGenre} ({wizardTone.toLowerCase()})</p>
                                        <p>🌐 Language: {bilingualMode ? `${sourceLanguage.toUpperCase()} ↔ ${targetLanguage.toUpperCase()} (${readingMode})` : `${sourceLanguage.toUpperCase()}`}</p>
                                        <p>🔧 Translation Settings: {lockedGlossary ? 'Glossary locked' : 'No glossary'}, {preserveCharacterNames ? 'names preserved' : 'no preservation'}</p>
                                        <p>🔊 {narrationEnabled ? `Narrated by ${voiceStyle} (${voiceTone} tone) with ${soundtrackTheme} background music` : 'Muted'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Extra Onboarding Help Hint */}
                        <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-[10px] text-slate-500 leading-relaxed text-left space-y-1">
                            <span className="font-bold text-slate-300 block">What happens next:</span>
                            <p>You will enter the authenticated workspace editor to generate individual pages and dialogue blocks.</p>
                        </div>
                    </aside>

                </div>

            </div>

            {/* Open Saved Project Library Overlay Dialog */}
            {isLibraryOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="w-full max-w-3xl h-[70vh] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col text-white">
                        
                        <header className="px-6 py-4 border-b border-slate-800 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-2">
                                <span className="text-xl">📁</span>
                                <div>
                                    <h3 className="font-extrabold text-sm text-slate-200">Story Library & Drafts</h3>
                                    <p className="text-[10px] text-slate-500 font-medium">Select a saved workspace or snapshot draft to restore editing</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsLibraryOpen(false)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                            >
                                Close
                            </button>
                        </header>

                        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                            
                            {/* Saved Projects column */}
                            <div className="space-y-4">
                                <h4 className="font-bold text-xs uppercase tracking-wider text-indigo-400">Saved Projects</h4>
                                {isLoadingLibrary ? (
                                    <p className="text-xs text-slate-500">Loading projects...</p>
                               ) : savedProjects.length > 0 ? (
                                    <div className="space-y-2">
                                        {savedProjects.map((proj) => (
                                            <div 
                                                key={proj.id}
                                                onClick={() => {
                                                    props.onLoadProject(proj);
                                                    setIsLibraryOpen(false);
                                                }}
                                                className="p-3 rounded-xl bg-slate-950/30 border border-slate-800 hover:border-indigo-500/40 hover:bg-slate-950/60 cursor-pointer flex justify-between items-center transition-all group"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-xs text-slate-200 truncate">{proj.title}</p>
                                                    <p className="text-[9px] text-slate-500 mt-0.5">{proj.genre} • {new Date(proj.updatedAt || proj.createdAt).toLocaleDateString()}</p>
                                                </div>
                                                <button
                                                    onClick={(e) => handleDeleteProject(proj.id, e)}
                                                    className="p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Shred Project"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-600 italic">No saved projects found.</p>
                                )}
                            </div>

                            {/* Saved Drafts column */}
                            <div className="space-y-4">
                                <h4 className="font-bold text-xs uppercase tracking-wider text-purple-400">Snapshot Drafts</h4>
                                {isLoadingLibrary ? (
                                    <p className="text-xs text-slate-500">Loading drafts...</p>
                                ) : savedDrafts.length > 0 ? (
                                    <div className="space-y-2">
                                        {savedDrafts.map((draft) => (
                                            <div 
                                                key={draft.id}
                                                onClick={() => {
                                                    if (props.onLoadDraft) {
                                                        props.onLoadDraft(draft);
                                                    }
                                                    setIsLibraryOpen(false);
                                                }}
                                                className="p-3 rounded-xl bg-slate-950/30 border border-slate-800 hover:border-purple-500/40 hover:bg-slate-950/60 cursor-pointer flex justify-between items-center transition-all group"
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold text-xs text-slate-200 truncate">{draft.title}</p>
                                                    <p className="text-[9px] text-slate-500 mt-0.5">{draft.genre} • Draft Snapshot</p>
                                                </div>
                                                <button
                                                    onClick={(e) => handleDeleteDraft(draft.id, e)}
                                                    className="p-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Shred Draft"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-600 italic">No snapshot drafts found.</p>
                                )}
                            </div>

                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
