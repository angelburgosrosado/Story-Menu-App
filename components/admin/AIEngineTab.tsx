import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';

interface AIEngineTabProps {
    aiProviders: any[];
    aiModels: any[];
    aiWorkflows: any[];
    aiRoutingRules: any[];
    aiFallbackConfigs: any[];
    fetchData: () => void;
}

export const AIEngineTab: React.FC<AIEngineTabProps> = ({
    aiProviders,
    aiModels,
    aiWorkflows,
    aiRoutingRules,
    aiFallbackConfigs,
    fetchData
}) => {
    const [aiEngineSubTab, setAiEngineSubTab] = useState<'providers'|'models'|'workflows'|'routing'>('providers');
    const [simulateWorkflow, setSimulateWorkflow] = useState('');
    const [simulateTier, setSimulateTier] = useState('Free');
    const [simulatingRoute, setSimulatingRoute] = useState(false);
    const [simulateResult, setSimulateResult] = useState<any>(null);

    return (
        <div className="bg-slate-950 border border-slate-700 p-4 space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-violet-400">⚡ AI Engine — Providers, Models &amp; Routing</h3>
                <button onClick={fetchData} className="text-violet-400 hover:text-violet-300 text-xs flex items-center gap-1">
                    <RefreshCw size={12}/> Refresh
                </button>
            </div>

            {/* Sub-tab nav */}
            <div className="flex border-b border-slate-800 gap-2 flex-wrap">
                {(['providers','models','workflows','routing'] as const).map(st => (
                    <button key={st} onClick={() => setAiEngineSubTab(st)}
                        className={`px-4 py-2 text-xs font-bold uppercase transition-all capitalize ${
                            aiEngineSubTab === st ? 'border-b-2 border-violet-400 text-violet-400' : 'text-gray-500 hover:text-gray-300'
                        }`}>
                        {st === 'routing' ? 'Routing Rules' : st === 'providers' ? 'Providers' : st === 'models' ? 'Model Catalog' : 'Workflows'}
                    </button>
                ))}
            </div>

            {/* ── PROVIDERS ─────────────────────────────────── */}
            {aiEngineSubTab === 'providers' && (
                <div className="space-y-3">
                    <div className="grid grid-cols-1 gap-2">
                        {aiProviders.map((p: any) => (
                            <div key={p.id} className="flex items-start justify-between p-3 bg-slate-900 border border-slate-800 rounded">
                                <div className="flex items-start gap-3">
                                    <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 ${
                                        p.status === 'Active' ? 'bg-emerald-400' :
                                        p.status === 'Configured' ? 'bg-amber-400' : 'bg-slate-600'
                                    }`}/>
                                    <div>
                                        <div className="font-bold text-sm text-slate-100">{p.displayName}</div>
                                        <div className="text-xs text-slate-400 mt-0.5">
                                            <span className="font-mono bg-slate-800 px-1 rounded mr-2">{p.apiKeyEnvVar}</span>
                                            <span className="capitalize">{p.providerType}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {(p.capabilities || []).map((c: string) => (
                                                <span key={c} className="text-[9px] font-bold px-1.5 py-0.5 bg-violet-950 text-violet-300 rounded">{c}</span>
                                            ))}
                                        </div>
                                        {p.notes && <div className="text-[10px] text-slate-500 mt-1 italic">{p.notes}</div>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                        p.status === 'Active' ? 'bg-emerald-950 text-emerald-400' :
                                        p.status === 'Configured' ? 'bg-amber-950 text-amber-400' :
                                        'bg-slate-800 text-slate-400'
                                    }`}>{p.status}</span>
                                    <button onClick={async () => {
                                        const newStatus = p.status === 'Active' ? 'Configured' : 'Active';
                                        await fetch(`/api/admin/ai-providers/${p.id}`, {
                                            method: 'PUT', headers: {'Content-Type':'application/json'},
                                            body: JSON.stringify({ status: newStatus })
                                        });
                                        fetchData();
                                    }} className="text-xs text-violet-400 hover:text-violet-300">
                                        {p.status === 'Active' ? 'Disable' : 'Enable'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── MODEL CATALOG ──────────────────────────────── */}
            {aiEngineSubTab === 'models' && (
                <div className="space-y-3">
                    {aiProviders.map((prov: any) => {
                        const provModels = aiModels.filter((m: any) => m.providerId === prov.id);
                        if (provModels.length === 0) return null;
                        return (
                            <div key={prov.id}>
                                <div className="text-[10px] font-bold uppercase text-slate-500 mb-2 flex items-center gap-2">
                                    <div className={`w-1.5 h-1.5 rounded-full ${
                                        prov.status === 'Active' ? 'bg-emerald-400' : 'bg-amber-400'
                                    }`}/>
                                    {prov.displayName}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {provModels.map((m: any) => (
                                        <div key={m.id} className={`p-3 border rounded ${
                                            m.status === 'Active' ? 'border-slate-700 bg-slate-900' : 'border-slate-800 bg-slate-950 opacity-60'
                                        }`}>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="font-bold text-sm text-slate-100">{m.displayName}</div>
                                                    <div className="font-mono text-[10px] text-slate-500 mt-0.5">{m.slug}</div>
                                                </div>
                                                <button onClick={async () => {
                                                    const newStatus = m.status === 'Active' ? 'Configured' : 'Active';
                                                    await fetch(`/api/admin/ai-models/${m.id}`, {
                                                        method: 'PUT', headers: {'Content-Type':'application/json'},
                                                        body: JSON.stringify({ status: newStatus })
                                                    });
                                                    fetchData();
                                                }} className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                                    m.status === 'Active' ? 'bg-emerald-950 text-emerald-400 hover:bg-red-950 hover:text-red-400' :
                                                    'bg-slate-800 text-slate-400 hover:bg-emerald-950 hover:text-emerald-400'
                                                }`}>
                                                    {m.status}
                                                </button>
                                            </div>
                                            <div className="flex gap-2 mt-2 flex-wrap">
                                                {(m.capabilityTypes || []).map((c: string) => (
                                                    <span key={c} className="text-[9px] font-bold px-1.5 py-0.5 bg-violet-950 text-violet-300 rounded">{c}</span>
                                                ))}
                                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                                    m.costTier === 'Low' ? 'bg-emerald-950 text-emerald-400' :
                                                    m.costTier === 'Medium' ? 'bg-amber-950 text-amber-400' :
                                                    'bg-red-950 text-red-400'
                                                }`}>Cost: {m.costTier}</span>
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-950 text-blue-400 rounded">Perf: {m.performanceTier}</span>
                                            </div>
                                            {m.notes && <div className="text-[10px] text-slate-500 mt-1.5 italic">{m.notes}</div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── WORKFLOWS ──────────────────────────────────── */}
            {aiEngineSubTab === 'workflows' && (
                <div className="space-y-2">
                    {aiWorkflows.map((w: any) => {
                        const defaultModel = aiModels.find((m: any) => m.id === w.defaultModelId);
                        const defaultProv = aiProviders.find((p: any) => p.id === w.defaultProviderId);
                        return (
                            <div key={w.id} className="p-3 bg-slate-900 border border-slate-800 rounded">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-bold text-sm text-slate-100">{w.title}</div>
                                        <div className="font-mono text-[10px] text-slate-500 mt-0.5">{w.slug}</div>
                                        {w.description && <div className="text-[10px] text-slate-400 mt-1">{w.description}</div>}
                                    </div>
                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                        w.status === 'Active' ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-400'
                                    }`}>{w.status}</span>
                                </div>
                                <div className="mt-2 pt-2 border-t border-slate-800 flex items-center gap-3 text-[10px]">
                                    <span className="text-slate-500">Default model:</span>
                                    <span className="font-bold text-violet-300">{defaultModel?.displayName || w.defaultModelId}</span>
                                    <span className="text-slate-600">via</span>
                                    <span className="text-slate-400">{defaultProv?.displayName || w.defaultProviderId}</span>
                                    <div className="flex gap-1 ml-auto">
                                        {(w.capabilityTypes || []).map((c: string) => (
                                            <span key={c} className="px-1.5 py-0.5 bg-violet-950 text-violet-300 rounded font-bold">{c}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── ROUTING RULES ──────────────────────────────── */}
            {aiEngineSubTab === 'routing' && (
                <div className="space-y-6">
                    {/* Simulate Routing Panel */}
                    <div className="p-4 bg-slate-900 border border-violet-800 rounded">
                        <div className="font-bold text-xs text-violet-400 mb-3">⚡ Simulate Routing — Preview which model resolves for a workflow + tier</div>
                        <div className="flex gap-3 flex-wrap items-end">
                            <div>
                                <label className="block text-[10px] text-slate-400 mb-1">Workflow</label>
                                <select
                                    value={simulateWorkflow}
                                    onChange={e => setSimulateWorkflow(e.target.value)}
                                    className="bg-slate-800 border border-slate-700 text-white text-xs p-2 rounded"
                                >
                                    <option value="">Select workflow…</option>
                                    {aiWorkflows.map((w: any) => (
                                        <option key={w.slug} value={w.slug}>{w.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] text-slate-400 mb-1">Plan Tier</label>
                                <select
                                    value={simulateTier}
                                    onChange={e => setSimulateTier(e.target.value)}
                                    className="bg-slate-800 border border-slate-700 text-white text-xs p-2 rounded"
                                >
                                    <option>Free</option>
                                    <option>Entry</option>
                                    <option>High User</option>
                                </select>
                            </div>
                            <button
                                disabled={!simulateWorkflow || simulatingRoute}
                                onClick={async () => {
                                    if (!simulateWorkflow) return;
                                    setSimulatingRoute(true);
                                    setSimulateResult(null);
                                    try {
                                        const res = await fetch(`/api/admin/ai-routing/resolve?workflow=${simulateWorkflow}&tier=${encodeURIComponent(simulateTier)}&env=production`);
                                        const data = await res.json();
                                        setSimulateResult(data);
                                    } catch(e) {
                                        setSimulateResult({ error: 'Failed to resolve' });
                                    } finally {
                                        setSimulatingRoute(false);
                                    }
                                }}
                                className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-bold px-4 py-2 rounded"
                            >
                                {simulatingRoute ? 'Resolving…' : 'Simulate'}
                            </button>
                        </div>
                        {simulateResult && !simulateResult.error && (
                            <div className="mt-3 p-3 bg-slate-800 border border-violet-700 rounded text-xs">
                                <div className="flex gap-4 flex-wrap">
                                    <div><span className="text-slate-400">Provider:</span> <span className="font-bold text-white">{simulateResult.providerDisplayName}</span></div>
                                    <div><span className="text-slate-400">Model:</span> <span className="font-bold text-violet-300">{simulateResult.modelDisplayName}</span></div>
                                    <div><span className="text-slate-400">Cost:</span> <span className="font-bold text-amber-300">{simulateResult.costTier}</span></div>
                                    <div><span className="text-slate-400">Performance:</span> <span className="font-bold text-blue-300">{simulateResult.performanceTier}</span></div>
                                    <div><span className="text-slate-400">Resolved by:</span> <span className={`font-bold ${
                                        simulateResult.resolvedBy === 'rule' ? 'text-emerald-400' :
                                        simulateResult.resolvedBy === 'workflow_default' ? 'text-amber-400' : 'text-red-400'
                                    }`}>{simulateResult.resolvedBy}</span></div>
                                </div>
                                <div className="font-mono text-[9px] text-slate-500 mt-2">{simulateResult.modelSlug}</div>
                            </div>
                        )}
                        {simulateResult?.error && (
                            <div className="mt-3 text-red-400 text-xs">{simulateResult.error}</div>
                        )}
                    </div>

                    {/* Routing Rules Matrix */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="font-bold text-xs text-slate-300 uppercase">Active Routing Rules ({aiRoutingRules.filter((r:any)=>r.status==='Active').length} active)</h4>
                            <button
                                onClick={async () => {
                                    const workflow = prompt('Workflow slug (e.g. text_outline_generation):');
                                    const tier = prompt('Plan tier (Free / Entry / High User):', 'Free');
                                    const modelId = prompt('Model ID (e.g. model-gemini-flash):');
                                    const providerId = prompt('Provider ID (e.g. prov-google):');
                                    if (workflow && tier && modelId && providerId) {
                                        await fetch('/api/admin/ai-routing-rules', {
                                            method: 'POST',
                                            headers: {'Content-Type':'application/json'},
                                            body: JSON.stringify({ workflowSlug: workflow, planTier: tier, modelId, providerId, environment: 'production', status: 'Active', priority: 1 })
                                        });
                                        fetchData();
                                    }
                                }}
                                className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-3 py-1 rounded"
                            >+ Add Rule</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-[11px] font-mono">
                                <thead>
                                    <tr className="border-b border-slate-800">
                                        <th className="text-left p-2 text-slate-400 font-bold uppercase text-[10px]">Workflow</th>
                                        <th className="text-left p-2 text-slate-400 font-bold uppercase text-[10px]">Plan Tier</th>
                                        <th className="text-left p-2 text-slate-400 font-bold uppercase text-[10px]">Provider</th>
                                        <th className="text-left p-2 text-slate-400 font-bold uppercase text-[10px]">Model</th>
                                        <th className="text-left p-2 text-slate-400 font-bold uppercase text-[10px]">Status</th>
                                        <th className="p-2"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {aiRoutingRules.map((rule: any) => {
                                        const model = aiModels.find((m: any) => m.id === rule.modelId);
                                        const prov = aiProviders.find((p: any) => p.id === rule.providerId);
                                        return (
                                            <tr key={rule.id} className={`border-t border-slate-800 hover:bg-slate-900 ${
                                                rule.status !== 'Active' ? 'opacity-40' : ''
                                            }`}>
                                                <td className="p-2 text-violet-300">{rule.workflowSlug}</td>
                                                <td className="p-2">
                                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                                        rule.planTier === 'High User' ? 'bg-amber-950 text-amber-300' :
                                                        rule.planTier === 'Entry' ? 'bg-blue-950 text-blue-300' :
                                                        'bg-slate-800 text-slate-400'
                                                    }`}>{rule.planTier}</span>
                                                </td>
                                                <td className="p-2 text-slate-300">{prov?.displayName || rule.providerId}</td>
                                                <td className="p-2 text-white font-bold">{model?.displayName || rule.modelId}</td>
                                                <td className="p-2">
                                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                                        rule.status === 'Active' ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-500'
                                                    }`}>{rule.status}</span>
                                                </td>
                                                <td className="p-2">
                                                    <button
                                                        onClick={async () => {
                                                            const newStatus = rule.status === 'Active' ? 'Inactive' : 'Active';
                                                            await fetch(`/api/admin/ai-routing-rules/${rule.id}`, {
                                                                method: 'PUT', headers: {'Content-Type':'application/json'},
                                                                body: JSON.stringify({ status: newStatus })
                                                            });
                                                            fetchData();
                                                        }}
                                                        className="text-slate-400 hover:text-white text-[10px]"
                                                    >
                                                        {rule.status === 'Active' ? 'Pause' : 'Activate'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Fallback Configs */}
                    <div>
                        <h4 className="font-bold text-xs text-slate-300 uppercase mb-3">Fallback Chains ({aiFallbackConfigs.filter((f:any)=>f.status==='Active').length} active)</h4>
                        <div className="space-y-2">
                            {aiFallbackConfigs.map((fb: any) => {
                                const primaryModel = aiModels.find((m: any) => m.id === fb.primaryModelId);
                                const fallbackModel = aiModels.find((m: any) => m.id === fb.fallbackModelId);
                                return (
                                    <div key={fb.id} className="p-3 bg-slate-900 border border-slate-800 rounded text-xs">
                                        <div className="flex justify-between items-start">
                                            <div className="font-mono text-violet-300 text-[10px]">{fb.workflowSlug}</div>
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                                fb.status === 'Active' ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-400'
                                            }`}>{fb.status}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-white font-bold">{primaryModel?.displayName || fb.primaryModelId}</span>
                                            <span className="text-slate-600">→ on error →</span>
                                            <span className="text-amber-300 font-bold">{fallbackModel?.displayName || fb.fallbackModelId}</span>
                                        </div>
                                        <div className="text-slate-500 text-[9px] mt-1">Triggers: {(fb.triggerConditions || []).join(', ')}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
