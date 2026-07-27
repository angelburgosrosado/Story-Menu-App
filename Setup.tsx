/**
 * Screen Name: New Project Onboarding Wizard
 * Purpose: Guided onboarding workflow to configure formats, AI suggestions, goals, characters, illustration styles, languages, and audio narration before studio launch.
 * Version: 1.1
 * Phase: Phase 12 Refinement
 * Date: 2026-07-09
 * What changed in this revision: Fully wired likeness photo upload, added dynamic AI suggestions, expanded story tones and educational genres, and ensured all configuration parameters map cleanly to final launch outputs.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Sparkles, BookOpen, Layers, Globe, Volume2, Zap, Check, 
  FolderOpen, ArrowRight, ArrowLeft, Trash2, LogOut, FileText, Info, Play, Square, Edit2, Plus, UserPlus, UploadCloud, Trash, X, Camera
} from 'lucide-react';
import { 
  getProjectsFromFirestore, 
  getDraftsFromFirestore, 
  deleteProjectFromFirestore, 
  deleteDraftFromFirestore, 
  saveDraftToFirestore
} from './storageFirestore';
import { Persona, ChapterGoal, CharacterIdentitySchema, StartingFormat, CreatorFlow, StoryGoal, UsageMode, ReferenceImage } from './types';
import { SetupStep1Format } from './components/setup/SetupStep1Format';
import { SetupStep8Review } from './components/setup/SetupStep8Review';
import { playPageTurnSFX, playSparkleSFX } from './audio';
import { fileToBase64 } from './imageUtils';

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
  personaId?: string;
  personaRole?: string;
  personaUsageMode?: string;
  aiSuggestionsEnabled?: boolean;
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

export const Setup: React.FC<SetupProps> = (props) => {
    const { t } = useTranslation();
    const [activeStep, setActiveStep] = useState(1);

    // Form fields
    const [projectTitle, setProjectTitle] = useState('My Storybook');
    const [projectDesc, setProjectDesc] = useState('');
    const [audienceType, setAudienceType] = useState('General');
    const [ageGrade, setAgeGrade] = useState('General');
    const [readingLevel, setReadingLevel] = useState('General');
    const [storyGoal, setStoryGoal] = useState('');
    const [wizardGenre, setWizardGenre] = useState('Science & Nature Study');
    const [wizardTone, setWizardTone] = useState('adventurous');
    const [stylePreset, setStylePreset] = useState('Pixar 3D');
    
    // Step 2 AI suggestions state
    const [aiSuggestionsEnabled, setAiSuggestionsEnabled] = useState(true);
    const [activeNudge, setActiveNudge] = useState('');

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
    const [soundtrackTheme, setSoundtrackTheme] = useState('Whimsical Ambient');
    const [characterVoiceMode, setCharacterVoiceMode] = useState(true);
    const [voiceLanguageAlignment, setVoiceLanguageAlignment] = useState('US English');
    const [voiceTone, setVoiceTone] = useState('warm');
    const [musicIntensity, setMusicIntensity] = useState('subtle');
    const [showAdvancedAudio, setShowAdvancedAudio] = useState(false);
    
    // Saved Library state
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [savedProjects, setSavedProjects] = useState<any[]>([]);
    const [savedDrafts, setSavedDrafts] = useState<any[]>([]);
    const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);

    // Dynamic database endpoints data
    const [formats, setFormats] = useState<StartingFormat[]>([]);
    const [flows, setFlows] = useState<CreatorFlow[]>([]);
    const [goals, setGoals] = useState<StoryGoal[]>([]);
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [usageModes, setUsageModes] = useState<UsageMode[]>([]);
    const [isLoadingWizardData, setIsLoadingWizardData] = useState(false);

    // Selected Entities
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

    // Persona Creator states
    const [showPersonaCreator, setShowPersonaCreator] = useState(false);
    const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
    const [uploadingRefImage, setUploadingRefImage] = useState(false);
    const [uploadedRefImage, setUploadedRefImage] = useState<ReferenceImage | null>(null);

    // Style presets list
    const stylePresets = [
        { name: 'Pixar 3D', desc: 'Bouncy 3D characters with soft dynamic lighting, optimized for kids fables.', preview: '🎨' },
        { name: 'Watercolor Illustration', desc: 'Hand-painted texture with soft color washes, great for historical, educational explainers.', preview: '🖌️' },
        { name: 'Classic Comic Inking', desc: 'Heavy shadows, sharp inks, and comic book dot matrices.', preview: '🌸' },
        { name: 'Bedtime Crayon Sketch', desc: 'Simple hand-drawn scribbles, friendly and encouraging style for early readers.', preview: '🖍️' }
    ];

    // Load initial data
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

    // Change AI nudge suggestions when selected format or description changes
    useEffect(() => {
        if (!selectedFormat) return;
        let nudge = "Keep descriptions simple. Focus on a clear central protagonist.";
        if (selectedFormat.slug === 'visual-lesson') {
            nudge = "💡 AI Suggestion: Break down your lesson step-by-step. Focus on visual sequences (e.g. 1. Light capture, 2. Chemical cycle).";
        } else if (selectedFormat.slug === 'bilingual-story') {
            nudge = "💡 AI Suggestion: Use short, clean sentences. This ensures parallel text aligns nicely for dual-language layout.";
        } else if (selectedFormat.slug === 'science-explainer') {
            nudge = "💡 AI Suggestion: Introduce STEM objectives clearly. Use focus words like 'chlorophyll' or 'kinetic' inside the premise.";
        } else if (selectedFormat.slug === 'kid-story') {
            nudge = "💡 AI Suggestion: Write a warm, whimsical premise. Focus on a bedtime adventure or an encouraging fable.";
        }
        setActiveNudge(nudge);
    }, [selectedFormat, projectDesc]);

    const fetchLibrary = async () => {
        setIsLoadingLibrary(true);
        try {
            const p = await getProjectsFromFirestore(props.activeCreator.id);
            const d = await getDraftsFromFirestore(props.activeCreator.id);
            setSavedProjects(p || []);
            setSavedDrafts(d || []);
        } catch (e) {
            console.error("Library load failed", e);
        } finally {
            setIsLoadingLibrary(false);
        }
    };

    const handleSelectFormat = (format: StartingFormat) => {
        setSelectedFormat(format);
        setProjectTitle(`My ${format.title}`);
        setAgeGrade(format.age_range || 'General');
        
        const isBilingual = format.category_tags.includes('Bilingual') || format.category_tags.includes('Languages');
        setBilingualMode(isBilingual);
        setReadingMode(isBilingual ? 'side-by-side' : 'single');

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

    const handleCreateProject = async () => {
        const primaryText = selectedPrimaryGoal ? selectedPrimaryGoal.title : 'Explore the story world';
        const secondaryText = selectedSecondaryGoal ? ` • ${selectedSecondaryGoal.title}` : '';
        const customNoteText = freeformGoalNote ? ` (${freeformGoalNote})` : '';
        const fullStoryGoal = `${primaryText}${secondaryText}${customNoteText}`;

        // Sync inputs back to parent configurations
        props.onGenreChange(wizardGenre);
        props.onLanguageChange(bilingualMode ? `${sourceLanguage}-${targetLanguage}` : sourceLanguage);
        props.onPremiseChange(projectDesc);
        props.onVoiceChange(voiceStyle);
        props.onSoundtrackChange(soundtrackTheme !== 'None');

        const defaultBlueprint: ChapterGoal[] = [
            { chapterNum: 1, title: "Inciting Incident", goal: `Introduce characters inside the ${wizardGenre} setting.` },
            { chapterNum: 2, title: "Initial Pursuit", goal: `Establish the primary objective: ${fullStoryGoal}` },
            { chapterNum: 3, title: "The Crossroads", goal: "Introduce a central obstacle or choice related to the premise." },
            { chapterNum: 4, title: "Confrontation & Growth", goal: "Resolve the story objective, delivering the core learning message." }
        ];

        props.onStoryBlueprintChange(defaultBlueprint);
        playSparkleSFX();

        props.onLaunch({
            title: projectTitle,
            desc: projectDesc,
            audience: (selectedFormat && selectedFormat.audience_tags) ? selectedFormat.audience_tags.join(', ') : audienceType,
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
            personaUsageMode: selectedPersona?.usageMode || undefined,
            aiSuggestionsEnabled
        });
    };

    const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this project?")) return;
        try {
            await deleteProjectFromFirestore(props.activeCreator.id, id);
            fetchLibrary();
        } catch (e) {
            alert("Delete failed.");
        }
    };

    return (
        <div className="w-full h-full min-h-screen bg-slate-950 text-white flex flex-col relative overflow-hidden font-sans">
            {/* Ambient Background Lights */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.1),transparent_50%)] pointer-events-none z-0" />
            
            {/* Navigation Header */}
            <header className="relative z-10 border-b border-slate-800/80 p-5 bg-slate-900/60 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">✨</span>
                    <h1 className="text-xl font-black tracking-wider uppercase bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400">Story.Menu</h1>
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={() => setIsLibraryOpen(!isLibraryOpen)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-750 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
                    >
                        <FolderOpen size={14} /> {isLibraryOpen ? 'Close Library' : 'My Saved Stories'}
                    </button>
                    {props.onLogOut && (
                        <button onClick={props.onLogOut} className="px-3 py-2 bg-red-950/20 hover:bg-red-900/40 text-red-400 border border-red-900/20 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all">
                            <LogOut size={14} /> Sign Out
                        </button>
                    )}
                </div>
            </header>

            <div className="flex-1 flex min-h-0 relative z-10">
                
                {/* SAVED LIBRARY PANEL */}
                {isLibraryOpen && (
                    <aside className="w-full md:w-80 border-r border-slate-800/80 p-5 bg-slate-900/50 shrink-0 flex flex-col justify-between overflow-y-auto absolute md:relative z-20 md:z-auto">
                        <div className="space-y-6">
                            <h3 className="font-bold text-slate-300 text-sm tracking-tight border-b border-slate-800 pb-2">Recent Stories</h3>
                            {isLoadingLibrary ? (
                                <p className="text-xs text-slate-500 animate-pulse">Loading Library...</p>
                            ) : savedProjects.length === 0 ? (
                                <p className="text-xs text-slate-500 italic">No saved books. Use the wizard to generate your first story!</p>
                            ) : (
                                <div className="space-y-2">
                                    {savedProjects.map((p) => (
                                        <div 
                                            key={p.id} 
                                            onClick={() => props.onLoadProject(p)}
                                            className="p-3 bg-slate-900 hover:bg-slate-850 border border-slate-800/60 rounded-xl cursor-pointer transition-all flex items-center justify-between"
                                        >
                                            <div className="text-left overflow-hidden pr-2">
                                                <p className="text-xs font-bold text-slate-200 truncate">{p.title}</p>
                                                <p className="text-[10px] text-slate-400 truncate mt-0.5">{p.genre} • {p.language}</p>
                                            </div>
                                            <button 
                                                onClick={(e) => handleDeleteProject(p.id, e)}
                                                className="text-slate-500 hover:text-red-400 p-1.5 rounded hover:bg-slate-800"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </aside>
                )}

                {/* MAIN CONTENT SPLIT GRID */}
                <div className="flex-1 flex min-h-0">
                    
                    {/* Left Sidebar Steps Map */}
                    <aside className="w-64 border-r border-slate-800 p-6 flex flex-col shrink-0 bg-slate-950/40 text-left font-sans">
                        <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase block mb-6 font-bold">Story Architect</span>
                        <div className="space-y-2.5">
                            {[
                                { step: 1, label: 'Starting Format' },
                                { step: 2, label: 'Creator Flow' },
                                { step: 3, label: 'Learning Goals' },
                                { step: 4, label: 'Character & Persona' },
                                { step: 5, label: 'Illustration Style' },
                                { step: 6, label: 'Languages' },
                                { step: 7, label: 'Narrator Voice' },
                                { step: 8, label: 'Review & Build' }
                            ].map((rail) => {
                                const isActive = activeStep === rail.step;
                                const isDone = activeStep > rail.step;
                                return (
                                    <button 
                                        key={rail.step}
                                        onClick={() => {
                                            if (rail.step < activeStep || (selectedFormat && rail.step <= 8)) {
                                                setActiveStep(rail.step);
                                            }
                                        }}
                                        disabled={!selectedFormat && rail.step > 1}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all ${
                                            isActive ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 
                                            isDone ? 'text-emerald-400 hover:bg-slate-850' : 'text-slate-500 hover:bg-slate-850/50'
                                        }`}
                                    >
                                        <span className={`w-5 h-5 rounded-full flex items-center justify-center border font-mono text-[9px] ${
                                            isActive ? 'border-indigo-400 text-indigo-400 bg-indigo-500/5' : 
                                            isDone ? 'border-emerald-400 bg-emerald-500/10 text-emerald-400' : 'border-slate-800'
                                        }`}>
                                            {isDone ? '✓' : rail.step}
                                        </span>
                                        {rail.label}
                                    </button>
                                );
                            })}
                        </div>
                    </aside>

                    {/* Center Guided Wizard Form */}
                    <main className="flex-1 p-8 overflow-y-auto flex flex-col justify-between">
                        <div className="max-w-2xl mx-auto w-full space-y-6">
                            
                            {/* Step 1: Choose Format */}
                            {activeStep === 1 && (
                                <SetupStep1Format
                                    isLoadingWizardData={isLoadingWizardData}
                                    formats={formats}
                                    selectedFormat={selectedFormat}
                                    handleSelectFormat={handleSelectFormat}
                                />
                            )}

                            {/* Step 2: Creator Flow & Guided AI Assistance */}
                            {activeStep === 2 && (
                                <div className="space-y-5 text-left animate-fadeIn">
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

                                        {/* AI Suggestions Capability */}
                                        <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                                            <div className="flex justify-between items-center">
                                                <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-200">
                                                    <input 
                                                        type="checkbox"
                                                        checked={aiSuggestionsEnabled}
                                                        onChange={(e) => setAiSuggestionsEnabled(e.target.checked)}
                                                    />
                                                    💡 Enable Guided AI Story Assistant
                                                </label>
                                                <span className="text-[9px] bg-indigo-600/30 text-indigo-400 px-2 py-0.5 rounded font-extrabold font-mono">SETTINGS CONTROL</span>
                                            </div>
                                            
                                            {aiSuggestionsEnabled && activeNudge && (
                                                <p className="text-xs text-indigo-300/90 italic leading-relaxed pl-5 border-l-2 border-indigo-500">
                                                    {activeNudge}
                                                </p>
                                            )}
                                        </div>

                                        {/* Metadata Selectors */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-300">Age / Grade Level</label>
                                                <select
                                                    value={ageGrade}
                                                    onChange={(e) => setAgeGrade(e.target.value)}
                                                    className="w-full rounded-xl bg-slate-950 border border-slate-800 text-slate-100 p-3 text-xs focus:outline-none"
                                                >
                                                    <option value="Grade K-2">Grade K-2 (Early Elementary)</option>
                                                    <option value="Grade 3-5">Grade 3-5 (Mid Elementary)</option>
                                                    <option value="Grade 6-8">Grade 6-8 (Middle School)</option>
                                                    <option value="Teens">Teens (High School)</option>
                                                    <option value="General">General / All Audiences</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-300">Reading Level Adaptation</label>
                                                <select
                                                    value={readingLevel}
                                                    onChange={(e) => setReadingLevel(e.target.value)}
                                                    className="w-full rounded-xl bg-slate-950 border border-slate-800 text-slate-100 p-3 text-xs focus:outline-none"
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
                                <div className="space-y-5 text-left animate-fadeIn">
                                    <div>
                                        <h3 className="text-xl font-bold tracking-tight text-white">Set learning and story goals</h3>
                                        <p className="text-sm text-slate-400">Define what the reader should learn or experience from this project</p>
                                    </div>

                                    <div className="space-y-4">
                                        {/* Primary Goal Selector */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-300">Primary Goal (Required)</label>
                                            <select
                                                value={selectedPrimaryGoal?.id || ''}
                                                onChange={(e) => {
                                                    const goal = goals.find(g => g.id === e.target.value);
                                                    setSelectedPrimaryGoal(goal || null);
                                                    if (goal && goal.category === 'Science') {
                                                        setWizardGenre('Science & Nature Study');
                                                    }
                                                }}
                                                className="w-full rounded-xl bg-slate-950 border border-slate-800 text-slate-100 p-3.5 text-xs focus:outline-none"
                                            >
                                                <option value="">-- Choose a required primary goal --</option>
                                                <optgroup label="Reading Fluency & Comprehension">
                                                    {goals.filter(g => g.visibility_state === 'Active' && g.category === 'Reading').map(g => (
                                                        <option key={g.id} value={g.id}>{g.title}</option>
                                                    ))}
                                                </optgroup>
                                                <optgroup label="Science & STEM Objectives">
                                                    {goals.filter(g => g.visibility_state === 'Active' && g.category === 'Science').map(g => (
                                                        <option key={g.id} value={g.id}>{g.title}</option>
                                                    ))}
                                                </optgroup>
                                                <optgroup label="General Creative Writing">
                                                    {goals.filter(g => g.visibility_state === 'Active' && g.category !== 'Reading' && g.category !== 'Science').map(g => (
                                                        <option key={g.id} value={g.id}>{g.title}</option>
                                                    ))}
                                                </optgroup>
                                            </select>
                                        </div>

                                        {/* Expanded Goal Notes field */}
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-300">Custom Goal Notes & Syllabus Keywords</label>
                                            <textarea 
                                                rows={3}
                                                value={freeformGoalNote}
                                                onChange={(e) => setFreeformGoalNote(e.target.value)}
                                                placeholder="e.g. Focus on vocabulary words: photosynthesis, carbon dioxide, chlorophyll. Introduce plant cell biology concepts."
                                                className="w-full rounded-xl bg-slate-950 border border-slate-800 text-slate-100 p-3.5 text-sm resize-none focus:outline-none"
                                            />
                                        </div>

                                        {/* Genre & Tone dropdowns */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-300">Syllabus Genre</label>
                                                <select
                                                    value={wizardGenre}
                                                    onChange={(e) => setWizardGenre(e.target.value)}
                                                    className="w-full rounded-xl bg-slate-950 border border-slate-800 text-slate-100 p-3 text-xs focus:outline-none"
                                                >
                                                    {['Science & Nature Study', 'Everyday Phonics & Letters', 'Bedtime Adventure', 'Historical Explainer', 'Multilingual Tale', 'Custom Story'].map(g => (
                                                        <option key={g} value={g}>{g}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-300">Story Tone</label>
                                                <select
                                                    value={wizardTone}
                                                    onChange={(e) => setWizardTone(e.target.value)}
                                                    className="w-full rounded-xl bg-slate-950 border border-slate-800 text-slate-100 p-3 text-xs focus:outline-none"
                                                >
                                                    {['exciting', 'cozy', 'funny', 'adventurous', 'inspiring', 'calm', 'magical', 'scientific', 'mysterious', 'gentle bedtime', 'classroom-friendly'].map(t => (
                                                        <option key={t} value={t}>{t}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Character & Persona Likeness Upload */}
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
                                            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer"
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
                                                                        fileName: 'likeness.png',
                                                                        mimeType: 'image/png',
                                                                        previewUrl: p.visualSummary || '',
                                                                        uploadStatus: 'Completed',
                                                                        cropStatus: 'Cropped',
                                                                        moderationStatus: 'Approved',
                                                                        consentVerified: true,
                                                                        approvedForGeneration: true
                                                                    });
                                                                } else {
                                                                    setUploadedRefImage(null);
                                                                }
                                                                setShowPersonaCreator(true);
                                                            }}
                                                            className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1"
                                                        >
                                                            <Edit2 size={10} /> Edit
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Step 5: Illustration Style presets */}
                            {activeStep === 5 && (
                                <div className="space-y-6 text-left animate-fadeIn">
                                    <div>
                                        <h3 className="text-xl font-bold tracking-tight text-white">Pick illustration style</h3>
                                        <p className="text-sm text-slate-400">Select the visual rendering preset for your storybook pages</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {stylePresets.map((preset) => {
                                            const isSelected = stylePreset === preset.name;
                                            return (
                                                <button
                                                    key={preset.name}
                                                    onClick={() => setStylePreset(preset.name)}
                                                    className={`p-5 rounded-2xl border text-left flex gap-4 transition-all ${
                                                        isSelected ? 'bg-indigo-650/10 border-indigo-500 shadow-lg' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                                                    }`}
                                                >
                                                    <span className="text-3xl shrink-0">{preset.preview}</span>
                                                    <div>
                                                        <h4 className="font-bold text-slate-200 text-sm">{preset.name}</h4>
                                                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{preset.desc}</p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Step 6: Languages & bilingual setup */}
                            {activeStep === 6 && (
                                <div className="space-y-6 text-left animate-fadeIn">
                                    <div>
                                        <h3 className="text-xl font-bold tracking-tight text-white">Choose languages & translation</h3>
                                        <p className="text-sm text-slate-400">Configure single language or dual-language bilingual outputs</p>
                                    </div>

                                    <div className="space-y-5 p-5 bg-slate-900 border border-slate-800 rounded-2xl">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h4 className="text-sm font-bold text-slate-200">Bilingual Dual-Panel Mode</h4>
                                                <p className="text-xs text-slate-400 mt-0.5">Translate page captions dynamically into a target language</p>
                                            </div>
                                            <input 
                                                type="checkbox" 
                                                checked={bilingualMode}
                                                onChange={(e) => {
                                                    setBilingualMode(e.target.checked);
                                                    setReadingMode(e.target.checked ? 'side-by-side' : 'single');
                                                }}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 text-xs font-medium">
                                            <div>
                                                <label className="block text-slate-400 mb-1.5 uppercase tracking-wider text-[10px]">Source Language</label>
                                                <select 
                                                    value={sourceLanguage} 
                                                    onChange={e => setSourceLanguage(e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-white"
                                                >
                                                    {wizardLanguages.map(l => (
                                                        <option key={l.code} value={l.code}>{l.displayName}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            {bilingualMode && (
                                                <div>
                                                    <label className="block text-slate-400 mb-1.5 uppercase tracking-wider text-[10px]">Target Language</label>
                                                    <select 
                                                        value={targetLanguage} 
                                                        onChange={e => setTargetLanguage(e.target.value)}
                                                        className="w-full bg-slate-950 border border-slate-800 p-2.5 rounded text-white"
                                                    >
                                                        {wizardLanguages.map(l => (
                                                            <option key={l.code} value={l.code}>{l.displayName}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                        </div>

                                        {bilingualMode && (
                                            <div className="space-y-3 pt-2 border-t border-slate-850">
                                                <div className="flex justify-between items-center text-xs">
                                                    <label className="text-slate-300">Protected Glossary Terms (Recommended)</label>
                                                    <input type="checkbox" checked={lockedGlossary} onChange={e => setLockedGlossary(e.target.checked)} />
                                                </div>
                                                <div className="flex justify-between items-center text-xs">
                                                    <label className="text-slate-300">Preserve Character Names</label>
                                                    <input type="checkbox" checked={preserveCharacterNames} onChange={e => setPreserveCharacterNames(e.target.checked)} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Step 7: Choose Narrator & Soundtrack */}
                            {activeStep === 7 && (
                                <div className="space-y-6 text-left animate-fadeIn">
                                    <div>
                                        <h3 className="text-xl font-bold tracking-tight text-white">Choose narrator & soundtrack</h3>
                                        <p className="text-sm text-slate-400">Configure read-aloud voice models and ambient background music</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-350">Narrator Voice Model</label>
                                                <select 
                                                    value={voiceStyle} 
                                                    onChange={e => setVoiceStyle(e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl text-xs text-white"
                                                >
                                                    <option value="Zephyr">Zephyr (Warm & Clear - Recommended for Kids)</option>
                                                    <option value="Nova">Nova (Energetic & Dynamic)</option>
                                                    <option value="Orion">Orion (Expressive & Calm Storyteller)</option>
                                                    <option value="Gentle Bedtime">Gentle Bedtime (Soft & Whispering)</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-slate-355">Soundtrack Ambient Mood</label>
                                                <select 
                                                    value={soundtrackTheme} 
                                                    onChange={e => setSoundtrackTheme(e.target.value)}
                                                    className="w-full bg-slate-950 border border-slate-850 p-3 rounded-xl text-xs text-white"
                                                >
                                                    <option value="Whimsical Ambient">Whimsical Ambient (Soft synths & chimes)</option>
                                                    <option value="Slice of Life">Slice of Life (Acoustic guitar & piano)</option>
                                                    <option value="Mystery & Adventure">Mystery & Adventure (Cinematic strings)</option>
                                                    <option value="None">Muted / No Music</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 8: Review & Launch */}
                            {activeStep === 8 && (
                                <SetupStep8Review
                                    projectTitle={projectTitle}
                                    projectDesc={projectDesc}
                                    audienceType={audienceType}
                                    ageGrade={ageGrade}
                                    readingLevel={readingLevel}
                                    storyGoal={storyGoal}
                                    wizardGenre={wizardGenre}
                                    wizardTone={wizardTone}
                                    selectedPersona={selectedPersona}
                                    personaRole={personaRole}
                                    stylePreset={stylePreset}
                                />
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
                                    className="px-8 py-3.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 text-white shadow-xl shadow-purple-500/20 flex items-center gap-2 cursor-pointer ml-auto"
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
                            
                            <div className="rounded-2xl border border-slate-800 bg-slate-955 overflow-hidden shadow-lg flex flex-col text-left">
                                <div className="p-4 space-y-3">
                                    <div>
                                        <span className="text-[9px] font-mono text-purple-400 font-bold uppercase tracking-wider">{audienceType} • {ageGrade}</span>
                                        <h4 className="font-extrabold text-sm text-slate-200 tracking-tight mt-0.5 line-clamp-1">{projectTitle || 'Untitled Story'}</h4>
                                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{projectDesc || 'A brand new story outline, ready to generate illustrated chapters.'}</p>
                                    </div>
                                    
                                    <div className="border-t border-slate-900 pt-3 space-y-1.5 text-[9px] font-medium text-slate-400">
                                        <p>📂 Format: {wizardGenre} ({wizardTone})</p>
                                        <p>👤 Cast: {selectedPersona ? `${selectedPersona.displayName} (${personaRole})` : 'No custom character cast'}</p>
                                        <p>🌐 Language: {bilingualMode ? `${sourceLanguage.toUpperCase()} ↔ ${targetLanguage.toUpperCase()} (${readingMode})` : `${sourceLanguage.toUpperCase()}`}</p>
                                        <p>🔊 {narrationEnabled ? `Narrated by ${voiceStyle} with ${soundtrackTheme} music` : 'Muted'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-[10px] text-slate-500 leading-relaxed text-left space-y-1">
                            <span className="font-bold text-slate-300 block">What happens next:</span>
                            <p>You will enter the authenticated workspace editor to generate individual pages and dialogue blocks.</p>
                        </div>
                    </aside>

                </div>

            </div>

            {/* Persona Creator Overlay Dialog */}
            {showPersonaCreator && editingPersona && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fadeIn">
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
                                            <input 
                                                type="file" 
                                                id="likeness-photo-upload"
                                                accept="image/*"
                                                className="hidden" 
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;
                                                    setUploadingRefImage(true);
                                                    try {
                                                        const base64 = await fileToBase64(file);
                                                        setUploadedRefImage({
                                                            id: 'img-' + Math.random().toString(36).substr(2, 9),
                                                            fileName: file.name,
                                                            mimeType: file.type,
                                                            previewUrl: base64,
                                                            uploadStatus: 'Completed',
                                                            cropStatus: 'Cropped',
                                                            moderationStatus: 'Approved',
                                                            consentVerified: true,
                                                            approvedForGeneration: true
                                                        });
                                                    } catch (err) {
                                                        alert("Could not load image.");
                                                    } finally {
                                                        setUploadingRefImage(false);
                                                    }
                                                }}
                                            />
                                            <label
                                                htmlFor="likeness-photo-upload"
                                                className="px-4 py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer block text-center"
                                            >
                                                {uploadingRefImage ? 'Reading face likeness...' : 'Choose Reference Image'}
                                            </label>
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
                                        moderationStatus: uploadedRefImage ? 'Approved' : 'Unmoderated',
                                        visualSummary: uploadedRefImage?.previewUrl || editingPersona.visualSummary
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
        </div>
    );
};
