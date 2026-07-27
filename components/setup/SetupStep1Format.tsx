import React from 'react';
import { ArrowRight } from 'lucide-react';

interface SetupStep1FormatProps {
    isLoadingWizardData: boolean;
    formats: any[];
    selectedFormat: any;
    handleSelectFormat: (fmt: any) => void;
}

export const SetupStep1Format: React.FC<SetupStep1FormatProps> = ({
    isLoadingWizardData,
    formats,
    selectedFormat,
    handleSelectFormat
}) => {
    return (
        <div className="space-y-6 text-left">
            <div>
                <h3 className="text-xl font-bold tracking-tight text-white">Pick a starting format</h3>
                <p className="text-sm text-slate-400">Choose the layout format that best fits your story needs</p>
            </div>

            {isLoadingWizardData ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((n) => (
                        <div key={n} className="w-full h-24 rounded-xl bg-slate-850/50 border border-slate-850 animate-pulse flex items-center p-4 gap-4" />
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
                            </div>
                            <ArrowRight size={16} className="text-slate-500 mt-4 shrink-0" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
