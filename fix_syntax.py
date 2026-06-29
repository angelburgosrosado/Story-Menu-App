import re

with open('AdminApp.tsx', 'r') as f:
    code = f.read()

# Let's find exactly where ai_costs starts
start_idx = code.find("{activeTab === 'ai_costs' && (")
if start_idx == -1:
    print("Cannot find ai_costs block")
else:
    # Find the next {activeTab === 
    next_tab_idx = code.find("{activeTab === 'ai_sandbox'", start_idx)
    
    # Replace everything between start_idx and next_tab_idx
    old_block = code[start_idx:next_tab_idx]
    
    new_block = """{activeTab === 'ai_costs' && (
                        <div className="space-y-6 animate-in fade-in duration-200">
                                <div className="mb-6">
                                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">AI Cost Analytics</h2>
                                    <p className="text-sm text-slate-500 mt-1">Track actual fiat USD costs incurred by user generations across Gemini, Leonardo, and ElevenLabs.</p>
                                </div>
                                
                                {!analyticsData ? (
                                    <div className="text-center p-12 text-slate-400">Loading analytics...</div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {/* Total Cost */}
                                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Operating Cost</h3>
                                                <div className="text-4xl font-black text-slate-800">
                                                    ${((analyticsData.total_cost_cents || 0) / 100).toFixed(4)}
                                                </div>
                                                <p className="text-xs text-slate-500 mt-2">Cumulative API spend across all integrated models</p>
                                            </div>
                                            
                                            {/* Provider Breakdown */}
                                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 col-span-2">
                                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Cost by Provider</h3>
                                                <div className="flex gap-4">
                                                    {analyticsData.by_provider?.map((p: any) => (
                                                        <div key={p.provider} className="flex-1 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                            <div className="text-sm font-bold capitalize text-slate-700 mb-1">{p.provider}</div>
                                                            <div className="text-xl font-black text-indigo-600">${(parseFloat(p.total) / 100).toFixed(4)}</div>
                                                        </div>
                                                    ))}
                                                    {(!analyticsData.by_provider || analyticsData.by_provider.length === 0) && (
                                                        <div className="text-sm text-slate-400">No usage data recorded yet.</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* User Leaderboard */}
                                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                            <div className="p-6 border-b border-slate-100 bg-slate-50">
                                                <h3 className="text-sm font-bold text-slate-800">Highest Consuming Users</h3>
                                            </div>
                                            <div className="divide-y divide-slate-100">
                                                {analyticsData.by_user?.map((u: any, idx: number) => (
                                                    <div key={u.user_email} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs">{idx + 1}</div>
                                                            <div>
                                                                <div className="font-bold text-slate-800">{u.user_email}</div>
                                                                <div className="text-xs text-slate-500">{u.calls} total API calls</div>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="font-black text-rose-500">${(parseFloat(u.total) / 100).toFixed(4)}</div>
                                                            <div className="text-xs text-slate-400">Total Cost</div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {(!analyticsData.by_user || analyticsData.by_user.length === 0) && (
                                                    <div className="p-8 text-center text-slate-400">No user usage data recorded yet.</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                    )}

                    """
    
    code = code[:start_idx] + new_block + code[next_tab_idx:]
    with open('AdminApp.tsx', 'w') as f:
        f.write(code)
    print("Fixed syntax")

