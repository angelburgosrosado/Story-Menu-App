import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { generateImageBase } from './hooks/useStoryEngine';

type JournalPage = {
    id: string;
    narrativeText: string;
    imageUrl: string;
    isLoading: boolean;
};

export const WritersJournalDashboard: React.FC<{ onNavigate?: (view: any) => void }> = ({ onNavigate }) => {
    const { t } = useTranslation();
    const [pages, setPages] = useState<JournalPage[]>(Array.from({ length: 10 }).map((_, i) => ({
        id: `page-${i + 1}`,
        narrativeText: '',
        imageUrl: '',
        isLoading: false
    })));
    
    const [selectedPageIndex, setSelectedPageIndex] = useState<number | null>(null);

    const updatePage = (index: number, updates: Partial<JournalPage>) => {
        setPages(prev => prev.map((p, i) => i === index ? { ...p, ...updates } : p));
    };

    const handleGenerateImage = async (index: number) => {
        const page = pages[index];
        if (!page.narrativeText.trim()) return;

        updatePage(index, { isLoading: true });
        try {
            // We use the text written by the user as the scene prompt
            const imageUrl = await generateImageBase(
                { scene: page.narrativeText, choices: [], focus_char: 'other' },
                'story',
                'Modern American',
                {
                    selectedGenre: 'Graphic Novel',
                    provider: 'gemini'
                }
            );
            updatePage(index, { imageUrl, isLoading: false });
        } catch (error) {
            console.error('Failed to generate image', error);
            updatePage(index, { isLoading: false });
        }
    };

    return (
        <div className="min-h-screen bg-[#f0eee9] text-stone-800 flex flex-col font-sans">
            <header className="p-4 border-b border-stone-300 flex justify-between items-center bg-white shadow-sm z-10 relative">
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => onNavigate && onNavigate('home')}
                        className="px-3 py-1 bg-stone-100 text-stone-500 rounded-md hover:bg-stone-200 hover:text-stone-700 font-bold text-sm transition"
                        title="Back to Menu"
                    >
                        ⬅ Menu
                    </button>
                    <h1 className="text-2xl font-bold tracking-tight text-stone-900">Writer's Journal</h1>
                </div>
                <button className="px-5 py-2.5 bg-stone-900 text-stone-50 rounded-md font-bold text-sm hover:bg-stone-800 transition">
                    Publish Sequence
                </button>
            </header>
            
            <main className="flex-1 p-8 flex gap-8 max-w-7xl mx-auto w-full">
                {/* Editor Sidebar */}
                <div className="w-1/3 bg-white border border-stone-200 rounded-xl p-6 shadow-sm flex flex-col">
                    {selectedPageIndex !== null ? (
                        <>
                            <h3 className="text-xl font-bold text-stone-800 mb-4 uppercase tracking-wider">
                                Page {selectedPageIndex + 1} Editor
                            </h3>
                            <label className="text-sm font-bold text-stone-500 uppercase tracking-widest mb-2 block">
                                Scene Description
                            </label>
                            <textarea 
                                className="w-full h-48 p-4 border border-stone-300 rounded-md bg-stone-50 text-stone-900 resize-none focus:outline-none focus:ring-2 focus:ring-stone-500 mb-6"
                                placeholder="Describe the scene in detail. E.g. 'A shadowy figure standing in the rain, neon lights reflecting in puddles...'"
                                value={pages[selectedPageIndex].narrativeText}
                                onChange={(e) => updatePage(selectedPageIndex, { narrativeText: e.target.value })}
                            />
                            
                            <button 
                                onClick={() => handleGenerateImage(selectedPageIndex)}
                                disabled={pages[selectedPageIndex].isLoading || !pages[selectedPageIndex].narrativeText.trim()}
                                className="w-full py-3 bg-stone-800 text-stone-100 rounded-md font-bold uppercase tracking-wider hover:bg-stone-700 disabled:opacity-50 transition"
                            >
                                {pages[selectedPageIndex].isLoading ? 'Rendering...' : 'Generate Visual'}
                            </button>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-stone-400 text-center px-4">
                            <span className="text-4xl mb-4">📖</span>
                            <p>Select a page from the sequence grid to start editing.</p>
                        </div>
                    )}
                </div>

                {/* Grid View */}
                <div className="flex-1">
                    <div className="mb-6">
                        <h2 className="text-3xl font-black text-stone-800 tracking-tight">10-Page Sequential Narrative</h2>
                        <p className="text-stone-500 mt-2">
                            Select a panel to write its scene and generate visuals.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {pages.map((page, i) => (
                            <div 
                                key={page.id} 
                                onClick={() => setSelectedPageIndex(i)}
                                className={`
                                    aspect-[3/4] bg-white rounded-lg flex flex-col items-center justify-center overflow-hidden
                                    cursor-pointer transition-all border-2 relative
                                    ${selectedPageIndex === i ? 'border-stone-800 shadow-md ring-4 ring-stone-200' : 'border-stone-200 hover:border-stone-400'}
                                `}
                            >
                                {page.imageUrl ? (
                                    <img src={page.imageUrl} alt={`Page ${i+1}`} className="w-full h-full object-cover" />
                                ) : (
                                    <>
                                        <span className="text-stone-300 text-3xl font-light mb-2">+{i+1}</span>
                                        <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">Page {i + 1}</span>
                                    </>
                                )}

                                {page.isLoading && (
                                    <div className="absolute inset-0 bg-stone-900/40 flex items-center justify-center backdrop-blur-sm">
                                        <span className="animate-spin text-white text-2xl">⏳</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
};
