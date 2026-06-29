import re

with open('AdminDashboard.tsx', 'r') as f:
    content = f.read()

# Add Toast State
if 'const [toast, setToast]' not in content:
    content = content.replace("const [loading, setLoading] = useState(true);", "const [loading, setLoading] = useState(true);\n  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);\n\n  const showToast = (message: string, type: 'success' | 'error' = 'success') => {\n    setToast({message, type});\n    setTimeout(() => setToast(null), 3000);\n  };")

# Add summary cards at the top
summary_cards = """
                {/* Summary Cards */}
                {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1">Total Users</p>
                            <h4 className="text-2xl font-black text-white">{stats.totalUsers}</h4>
                        </div>
                        <Users className="text-blue-500 opacity-50" size={32} />
                    </div>
                    <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1">Pro Users</p>
                            <h4 className="text-2xl font-black text-white">{stats.proUsers}</h4>
                        </div>
                        <Shield className="text-yellow-500 opacity-50" size={32} />
                    </div>
                    <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1">Est. MRR</p>
                            <h4 className="text-2xl font-black text-white">${stats.mrrEstimate}</h4>
                        </div>
                        <DollarSign className="text-green-500 opacity-50" size={32} />
                    </div>
                    <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1">System Health</p>
                            <h4 className="text-2xl font-black text-white">Active</h4>
                        </div>
                        <Activity className="text-fuchsia-500 opacity-50" size={32} />
                    </div>
                </div>
                )}
"""

if "Summary Cards" not in content:
    content = content.replace("                {/* TABS */}", summary_cards + "\n                {/* TABS */}")

# Update Integrations UI
integrations_old = """                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Publishable Key</label>
                                        <div className="flex gap-2">
                                            <input type="text" value={stripePub} onChange={e => setStripePub(e.target.value)} className="w-full bg-slate-950 border border-slate-700 p-2 text-xs rounded text-white" placeholder="pk_live_..." />
                                            <button onClick={() => handleSaveSetting('stripe_publishable_key', stripePub, false)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 text-xs font-bold rounded">Save</button>
                                        </div>
                                    </div>"""

integrations_new = """                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="block text-[10px] uppercase font-bold text-gray-500">Publishable Key</label>
                                            {stripePub ? <span className="text-[9px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded">CONNECTED</span> : <span className="text-[9px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded">MISSING</span>}
                                        </div>
                                        <div className="flex gap-2">
                                            <input type="text" value={stripePub} onChange={e => setStripePub(e.target.value)} className="w-full bg-slate-950 border border-slate-700 p-2 text-xs rounded text-white focus:border-indigo-500 focus:outline-none" placeholder="pk_live_..." />
                                            <button onClick={() => { handleSaveSetting('stripe_publishable_key', stripePub, false); showToast('Stripe Publishable Key saved', 'success'); }} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 text-xs font-bold rounded shadow-lg shadow-indigo-500/20 transition-all active:scale-95">Save</button>
                                        </div>
                                    </div>"""

content = content.replace(integrations_old, integrations_new)

integrations_secret_old = """                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Secret Key (Restricted)</label>
                                        <div className="flex gap-2">
                                            <input type="password" value={stripeSecret} onChange={e => setStripeSecret(e.target.value)} className="w-full bg-slate-950 border border-slate-700 p-2 text-xs rounded text-white" placeholder="sk_live_..." />
                                            <button onClick={() => handleSaveSetting('stripe_secret_key', stripeSecret, true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 text-xs font-bold rounded">Save</button>
                                        </div>
                                    </div>"""

integrations_secret_new = """                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="block text-[10px] uppercase font-bold text-gray-500">Secret Key (Restricted)</label>
                                            {stripeSecret ? <span className="text-[9px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded">CONNECTED</span> : <span className="text-[9px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded">MISSING</span>}
                                        </div>
                                        <div className="flex gap-2">
                                            <input type="password" value={stripeSecret} onChange={e => setStripeSecret(e.target.value)} className="w-full bg-slate-950 border border-slate-700 p-2 text-xs rounded text-white focus:border-indigo-500 focus:outline-none" placeholder="sk_live_..." />
                                            <button onClick={() => { handleSaveSetting('stripe_secret_key', stripeSecret, true); showToast('Stripe Secret Key saved', 'success'); }} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 text-xs font-bold rounded shadow-lg shadow-indigo-500/20 transition-all active:scale-95">Save</button>
                                        </div>
                                    </div>"""

content = content.replace(integrations_secret_old, integrations_secret_new)


paypal_old = """                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Client ID</label>
                                        <div className="flex gap-2">
                                            <input type="text" value={paypalClient} onChange={e => setPaypalClient(e.target.value)} className="w-full bg-slate-950 border border-slate-700 p-2 text-xs rounded text-white" placeholder="Client ID from PayPal Developer Dashboard..." />
                                            <button onClick={() => handleSaveSetting('paypal_client_id', paypalClient, false)} className="bg-blue-600 hover:bg-blue-500 text-white px-3 text-xs font-bold rounded">Save</button>
                                        </div>
                                    </div>"""

paypal_new = """                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="block text-[10px] uppercase font-bold text-gray-500">Client ID</label>
                                            {paypalClient ? <span className="text-[9px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded">CONNECTED</span> : <span className="text-[9px] font-bold text-red-400 bg-red-400/10 px-2 py-0.5 rounded">MISSING</span>}
                                        </div>
                                        <div className="flex gap-2">
                                            <input type="text" value={paypalClient} onChange={e => setPaypalClient(e.target.value)} className="w-full bg-slate-950 border border-slate-700 p-2 text-xs rounded text-white focus:border-blue-500 focus:outline-none" placeholder="Client ID from PayPal Developer Dashboard..." />
                                            <button onClick={() => { handleSaveSetting('paypal_client_id', paypalClient, false); showToast('PayPal Client ID saved', 'success'); }} className="bg-blue-600 hover:bg-blue-500 text-white px-3 text-xs font-bold rounded shadow-lg shadow-blue-500/20 transition-all active:scale-95">Save</button>
                                        </div>
                                    </div>"""

content = content.replace(paypal_old, paypal_new)


# Insert Toast UI at the bottom of the modal container
toast_ui = """
                {/* Toast Notification */}
                {toast && (
                    <div className={`fixed bottom-6 right-6 z-[600] px-4 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 fade-in duration-300 ${toast.type === 'success' ? 'bg-green-500/10 border border-green-500 text-green-400' : 'bg-red-500/10 border border-red-500 text-red-400'}`}>
                        {toast.type === 'success' ? <Shield size={18} /> : <X size={18} />}
                        <span className="font-bold text-sm">{toast.message}</span>
                    </div>
                )}
"""

if "{toast && (" not in content:
    content = content.replace("            </div>\n        </div>\n    </div>\n  );\n};\n", toast_ui + "\n            </div>\n        </div>\n    </div>\n  );\n};\n")

with open('AdminDashboard.tsx', 'w') as f:
    f.write(content)

print("AdminDashboard patched successfully.")
