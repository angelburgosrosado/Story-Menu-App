import React from 'react';
import { PenTool, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ModeSelectionScreenProps {
    onSelect: (mode: 'comic' | 'editorial') => void;
}

export const ModeSelectionScreen: React.FC<ModeSelectionScreenProps> = ({ onSelect }) => {
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 relative font-sans">
            {/* Ambient background grids and glows */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(6,182,212,0.15),transparent_50%),radial-gradient(ellipse_at_bottom,rgba(147,51,234,0.15),transparent_50%)] pointer-events-none z-0" />
            <div className="absolute top-0 left-0 w-full h-full bg-[size:32px_32px] bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] opacity-70 pointer-events-none z-0" />
            
            <div className="relative z-10 w-full max-w-4xl mx-auto text-center animate-fadeIn">
                <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-500">
                        Choose Your Studio
                    </span>
                </h1>
                <p className="text-slate-400 mb-12 text-lg max-w-xl mx-auto">
                    What kind of story do you want to create today? You can always change this later in your profile settings.
                </p>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Comic Creator */}
                    <button 
                        onClick={() => onSelect('comic')}
                        className="group relative flex flex-col items-center text-left p-8 rounded-3xl bg-slate-900/50 border-2 border-slate-800 hover:border-cyan-500 transition-all overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all border border-slate-700 group-hover:border-cyan-500/50">
                            <PenTool className="w-10 h-10 text-cyan-400" />
                        </div>
                        
                        <h2 className="text-2xl font-bold text-white mb-3">Comic Creator</h2>
                        <p className="text-slate-400 text-center">
                            Craft dynamic graphic novels with multi-panel layouts, speech bubbles, and cinematic visuals.
                        </p>
                    </button>

                    {/* Short Journal / Editorial */}
                    <button 
                        onClick={() => onSelect('editorial')}
                        className="group relative flex flex-col items-center text-left p-8 rounded-3xl bg-slate-900/50 border-2 border-slate-800 hover:border-fuchsia-500 transition-all overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-fuchsia-500/20 transition-all border border-slate-700 group-hover:border-fuchsia-500/50">
                            <BookOpen className="w-10 h-10 text-fuchsia-400" />
                        </div>
                        
                        <h2 className="text-2xl font-bold text-white mb-3">Short Journal (Kids)</h2>
                        <p className="text-slate-400 text-center">
                            Write illustrated short stories and journals with single full-page artistic spreads.
                        </p>
                    </button>
                </div>
            </div>
        </div>
    );
};
