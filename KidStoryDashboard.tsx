import React, { useState } from 'react';
import { generateTextBeatBase, generateImageBase } from './hooks/useStoryEngine';
import { Book } from './Book';
import { ComicFace } from './types';

const TEMPLATES = [
    { id: 'dino', emoji: '🦖', title: 'Dinosaur Adventure', theme: 'bg-emerald-100 border-emerald-300 text-emerald-700' },
    { id: 'space', emoji: '🚀', title: 'Space Explorer', theme: 'bg-purple-100 border-purple-300 text-purple-700' },
    { id: 'magic', emoji: '🦄', title: 'Magical Unicorn', theme: 'bg-pink-100 border-pink-300 text-pink-700' },
    { id: 'pirate', emoji: '🏴‍☠️', title: 'Pirate Treasure', theme: 'bg-amber-100 border-amber-300 text-amber-700' },
    { id: 'ocean', emoji: '🧜‍♀️', title: 'Ocean Friends', theme: 'bg-cyan-100 border-cyan-300 text-cyan-700' },
    { id: 'scratch', emoji: '✏️', title: 'Start From Scratch', theme: 'bg-white border-gray-300 text-gray-700' },
];

export const KidStoryDashboard: React.FC<{ onNavigate?: (view: any) => void }> = ({ onNavigate }) => {
    const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
    const [heroName, setHeroName] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [storyFaces, setStoryFaces] = useState<ComicFace[]>([]);
    const [viewingStory, setViewingStory] = useState(false);

    const handleGenerateStory = async () => {
        if (!heroName.trim()) return;
        setIsGenerating(true);
        
        try {
            const faces: ComicFace[] = [];
            
            // Generate Cover
            const coverBeat = await generateTextBeatBase({
                pageNum: 0,
                selectedGenre: "Children's Storybook",
                customPremise: `A magical story about a young hero named ${heroName} in a ${selectedTemplate.title} setting.`,
                storyTone: 'Whimsical',
            });
            const coverImage = await generateImageBase(coverBeat, 'cover', 'Childrens Storybook Illustration', { provider: 'gemini' });
            faces.push({ id: 'cover', type: 'cover', narrative: coverBeat, imageUrl: coverImage, choices: [], pageIndex: 0 });

            // Generate 3 inner pages sequentially
            for (let i = 1; i <= 3; i++) {
                const beat = await generateTextBeatBase({
                    history: faces,
                    pageNum: i,
                    selectedGenre: "Children's Storybook",
                    customPremise: `A magical story about a young hero named ${heroName} in a ${selectedTemplate.title} setting.`,
                    storyTone: 'Whimsical',
                });
                const image = await generateImageBase(beat, 'story', 'Childrens Storybook Illustration', { provider: 'gemini' });
                faces.push({ id: `page-${i}`, type: 'story', narrative: beat, imageUrl: image, choices: [], pageIndex: i });
            }

            setStoryFaces(faces);
            setViewingStory(true);
        } catch (error) {
            console.error("Failed to generate kid story", error);
            alert("Oops! The magic wand fizzled. Try again!");
        } finally {
            setIsGenerating(false);
        }
    };

    const [currentSheetIndex, setCurrentSheetIndex] = useState(0);

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

    if (viewingStory) {
        return (
            <div className="min-h-screen bg-blue-50 relative print:bg-white">
                <div className="absolute top-4 left-4 right-4 z-50 flex justify-between items-center no-print">
                    <button 
                        onClick={() => {
                            setViewingStory(false);
                            setCurrentSheetIndex(0);
                        }}
                        className="px-6 py-2 bg-white rounded-full font-bold text-blue-600 shadow-md border-2 border-blue-200 hover:bg-blue-50"
                    >
                        ⬅️ Back to Editor
                    </button>
                    
                    <div className="flex gap-3 bg-white p-2 rounded-full shadow-md border-2 border-amber-200">
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
                
                <div className="pt-24 pb-10 flex justify-center items-center min-h-screen">
                    <div className="print-book-container flex justify-center w-full">
                        <Book 
                            comicFaces={storyFaces} 
                            currentSheetIndex={currentSheetIndex} 
                            isStarted={true}
                            isSetupVisible={false}
                            selectedVoice="en-US-Journey-F"
                            generateSpeech={async () => ""}
                            onSheetClick={(index) => setCurrentSheetIndex(index)}
                            onChoice={() => {}} 
                            onOpenBook={() => setCurrentSheetIndex(1)}
                            onDownload={() => handleShare('print')}
                            onReset={() => setViewingStory(false)}
                        />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-blue-50 text-gray-800 flex flex-col font-sans overflow-hidden">
            <header className="p-4 bg-white border-b-4 border-blue-200 flex justify-between items-center shadow-sm z-10 relative">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => onNavigate && onNavigate('home')}
                        className="px-3 py-1 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 font-bold text-sm mr-2"
                        title="Back to Menu"
                    >
                        ⬅️ Menu
                    </button>
                    <span className="text-3xl">🌟</span>
                    <h1 className="text-2xl font-black tracking-tight text-blue-600 uppercase">Kid Storymaker</h1>
                </div>
            </header>
            
            <main className="flex-1 p-6 md:p-12 overflow-y-auto">
                <div className="max-w-5xl mx-auto">
                    
                    {!selectedTemplate ? (
                        <>
                            <h2 className="text-3xl font-extrabold text-blue-800 mb-8 text-center drop-shadow-sm">Choose Your Story Magic! ✨</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {TEMPLATES.map(t => (
                                    <TemplateCard 
                                        key={t.id}
                                        {...t} 
                                        onClick={() => setSelectedTemplate(t)}
                                    />
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="max-w-xl mx-auto bg-white p-8 rounded-3xl shadow-xl border-4 border-blue-200 mt-10">
                            <div className="text-center mb-8">
                                <span className="text-6xl drop-shadow-md block mb-4">{selectedTemplate.emoji}</span>
                                <h2 className="text-3xl font-extrabold text-blue-800">{selectedTemplate.title}</h2>
                                <p className="text-gray-500 mt-2 font-medium">Let's set up your adventure!</p>
                            </div>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="block font-bold text-blue-900 mb-2 text-lg">What is your hero's name?</label>
                                    <input 
                                        type="text" 
                                        value={heroName}
                                        onChange={(e) => setHeroName(e.target.value)}
                                        className="w-full text-xl p-4 border-4 border-blue-100 rounded-2xl focus:outline-none focus:border-blue-400 font-bold text-gray-700"
                                        placeholder="e.g. Leo, Mia..."
                                    />
                                </div>
                                
                                <div className="flex gap-4 pt-4">
                                    <button 
                                        onClick={() => setSelectedTemplate(null)}
                                        className="flex-1 py-4 bg-gray-100 text-gray-500 font-bold rounded-2xl hover:bg-gray-200"
                                    >
                                        Go Back
                                    </button>
                                    <button 
                                        onClick={handleGenerateStory}
                                        disabled={!heroName.trim() || isGenerating}
                                        className="flex-1 py-4 bg-emerald-500 text-white font-bold rounded-2xl border-b-4 border-emerald-700 hover:bg-emerald-400 hover:-translate-y-1 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50 disabled:transform-none text-xl"
                                    >
                                        {isGenerating ? '✨ Casting Spell...' : 'Make Story! ✨'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

const TemplateCard = ({ emoji, title, theme, onClick }: any) => {
    const isDashed = theme.includes('dashed');
    return (
        <div 
            onClick={onClick}
            className={`
                aspect-square rounded-3xl p-6 flex flex-col items-center justify-center gap-4 cursor-pointer
                transform hover:-translate-y-2 hover:scale-105 transition-all duration-300
                ${theme} ${isDashed ? 'border-4 border-dashed' : 'border-4 border-solid shadow-lg hover:shadow-xl'}
            `}
        >
            <div className="text-7xl drop-shadow-md">{emoji}</div>
            <h3 className="text-xl font-bold text-center">{title}</h3>
        </div>
    );
};
