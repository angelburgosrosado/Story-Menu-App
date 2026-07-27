import React from 'react';

interface SetupStep8ReviewProps {
    projectTitle: string;
    projectDesc: string;
    audienceType: string;
    ageGrade: string;
    readingLevel: string;
    storyGoal: string;
    wizardGenre: string;
    wizardTone: string;
    selectedPersona: any;
    personaRole: string;
    stylePreset: string;
}

export const SetupStep8Review: React.FC<SetupStep8ReviewProps> = ({
    projectTitle,
    projectDesc,
    audienceType,
    ageGrade,
    readingLevel,
    storyGoal,
    wizardGenre,
    wizardTone,
    selectedPersona,
    personaRole,
    stylePreset
}) => {
    return (
        <div className="space-y-6 text-left animate-fadeIn">
            <div>
                <h3 className="text-xl font-bold tracking-tight text-white">Review and generate your book</h3>
                <p className="text-sm text-slate-400 mt-1">Review your storybook setup details below. You can fine-tune everything inside the editor.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-slate-955/40 border border-slate-800 space-y-3">
                    <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider block">1. Basics & Target</span>
                    <h4 className="font-extrabold text-sm text-slate-200 line-clamp-1">{projectTitle}</h4>
                    <p className="text-[10px] text-slate-400 line-clamp-2">{projectDesc || 'No premise description written yet.'}</p>
                    <span className="block text-[10px] text-slate-300 font-semibold">{audienceType} • {ageGrade} ({readingLevel})</span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-955/40 border border-slate-800 space-y-3">
                    <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider block">2. Goals & Format</span>
                    <h4 className="font-extrabold text-xs text-slate-200 font-serif">Syllabus Objective</h4>
                    <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">{storyGoal || 'General creative story adventure development.'}</p>
                    <span className="block text-[10px] text-slate-300 font-semibold">{wizardGenre} ({wizardTone})</span>
                </div>

                <div className="p-5 rounded-2xl bg-slate-955/40 border border-slate-800 space-y-3">
                    <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider block">3. Cast Character</span>
                    {selectedPersona ? (
                        <div className="space-y-1 text-left">
                            <h4 className="font-extrabold text-sm text-slate-200">{selectedPersona.displayName}</h4>
                            <p className="text-[10px] text-slate-400"><strong className="text-slate-300">Role:</strong> {personaRole}</p>
                        </div>
                    ) : (
                        <p className="text-[10px] text-slate-500">No custom character cast.</p>
                    )}
                </div>

                <div className="p-5 rounded-2xl bg-slate-955/40 border border-slate-800 space-y-3">
                    <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider block">4. Visual Presets</span>
                    <div className="text-left">
                        <h4 className="font-extrabold text-xs text-slate-200">{stylePreset} preset</h4>
                        <p className="text-[9px] text-slate-505 mt-1">Consistency guidance active</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
