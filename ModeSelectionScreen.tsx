import React from 'react';
import { PenTool, BookOpen, Smile } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type AppSkin = 'comic' | 'writers-journal' | 'kid-story';

interface ModeSelectionScreenProps {
    onSelect: (mode: AppSkin) => void;
}

export const ModeSelectionScreen: React.FC<ModeSelectionScreenProps> = ({ onSelect }) => {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative font-sans">
            {/* Ambient background grids and glows */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.15),transparent_50%),radial-gradient(ellipse_at_bottom,rgba(147,51,234,0.15),transparent_50%)] pointer-events-none z-0" />
            <div className="absolute top-0 left-0 w-full h-full bg-[size:32px_32px] bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] opacity-70 pointer-events-none z-0" />
            
            <div className="relative z-10 w-full max-w-5xl mx-auto text-center animate-fadeIn">
                <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-500">
                        Choose Your Studio
                    </span>
                </h1>
                <p className="text-slate-400 mb-12 text-lg max-w-xl mx-auto">
                    What kind of story do you want to create today? You can always change this later in your profile settings.
                </p>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Comic Studio */}
                    <button 
                        onClick={() => onSelect('comic')}
                        className="group relative flex flex-col items-center text-left p-8 rounded-3xl bg-slate-900/50 border-2 border-slate-800 hover:border-cyan-500 transition-all overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all border border-slate-700 group-hover:border-cyan-500/50">
                            <PenTool className="w-10 h-10 text-cyan-400" />
                        </div>
                        
                        <h2 className="text-2xl font-bold text-white mb-3">Comic Studio</h2>
                        <p className="text-slate-400 text-center">
                            For advanced creators. Craft dynamic graphic novels with multi-panel layouts.
                        </p>
                    </button>

                    {/* Writer's Journal */}
                    <button 
                        onClick={() => onSelect('writers-journal')}
                        className="group relative flex flex-col items-center text-left p-8 rounded-3xl bg-slate-900/50 border-2 border-slate-800 hover:border-fuchsia-500 transition-all overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-fuchsia-500/20 transition-all border border-slate-700 group-hover:border-fuchsia-500/50">
                            <BookOpen className="w-10 h-10 text-fuchsia-400" />
                        </div>
                        
                        <h2 className="text-2xl font-bold text-white mb-3">Writer's Journal</h2>
                        <p className="text-slate-400 text-center">
                            Write 10-page short stories with a clean, sequential page layout.
                        </p>
                    </button>

                    {/* Kid Story */}
                    <button 
                        onClick={() => onSelect('kid-story')}
                        className="group relative flex flex-col items-center text-left p-8 rounded-3xl bg-slate-900/50 border-2 border-emerald-500 hover:border-emerald-400 transition-all overflow-hidden transform hover:-translate-y-2"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 opacity-100" />
                        
                        <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center mb-6 transition-all border-4 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                            <Smile className="w-12 h-12 text-white" />
                        </div>
                        
                        <h2 className="text-3xl font-black text-white mb-3 tracking-wide">Kid Story</h2>
                        <p className="text-emerald-100 text-center text-lg font-medium">
                            A fun, simple storymaker designed specifically for younger creators!
                        </p>
                    </button>
                </div>
            </div>
        </div>
    );
};
