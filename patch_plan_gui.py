import re

with open('server.ts', 'r') as f:
    code = f.read()

# Update server.ts to accept description
old_post = r"const \{ name, priceSubscription, priceOneTime, features \} = req\.body;\n\s*const newPlan = \{\n\s*name,"
new_post = "const { name, description, priceSubscription, priceOneTime, features } = req.body;\n            const newPlan = {\n                name,\n                description: description || '',"
code = re.sub(old_post, new_post, code)

with open('server.ts', 'w') as f:
    f.write(code)

with open('AdminApp.tsx', 'r') as f:
    code = f.read()

# Make sure state includes description
code = code.replace(
    'const [editingPlan, setEditingPlan] = useState<any>({ name: "", priceSubscription: 0, priceOneTime: 0, features: [] });',
    'const [editingPlan, setEditingPlan] = useState<any>({ name: "", description: "", priceSubscription: 0, priceOneTime: 0, features: [] });'
)
code = code.replace(
    'setEditingPlan({ name: "", priceSubscription: 0, priceOneTime: 0, features: [] });',
    'setEditingPlan({ name: "", description: "", priceSubscription: 0, priceOneTime: 0, features: [] });'
)

# Redesign Plan Modal
old_modal_start = r'\{showPlanModal && \(\n\s*<div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">.*?<div className="flex justify-end gap-3 mt-6">'
new_modal_start = """{showPlanModal && (
                                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                                    <div className="bg-white border border-slate-200 p-8 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                                        
                                        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-100">
                                            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                                                <CreditCard size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-xl text-slate-800 tracking-tight leading-none">{editingPlan.id ? 'Edit' : 'Create'} Subscription Plan</h3>
                                                <p className="text-xs text-slate-500 mt-1">Configure pricing tiers and feature access</p>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-6">
                                            {/* Basic Details */}
                                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                                                <h4 className="font-bold text-sm uppercase tracking-wider text-slate-500 mb-4">Core Identity</h4>
                                                
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-700 mb-1">Plan Name <span className="text-red-500">*</span></label>
                                                        <input type="text" className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm" value={editingPlan.name} onChange={e => setEditingPlan({...editingPlan, name: e.target.value})} placeholder="e.g. Creator Pro" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-700 mb-1">Marketing Tagline / Description</label>
                                                        <input type="text" className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all shadow-sm" value={editingPlan.description || ''} onChange={e => setEditingPlan({...editingPlan, description: e.target.value})} placeholder="e.g. Best for power users and frequent generators" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Pricing Matrix */}
                                            <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
                                                <h4 className="font-bold text-sm uppercase tracking-wider text-indigo-500 mb-4">Pricing Matrix</h4>
                                                
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-50">
                                                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Monthly Sub ($)</label>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                                            <input type="number" min="0" step="0.01" className="w-full bg-transparent border-0 rounded-lg p-0 pl-7 text-2xl font-black text-slate-800 focus:ring-0 outline-none" value={editingPlan.priceSubscription} onChange={e => setEditingPlan({...editingPlan, priceSubscription: e.target.value})} />
                                                        </div>
                                                    </div>
                                                    <div className="bg-white p-4 rounded-xl shadow-sm border border-indigo-50">
                                                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">One-Time Price ($)</label>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                                            <input type="number" min="0" step="0.01" className="w-full bg-transparent border-0 rounded-lg p-0 pl-7 text-2xl font-black text-slate-800 focus:ring-0 outline-none" value={editingPlan.priceOneTime} onChange={e => setEditingPlan({...editingPlan, priceOneTime: e.target.value})} />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Feature Authorization */}
                                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                                                <div className="flex justify-between items-end mb-4">
                                                    <h4 className="font-bold text-sm uppercase tracking-wider text-slate-500">Feature Access Control</h4>
                                                    <span className="text-[10px] bg-blue-100 text-blue-600 font-bold px-2 py-1 rounded">{editingPlan.features.length} Unlocked</span>
                                                </div>
                                                
                                                <div className="max-h-60 overflow-y-auto pr-2 custom-scrollbar space-y-2">
                                                    {settings.filter((s:any) => s.keyName && s.keyName.startsWith('feature_')).length === 0 ? (
                                                        <div className="p-6 text-sm text-slate-500 text-center border-2 border-dashed border-slate-300 rounded-xl bg-white">
                                                            No Feature Flags exist.<br/>
                                                            <span className="text-xs mt-1 block">Go to the <strong>UI Feature Flags</strong> tab to create them!</span>
                                                        </div>
                                                    ) : settings.filter((s:any) => s.keyName && s.keyName.startsWith('feature_')).map((s:any) => s.keyName).map((feature: string) => (
                                                        <label key={feature} className={`flex items-center space-x-3 text-sm cursor-pointer p-3 rounded-xl border transition-all ${editingPlan.features.includes(feature) ? 'bg-white border-blue-500 shadow-sm ring-1 ring-blue-500' : 'bg-white/50 border-slate-200 hover:bg-white hover:border-slate-300'}`}>
                                                            <div className="relative flex items-center justify-center w-5 h-5">
                                                                <input 
                                                                    type="checkbox" 
                                                                    className="peer w-5 h-5 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer transition-all"
                                                                    checked={editingPlan.features.includes(feature)}
                                                                    onChange={(e) => {
                                                                        const newFeatures = e.target.checked 
                                                                            ? [...editingPlan.features, feature] 
                                                                            : editingPlan.features.filter((f: string) => f !== feature);
                                                                        setEditingPlan({...editingPlan, features: newFeatures});
                                                                    }}
                                                                />
                                                            </div>
                                                            <div className="flex-1">
                                                                <span className={`block font-medium ${editingPlan.features.includes(feature) ? 'text-blue-900' : 'text-slate-700'}`}>{feature.split('_').slice(1).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</span>
                                                                <span className="block text-[10px] text-slate-400 font-mono mt-0.5">{feature}</span>
                                                            </div>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100">"""

code = re.sub(old_modal_start, new_modal_start, code, flags=re.DOTALL)

with open('AdminApp.tsx', 'w') as f:
    f.write(code)

print("GUI updated")
