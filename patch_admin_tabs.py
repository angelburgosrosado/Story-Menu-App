import re

with open('AdminDashboard.tsx', 'r') as f:
    content = f.read()

# 1. Update activeTab type
content = content.replace(
    "const [activeTab, setActiveTab] = useState<'memberships' | 'categories' | 'moderation' | 'plans' | 'integrations' | 'landing' | 'diagnostics'>('memberships');",
    "const [activeTab, setActiveTab] = useState<'memberships' | 'categories' | 'moderation' | 'plans' | 'integrations' | 'landing' | 'diagnostics' | 'security'>('memberships');\n  const [adminUsers, setAdminUsers] = useState<any[]>([]);\n  const [newAdminEmail, setNewAdminEmail] = useState('');\n  const [newAdminPassword, setNewAdminPassword] = useState('');\n  const [stripeSecret, setStripeSecret] = useState('');\n  const [stripePub, setStripePub] = useState('');\n  const [paypalClient, setPaypalClient] = useState('');"
)

# 2. Update fetchData
fetch_target = """const [statsRes, custRes, catRes, flagRes, plansRes, settingsRes, landingRes] = await Promise.all([
        fetch('/api/admin/stats').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/admin/customers').then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/admin/categories').then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/admin/moderation').then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/admin/plans').then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/admin/settings').then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/public/landing').then(r => r.ok ? r.json() : {}).catch(() => ({}))
      ]);"""
fetch_repl = """const [statsRes, custRes, catRes, flagRes, plansRes, settingsRes, landingRes, adminRes] = await Promise.all([
        fetch('/api/admin/stats').then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/admin/customers').then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/admin/categories').then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/admin/moderation').then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/admin/plans').then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/admin/settings').then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/public/landing').then(r => r.ok ? r.json() : {}).catch(() => ({})),
        fetch('/api/admin/auth/users').then(r => r.ok ? r.json() : []).catch(() => [])
      ]);"""
content = content.replace(fetch_target, fetch_repl)

setters_target = """setSettings(Array.isArray(settingsRes) ? settingsRes : []);
      setLandingConfig(landingRes || {});"""
setters_repl = """setSettings(Array.isArray(settingsRes) ? settingsRes : []);
      setLandingConfig(landingRes || {});
      setAdminUsers(Array.isArray(adminRes) ? adminRes : []);
      if (Array.isArray(settingsRes)) {
          setStripeSecret(settingsRes.find(s => s.key_name === 'stripe_secret_key')?.key_value || '');
          setStripePub(settingsRes.find(s => s.key_name === 'stripe_publishable_key')?.key_value || '');
          setPaypalClient(settingsRes.find(s => s.key_name === 'paypal_client_id')?.key_value || '');
      }"""
content = content.replace(setters_target, setters_repl)

# 3. Handle Add Admin / Delete Admin / Save Settings
handle_logic = """
  const handleCreateAdmin = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newAdminEmail || !newAdminPassword) return;
      try {
          await fetch('/api/admin/auth/users', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username: newAdminEmail, password: newAdminPassword })
          });
          setNewAdminEmail('');
          setNewAdminPassword('');
          fetchData();
      } catch (err) {
          console.error(err);
      }
  };

  const handleDeleteAdmin = async (username: string) => {
      if (!confirm(`Revoke admin access for ${username}?`)) return;
      try {
          await fetch(`/api/admin/auth/users/${encodeURIComponent(username)}`, { method: 'DELETE' });
          fetchData();
      } catch (err) {
          console.error(err);
      }
  };

  const handleSaveSetting = async (keyName: string, keyValue: string, isSecret: boolean) => {
      try {
          await fetch('/api/admin/settings', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ keyName, keyValue, isSecret })
          });
          alert(`${keyName} saved successfully.`);
          fetchData();
      } catch (err) {
          console.error(err);
          alert(`Failed to save ${keyName}`);
      }
  };
"""
content = content.replace("const dialogRef = React.useRef<HTMLDialogElement>(null);", handle_logic + "\n  const dialogRef = React.useRef<HTMLDialogElement>(null);")


# 4. Add Security Tab button
nav_target = """<button 
                        onClick={() => setActiveTab('diagnostics')} """
nav_repl = """<button 
                        onClick={() => setActiveTab('security')} 
                        className={`px-4 py-2 font-bold uppercase text-xs flex items-center gap-2 ${activeTab === 'security' ? 'border-b-2 border-yellow-400 text-yellow-400' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                        <Shield size={14} /> Security & Access
                    </button>
                    <button 
                        onClick={() => setActiveTab('diagnostics')} """
content = content.replace(nav_target, nav_repl)


# 5. Add Security Tab Content
security_tab_content = """
                {activeTab === 'security' && (
                    <div className="bg-slate-950 border border-slate-700 p-4">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="font-bold text-lg text-yellow-400 flex items-center gap-2">
                                    <Shield size={20} /> Access Control Lists
                                </h3>
                                <p className="text-xs text-gray-400 mt-1">Manage users who have Super Admin clearance.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-bold text-sm text-slate-300 mb-3 border-b border-slate-800 pb-2">Authorized Administrators</h4>
                                {adminUsers.length === 0 ? (
                                    <div className="text-gray-500 text-xs italic bg-slate-900 p-4 rounded text-center">No admins configured. Check default credentials.</div>
                                ) : (
                                    <ul className="space-y-2">
                                        {adminUsers.map((user: any) => (
                                            <li key={user.username} className="flex justify-between items-center p-3 bg-slate-900 border border-slate-800 rounded">
                                                <div>
                                                    <div className="font-bold text-sm text-slate-200">{user.username}</div>
                                                    <div className="text-[10px] text-gray-500">Role: {user.role || 'Admin'} • Created: {new Date(user.created_at).toLocaleDateString()}</div>
                                                </div>
                                                <button 
                                                    onClick={() => handleDeleteAdmin(user.username)}
                                                    className="text-red-500 hover:text-red-400 p-2 rounded hover:bg-red-500/10 transition-colors"
                                                    title="Revoke Access"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="bg-slate-900 p-4 rounded border border-slate-800">
                                <h4 className="font-bold text-sm text-slate-300 mb-4">Grant Access</h4>
                                <form onSubmit={handleCreateAdmin} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1">Email Address</label>
                                        <input 
                                            type="email" 
                                            value={newAdminEmail}
                                            onChange={e => setNewAdminEmail(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-yellow-400 outline-none"
                                            placeholder="e.g. admin@story.menu"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 mb-1">Secure Password</label>
                                        <input 
                                            type="password" 
                                            value={newAdminPassword}
                                            onChange={e => setNewAdminPassword(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-sm text-white focus:border-yellow-400 outline-none"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                    <button 
                                        type="submit"
                                        className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 rounded transition-colors text-sm"
                                    >
                                        Create Administrator
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
"""
content = content.replace("{activeTab === 'diagnostics' && (", security_tab_content + "\n                {activeTab === 'diagnostics' && (")


# 6. Replace Integrations Tab
integrations_target_start = "{activeTab === 'integrations' && ("
integrations_target_end = ")}

                {activeTab === 'landing' && ("

old_integrations = content[content.find(integrations_target_start):content.find(integrations_target_end) + 2]

new_integrations = """{activeTab === 'integrations' && (
                    <div className="bg-slate-950 border border-slate-700 p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-sm text-cyan-400">Payment Gateway Integrations</h3>
                            <button className="bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1 rounded text-xs font-bold" onClick={() => fetchData()}>Refresh</button>
                        </div>
                        <div className="text-xs text-yellow-500 font-mono mb-6 bg-yellow-500/10 p-3 rounded border border-yellow-500/20">
                            * Tokens stored here override sandbox mocks. API keys are persisted securely in the database (`app_settings`) and synced to local environment variables.
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Stripe */}
                            <div className="p-5 bg-slate-900 border border-slate-800 rounded">
                                <h4 className="font-bold text-indigo-400 mb-4 flex items-center gap-2">Stripe Processor</h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Publishable Key</label>
                                        <div className="flex gap-2">
                                            <input type="text" value={stripePub} onChange={e => setStripePub(e.target.value)} className="w-full bg-slate-950 border border-slate-700 p-2 text-xs rounded text-white" placeholder="pk_live_..." />
                                            <button onClick={() => handleSaveSetting('stripe_publishable_key', stripePub, false)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 text-xs font-bold rounded">Save</button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Secret Key (Restricted)</label>
                                        <div className="flex gap-2">
                                            <input type="password" value={stripeSecret} onChange={e => setStripeSecret(e.target.value)} className="w-full bg-slate-950 border border-slate-700 p-2 text-xs rounded text-white" placeholder="sk_live_..." />
                                            <button onClick={() => handleSaveSetting('stripe_secret_key', stripeSecret, true)} className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 text-xs font-bold rounded">Save</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* PayPal */}
                            <div className="p-5 bg-slate-900 border border-slate-800 rounded">
                                <h4 className="font-bold text-blue-400 mb-4 flex items-center gap-2">PayPal Processor</h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Client ID</label>
                                        <div className="flex gap-2">
                                            <input type="text" value={paypalClient} onChange={e => setPaypalClient(e.target.value)} className="w-full bg-slate-950 border border-slate-700 p-2 text-xs rounded text-white" placeholder="Client ID from PayPal Developer Dashboard..." />
                                            <button onClick={() => handleSaveSetting('paypal_client_id', paypalClient, false)} className="bg-blue-600 hover:bg-blue-500 text-white px-3 text-xs font-bold rounded">Save</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}"""

content = content.replace(old_integrations, new_integrations)

with open('AdminDashboard.tsx', 'w') as f:
    f.write(content)

print("AdminDashboard.tsx patched successfully!")
