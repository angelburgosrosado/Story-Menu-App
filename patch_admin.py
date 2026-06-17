with open('AdminDashboard.tsx', 'r') as f:
    content = f.read()

# 1. Update State
state_target = """  const [activeTab, setActiveTab] = useState<'memberships' | 'categories' | 'moderation'>('memberships');"""
state_replace = """  const [activeTab, setActiveTab] = useState<'memberships' | 'categories' | 'moderation' | 'plans' | 'integrations'>('memberships');
  const [plans, setPlans] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
"""
content = content.replace(state_target, state_replace)

# 2. Update fetchData
fetch_target = """        fetch('/api/admin/moderation').then(r => r.json()).catch(() => [])
      ]);"""
fetch_replace = """        fetch('/api/admin/moderation').then(r => r.json()).catch(() => []),
        fetch('/api/admin/plans').then(r => r.json()).catch(() => []),
        fetch('/api/admin/settings').then(r => r.json()).catch(() => [])
      ]);"""
content = content.replace(fetch_target, fetch_replace)

setdata_target = """      setFlags(flagRes || []);"""
setdata_replace = """      setFlags(flagRes || []);
      setPlans(arguments[0][4] || []);
      setSettings(arguments[0][5] || []);"""
# Wait, arguments[0] is not going to work like that because it's a destructured array in Promise.all.
# Let's fix the destructuring.

destructure_target = """      const [statsRes, custRes, catRes, flagRes] = await Promise.all(["""
destructure_replace = """      const [statsRes, custRes, catRes, flagRes, plansRes, settingsRes] = await Promise.all(["""
content = content.replace(destructure_target, destructure_replace)

setdata2_target = """      setFlags(flagRes || []);"""
setdata2_replace = """      setFlags(flagRes || []);
      setPlans(plansRes || []);
      setSettings(settingsRes || []);"""
content = content.replace(setdata2_target, setdata2_replace)

# 3. Add Tabs
tabs_target = """                    <button 
                        onClick={() => setActiveTab('moderation')} """
tabs_replace = """                    <button 
                        onClick={() => setActiveTab('plans')} 
                        className={`px-4 py-2 font-bold uppercase text-xs ${activeTab === 'plans' ? 'border-b-2 border-cyan-400 text-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        Subscription Plans
                    </button>
                    <button 
                        onClick={() => setActiveTab('integrations')} 
                        className={`px-4 py-2 font-bold uppercase text-xs ${activeTab === 'integrations' ? 'border-b-2 border-cyan-400 text-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        API Integrations
                    </button>
                    <button 
                        onClick={() => setActiveTab('moderation')} """
content = content.replace(tabs_target, tabs_replace)

# 4. Add Tab Contents at the end, right before </div>\n        )}
tab_contents = """
                {activeTab === 'plans' && (
                    <div className="bg-slate-950 border border-slate-700 p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-sm text-cyan-400">Manage Subscription Tiers</h3>
                            <button className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1 rounded text-xs font-bold" onClick={async () => {
                                const name = prompt("Plan Name (e.g. Pro, Enterprise):");
                                if (name) {
                                    const price = prompt("Monthly Price (e.g. 19.99):");
                                    const featuresRaw = prompt("Features (comma separated):");
                                    const features = featuresRaw ? featuresRaw.split(',').map(f => f.trim()) : [];
                                    await fetch('/api/admin/plans', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ name, price, features }) });
                                    fetchData();
                                }
                            }}>+ Create Plan</button>
                        </div>
                        {plans.length === 0 ? (
                            <div className="text-gray-500 text-xs italic">No plans configured yet. Using sandbox defaults.</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {plans.map((p: any) => (
                                    <div key={p.id} className="p-4 border border-slate-800 bg-slate-900 flex flex-col">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="text-lg font-black text-cyan-400 uppercase">{p.name}</div>
                                            <div className="text-green-400 font-mono font-bold">${p.price}/{p.billingCycle || 'mo'}</div>
                                        </div>
                                        <ul className="text-xs text-gray-400 mb-4 flex-1 space-y-1 font-mono">
                                            {Array.isArray(p.features) ? p.features.map((f: string, i: number) => <li key={i}>- {f}</li>) : <li>{typeof p.features === 'string' ? p.features : 'No features listed'}</li>}
                                        </ul>
                                        <button className="text-red-500 hover:text-red-400 text-xs flex items-center justify-center gap-1 border border-red-900/50 py-1" onClick={async () => {
                                            if (confirm(`Delete plan ${p.name}?`)) {
                                                await fetch(`/api/admin/plans/${p.id}`, { method: 'DELETE' });
                                                fetchData();
                                            }
                                        }}><Trash2 size={12}/> Delete Tier</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'integrations' && (
                    <div className="bg-slate-950 border border-slate-700 p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-sm text-cyan-400">Payment Gateway Integrations</h3>
                            <button className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1 rounded text-xs font-bold" onClick={async () => {
                                const keyName = prompt("Key Name (e.g. STRIPE_SECRET_KEY, SQUARE_ACCESS_TOKEN):");
                                if (keyName) {
                                    const keyValue = prompt("Token/Secret Value:");
                                    if (keyValue) {
                                        await fetch('/api/admin/settings', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ keyName, keyValue, isSecret: true }) });
                                        fetchData();
                                    }
                                }
                            }}>+ Add Key</button>
                        </div>
                        <div className="text-xs text-yellow-500 font-mono mb-4 italic">
                            * Tokens stored here override sandbox mocks. Leave empty to use local test mode.
                        </div>
                        {settings.length === 0 ? (
                            <div className="text-gray-500 text-xs italic">No integrations configured yet.</div>
                        ) : (
                            <ul className="space-y-2">
                                {settings.map((s: any) => (
                                    <li key={s.keyName} className="flex flex-col gap-1 p-3 bg-slate-900 border border-slate-800 text-sm font-mono">
                                        <div className="text-cyan-400 font-bold">{s.keyName}</div>
                                        <div className="text-gray-500 text-xs truncate">
                                            {s.isSecret ? '••••••••••••••••••••••••' : s.keyValue}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
"""

end_target = """</div>
        )}
      </div>"""

content = content.replace(end_target, tab_contents + "\n" + end_target)

with open('AdminDashboard.tsx', 'w') as f:
    f.write(content)
print("Patched AdminDashboard.tsx")
