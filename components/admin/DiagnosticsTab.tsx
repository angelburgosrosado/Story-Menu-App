import React from 'react';

interface DiagnosticsTabProps {
    runLiveVerification: () => void;
    runDiagnostics: () => void;
    runningDiagnostics: boolean;
    healthData: any;
    aiEngineSummary: any;
}

export const DiagnosticsTab: React.FC<DiagnosticsTabProps> = ({
    runLiveVerification,
    runDiagnostics,
    runningDiagnostics,
    healthData,
    aiEngineSummary
}) => {
    return (
        <div className="bg-slate-950 border border-slate-700 p-4 space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-fuchsia-400">System Diagnostics &amp; Health Check</h3>
                <div className="flex gap-2">
                    <button onClick={runLiveVerification} className="px-4 py-1.5 border border-fuchsia-600 text-fuchsia-400 hover:bg-fuchsia-900 text-xs font-bold rounded shadow transition-colors">
                        RUN LIVE VERIFICATION
                    </button>
                    <button onClick={runDiagnostics} disabled={runningDiagnostics} className="px-4 py-1.5 bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-bold rounded shadow disabled:opacity-50 flex items-center gap-2">
                        {runningDiagnostics ? 'RUNNING...' : 'RUN DIAGNOSTICS'}
                    </button>
                </div>
            </div>
            
            {!healthData ? (
                <div className="text-gray-400 text-xs text-center py-10">Waiting for diagnostic results...</div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    {/* Database Check */}
                    <div className="border border-slate-700 p-3 bg-slate-900 rounded">
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`w-3 h-3 rounded-full ${healthData.database?.status === 'ok' ? 'bg-green-500' : healthData.database?.status === 'offline' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                            <h4 className="font-bold text-xs uppercase text-gray-300">Database</h4>
                        </div>
                        <p className="text-xs text-gray-400">{healthData.database?.message}</p>
                    </div>
                    {/* Storage Check */}
                    <div className="border border-slate-700 p-3 bg-slate-900 rounded">
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`w-3 h-3 rounded-full ${healthData.storage?.status === 'ok' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <h4 className="font-bold text-xs uppercase text-gray-300">File Storage</h4>
                        </div>
                        <p className="text-xs text-gray-400">{healthData.storage?.message}</p>
                    </div>
                    {/* Gemini API Check */}
                    <div className="border border-slate-700 p-3 bg-slate-900 rounded">
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`w-3 h-3 rounded-full ${healthData.integrations?.gemini?.status === 'ok' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <h4 className="font-bold text-xs uppercase text-gray-300">Gemini AI API</h4>
                        </div>
                        <p className="text-xs text-gray-400">{healthData.integrations?.gemini?.message}</p>
                    </div>
                    {/* Payment Gateways Check */}
                    <div className="border border-slate-700 p-3 bg-slate-900 rounded">
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`w-3 h-3 rounded-full ${(healthData.integrations?.stripe?.status === 'ok' || healthData.integrations?.paypal?.status === 'ok') ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                            <h4 className="font-bold text-xs uppercase text-gray-300">Payment Gateways</h4>
                        </div>
                        <p className="text-xs text-gray-400">
                            Stripe: {healthData.integrations?.stripe?.status === 'ok' ? '✅' : '❌'} | 
                            PayPal: {healthData.integrations?.paypal?.status === 'ok' ? '✅' : '❌'}
                        </p>
                    </div>
                    {/* AI Engine Summary */}
                    {aiEngineSummary && (
                        <div className="border border-violet-800 p-3 bg-slate-900 rounded col-span-2">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-3 h-3 rounded-full bg-violet-400"></div>
                                <h4 className="font-bold text-xs uppercase text-violet-300">⚡ AI Engine Routing</h4>
                            </div>
                            <div className="grid grid-cols-4 gap-3">
                                {[
                                    { label: 'Active Providers', value: `${aiEngineSummary.activeProviders}/${aiEngineSummary.totalProviders}` },
                                    { label: 'Active Models', value: `${aiEngineSummary.activeModels}/${aiEngineSummary.totalModels}` },
                                    { label: 'Active Workflows', value: `${aiEngineSummary.activeWorkflows}/${aiEngineSummary.totalWorkflows}` },
                                    { label: 'Routing Rules', value: `${aiEngineSummary.activeRoutingRules}/${aiEngineSummary.totalRoutingRules}` },
                                ].map(s => (
                                    <div key={s.label} className="text-center">
                                        <div className="text-xl font-black text-violet-300">{s.value}</div>
                                        <div className="text-[9px] text-slate-500 uppercase font-bold">{s.label}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {(aiEngineSummary.providerStatuses || []).map((p: any) => (
                                    <span key={p.slug} className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                        p.status === 'Active' ? 'bg-emerald-950 text-emerald-400' :
                                        p.status === 'Configured' ? 'bg-amber-950 text-amber-400' :
                                        'bg-slate-800 text-slate-500'
                                    }`}>{p.displayName}: {p.status}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
