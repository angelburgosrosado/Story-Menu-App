/*
Screen Name: New Project Onboarding Wizard
Purpose: Helps users configure templates, metadata, goals, visual styles, languages, and narration before launching a story project
Version: v1.0
Phase: Phase 3
Date: 2026-07-09
What changed in this revision: Integrated dynamic Character and Photo-Persona Selection, custom persona builder, likeness usage modes, safety consent checking, and photo reference preview upload workflows.
*/

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Sparkles, BookOpen, Layers, Globe, Volume2, Zap, Check, 
  FolderOpen, ArrowRight, ArrowLeft, Trash2, LogOut, FileText, Info, Play, Square, Edit2, Plus, UserPlus, UploadCloud, Trash, X
} from 'lucide-react';
import { 
  getProjectsFromFirestore, 
  getDraftsFromFirestore, 
  deleteProjectFromFirestore, 
  deleteDraftFromFirestore, 
  saveDraftToFirestore
} from './storageFirestore';
import { Persona, ChapterGoal, CharacterIdentitySchema, StartingFormat, CreatorFlow, StoryGoal, UsageMode, ReferenceImage } from './types';
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
  // future generation metadata
  personaId?: string;
  personaRole?: string;
  personaUsageMode?: string;
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

// Hardcoded TEMPLATES deleted in favor of dynamic starting_formats database loading


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
    const [sourceLanguage, setSourceLanguage] = useState('en-US');
    const [targetLanguage, setTargetLanguage] = useState('es-MX');
    const [wizardLanguages, setWizardLanguages] = useState<any[]>([]);
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

    // Wizard Dynamic Library Data
    const [formats, setFormats] = useState<StartingFormat[]>([]);
    const [flows, setFlows] = useState<CreatorFlow[]>([]);
    const [goals, setGoals] = useState<StoryGoal[]>([]);
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [usageModes, setUsageModes] = useState<UsageMode[]>([]);
    const [isLoadingWizardData, setIsLoadingWizardData] = useState(false);

    // Selected Managed Entities
    const [selectedFormat, setSelectedFormat] = useState<StartingFormat | null>(null);
    const [selectedFlow, setSelectedFlow] = useState<CreatorFlow | null>(null);
    const [selectedPrimaryGoal, setSelectedPrimaryGoal] = useState<StoryGoal | null>(null);
    const [selectedSecondaryGoal, setSelectedSecondaryGoal] = useState<StoryGoal | null>(null);
    const [freeformGoalNote, setFreeformGoalNote] = useState('');

    // Step 4 Character System
    const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
    const [personaRole, setPersonaRole] = useState<string>('Main character');
    const [isPrimaryPersona, setIsPrimaryPersona] = useState<boolean>(true);
    const [recurringIntent, setRecurringIntent] = useState<boolean>(true);
    const [personaStoryNotes, setPersonaStoryNotes] = useState<string>('');

    // Persona Creator Modal/Form states
    const [showPersonaCreator, setShowPersonaCreator] = useState(false);
    const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
    const [uploadingRefImage, setUploadingRefImage] = useState(false);
    const [uploadedRefImage, setUploadedRefImage] = useState<ReferenceImage | null>(null);

    useEffect(() => {
        const loadWizardData = async () => {
            setIsLoadingWizardData(true);
            try {
                const [formatsRes, flowsRes, goalsRes, personasRes, modesRes, langsRes] = await Promise.all([
                    fetch('/api/formats').then(res => res.json()),
                    fetch('/api/flows').then(res => res.json()),
                    fetch('/api/goals').then(res => res.json()),
                    fetch('/api/personas').then(res => res.json()),
                    fetch('/api/usage-modes').then(res => res.json()),
                    fetch('/api/languages').then(res => res.json())
                ]);
                setFormats(formatsRes || []);
                setFlows(flowsRes || []);
                setGoals(goalsRes || []);
                setPersonas(personasRes || []);
                setUsageModes(modesRes || []);
                setWizardLanguages(langsRes || []);
                if (personasRes && personasRes.length > 0) {
                    setSelectedPersona(personasRes[0]);
                }
            } catch (e) {
                console.error("Failed to load wizard setup data", e);
            } finally {
                setIsLoadingWizardData(false);
            }
        };
        loadWizardData();
    }, []);

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

    const handleSelectFormat = (format: StartingFormat) => {
        setSelectedFormat(format);
        
        // Setup initial default fields from metadata
        setProjectTitle(`My ${format.title}`);
        setAgeGrade(format.age_range || 'General');
        
        // Auto toggles for bilingual mode
        const isBilingual = format.category_tags.includes('Bilingual') || format.category_tags.includes('Languages');
        setBilingualMode(isBilingual);
        setReadingMode(isBilingual ? 'side-by-side' : 'single');

        // Automatically set related parameters or auto-select recommended flow if single option exists
        const matchedFlows = flows.filter(f => f.related_formats.includes(format.slug));
        if (matchedFlows.length === 1) {
            setSelectedFlow(matchedFlows[0]);
        } else {
            setSelectedFlow(null);
        }

        setActiveStep(2);
        playPageTurnSFX();
    };

    const handleNextStep = () => {
        if (activeStep < 8) {
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
        // Construct the consolidated goal string
        const primaryText = selectedPrimaryGoal ? selectedPrimaryGoal.title : 'Explore the story world';
        const secondaryText = selectedSecondaryGoal ? ` • ${selectedSecondaryGoal.title}` : '';
        const customNoteText = freeformGoalNote ? ` (${freeformGoalNote})` : '';
        const fullStoryGoal = `${primaryText}${secondaryText}${customNoteText}`;

        // Sync states to parent setup props
        props.onGenreChange(wizardGenre);
        props.onLanguageChange(bilingualMode ? `${sourceLanguage}-${targetLanguage}` : sourceLanguage);
        props.onPremiseChange(projectDesc);
        props.onVoiceChange(voiceStyle);
        props.onSoundtrackChange(soundtrackTheme !== 'None');

        // Fallback default blueprint beats in case server-side Gemini suggest fails
        const defaultBlueprint: ChapterGoal[] = [
            { chapterNum: 1, title: "Inciting Incident", goal: `Introduce characters inside the ${wizardGenre} setting.` },
            { chapterNum: 2, title: "Initial Pursuit", goal: `Establish the primary objective: ${fullStoryGoal}` },
            { chapterNum: 3, title: "The Crossroads", goal: "Introduce a central obstacle or choice related to the premise." },
            { chapterNum: 4, title: "Confrontation & Growth", goal: "Resolve the story objective, delivering the core learning message." }
        ];

        props.onStoryBlueprintChange(defaultBlueprint);

        // Play startup sound and launch studio
        playSparkleSFX();
        props.onLaunch({
            title: projectTitle,
            desc: projectDesc,
            audience: selectedFormat ? selectedFormat.audience_tags.join(', ') : audienceType,
            grade: ageGrade,
            level: readingLevel,
            goal: fullStoryGoal,
            genre: wizardGenre,
            tone: wizardTone,
            style: stylePreset,
            language: bilingualMode ? `${sourceLanguage}-${targetLanguage}` : sourceLanguage,
            bilingual: bilingualMode,
            narration: narrationEnabled,
            voice: voiceStyle,
            soundtrack: soundtrackTheme,
            personaId: selectedPersona?.id || undefined,
            personaRole: personaRole || undefined,
            personaUsageMode: selectedPersona?.usageMode || undefined
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
                            { step: 2, title: 'Choose your creator flow', desc: 'Title, premise & workflow' },
                            { step: 3, title: 'Set learning & story goals', desc: 'Syllabus, goals and tones' },
                            { step: 4, title: 'Character & Persona', desc: 'Manage characters & reference photos' },
                            { step: 5, title: 'Pick illustration style', desc: 'Art style and camera' },
                            { step: 6, title: 'Choose languages & translation', desc: 'Bilingual options' },
                            { step: 7, title: 'Choose narrator & soundtrack', desc: 'Voices and music' },
                            { step: 8, title: 'Review and generate your book', desc: 'Launch book sequence' }
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
                            
                            {/* Step 1: Choose Format */}
                            {activeStep === 1 && (
                                <div className="space-y-6 text-left">
                                    <div>
                                        <h3 className="text-xl font-bold tracking-tight text-white">Pick a starting format</h3>
                                        <p className="text-sm text-slate-400">Choose the format that best fits your lesson or story</p>
                                    </div>

                                    {isLoadingWizardData ? (
                                        <div className="space-y-3">
                                            {[1, 2, 3].map((n) => (
                                                <div key={n} className="w-full h-24 rounded-xl bg-slate-850/50 border border-slate-800 animate-pulse flex items-center p-4 gap-4">
                                                    <div className="w-12 h-12 rounded bg-slate-805 shrink-0"></div>
                                                    <div className="flex-1 space-y-2">
                                                        <div className="h-4 bg-slate-800 rounded w-1/3"></div>
                                                        <div className="h-3 bg-slate-800 rounded w-3/4"></div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-3">
                                            {formats.filter(f => f.visibility_state === 'Active').map((fmt) => (
                                                <button
                                                    key={fmt.id}
                                                    onClick={() => handleSelectFormat(fmt)}
                                                    className={`w-full p-4 rounded-xl border text-left flex items-start gap-4 transition-all cursor-pointer relative overflow-hidden ${
                                                        selectedFormat?.id === fmt.id
                                                        ? 'bg-indigo-600/10 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                                                        : 'bg-slate-950/20 border-slate-800 hover:border-slate-700 hover:bg-slate-950/20'
                                                    }`}
                                                >
                                                    {fmt.featured && (
                                                        <span className="absolute top-0 right-0 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-bl">
                                                            RECOMMENDED
                                                        </span>
                                                    )}
                                                    <span className="text-3xl p-3 rounded-lg bg-slate-800 border border-slate-700 shrink-0 mt-1">{fmt.icon || '🏫'}</span>
                                                    <div className="flex-1 min-w-0 pr-8">
                                                        <h4 className="font-extrabold text-sm text-slate-200 flex items-center gap-2">
                                                            {fmt.title}
                                                            {fmt.age_range && <span className="text-[10px] font-semibold text-slate-500 font-mono">({fmt.age_range})</span>}
                                                        </h4>
                                                        <p className="text-xs text-slate-400 mt-0.5">{fmt.short_description}</p>
                                                        {fmt.recommended_for && (
                                                            <p className="text-[10px] text-indigo-400 mt-1.5 font-medium"><strong className="text-slate-400">Best for:</strong> {fmt.recommended_for}</p>
                                                        )}
                                                        {fmt.sample_output_hint && (
                                                            <p className="text-[10px] text-emerald-400/95 mt-0.5 font-medium"><strong className="text-slate-400">Sample Output:</strong> {fmt.sample_output_hint}</p>
                                                        )}
                                                        {fmt.audience_tags && fmt.audience_tags.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-2.5">
                                                                {fmt.audience_tags.map(tag => (
                                                                    <span key={tag} className="text-[8px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">{tag}</span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <ArrowRight size={16} className="text-slate-500 mt-4 shrink-0" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Step 2: Creator Flow & Project Basics */}
                            {activeStep === 2 && (
                                <div className="space-y-5 text-left">
                                    <div>
                                        <h3 className="text-xl font-bold tracking-tight text-white">Choose your creator flow</h3>
                                        <p className="text-sm text-slate-400">Define the project title, premise, and creator template workflow</p>
                                    </div>

                                    {selectedFormat && (
                                        <div className="p-3 bg-indigo-950/20 border border-indigo-900/40 rounded-xl flex items-center gap-3 text-xs text-indigo-300">
                                            <Info size={14} className="shrink-0 text-indigo-400" />
                                            <span>Showing flows optimized for the <strong className="text-indigo-200">{selectedFormat.title}</strong> format.</span>
                                        </div>
                                    )}

                                    <div className="space-y-5">
                                        {/* Project Title */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-300">Project Title</label>
                                            <input 
                                                type="text" 
                                                value={projectTitle}
                                                onChange={(e) => setProjectTitle(e.target.value)}
                                                placeholder="e.g. Photosynthesis: Energy from Light"
                                                className="w-full rounded-xl bg-slate-950 border border-slate-800 text-slate-100 p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                            />
                                        </div>

                                        {/* Short Description */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-300">Short Description / Premise</label>
                                            <textarea 
                                                rows={2}
                                                value={projectDesc}
                                                onChange={(e) => setProjectDesc(e.target.value)}
                                                placeholder="e.g. A character-driven journey explaining how plants convert light to energy..."
                                                className="w-full rounded-xl bg-slate-950 border border-slate-800 text-slate-100 p-3.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                            />
                                        </div>

                                        {/* Creator Flows Selection */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-slate-300">Select Creator Flow</label>
                                            <div className="grid grid-cols-1 gap-2.5">
                                                {flows.filter(f => f.visibility_state === 'Active').map((flow) => {
                                                    const isRecommended = selectedFormat && flow.related_formats.includes(selectedFormat.slug);
                                                    const isSelected = selectedFlow?.id === flow.id;
                                                    return (
                                                        <button
                                                            key={flow.id}
                                                            type="button"
                                                            onClick={() => setSelectedFlow(flow)}
                                                            className={`w-full p-3.5 rounded-xl border text-left flex items-start gap-3.5 transition-all cursor-pointer relative overflow-hidden ${
                                                                isSelected
                                                                ? 'bg-indigo-600/10 border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                                                                : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                                                            }`}
                                                        >
                                                            {isRecommended && (
                                                                <span className="absolute top-0 right-0 bg-emerald-600 text-white text-[7px] font-black px-2 py-0.5 rounded-bl uppercase tracking-wider">
                                                                    Recommended Match
                                                                </span>
                                                            )}
                                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border mt-0.5 text-xs ${
                                                                isSelected ? 'bg-indigo-600 text-white border-transparent' : 'border-slate-600'
                                                            }`}>
                                                                {isSelected && '✓'}
                                                            </div>
                                                            <div className="flex-1 min-w-0 pr-12">
                                                                <h5 className="font-extrabold text-xs text-slate-200">{flow.title}</h5>
                                                                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{flow.short_description}</p>
                                                                {flow.best_for && (
                                                                    <p className="text-[10px] text-slate-500 mt-1"><strong className="text-slate-400">Best for:</strong> {flow.best_for}</p>
                                                                )}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        {/* Metadata dropdowns */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                            {/* Age or Grade */}
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-300">Age / Grade Level</label>
                                                <select
                                                    value={ageGrade}
                                                    onChange={(e) => setAgeGrade(e.target.value)}
                                                    className="w-full rounded-xl bg-slate-950 border border-slate-800 text-slate-100 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                                >
                                                    <option value="Grade K-2">Grade K-2 (Early Elementary)</option>
                                                    <option value="Grade 3-5">Grade 3-5 (Mid Elementary)</option>
                                                    <option value="Grade 6-8">Grade 6-8 (Middle School)</option>
                                                    <option value="Teens">Teens (High School)</option>
                                                    <option value="General">General / All Audiences</option>
                                                </select>
                                            </div>

                                            {/* Reading Level */}
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-300">Reading Level Adaptation</label>
                                                <select
                                                    value={readingLevel}
                                                    onChange={(e) => setReadingLevel(e.target.value)}
                                                    className="w-full rounded-xl bg-slate-950 border border-slate-800 text-slate-100 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                                >
                                                    <option value="Lexile 300L">Lexile 300L (Beginning Reader)</option>
                                                    <option value="Lexile 500L">Lexile 500L (Developing Reader)</option>
                                                    <option value="Lexile 700L">Lexile 700L (Independent Reader)</option>
                                                    <option value="General">General (Unassisted Reading)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Story & Learning Goals */}
                            {activeStep === 3 && (
                                <div className="space-y-5 text-left">
                                    <div>
                                        <h3 className="text-xl font-bold tracking-tight text-white">Set learning and story goals</h3>
                                        <p className="text-sm text-slate-400">Define what the reader should learn or experience from this project</p>
                                    </div>

                                    {selectedFormat && (
                                        <div className="p-3 bg-indigo-950/20 border border-indigo-900/40 rounded-xl flex items-center gap-3 text-xs text-indigo-300">
                                            <Info size={14} className="shrink-0 text-indigo-400" />
                                            <span>Goals recommended for the <strong className="text-indigo-200">{selectedFormat.title}</strong> format are marked with a star (★).</span>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        {/* Primary Goal Selector */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-300">Primary Goal (Required)</label>
                                            <select
                                                value={selectedPrimaryGoal?.id || ''}
                                                onChange={(e) => {
                                                    const goal = goals.find(g => g.id === e.target.value);
                                                    setSelectedPrimaryGoal(goal || null);
                                                    if (goal) {
                                                        if (goal.category === 'Science') {
                                                            setWizardTone('EDUCATIONAL');
                                                            setWizardGenre('Custom');
                                                        }
                                                    }
                                                }}
                                                className="w-full rounded-xl bg-slate-950 border border-slate-800 text-slate-100 p-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                            >
                                                <option value="">-- Choose a required primary goal --</option>
                                                <optgroup label="Reading Fluency & Comprehension">
                                                    {goals.filter(g => g.visibility_state === 'Active' && g.category === 'Reading').map(g => {
                                                        const isRecommended = selectedFormat && g.related_formats.includes(selectedFormat.slug);
                                                        return <option key={g.id} value={g.id}>{isRecommended ? '★ ' : ''}{g.title}</option>;
                                                    })}
                                                </optgroup>
                                                <optgroup label="Science & STEM Objectives">
                                                    {goals.filter(g => g.visibility_state === 'Active' && g.category === 'Science').map(g => {
                                                        const isRecommended = selectedFormat && g.related_formats.includes(selectedFormat.slug);
                                                        return <option key={g.id} value={g.id}>{isRecommended ? '★ ' : ''}{g.title}</option>;
                                                    })}
                                                </optgroup>
                                                <optgroup label="Language, Vocabulary & Sharing">
                                                    {goals.filter(g => g.visibility_state === 'Active' && g.category !== 'Reading' && g.category !== 'Science').map(g => {
                                                        const isRecommended = selectedFormat && g.related_formats.includes(selectedFormat.slug);
                                                        return <option key={g.id} value={g.id}>{isRecommended ? '★ ' : ''}{g.title}</option>;
                                                    })}
                                                </optgroup>
                                            </select>
                                            {selectedPrimaryGoal && (
                                                <span className="text-[10px] text-slate-500 mt-1 block font-medium">{selectedPrimaryGoal.short_description}</span>
                                            )}
                                        </div>

                                        {/* Secondary Goal Selector */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-300">Secondary Goal (Optional)</label>
                                            <select
                                                value={selectedSecondaryGoal?.id || ''}
                                                onChange={(e) => {
                                                    const goal = goals.find(g => g.id === e.target.value);
                                                    setSelectedSecondaryGoal(goal || null);
                                                }}
                                                className="w-full rounded-xl bg-slate-950 border border-slate-800 text-slate-100 p-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                            >
                                                <option value="">-- None --</option>
                                                <optgroup label="Reading Fluency & Comprehension">
                                                    {goals.filter(g => g.visibility_state === 'Active' && g.category === 'Reading' && g.id !== selectedPrimaryGoal?.id).map(g => {
                                                        const isRecommended = selectedFormat && g.related_formats.includes(selectedFormat.slug);
                                                        return <option key={g.id} value={g.id}>{isRecommended ? '★ ' : ''}{g.title}</option>;
                                                    })}
                                                </optgroup>
                                                <optgroup label="Science & STEM Objectives">
                                                    {goals.filter(g => g.visibility_state === 'Active' && g.category === 'Science' && g.id !== selectedPrimaryGoal?.id).map(g => {
                                                        const isRecommended = selectedFormat && g.related_formats.includes(selectedFormat.slug);
                                                        return <option key={g.id} value={g.id}>{isRecommended ? '★ ' : ''}{g.title}</option>;
                                                    })}
                                                </optgroup>
                                                <optgroup label="Language, Vocabulary & Sharing">
                                                    {goals.filter(g => g.visibility_state === 'Active' && g.category !== 'Reading' && g.category !== 'Science' && g.id !== selectedPrimaryGoal?.id).map(g => {
                                                        const isRecommended = selectedFormat && g.related_formats.includes(selectedFormat.slug);
                                                        return <option key={g.id} value={g.id}>{isRecommended ? '★ ' : ''}{g.title}</option>;
                                                    })}
                                                </optgroup>
                                            </select>
                                            {selectedSecondaryGoal && (
                                                <span className="text-[10px] text-slate-500 mt-1 block font-medium">{selectedSecondaryGoal.short_description}</span>
                                            )}
                                        </div>

                                        {/* Freeform Goal Note */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-300">Custom Goal Notes / Focus Terms (Optional)</label>
                                            <input 
                                                type="text" 
                                                value={freeformGoalNote}
                                                onChange={(e) => setFreeformGoalNote(e.target.value)}
                                                placeholder="e.g. Focus on photosynthesis terms, introduce the word 'chlorophyll'"
                                                className="w-full rounded-xl bg-slate-950 border border-slate-800 text-slate-100 p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                            />
                                        </div>

                                        {/* Genre & Tone dropdowns */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-300">Syllabus Genre</label>
                                                <select
                                                    value={wizardGenre}
                                                    onChange={(e) => setWizardGenre(e.target.value)}
                                                    className="w-full rounded-xl bg-slate-950 border border-slate-800 text-slate-100 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                                >
                                                    {['Superhero Action', 'High Fantasy', 'Neon Noir Detective', 'Classic Horror', 'Historical Archeology Tales', 'Custom'].map(g => (
                                                        <option key={g} value={g}>{g}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-300">Story Tone</label>
                                                <select
                                                    value={wizardTone}
                                                    onChange={(e) => setWizardTone(e.target.value)}
                                                    className="w-full rounded-xl bg-slate-950 border border-slate-800 text-slate-100 p-3 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
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

                            {/* Step 4: Character & Persona */}
                            {activeStep === 4 && (
                                <div className="space-y-6 text-left animate-fadeIn">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="text-xl font-bold tracking-tight text-white font-serif">Character & Persona</h3>
                                            <p className="text-sm text-slate-400">Configure or select a character to feature in your story</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingPersona({
                                                    id: '',
                                                    slug: '',
                                                    displayName: '',
                                                    shortDescription: '',
                                                    longDescription: '',
                                                    personaType: 'Custom Character',
                                                    roleDefaults: ['Main character'],
                                                    ageGroup: 'General',
                                                    audience_tags: [],
                                                    language_tags: ['en'],
                                                    stylePreference: 'General',
                                                    visualSummary: '',
                                                    generationSafeDescription: '',
                                                    usageMode: 'none',
                                                    recurringCharacter: true,
                                                    visibilityScope: 'Private',
                                                    consentStatus: 'Not Granted',
                                                    moderationStatus: 'Unmoderated',
                                                    approvedForGeneration: false,
                                                    sort_order: 99,
                                                    status: 'Active'
                                                });
                                                setUploadedRefImage(null);
                                                setShowPersonaCreator(true);
                                            }}
                                            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer animate-pulse"
                                        >
                                            <Plus size={14} /> Add Character
                                        </button>
                                    </div>

                                    {/* Persona list/cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                                        {personas.map((p) => {
                                            const isSelected = selectedPersona?.id === p.id;
                                            return (
                                                <div
                                                    key={p.id}
                                                    onClick={() => {
                                                        setSelectedPersona(p);
                                                        setPersonaRole((p.roleDefaults && p.roleDefaults[0]) || 'Main character');
                                                    }}
                                                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between h-44 relative overflow-hidden ${
                                                        isSelected
                                                        ? 'bg-indigo-600/10 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                                                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                                                    }`}
                                                >
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between items-start">
                                                            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 uppercase tracking-wider">
                                                                {p.personaType}
                                                            </span>
                                                            <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                                                                p.visibilityScope === 'Public' ? 'bg-emerald-950/40 text-emerald-400' : 'bg-slate-900 border border-slate-800 text-slate-500'
                                                            }`}>
                                                                {p.visibilityScope}
                                                            </span>
                                                        </div>
                                                        <h4 className="font-extrabold text-sm text-slate-200 mt-1">{p.displayName}</h4>
                                                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{p.shortDescription}</p>
                                                    </div>

                                                    <div className="flex justify-between items-center pt-2 border-t border-slate-900 mt-2">
                                                        <span className="text-[9.5px] text-slate-500 font-mono">
                                                            Mode: {p.usageMode}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingPersona({ ...p });
                                                                if (p.referenceImageId) {
                                                                    setUploadedRefImage({
                                                                        id: p.referenceImageId,
                                                                        fileName: 'uploaded-photo.jpg',
                                                                        mimeType: 'image/jpeg',
                                                                        previewUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
                                                                        uploadStatus: 'Completed',
                                                                        cropStatus: 'Cropped',
                                                                        moderationStatus: p.moderationStatus === 'Approved' ? 'Approved' : 'Pending',
                                                                        consentVerified: p.consentStatus === 'Granted',
                                                                        approvedForGeneration: p.approvedForGeneration
                                                                    });
                                                                } else {
                                                                    setUploadedRefImage(null);
                                                                }
                                                                setShowPersonaCreator(true);
                                                            }}
                                                            className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                                                        >
                                                            <Edit2 size={10} /> Edit Character
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Role Configuration for selected persona */}
                                    {selectedPersona && (
                                        <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-4 animate-fadeIn">
                                            <div className="flex items-center gap-2">
                                                <Info size={14} className="text-indigo-400 shrink-0" />
                                                <h4 className="text-xs font-bold text-slate-200">Configure Story Role for <span className="text-indigo-400">{selectedPersona.displayName}</span></h4>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                                <div>
                                                    <label className="block text-slate-400 mb-1.5 font-bold uppercase tracking-wide text-[10px]">Story Role Type</label>
                                                    <select
                                                        value={personaRole}
                                                        onChange={(e) => setPersonaRole(e.target.value)}
                                                        className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded text-white text-xs"
                                                    >
                                                        <option value="Main character">Main character</option>
                                                        <option value="Narrator guide">Narrator guide</option>
                                                        <option value="Supporting family member">Supporting family member</option>
                                                        <option value="Teacher/host">Teacher/host</option>
                                                        <option value="Science explainer">Science explainer</option>
                                                        <option value="Class mascot">Class mascot</option>
                                                        <option value="Side character">Side character</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="block text-slate-400 mb-1.5 font-bold uppercase tracking-wide text-[10px]">Casting Priorities</label>
                                                    <div className="flex items-center gap-4 mt-2">
                                                        <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={isPrimaryPersona}
                                                                onChange={(e) => setIsPrimaryPersona(e.target.checked)}
                                                            />
                                                            Primary Character
                                                        </label>
                                                        <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={recurringIntent}
                                                                onChange={(e) => setRecurringIntent(e.target.checked)}
                                                            />
                                                            Recurring Intent
                                                        </label>
                                                    </div>
                                                </div>

                                                <div className="col-span-2">
                                                    <label className="block text-slate-400 mb-1.5 font-bold uppercase tracking-wide text-[10px]">Story Notes for this Casting</label>
                                                    <input
                                                        type="text"
                                                        value={personaStoryNotes}
                                                        onChange={(e) => setPersonaStoryNotes(e.target.value)}
                                                        placeholder="e.g. Plays the sidekick who finds the glowing leaf"
                                                        className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded text-white text-xs"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Step 5: Visual Style */}
                            {activeStep === 5 && (
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

                            {/* Step 6: Language Tracks */}
                            {activeStep === 6 && (
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
                                                    className="w-full rounded-xl bg-slate-955 border border-slate-808 text-slate-100 p-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                                >
                                                    {wizardLanguages.map(l => (
                                                        <option key={l.id} value={l.code}>{l.displayName} ({l.nativeName})</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {bilingualMode && (
                                                <div>
                                                    <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-300">Translation language</label>
                                                    <select
                                                        value={targetLanguage}
                                                        onChange={(e) => setTargetLanguage(e.target.value)}
                                                        className="w-full rounded-xl bg-slate-955 border border-slate-808 text-slate-100 p-3.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                                                    >
                                                        {wizardLanguages.map(l => (
                                                            <option key={l.id} value={l.code}>{l.displayName} ({l.nativeName})</option>
                                                        ))}
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

                            {/* Step 7: Audio */}
                            {activeStep === 7 && (
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

                            {/* Step 8: Review & Create */}
                            {activeStep === 8 && (
                                <div className="space-y-6 text-left">
                                    <div>
                                        <h3 className="text-xl font-bold tracking-tight text-white">Review and generate your book</h3>
                                        <p className="text-sm text-slate-400 mt-1">Review your storybook setup details below. You can fine-tune everything inside the editor.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        
                                        {/* Basics review card */}
                                        <div className="p-5 rounded-2xl bg-slate-955/40 border border-slate-800 space-y-3 relative">
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
                                            <h4 className="font-extrabold text-xs text-slate-200 font-serif">Syllabus Objective</h4>
                                            <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{storyGoal || 'General creative story adventure development.'}</p>
                                            <span className="block text-[10px] text-slate-300 font-semibold">{wizardGenre} ({wizardTone.toLowerCase()})</span>
                                        </div>

                                        {/* Character & Persona review card */}
                                        <div className="p-5 rounded-2xl bg-slate-955/40 border border-slate-800 space-y-3 relative">
                                            <button 
                                                onClick={() => setActiveStep(4)}
                                                className="absolute top-4 right-4 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                                            >
                                                <Edit2 size={10} /> Change
                                            </button>
                                            <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider block">3. Cast Character</span>
                                            {selectedPersona ? (
                                                <div className="space-y-1 text-left">
                                                    <h4 className="font-extrabold text-sm text-slate-200">{selectedPersona.displayName}</h4>
                                                    <p className="text-[10px] text-slate-400"><strong className="text-slate-300">Role:</strong> {personaRole}</p>
                                                    <p className="text-[9px] text-slate-500">Likeness Mode: {selectedPersona.usageMode}</p>
                                                </div>
                                            ) : (
                                                <p className="text-[10px] text-slate-500">No custom character cast.</p>
                                            )}
                                        </div>

                                        {/* Visual Preset review card */}
                                        <div className="p-5 rounded-2xl bg-slate-955/40 border border-slate-800 space-y-3 relative">
                                            <button 
                                                onClick={() => setActiveStep(5)}
                                                className="absolute top-4 right-4 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                                            >
                                                <Edit2 size={10} /> Change
                                            </button>
                                            <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider block">4. Visual Presets</span>
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
                                                onClick={() => setActiveStep(6)}
                                                className="absolute top-4 right-4 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                                            >
                                                <Edit2 size={10} /> Change
                                            </button>
                                            <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider block">5. Language Setup</span>
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
                                            onClick={() => setActiveStep(7)}
                                            className="absolute top-4 right-4 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                                        >
                                            <Edit2 size={10} /> Change
                                        </button>
                                        <div className="text-left space-y-1">
                                            <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider block">6. Audio Narration & Soundtrack</span>
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

                            {activeStep < 8 ? (
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
                    <aside className="w-80 border-l border-slate-800 p-6 flex flex-col justify-between shrink-0 bg-slate-900/40 font-sans">
                        <div className="space-y-6">
                            <span className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase block">Live Summary Card</span>
                            
                            {/* Project Mock Preview Card */}
                            <div className="rounded-2xl border border-slate-800 bg-slate-955 overflow-hidden shadow-lg flex flex-col text-left">
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
                                        <p className="text-[10px] text-slate-405 mt-1 line-clamp-2 leading-relaxed">{projectDesc || 'A brand new story outline, ready to generate illustrated chapters.'}</p>
                                    </div>
                                    
                                    {/* Live language configuration mapping */}
                                    <div className="border-t border-slate-900 pt-3 space-y-1.5 text-[9px] font-medium text-slate-400">
                                        {storyGoal && (
                                            <p className="line-clamp-1">🎯 Goal: {storyGoal}</p>
                                        )}
                                        <p>📂 Format: {wizardGenre} ({wizardTone.toLowerCase()})</p>
                                        <p>👤 Cast: {selectedPersona ? `${selectedPersona.displayName} (${personaRole})` : 'No custom character cast'}</p>
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

            {/* Persona Creator Overlay Dialog */}
            {showPersonaCreator && editingPersona && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl p-6 text-left space-y-5 text-white">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <UserPlus size={20} className="text-indigo-400" />
                                <h3 className="font-extrabold text-sm text-slate-200">
                                    {editingPersona.id ? 'Edit Character & Persona' : 'Create Character & Persona'}
                                </h3>
                            </div>
                            <button className="text-gray-400 hover:text-white" onClick={() => setShowPersonaCreator(false)}><X size={18} /></button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                            <div className="col-span-2">
                                <label className="block text-slate-400 mb-1 font-bold">Display Name</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Professor Pumpernickel"
                                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-white text-xs outline-none" 
                                    value={editingPersona.displayName} 
                                    onChange={e => setEditingPersona({...editingPersona, displayName: e.target.value})} 
                                />
                            </div>

                            <div>
                                <label className="block text-slate-400 mb-1 font-bold">Character Archetype</label>
                                <select 
                                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-white text-xs"
                                    value={editingPersona.personaType} 
                                    onChange={e => setEditingPersona({...editingPersona, personaType: e.target.value as any})}
                                >
                                    <option value="Me">Me (Self Portrait)</option>
                                    <option value="Child Reader">Child Reader</option>
                                    <option value="Story Guide">Story Guide</option>
                                    <option value="Science Helper">Science Helper</option>
                                    <option value="Teacher Voice Character">Teacher Voice Character</option>
                                    <option value="Family Character">Family Character</option>
                                    <option value="Custom Character">Custom Character</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-slate-400 mb-1 font-bold">Likeness Usage Mode</label>
                                <select 
                                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-white text-xs"
                                    value={editingPersona.usageMode} 
                                    onChange={e => setEditingPersona({...editingPersona, usageMode: e.target.value})}
                                >
                                    {usageModes.map(m => (
                                        <option key={m.slug} value={m.slug}>{m.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Reference Photo Upload area */}
                            {editingPersona.usageMode !== 'none' && (
                                <div className="col-span-2 space-y-2 p-4 bg-slate-950 border border-slate-850 rounded-2xl text-left">
                                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reference Photo Likeness</span>
                                    
                                    {!uploadedRefImage ? (
                                        <div className="border border-dashed border-slate-800 rounded-xl p-6 text-center space-y-3">
                                            <UploadCloud className="mx-auto text-slate-500" size={32} />
                                            <div>
                                                <p className="text-xs font-bold text-slate-300">Upload a Reference Photo</p>
                                                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Uploaded faces are only used to maintain facial consistency in generated scenes.</p>
                                            </div>
                                            <button
                                                type="button"
                                                disabled={uploadingRefImage}
                                                onClick={() => {
                                                    setUploadingRefImage(true);
                                                    setTimeout(() => {
                                                        setUploadedRefImage({
                                                            id: 'img-' + Math.random().toString(36).substr(2, 9),
                                                            fileName: 'my-avatar.png',
                                                            mimeType: 'image/png',
                                                            previewUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200',
                                                            uploadStatus: 'Completed',
                                                            cropStatus: 'Cropped',
                                                            moderationStatus: 'Approved',
                                                            consentVerified: true,
                                                            approvedForGeneration: true
                                                        });
                                                        setUploadingRefImage(false);
                                                    }, 1500);
                                                }}
                                                className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-650/40 text-indigo-400 border border-indigo-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                                            >
                                                {uploadingRefImage ? 'Uploading and analyzing face...' : 'Choose File / Simulate Upload'}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-4 items-center p-2">
                                            <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0">
                                                <img src={uploadedRefImage.previewUrl} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex-1 space-y-1 text-xs">
                                                <p className="font-bold text-slate-300">{uploadedRefImage.fileName}</p>
                                                <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                                                    <span>✓ Moderation Cleared (Face Detected)</span>
                                                </p>
                                                <div className="flex gap-3 pt-1 text-[10px]">
                                                    <button type="button" className="text-slate-400 hover:text-white" onClick={() => setUploadedRefImage(null)}>Remove</button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="col-span-2">
                                <label className="block text-slate-400 mb-1 font-bold">Short Bio / Character Description</label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. A friendly child researcher who loves space explainers"
                                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-white text-xs outline-none" 
                                    value={editingPersona.shortDescription} 
                                    onChange={e => setEditingPersona({...editingPersona, shortDescription: e.target.value})} 
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-slate-400 mb-1 font-bold">Visual Summary (Prompt locked descriptors)</label>
                                <textarea 
                                    rows={2}
                                    placeholder="e.g. Short curly hair, red hoodie, white canvas sneakers"
                                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-white text-xs outline-none resize-none" 
                                    value={editingPersona.visualSummary} 
                                    onChange={e => setEditingPersona({...editingPersona, visualSummary: e.target.value})} 
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="block text-slate-400 mb-1 font-bold">Safety, Consent & Visibility Scope</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-slate-950 border border-slate-850 rounded-2xl mt-1">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input 
                                            type="checkbox"
                                            checked={editingPersona.consentStatus === 'Granted'}
                                            onChange={e => setEditingPersona({...editingPersona, consentStatus: e.target.checked ? 'Granted' : 'Not Granted'})}
                                        />
                                        <span>I consent to using this character likeness</span>
                                    </label>
                                    <div>
                                        <select
                                            className="bg-slate-900 border border-slate-800 p-1.5 rounded text-white text-xs w-full"
                                            value={editingPersona.visibilityScope}
                                            onChange={e => setEditingPersona({...editingPersona, visibilityScope: e.target.value as any})}
                                        >
                                            <option value="Private">Private (Just Me)</option>
                                            <option value="Family-only">Family-only</option>
                                            <option value="Classroom-only">Classroom-only</option>
                                            <option value="Public">Public (Shared Library)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t border-slate-850">
                            <button className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded text-xs font-bold" onClick={() => setShowPersonaCreator(false)}>Cancel</button>
                            <button 
                                className="bg-indigo-650 hover:bg-indigo-600 text-white px-5 py-2 rounded text-xs font-bold"
                                onClick={async () => {
                                    const body = {
                                        ...editingPersona,
                                        referenceImageId: uploadedRefImage?.id || '',
                                        referenceImageStatus: uploadedRefImage ? 'Approved' : 'None',
                                        approvedForGeneration: uploadedRefImage ? uploadedRefImage.approvedForGeneration : true,
                                        moderationStatus: uploadedRefImage ? 'Approved' : 'Unmoderated'
                                    };
                                    const res = await fetch('/api/personas', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(body)
                                    }).then(r => r.json());

                                    setPersonas([...personas, res]);
                                    setSelectedPersona(res);
                                    setShowPersonaCreator(false);
                                }}
                            >
                                Save Character
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
