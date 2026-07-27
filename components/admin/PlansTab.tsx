import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';

export const MONETIZABLE_FEATURES = [
    'Basic Art Styles',
    'Advanced Art Styles (e.g. Noir, Pixar, Anime)',
    'Standard Generation Queue',
    'Priority GPU Queue (Faster generation)',
    'Watermark Removal',
    'Commercial Usage Rights',
    'Premium LLMs (e.g. Gemini Pro, Claude 3 Opus)',
    'Procedural Soundscapes (Dynamic audio)',
    'Synthesized Speech Narration',
    'Unified Book & PDF Export',
    'Multi-Tenant Casting Vault (Persistent character tracking)'
];

export interface Plan {
    id: string | number;
    name: string;
    priceSubscription: number;
    priceOneTime: number;
    features: string[];
}

interface PlansTabProps {
    plans: Plan[];
    fetchData: () => void;
}

export const PlansTab: React.FC<PlansTabProps> = ({ plans, fetchData }) => {
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState<any>({ name: "", priceSubscription: 0, priceOneTime: 0, features: [] });

    return (
        <div className="bg-slate-950 border border-slate-700 p-4 relative">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-sm text-cyan-400">Manage Subscription Tiers</h3>
                <button 
                    className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1 rounded text-xs font-bold" 
                    onClick={() => {
                        setEditingPlan({ name: "", priceSubscription: 0, priceOneTime: 0, features: [] });
                        setShowPlanModal(true);
                    }}
                >
                    + Create Plan
                </button>
            </div>
            {plans.length === 0 ? (
                <div className="text-gray-500 text-xs italic">No plans configured yet. Using sandbox defaults.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {plans.map((p: any) => (
                        <div key={p.id} className="p-4 border border-slate-800 bg-slate-900 flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                                <div className="text-lg font-black text-cyan-400 uppercase">{p.name}</div>
                                <div className="flex flex-col text-right">
                                    <span className="text-green-400 font-mono font-bold">${p.priceSubscription}/mo</span>
                                    <span className="text-emerald-500 font-mono text-[10px]">or ${p.priceOneTime} one-time</span>
                                </div>
                            </div>
                            <ul className="text-xs text-gray-400 mb-4 flex-1 space-y-1 font-mono">
                                {Array.isArray(p.features) ? p.features.map((f: string, i: number) => <li key={i}>✓ {f}</li>) : <li>{typeof p.features === 'string' ? p.features : 'No features listed'}</li>}
                            </ul>
                            <button 
                                className="text-red-500 hover:text-red-400 text-xs flex items-center justify-center gap-1 border border-red-900/50 py-1" 
                                onClick={async () => {
                                    if (confirm(`Delete plan ${p.name}?`)) {
                                        await fetch(`/api/admin/plans/${p.id}`, { method: 'DELETE' });
                                        fetchData();
                                    }
                                }}
                            >
                                <Trash2 size={12}/> Delete Tier
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {showPlanModal && (
                <div className="absolute top-0 left-0 w-full h-full bg-slate-950/90 z-10 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-700 p-6 rounded max-w-lg w-full max-h-full overflow-y-auto">
                        <h3 className="font-bold text-lg mb-4 text-white">Configure Plan</h3>
                        
                        <label className="block text-xs font-bold text-slate-400 mb-1">Plan Name</label>
                        <input type="text" className="w-full bg-slate-950 border border-slate-800 p-2 text-white mb-4" value={editingPlan.name} onChange={e => setEditingPlan({...editingPlan, name: e.target.value})} placeholder="e.g. Creator Pro" />

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1">Monthly Sub Price ($)</label>
                                <input type="number" className="w-full bg-slate-950 border border-slate-800 p-2 text-white" value={editingPlan.priceSubscription} onChange={e => setEditingPlan({...editingPlan, priceSubscription: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 mb-1">One-Time Price ($)</label>
                                <input type="number" className="w-full bg-slate-950 border border-slate-800 p-2 text-white" value={editingPlan.priceOneTime} onChange={e => setEditingPlan({...editingPlan, priceOneTime: e.target.value})} />
                            </div>
                        </div>

                        <label className="block text-xs font-bold text-slate-400 mb-2">Monetizable Features</label>
                        <div className="space-y-2 mb-6 border border-slate-800 p-3 bg-slate-950 max-h-60 overflow-y-auto">
                            {MONETIZABLE_FEATURES.map((feature) => (
                                <label key={feature} className="flex items-center space-x-2 text-sm text-gray-300 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="accent-cyan-500"
                                        checked={editingPlan.features?.includes(feature) || false}
                                        onChange={(e) => {
                                            const currentFeatures = editingPlan.features || [];
                                            const newFeatures = e.target.checked 
                                                ? [...currentFeatures, feature] 
                                                : currentFeatures.filter((f: string) => f !== feature);
                                            setEditingPlan({...editingPlan, features: newFeatures});
                                        }}
                                    />
                                    <span>{feature}</span>
                                </label>
                            ))}
                        </div>

                        <div className="flex justify-end gap-2">
                            <button className="px-4 py-2 bg-slate-800 text-white rounded text-sm hover:bg-slate-700" onClick={() => setShowPlanModal(false)}>Cancel</button>
                            <button className="px-4 py-2 bg-cyan-600 text-white rounded text-sm font-bold hover:bg-cyan-500" onClick={async () => {
                                await fetch('/api/admin/plans', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(editingPlan)
                                });
                                setShowPlanModal(false);
                                fetchData();
                            }}>Save Plan</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
