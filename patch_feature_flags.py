import re

with open('AdminApp.tsx', 'r') as f:
    code = f.read()

# 1. Remove MONETIZABLE_FEATURES
code = re.sub(r"const MONETIZABLE_FEATURES = \[.*?\];\n", "", code, flags=re.DOTALL)

# 2. Update Plan Editor to use dynamic feature flags
old_plan_editor = r"\{MONETIZABLE_FEATURES\.map\(\(feature\) => \("
new_plan_editor = """{settings.filter((s:any) => s.keyName && s.keyName.startsWith('feature_')).map((s:any) => s.keyName).map((feature: string) => ("""
code = code.replace(old_plan_editor, new_plan_editor)

# 3. Redesign UI Feature Flags Tab
old_ui = r"\{\/\* Features & Modules Toggles \*\/\}.*?\{\/\* Analytics \*\/\}"

new_ui = """{/* Features & Modules Toggles */}
                    {activeTab === 'features' && (
                        <div className="p-8 bg-slate-50">
                            <div className="mb-8 max-w-2xl">
                                <h3 className="font-bold text-lg text-slate-800 mb-1">UI Feature Flags</h3>
                                <p className="text-sm text-slate-500">Enable or disable core platform modules globally. These act as emergency kill-switches. For a user to access a feature, it must be globally enabled here AND unlocked by their active subscription plan.</p>
                            </div>
                            
                            <div className="space-y-6 max-w-4xl">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {settings.filter((s:any) => s.keyName && s.keyName.startsWith('feature_')).map((s:any) => {
                                        const f = s.keyName;
                                        const isEnabled = s.keyValue === 'true';
                                        return (
                                            <div key={f} className={`p-6 rounded-2xl shadow-sm border transition-all ${isEnabled ? 'bg-white border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <div className="font-bold text-sm text-slate-800 mb-1">{f.split('_').slice(1).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</div>
                                                        <div className="text-[10px] text-slate-400 font-mono bg-slate-100 px-2 py-1 rounded inline-block">{f}</div>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleUpdateSetting(f, isEnabled ? 'false' : 'true')}
                                                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${isEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                                                    >
                                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                                    </button>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-3 border-t border-slate-100 pt-3">
                                                    {isEnabled 
                                                        ? <span className="text-emerald-600 font-medium">✓ Globally Active</span> 
                                                        : <span className="text-amber-600 font-medium">⚠ Disabled Globally</span>}
                                                    <span className="block mt-1">Users require a Subscription Plan with this feature unlocked to access it.</span>
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                <div className="mt-8 border-t border-slate-200 pt-8">
                                    <h4 className="font-bold text-sm uppercase tracking-wider text-slate-500 mb-4">Create New Flag</h4>
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 max-w-md">
                                        <div className="flex items-center gap-3">
                                            <input 
                                                type="text" 
                                                placeholder="feature_my_new_flag" 
                                                className="flex-1 border border-slate-300 p-2.5 rounded-xl text-sm font-mono focus:border-blue-500 outline-none" 
                                                value={newFeature.keyName} 
                                                onChange={e => setNewFeature({...newFeature, keyName: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_')})} 
                                            />
                                            <button 
                                                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors shadow-md shadow-blue-600/20 whitespace-nowrap" 
                                                onClick={async () => {
                                                    if (!newFeature.keyName.startsWith('feature_')) {
                                                        alert("Feature flags must start with 'feature_'");
                                                        return;
                                                    }
                                                    await adminFetch('/api/admin/settings', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ keyName: newFeature.keyName, keyValue: 'false', isSecret: false }) });
                                                    setNewFeature({ keyName: 'feature_', keyValue: '', isSecret: false });
                                                    fetchData();
                                                }}
                                            >
                                                + Add Flag
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Analytics */}"""

code = re.sub(old_ui, new_ui, code, flags=re.DOTALL)

with open('AdminApp.tsx', 'w') as f:
    f.write(code)

print("Feature flags tab redesigned.")
