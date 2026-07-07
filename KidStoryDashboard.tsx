import React, { useState } from 'react';
import { generateTextBeatBase, generateImageBase, enhanceKidStoryBase } from './hooks/useStoryEngine';
import { Book } from './Book';
import { ComicFace } from './types';
import { ArrowRight, Image as ImageIcon, Sparkles, BookOpen, ChevronLeft, Pencil, Mic } from 'lucide-react';

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

export const KidStoryDashboard: React.FC<{ onNavigate?: (view: any) => void }> = ({ onNavigate }) => {
    const [step, setStep] = useState<Step>('idea');
    
    // Idea Phase State
    const [storyPrompt, setStoryPrompt] = useState('');
    const [isGeneratingScreenplay, setIsGeneratingScreenplay] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isEnhancingVoice, setIsEnhancingVoice] = useState(false);
    
    // Screenplay Phase State
    const [draftBeats, setDraftBeats] = useState<ComicFace[]>([]);
    const [isGeneratingArtwork, setIsGeneratingArtwork] = useState(false);

    // Final Book State
    const [currentSheetIndex, setCurrentSheetIndex] = useState(0);

    const handleGenerateScreenplay = async () => {
        if (!storyPrompt.trim()) return;
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
        setIsGeneratingArtwork(true);
        try {
            const finalizedFaces = [...draftBeats];
            
            // Generate images for all beats sequentially
            for (let i = 0; i < finalizedFaces.length; i++) {
                const face = finalizedFaces[i];
                const imageType = face.type === 'cover' ? 'cover' : 'story';
                const image = await generateImageBase(
                    face.narrative!, 
                    imageType, 
                    'Childrens Storybook Illustration',
                    {}
                );
                finalizedFaces[i].imageUrl = image;
            }

            setDraftBeats(finalizedFaces);
            setCurrentSheetIndex(0);
            setStep('editor');
        } catch (error) {
            console.error("Failed to generate artwork", error);
            alert("Oops! The paintbrush fizzled. Try again!");
        } finally {
            setIsGeneratingArtwork(false);
        }
    };

    const handleShare = async (method: 'print' | 'publish' | 'link') => {
        if (method === 'print') {
            window.print();
        } else if (method === 'publish') {
            alert("Yay! Your story was sent to the Global Multiverse Gallery! 🌟");
        } else if (method === 'link') {
            try {
                await navigator.clipboard.writeText(window.location.href + "?story=" + Date.now());
                alert("Magic Link copied to clipboard! ✨");
            } catch (err) {
                alert("Could not copy link. 😢");
            }
        }
    };

    return (
        <div className="min-h-screen bg-blue-50 text-gray-800 flex flex-col font-sans overflow-hidden">
            {/* Header */}
            {step !== 'editor' && (
                <header className="p-4 bg-white border-b-4 border-blue-200 flex justify-between items-center shadow-sm z-10 relative">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => {
                                if (step === 'screenplay') setStep('idea');
                                else onNavigate && onNavigate('home');
                            }}
                            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 font-bold text-sm flex items-center gap-2"
                        >
                            <ChevronLeft size={18} />
                            {step === 'screenplay' ? 'Back to Idea' : 'Menu'}
                        </button>
                        <span className="text-3xl hidden sm:inline">🌟</span>
                        <h1 className="text-2xl font-black tracking-tight text-blue-600 uppercase">
                            Kid Story Studio
                        </h1>
                    </div>
                    
                    {/* Progress Indicator */}
                    <div className="hidden md:flex items-center gap-2 font-bold text-sm">
                        <div className={`px-3 py-1 rounded-full ${step === 'idea' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-400'}`}>1. Idea</div>
                        <ArrowRight size={16} className="text-blue-300" />
                        <div className={`px-3 py-1 rounded-full ${step === 'screenplay' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-400'}`}>2. Screenplay</div>
                        <ArrowRight size={16} className="text-blue-300" />
                        <div className={`px-3 py-1 rounded-full ${step === 'editor' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-400'}`}>3. Book</div>
                    </div>
                </header>
            )}

            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                <div className="max-w-6xl mx-auto h-full">
                    
                    {/* PHASE 1: IDEA */}
                    {step === 'idea' && (
                        <div className="flex flex-col md:flex-row gap-8 h-full min-h-[500px]">
                            {/* Left Col: Prompter */}
                            <div className="flex-1 bg-white p-6 rounded-3xl shadow-xl border-4 border-blue-200 flex flex-col">
                                <h2 className="text-2xl font-extrabold text-blue-800 mb-4 flex items-center gap-2">
                                    <Pencil className="text-blue-500" /> 
                                    What's your story?
                                </h2>
                                <p className="text-gray-500 font-medium mb-4">
                                    Type your own adventure, paste a story you wrote, or start with a template on the right!
                                </p>
                                <textarea 
                                    value={storyPrompt}
                                    onChange={(e) => setStoryPrompt(e.target.value)}
                                    placeholder="Once upon a time, a brave young hero named..."
                                    className="flex-1 w-full p-6 text-xl border-4 border-blue-50 rounded-2xl focus:outline-none focus:border-blue-300 font-medium text-gray-700 resize-none"
                                />
                                <div className="mt-6 flex justify-between items-center">
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
                                                    alert("Could not process voice magically. But we pasted your words anyway!");
                                                    setStoryPrompt(prev => prev ? prev + " " + transcript : transcript);
                                                } finally {
                                                    setIsEnhancingVoice(false);
                                                }
                                            };
                                            recognition.start();
                                        }}
                                        disabled={isListening || isEnhancingVoice || isGeneratingScreenplay}
                                        className={`py-4 px-6 rounded-2xl font-bold border-b-4 transition-all flex items-center gap-2 text-lg
                                            ${isListening ? 'bg-red-500 text-white border-red-700 animate-pulse' : 
                                              isEnhancingVoice ? 'bg-amber-400 text-amber-900 border-amber-600' : 
                                              'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200 hover:-translate-y-1 active:border-b-0 active:translate-y-1'}
                                        `}
                                    >
                                        <Mic size={24} className={isListening ? "animate-bounce" : ""} />
                                        {isListening ? 'Listening...' : isEnhancingVoice ? 'Enhancing Magic...' : 'Dictate'}
                                    </button>

                                    <button 
                                        onClick={handleGenerateScreenplay}
                                        disabled={!storyPrompt.trim() || isGeneratingScreenplay || isEnhancingVoice}
                                        className="py-4 px-8 bg-blue-600 text-white font-black rounded-2xl border-b-4 border-blue-800 hover:bg-blue-500 hover:-translate-y-1 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50 disabled:transform-none text-xl flex items-center gap-3"
                                    >
                                        {isGeneratingScreenplay ? '✨ Writing Draft...' : 'Generate Screenplay ✨'}
                                        {!isGeneratingScreenplay && <ArrowRight />}
                                    </button>
                                </div>
                            </div>
                            
                            {/* Right Col: Templates */}
                            <div className="w-full md:w-80 flex flex-col gap-4">
                                <h3 className="text-xl font-bold text-gray-600 px-2">Quick Starts</h3>
                                <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
                                    <button 
                                        onClick={() => setStoryPrompt('')}
                                        className="p-4 bg-white border-4 border-gray-200 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 text-left flex items-center gap-3"
                                    >
                                        <span className="text-2xl">✏️</span> Clear Canvas
                                    </button>
                                    {TEMPLATES.map(t => (
                                        <button 
                                            key={t.id}
                                            onClick={() => setStoryPrompt(SAMPLE_STORIES[t.id])}
                                            className={`p-4 border-4 rounded-2xl font-bold text-left flex items-center gap-3 transition-colors ${t.theme}`}
                                        >
                                            <span className="text-2xl">{t.emoji}</span> {t.title}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PHASE 2: SCREENPLAY */}
                    {step === 'screenplay' && (
                        <div className="max-w-4xl mx-auto">
                            <div className="bg-white p-6 rounded-3xl shadow-xl border-4 border-purple-200 mb-6 flex justify-between items-center">
                                <div>
                                    <h2 className="text-2xl font-extrabold text-purple-800 flex items-center gap-2">
                                        <BookOpen className="text-purple-500" /> 
                                        Storyboard Review
                                    </h2>
                                    <p className="text-gray-500 font-medium">Review the text for each page before we draw the pictures!</p>
                                </div>
                                <button 
                                    onClick={handleGenerateArtwork}
                                    disabled={isGeneratingArtwork}
                                    className="py-3 px-6 bg-purple-600 text-white font-black rounded-xl border-b-4 border-purple-800 hover:bg-purple-500 hover:-translate-y-1 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50 disabled:transform-none text-lg flex items-center gap-2"
                                >
                                    {isGeneratingArtwork ? '🎨 Painting Canvas...' : 'Generate Artwork 🎨'}
                                </button>
                            </div>

                            <div className="space-y-6">
                                {draftBeats.map((beat, index) => (
                                    <div key={beat.id} className="bg-white p-6 rounded-3xl shadow-md border-2 border-gray-100 flex flex-col md:flex-row gap-6">
                                        {/* Image Placeholder */}
                                        <div className="w-full md:w-64 aspect-square bg-gray-50 rounded-2xl border-4 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 shrink-0">
                                            <ImageIcon size={48} className="mb-2 opacity-50" />
                                            <span className="font-bold">{index === 0 ? 'Cover Art' : `Page ${index} Art`}</span>
                                            <span className="text-sm px-4 text-center mt-2 opacity-70">Image will be generated here</span>
                                        </div>
                                        
                                        {/* Text Inputs */}
                                        <div className="flex-1 flex flex-col gap-4">
                                            <div>
                                                <label className="block font-bold text-gray-700 mb-2 uppercase text-sm tracking-wider">
                                                    {index === 0 ? 'Title / Main Caption' : 'Caption Box'}
                                                </label>
                                                <textarea 
                                                    value={beat.narrative?.caption || ''}
                                                    onChange={(e) => handleUpdateBeatText(index, 'caption', e.target.value)}
                                                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 font-medium text-gray-800 resize-none h-20"
                                                />
                                            </div>
                                            {index > 0 && (
                                                <div>
                                                    <label className="block font-bold text-gray-700 mb-2 uppercase text-sm tracking-wider">
                                                        Speech Bubble
                                                    </label>
                                                    <input 
                                                        type="text"
                                                        value={beat.narrative?.dialogue || ''}
                                                        onChange={(e) => handleUpdateBeatText(index, 'dialogue', e.target.value)}
                                                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-400 font-medium text-gray-800"
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
                        <div className="absolute inset-0 bg-blue-50 z-50 print:bg-white flex flex-col">
                            <div className="p-4 flex justify-between items-center no-print bg-white border-b-2 border-blue-100 shadow-sm shrink-0">
                                <button 
                                    onClick={() => setStep('screenplay')}
                                    className="px-6 py-2 bg-gray-100 rounded-full font-bold text-gray-600 hover:bg-gray-200 flex items-center gap-2"
                                >
                                    <ChevronLeft size={18} /> Back to Editor
                                </button>
                                
                                <div className="flex gap-3">
                                    <button onClick={() => handleShare('print')} className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-full font-bold flex gap-2 items-center">
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
                                        generateSpeech={async () => ""}
                                        onSheetClick={(index) => setCurrentSheetIndex(index)}
                                        onChoice={() => {}} 
                                        onOpenBook={() => setCurrentSheetIndex(1)}
                                        onDownload={() => handleShare('print')}
                                        onReset={() => {}}
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
