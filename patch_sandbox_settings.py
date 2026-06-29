import re

with open('AdminPromptSandbox.tsx', 'r') as f:
    code = f.read()

# Add states for settings
state_injection = """
    // Global Settings
    const [globalSettings, setGlobalSettings] = useState<any[]>([]);

    useEffect(() => {
        fetch('/api/admin/characters/global', { headers: { 'Authorization': `Bearer ${localStorage.getItem('ADMIN_TOKEN')}` }})
            .then(r => r.json())
            .then(data => setGlobalCharacters(data || []))
            .catch(console.error);
            
        fetch('/api/admin/settings', { headers: { 'Authorization': `Bearer ${localStorage.getItem('ADMIN_TOKEN')}` }})
            .then(r => r.json())
            .then(data => setGlobalSettings(data || []))
            .catch(console.error);
    }, []);
"""

# Replace existing globalCharacters fetch
old_fetch = r"useEffect\(\(\) => \{\n\s+fetch\('/api/admin/characters/global'.*?\}\, \[\]\);"
code = re.sub(old_fetch, state_injection.strip(), code, flags=re.DOTALL)

# Add UI panel just under the Advanced Prompt Sandbox header
ui_injection = """
                    {/* Live Backend Config Panel */}
                    {globalSettings.length > 0 && (
                        <div className="mt-4 mb-6 bg-blue-50/50 border border-blue-100 rounded-lg p-3 text-xs flex gap-6 items-center">
                            <div className="flex items-center gap-2 text-blue-700">
                                <Cpu size={14} />
                                <span className="font-semibold uppercase tracking-wider text-[10px]">Active Backend Config:</span>
                            </div>
                            <div className="flex gap-4 text-slate-600 font-mono">
                                <span>Model: <strong className="text-slate-800">{globalSettings.find(s => s.keyName === 'ai_model_default_text')?.keyValue || 'gemini-3.5-flash'}</strong></span>
                                <span>Temp: <strong className="text-slate-800">{globalSettings.find(s => s.keyName === 'ai_model_temperature')?.keyValue || '0.7'}</strong></span>
                                {globalSettings.find(s => s.keyName === 'ai_system_prompt_comic')?.keyValue && (
                                    <span className="text-emerald-600">✓ Custom Comic Prompt Active</span>
                                )}
                            </div>
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
"""

code = code.replace('<div className="grid grid-cols-1 md:grid-cols-2 gap-8">', ui_injection)

with open('AdminPromptSandbox.tsx', 'w') as f:
    f.write(code)

print("Sandbox patched to show Live Settings")
