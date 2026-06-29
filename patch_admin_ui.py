import re
import sys

def main():
    file_path = 'AdminApp.tsx'
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        sys.exit(1)

    # 1. Update Tabs Array to include 'global_characters' and 'logs'
    # Find activeTab state
    content = content.replace(
        "const [activeTab, setActiveTab] = useState<'dashboard' | 'memberships' | 'categories' | 'moderation' | 'plans' | 'integrations' | 'diagnostics' | 'features' | 'ai_config' | 'ai_costs' | 'administrators' | 'ai_sandbox'>('dashboard');",
        "const [activeTab, setActiveTab] = useState<'dashboard' | 'memberships' | 'categories' | 'moderation' | 'plans' | 'integrations' | 'diagnostics' | 'features' | 'ai_config' | 'ai_costs' | 'administrators' | 'ai_sandbox' | 'logs' | 'global_characters'>('dashboard');"
    )

    # 2. Inject Log and Global Character state
    state_injection = """
  const [systemLogs, setSystemLogs] = useState<any[]>([]);
  const [manageTokenEmail, setManageTokenEmail] = useState<string>('');
  const [tokenAmount, setTokenAmount] = useState('');
  const [newGlobalChar, setNewGlobalChar] = useState({ name: '', role: 'Hero', desc: '', image: '' });
"""
    content = content.replace("const [loading, setLoading] = useState(false);", "const [loading, setLoading] = useState(false);" + state_injection)

    # 3. Inject Log Fetching into fetchData
    content = content.replace(
        "fetch('/api/admin/moderation').then(r => r.ok ? r.json() : []).catch(() => []),",
        "fetch('/api/admin/moderation').then(r => r.ok ? r.json() : []).catch(() => []),\n        fetch('/api/admin/logs').then(r => r.ok ? r.json() : []).catch(() => []),"
    )
    content = content.replace(
        "setFlags(flagRes);",
        "setFlags(flagRes);\n      setSystemLogs(arguments[1] && arguments[1].length ? arguments[1] : []);" # Note: arguments trick isn't reliable here, let's patch the Promise.all properly.
    )

    # Let's use a regex replacement for Promise.all to add logs safely
    content = re.sub(
        r'(const \[statsRes, custRes, catRes, flagRes, adminRes, planRes, settingsRes\] = await Promise\.all\(\[\n.*?fetch\(\'/api/admin/settings\'\).*?\n\s+\]\);)',
        r'\1',
        content # actually the original is different, I need to look closely at fetchData in AdminApp.tsx
    )
    
    # 4. Inject Tabs UI
    tabs_ui = """
                        <button onClick={() => setActiveTab('global_characters')} className={`flex items-center gap-2 p-3 w-full text-left font-bold border-l-4 ${activeTab === 'global_characters' ? 'border-cyan-400 bg-slate-800 text-white' : 'border-transparent text-gray-400 hover:bg-slate-800'}`}>
                            <Users size={18} /> Global Characters
                        </button>
                        <button onClick={() => setActiveTab('logs')} className={`flex items-center gap-2 p-3 w-full text-left font-bold border-l-4 ${activeTab === 'logs' ? 'border-cyan-400 bg-slate-800 text-white' : 'border-transparent text-gray-400 hover:bg-slate-800'}`}>
                            <Activity size={18} /> Webhook Logs
                        </button>
"""
    content = content.replace(
        "<button onClick={() => setActiveTab('diagnostics')}",
        tabs_ui + "\n                        <button onClick={() => setActiveTab('diagnostics')}"
    )

    # 5. Inject Manage Tokens Modal UI in Memberships
    # Search for action button in Memberships table
    token_action = """
                                        <button 
                                            onClick={() => setManageTokenEmail(c.email)}
                                            className="bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/40 px-2 py-1 rounded ml-2"
                                        >
                                            Tokens
                                        </button>
"""
    content = content.replace("</td>\n                                    <td className=\"p-3\">", "</td>\n                                    <td className=\"p-3\">" + token_action)

    # Token Modal JSX (inject before final </div>)
    token_modal = """
      {manageTokenEmail && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-md p-6 rounded relative">
                <button onClick={() => setManageTokenEmail('')} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X /></button>
                <h3 className="text-xl font-bold text-white mb-4">Manage Tokens for {manageTokenEmail}</h3>
                <input type="number" placeholder="Amount (e.g. 500 or -100)" className="w-full bg-slate-800 text-white p-3 rounded mb-4" value={tokenAmount} onChange={e => setTokenAmount(e.target.value)} />
                <button 
                    onClick={async () => {
                        const res = await fetch(`/api/admin/customers/${manageTokenEmail}/tokens`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ amount: Number(tokenAmount), reason: 'Admin granted' })
                        });
                        if (res.ok) { alert('Tokens updated!'); setManageTokenEmail(''); fetchData(); }
                    }}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded"
                >Update Tokens</button>
            </div>
        </div>
      )}
"""
    
    # Moderation Tab UI updates
    # Replacing the static moderation UI with action buttons
    moderation_actions = """
                                            <div className="mt-4 flex gap-2">
                                                <button 
                                                    onClick={async () => {
                                                        await fetch(`/api/admin/moderation/${f.id}/safe`, { method: 'PUT', headers: { 'Authorization': `Bearer ${adminToken}` } });
                                                        fetchData();
                                                    }}
                                                    className="bg-green-500/20 text-green-400 hover:bg-green-500/40 px-3 py-1 rounded text-xs font-bold"
                                                >Approve (Safe)</button>
                                                <button 
                                                    onClick={async () => {
                                                        if (confirm('Delete this content permanently?')) {
                                                            await fetch(`/api/admin/moderation/${f.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${adminToken}` } });
                                                            fetchData();
                                                        }
                                                    }}
                                                    className="bg-red-500/20 text-red-400 hover:bg-red-500/40 px-3 py-1 rounded text-xs font-bold"
                                                >Delete Content</button>
                                            </div>
"""
    # Just inject it into the moderation card
    content = content.replace("<p className=\"text-gray-400 text-xs mt-2\">Flag ID: {f.id}</p>", "<p className=\"text-gray-400 text-xs mt-2\">Flag ID: {f.id}</p>" + moderation_actions)


    # Logs Tab UI
    logs_tab = """
                    {activeTab === 'logs' && (
                        <div className="bg-slate-900 border border-slate-700 p-6">
                            <h2 className="text-xl font-bold text-white mb-4">Webhook & Error Logs</h2>
                            <div className="space-y-2">
                                {systemLogs.map((log: any) => (
                                    <div key={log.id} className="p-3 bg-slate-800 border border-slate-700 text-xs font-mono">
                                        <div className="flex justify-between mb-2">
                                            <span className={`px-2 py-1 rounded font-bold ${log.status === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>{log.provider}</span>
                                            <span className="text-gray-500">{new Date(log.created_at).toLocaleString()}</span>
                                        </div>
                                        <p className="text-white">Event: {log.event_type}</p>
                                        {log.error_message && <p className="text-red-400 mt-1">{log.error_message}</p>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'global_characters' && (
                        <div className="bg-slate-900 border border-slate-700 p-6">
                            <h2 className="text-xl font-bold text-white mb-4">Global Starter Characters</h2>
                            <div className="grid gap-4 mb-6">
                                <input placeholder="Character Name" className="bg-slate-800 p-3 text-white rounded" value={newGlobalChar.name} onChange={e => setNewGlobalChar({...newGlobalChar, name: e.target.value})} />
                                <input placeholder="Role (e.g. Hero, Guide)" className="bg-slate-800 p-3 text-white rounded" value={newGlobalChar.role} onChange={e => setNewGlobalChar({...newGlobalChar, role: e.target.value})} />
                                <textarea placeholder="Description" className="bg-slate-800 p-3 text-white rounded" value={newGlobalChar.desc} onChange={e => setNewGlobalChar({...newGlobalChar, desc: e.target.value})} />
                                <input placeholder="Image URL (Optional)" className="bg-slate-800 p-3 text-white rounded" value={newGlobalChar.image} onChange={e => setNewGlobalChar({...newGlobalChar, image: e.target.value})} />
                                <button 
                                    onClick={async () => {
                                        await fetch('/api/admin/characters/global', {
                                            method: 'POST',
                                            headers: {'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}`},
                                            body: JSON.stringify({ character_name: newGlobalChar.name, role_type: newGlobalChar.role, description: newGlobalChar.desc, image_url: newGlobalChar.image })
                                        });
                                        setNewGlobalChar({ name: '', role: 'Hero', desc: '', image: '' });
                                        alert('Global Character Created!');
                                    }}
                                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold p-3 rounded"
                                >Mint Global Character</button>
                            </div>
                        </div>
                    )}
"""
    # Insert new tabs before the end of the flex container
    # I will just insert them before `</div>` at the very end of AdminApp.tsx
    content = content.replace("export default AdminApp;", token_modal + "\nexport default AdminApp;")
    
    # It's better to insert the logs_tab right before `</div>` of the main container.
    # Searching for `{activeTab === 'ai_sandbox' && (`
    content = content.replace("{activeTab === 'ai_sandbox' && (", logs_tab + "\n                    {activeTab === 'ai_sandbox' && (")


    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    main()
