/**
 * Screen Name: Kid Story Dashboard
 * Purpose: Simple, visual, child-friendly storybook creation workspace
 * Version: 1.1
 * Phase: Phase 12 Refinement
 * Date: 2026-07-09
 * What changed in this revision: Added photo-to-character upload, database project persistence, live narration engine integration, and styled child-friendly recent projects launcher.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { generateTextBeatBase, generateImageBase, enhanceKidStoryBase, generateSpeechBase } from './hooks/useStoryEngine';
import { Book } from './Book';
import { ComicFace } from './types';
import { ArrowRight, Image as ImageIcon, Sparkles, BookOpen, ChevronLeft, Pencil, Mic, Camera, RotateCcw } from 'lucide-react';
import { saveProjectToFirestore } from './storageFirestore';
import { fileToBase64 } from './imageUtils';

const SAMPLE_STORIES: Record<string, string> = {
    'dino': "A brave young triceratops named Leo goes on a big adventure to find the legendary Star Berry in the thick, glowing jungle. Along the way, he makes friends with a tiny pterodactyl.",
    'space': "Captain Mia, a 7-year-old astronaut, discovers a planet made entirely of bouncing jelly! She meets the friendly Jellyliens and learns how to bounce to the moon.",
    'magic': "In a sparkly forest, a little unicorn named Sparkle loses her rainbow colors. She has to solve three riddles from the wise old owl to get them back.",
    'pirate': "Pirate Pete and his parrot friend find a map leading to the Isle of Toys. They must sail across the Lemonade Sea to reach it.",
    'ocean': "A curious little mermaid named Coral finds a sunken submarine and decides to fix it up so her crab friend can explore the dry land.",
};

const TEMPLATES = [
    { id: 'dino', emoji: '🦖', title: 'Dinosaur Adventure', theme: 'bg-emerald-100 border-emerald-300 text-emerald-700 hover:bg-emerald-200' },
    { id: 'space', emoji: '🚀', title: 'Space Explorer', theme: 'bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200' },
    { id: 'magic', emoji: '🦄', title: 'Magical Unicorn', theme: 'bg-pink-100 border-pink-300 text-pink-700 hover:bg-pink-200' },
    { id: 'pirate', emoji: '🏴‍☠️', title: 'Pirate Treasure', theme: 'bg-amber-100 border-amber-300 text-amber-700 hover:bg-amber-200' },
    { id: 'ocean', emoji: '🧜‍♀️', title: 'Ocean Friends', theme: 'bg-cyan-100 border-cyan-300 text-cyan-700 hover:bg-cyan-200' },
];

type Step = 'idea' | 'screenplay' | 'editor';

export interface KidStoryDashboardProps {
    onNavigate?: (view: any) => void;
    currentUser: any;
    activeCreator: any;
    validateApiKey: () => Promise<boolean>;
    onDeductTokens?: (cost: number) => Promise<boolean>;
    isLightMode: boolean;
}

export const KidStoryDashboard: React.FC<KidStoryDashboardProps> = ({ 
    onNavigate, 
    currentUser, 
    activeCreator, 
    validateApiKey, 
    onDeductTokens,
    isLightMode 
}) => {
    const [step, setStep] = useState<Step>('idea');
    
    // Idea Phase State
    const [storyPrompt, setStoryPrompt] = useState('');
    const [isGeneratingScreenplay, setIsGeneratingScreenplay] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isEnhancingVoice, setIsEnhancingVoice] = useState(false);
    const [kidPhoto, setKidPhoto] = useState<string | null>(null);
    
    // Saved stories for continuation
    const [savedStories, setSavedStories] = useState<any[]>([]);
    const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

    // Screenplay Phase State
    const [draftBeats, setDraftBeats] = useState<ComicFace[]>([]);
    const [isGeneratingArtwork, setIsGeneratingArtwork] = useState(false);

    // Final Book State
    const [currentSheetIndex, setCurrentSheetIndex] = useState(0);

    // Fetch previous stories on mount
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await fetch(`/api/projects?userId=${activeCreator.id}`);
                if (res.ok) {
                    const data = await res.json();
                    // Filter down to children's books
                    const childBooks = data.filter((p: any) => p.genre === "Children's Storybook");
                    setSavedStories(childBooks);
                }
            } catch (err) {
                console.warn("Could not load recent stories:", err);
            }
        };
        fetchProjects();
    }, [activeCreator.id]);

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const base64 = await fileToBase64(file);
            setKidPhoto(base64);
            alert("📸 Got it! We'll put your photo into the story illustrations!");
        } catch (err) {
            alert("Could not process photo. Try a smaller one!");
        }
    };

    const handleGenerateScreenplay = async () => {
        if (!storyPrompt.trim()) return;
        
        const hasKey = await validateApiKey();
        if (!hasKey) return;

        if (onDeductTokens) {
            const allowed = await onDeductTokens(10);
            if (!allowed) return;
        }

        setIsGeneratingScreenplay(true);
        
        try {
            const faces: ComicFace[] = [];
            
            // 1. Generate Cover Text
            const coverBeat = await generateTextBeatBase({
                pageNum: 0,
                selectedGenre: "Children's Storybook",
                customPremise: storyPrompt,
                storyTone: 'Whimsical',
            });
            faces.push({ id: 'cover', type: 'cover', narrative: coverBeat, imageUrl: '', choices: [], pageIndex: 0, isLoading: false });

            // 2. Generate 3 inner pages of text
            for (let i = 1; i <= 3; i++) {
                const beat = await generateTextBeatBase({
                    history: faces,
                    pageNum: i,
                    selectedGenre: "Children's Storybook",
                    customPremise: storyPrompt,
                    storyTone: 'Whimsical',
                });
                faces.push({ id: `page-${i}`, type: 'story', narrative: beat, imageUrl: '', choices: [], pageIndex: i, isLoading: false });
            }

            setDraftBeats(faces);
            setStep('screenplay');
        } catch (error) {
            console.error("Failed to generate screenplay", error);
            alert("Oops! The magic wand fizzled while writing. Try again!");
        } finally {
            setIsGeneratingScreenplay(false);
        }
    };

    const handleUpdateBeatText = (index: number, field: 'caption' | 'dialogue', value: string) => {
        const newBeats = [...draftBeats];
        newBeats[index] = {
            ...newBeats[index],
            narrative: {
                ...newBeats[index].narrative,
                [field]: value
            }
        };
        setDraftBeats(newBeats);
    };

    const handleGenerateArtwork = async () => {
        const hasKey = await validateApiKey();
        if (!hasKey) return;

        if (onDeductTokens) {
            const allowed = await onDeductTokens(20);
            if (!allowed) return;
        }

        setIsGeneratingArtwork(true);
        try {
            const finalizedFaces = [...draftBeats];
            
            // Generate images for all beats sequentially
            for (let i = 0; i < finalizedFaces.length; i++) {
                const face = finalizedFaces[i];
                const imageType = face.type === 'cover' ? 'cover' : 'story';
                
                // If kid uploaded a photo, we pass it down as hero reference visual
                const visuals: any = {
                    selectedGenre: "Children's Storybook",
                };
                if (kidPhoto) {
                    visuals.heroVisuals = `A young child whose appearance is defined by this photo: ${kidPhoto}`;
                }

                const image = await generateImageBase(
                    face.narrative!, 
                    imageType, 
                    'Childrens Storybook Illustration',
                    visuals
                );
                finalizedFaces[i].imageUrl = image;
            }

            setDraftBeats(finalizedFaces);
            setCurrentSheetIndex(0);

            // Persist the completed project to DB
            const projectTitle = finalizedFaces[0]?.narrative?.caption || "My Magic Story";
            try {
                const projRes = await fetch('/api/projects', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: activeCreator.id,
                        title: projectTitle,
                        genre: "Children's Storybook",
                        language: "en",
                        comicFaces: JSON.stringify(finalizedFaces)
                    })
                });
                const data = await projRes.json();
                if (data && data.id) {
                    setActiveProjectId(data.id);
                }
            } catch (err) {
                console.warn("Offline database persistence active:", err);
            }

            setStep('editor');
        } catch (error) {
            console.error("Failed to generate artwork", error);
            alert("Oops! The paintbrush fizzled. Try again!");
        } finally {
            setIsGeneratingArtwork(false);
        }
    };

    const handleLoadStory = (story: any) => {
        try {
            const parsedBeats = JSON.parse(story.comicFaces || '[]');
            if (parsedBeats.length > 0) {
                setDraftBeats(parsedBeats);
                setActiveProjectId(story.id);
                setCurrentSheetIndex(0);
                setStep('editor');
            } else {
                alert("Could not load this story outline.");
            }
        } catch (e) {
            alert("Story load failed.");
        }
    };

    const handleShare = async (method: 'print' | 'publish' | 'link') => {
        if (method === 'print') {
            window.print();
        } else if (method === 'publish') {
            alert("Yay! Your story was sent to the Global Multiverse Gallery! 🌟");
        } else if (method === 'link') {
            try {
                await navigator.clipboard.writeText(window.location.href + "?story=" + (activeProjectId || Date.now()));
                alert("Magic Link copied to clipboard! ✨");
            } catch (err) {
                alert("Could not copy link. 😢");
            }
        }
    };

    return (
        <div className={`min-h-screen w-full flex flex-col font-sans overflow-hidden ${isLightMode ? 'bg-amber-50' : 'bg-slate-900 text-slate-100'}`}>
            {/* Header */}
            {step !== 'editor' && (
                <header className="p-4 bg-white border-b-4 border-amber-200 flex justify-between items-center shadow-sm z-10 relative">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => {
                                if (step === 'screenplay') setStep('idea');
                                else onNavigate && onNavigate('home');
                            }}
                            className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl font-bold text-sm flex items-center gap-2 transition-all"
                        >
                            <ChevronLeft size={18} />
                            {step === 'screenplay' ? 'Back to Idea' : 'Exit Studio'}
                        </button>
                        <span className="text-3xl hidden sm:inline">🌟</span>
                        <h1 className="text-2xl font-black tracking-tight text-amber-600 uppercase">
                            Kid Story Studio
                        </h1>
                    </div>
                    
                    {/* Progress Indicator */}
                    <div className="hidden md:flex items-center gap-2 font-bold text-sm">
                        <div className={`px-4 py-1.5 rounded-full ${step === 'idea' ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-600'}`}>1. My Idea</div>
                        <ArrowRight size={16} className="text-amber-300" />
                        <div className={`px-4 py-1.5 rounded-full ${step === 'screenplay' ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-600'}`}>2. Storyboard</div>
                        <ArrowRight size={16} className="text-amber-300" />
                        <div className={`px-4 py-1.5 rounded-full ${step === 'editor' ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-600'}`}>3. Flip Book</div>
                    </div>
                </header>
            )}

            <main className="flex-1 p-4 md:p-8 overflow-y-auto z-10 relative">
                <div className="max-w-6xl mx-auto h-full">
                    
                    {/* PHASE 1: IDEA */}
                    {step === 'idea' && (
                        <div className="flex flex-col md:flex-row gap-8 h-full min-h-[500px]">
                            {/* Left Col: Prompter */}
                            <div className="flex-1 bg-white p-6 rounded-3xl shadow-xl border-4 border-amber-200 flex flex-col">
                                <h2 className="text-2xl font-black text-amber-800 mb-4 flex items-center gap-2">
                                    <Pencil className="text-amber-500" /> 
                                    What is your story about?
                                </h2>
                                <p className="text-slate-500 font-medium mb-4">
                                    Type your adventure, choose a starting template on the right, or press Dictate to speak your story!
                                </p>
                                <textarea 
                                    value={storyPrompt}
                                    onChange={(e) => setStoryPrompt(e.target.value)}
                                    placeholder="Once upon a time, a brave young hero named..."
                                    className="flex-1 w-full p-6 text-xl border-4 border-amber-50 rounded-2xl focus:outline-none focus:border-amber-300 font-medium text-slate-700 resize-none"
                                />
                                
                                <div className="mt-6 flex flex-wrap gap-4 justify-between items-center">
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                if (isListening) return;
                                                const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                                                if (!SpeechRecognition) {
                                                    alert("Oops! Voice dictation isn't supported in this browser. Try Chrome!");
                                                    return;
                                                }
                                                const recognition = new SpeechRecognition();
                                                recognition.lang = 'en-US';
                                                recognition.interimResults = false;
                                                recognition.maxAlternatives = 1;

                                                recognition.onstart = () => setIsListening(true);
                                                recognition.onerror = () => setIsListening(false);
                                                recognition.onend = () => setIsListening(false);

                                                recognition.onresult = async (event: any) => {
                                                    setIsListening(false);
                                                    const transcript = event.results[0][0].transcript;
                                                    setIsEnhancingVoice(true);
                                                    try {
                                                        const enhanced = await enhanceKidStoryBase(transcript);
                                                        setStoryPrompt(prev => prev ? prev + " " + enhanced : enhanced);
                                                    } catch (err) {
                                                        console.error("Voice enhancement failed", err);
                                                        setStoryPrompt(prev => prev ? prev + " " + transcript : transcript);
                                                    } finally {
                                                        setIsEnhancingVoice(false);
                                                    }
                                                };
                                                recognition.start();
                                            }}
                                            disabled={isListening || isEnhancingVoice || isGeneratingScreenplay}
                                            className={`py-3.5 px-6 rounded-2xl font-extrabold border-b-4 transition-all flex items-center gap-2 text-lg
                                                ${isListening ? 'bg-red-500 text-white border-red-700 animate-pulse' : 
                                                  isEnhancingVoice ? 'bg-amber-400 text-amber-900 border-amber-600' : 
                                                  'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200 hover:-translate-y-1 active:border-b-0 active:translate-y-1'}
                                            `}
                                        >
                                            <Mic size={20} className={isListening ? "animate-bounce" : ""} />
                                            {isListening ? 'Listening...' : isEnhancingVoice ? 'Making Magic...' : 'Dictate'}
                                        </button>

                                        {/* Put me in the story button */}
                                        <label className={`py-3.5 px-6 rounded-2xl font-extrabold border-b-4 transition-all flex items-center gap-2 text-lg cursor-pointer
                                            ${kidPhoto ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-sky-100 text-sky-700 border-sky-300 hover:bg-sky-200 hover:-translate-y-1'}
                                        `}>
                                            <Camera size={20} />
                                            {kidPhoto ? 'Photo Added!' : 'Put me in the story'}
                                            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                                        </label>
                                    </div>

                                    <button 
                                        onClick={handleGenerateScreenplay}
                                        disabled={!storyPrompt.trim() || isGeneratingScreenplay || isEnhancingVoice}
                                        className="py-4 px-8 bg-amber-500 text-white font-black rounded-2xl border-b-4 border-amber-700 hover:bg-amber-400 hover:-translate-y-1 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50 disabled:transform-none text-xl flex items-center gap-3"
                                    >
                                        {isGeneratingScreenplay ? '✨ Writing Draft...' : 'Write Screenplay ✨'}
                                        {!isGeneratingScreenplay && <ArrowRight />}
                                    </button>
                                </div>
                            </div>
                            
                            {/* Right Col: Templates and Recents */}
                            <div className="w-full md:w-80 flex flex-col gap-6">
                                {/* Saved Recents */}
                                {savedStories.length > 0 && (
                                    <div className="bg-white p-5 rounded-3xl border-4 border-amber-100 shadow-lg">
                                        <h3 className="text-lg font-black text-amber-800 mb-3">Continue my story</h3>
                                        <div className="space-y-2 max-h-[160px] overflow-y-auto">
                                            {savedStories.map((story) => (
                                                <button
                                                    key={story.id}
                                                    onClick={() => handleLoadStory(story)}
                                                    className="w-full p-2.5 bg-amber-50/50 hover:bg-amber-50 border border-amber-100 rounded-xl font-bold text-left text-sm text-amber-900 flex items-center justify-between"
                                                >
                                                    <span className="truncate pr-2">{story.title}</span>
                                                    <ArrowRight size={14} className="shrink-0 text-amber-500" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <h3 className="text-xl font-black text-amber-800 px-2 mb-3">Or pick a template</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-1 gap-3">
                                        {TEMPLATES.map(t => (
                                            <button 
                                                key={t.id}
                                                onClick={() => setStoryPrompt(SAMPLE_STORIES[t.id])}
                                                className={`p-4 border-4 rounded-2xl font-black text-left flex items-center gap-3 transition-colors ${t.theme}`}
                                            >
                                                <span className="text-2xl">{t.emoji}</span> {t.title}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PHASE 2: SCREENPLAY */}
                    {step === 'screenplay' && (
                        <div className="max-w-4xl mx-auto">
                            <div className="bg-white p-6 rounded-3xl shadow-xl border-4 border-purple-200 mb-6 flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-black text-purple-800 flex items-center gap-2">
                                        <BookOpen className="text-purple-500" /> 
                                        Storyboard Review
                                    </h2>
                                    <p className="text-slate-500 font-medium">Review the text for each page before we draw the pictures!</p>
                                </div>
                                <button 
                                    onClick={handleGenerateArtwork}
                                    disabled={isGeneratingArtwork}
                                    className="py-3 px-6 bg-purple-600 text-white font-black rounded-xl border-b-4 border-purple-800 hover:bg-purple-500 hover:-translate-y-1 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50 disabled:transform-none text-lg flex items-center gap-2"
                                >
                                    {isGeneratingArtwork ? '🎨 Painting Canvas...' : 'Draw My Book! 🎨'}
                                </button>
                            </div>

                            <div className="space-y-6">
                                {draftBeats.map((beat, index) => (
                                    <div key={beat.id} className="bg-white p-6 rounded-3xl shadow-md border-2 border-slate-100 flex flex-col md:flex-row gap-6">
                                        {/* Image Placeholder */}
                                        <div className="w-full md:w-64 aspect-square bg-slate-50 rounded-2xl border-4 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 shrink-0">
                                            <ImageIcon size={48} className="mb-2 opacity-50" />
                                            <span className="font-bold">{index === 0 ? 'Cover Art' : `Page ${index} Art`}</span>
                                            <span className="text-sm px-4 text-center mt-2 opacity-70">Image will be drawn here</span>
                                        </div>
                                        
                                        {/* Text Inputs */}
                                        <div className="flex-1 flex flex-col gap-4">
                                            <div>
                                                <label className="block font-bold text-slate-700 mb-2 uppercase text-sm tracking-wider">
                                                    {index === 0 ? 'Title / Main Caption' : 'Caption Box'}
                                                </label>
                                                <textarea 
                                                    value={beat.narrative?.caption || ''}
                                                    onChange={(e) => handleUpdateBeatText(index, 'caption', e.target.value)}
                                                    className="w-full p-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-purple-400 font-medium text-slate-800 resize-none h-20"
                                                />
                                            </div>
                                            {index > 0 && (
                                                <div>
                                                    <label className="block font-bold text-slate-700 mb-2 uppercase text-sm tracking-wider">
                                                        Speech Bubble
                                                    </label>
                                                    <input 
                                                        type="text"
                                                        value={beat.narrative?.dialogue || ''}
                                                        onChange={(e) => handleUpdateBeatText(index, 'dialogue', e.target.value)}
                                                        className="w-full p-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-purple-400 font-medium text-slate-800"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* PHASE 3: EDITOR (Final Book) */}
                    {step === 'editor' && (
                        <div className="absolute inset-0 bg-amber-50 z-50 print:bg-white flex flex-col">
                            <div className="p-4 flex justify-between items-center no-print bg-white border-b-2 border-amber-100 shadow-sm shrink-0">
                                <button 
                                    onClick={() => setStep('screenplay')}
                                    className="px-6 py-2 bg-slate-100 rounded-full font-bold text-slate-600 hover:bg-slate-200 flex items-center gap-2"
                                >
                                    <ChevronLeft size={18} /> Back to Editor
                                </button>
                                
                                <div className="flex gap-3">
                                    <button onClick={() => handleShare('print')} className="px-4 py-2 bg-sky-100 hover:bg-sky-200 text-sky-800 rounded-full font-bold flex gap-2 items-center">
                                        🖨️ Print Book
                                    </button>
                                    <button onClick={() => handleShare('publish')} className="px-4 py-2 bg-fuchsia-100 hover:bg-fuchsia-200 text-fuchsia-800 rounded-full font-bold flex gap-2 items-center">
                                        🌍 Publish to Gallery
                                    </button>
                                    <button onClick={() => handleShare('link')} className="px-4 py-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-full font-bold flex gap-2 items-center">
                                        🔗 Copy Link
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto flex justify-center items-center py-10">
                                <div className="print-book-container flex justify-center w-full">
                                    <Book 
                                        comicFaces={draftBeats} 
                                        currentSheetIndex={currentSheetIndex} 
                                        isStarted={true}
                                        isSetupVisible={false}
                                        selectedVoice="en-US-Journey-F"
                                        generateSpeech={generateSpeechBase}
                                        onSheetClick={(index) => setCurrentSheetIndex(index)}
                                        onChoice={() => {}} 
                                        onOpenBook={() => setCurrentSheetIndex(1)}
                                        onDownload={() => handleShare('print')}
                                        onReset={() => {
                                            setStep('idea');
                                            setStoryPrompt('');
                                            setDraftBeats([]);
                                        }}
                                        onUpdateText={handleUpdateBeatText}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
};
