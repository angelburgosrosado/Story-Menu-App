import re

with open('AdminApp.tsx', 'r') as f:
    code = f.read()

# Update newFeature state to include description
code = code.replace(
    "const [newFeature, setNewFeature] = useState({ keyName: 'feature_', keyValue: '', isSecret: false });",
    "const [newFeature, setNewFeature] = useState({ keyName: 'feature_', keyValue: '', isSecret: false, description: '' });"
)

# Replace the feature flag renderer
old_renderer = r"\{settings\.filter\(\(s:any\) => s\.keyName && s\.keyName\.startsWith\(\'feature_\'\)\)\.map\(\(s:any\) => \{.*?\}\)\}"

new_renderer = """{settings.filter((s:any) => s.keyName && s.keyName.startsWith('feature_')).map((s:any) => {
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
                                                        onClick={() => handleUpdateSetting(f, isEnabled ? 'false' : 'true', s.isSecret, s.description)}
                                                        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${isEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}
                                                    >
                                                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                                    </button>
                                                </div>
                                                
                                                <div className="mb-3 mt-3">
                                                    <textarea 
                                                        className="w-full text-xs text-slate-600 p-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none resize-none"
                                                        rows={2}
                                                        placeholder="Add an explanation for this feature..."
                                                        defaultValue={s.description || ''}
                                                        onBlur={(e) => {
                                                            if (e.target.value !== s.description) {
                                                                handleUpdateSetting(f, s.keyValue, s.isSecret, e.target.value);
                                                            }
                                                        }}
                                                    />
                                                </div>

                                                <p className="text-xs text-slate-500 mt-3 border-t border-slate-100 pt-3">
                                                    {isEnabled 
                                                        ? <span className="text-emerald-600 font-medium">✓ Globally Active</span> 
                                                        : <span className="text-amber-600 font-medium">⚠ Disabled Globally</span>}
                                                    <span className="block mt-1">Users require a Subscription Plan with this feature unlocked to access it.</span>
                                                </p>
                                            </div>
                                        );
                                    })}"""
code = re.sub(old_renderer, new_renderer, code, flags=re.DOTALL)

# Update handleUpdateSetting to accept description
old_handle_update = r"const handleUpdateSetting = async \(keyName: string, keyValue: string, isSecret = false\) => \{"
new_handle_update = "const handleUpdateSetting = async (keyName: string, keyValue: string, isSecret = false, description?: string) => {"
code = re.sub(old_handle_update, new_handle_update, code)

old_handle_post = r"await adminFetch\('/api/admin/settings', \{\s*method: 'POST',\s*headers: \{\s*'Content-Type': 'application/json'\s*\},\s*body: JSON\.stringify\(\{ keyName, keyValue, isSecret \}\)\s*\}\);"
new_handle_post = "await adminFetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keyName, keyValue, isSecret, description }) });"
code = re.sub(old_handle_post, new_handle_post, code)

# Update Add Flag UI
old_add_flag = r"type=\"text\" \n\s*placeholder=\"feature_my_new_flag\" \n\s*className=\"flex-1 border border-slate-300 p-2\.5 rounded-xl text-sm font-mono focus:border-blue-500 outline-none\" \n\s*value=\{newFeature\.keyName\} \n\s*onChange=\{e => setNewFeature\(\{\.\.\.newFeature, keyName: e\.target\.value\.toLowerCase\(\)\.replace\(/\[\^a-z0-9_\]/g, \'_'\)\}\)\} \n\s*\/>\n\s*<button"

new_add_flag = """type="text" 
                                                placeholder="feature_my_new_flag" 
                                                className="flex-1 border border-slate-300 p-2.5 rounded-xl text-sm font-mono focus:border-blue-500 outline-none" 
                                                value={newFeature.keyName} 
                                                onChange={e => setNewFeature({...newFeature, keyName: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_')})} 
                                            />
                                        </div>
                                        <div className="mt-3 flex gap-3">
                                            <input 
                                                type="text" 
                                                placeholder="Short explanation of what this feature does..." 
                                                className="flex-1 border border-slate-300 p-2.5 rounded-xl text-sm focus:border-blue-500 outline-none" 
                                                value={newFeature.description} 
                                                onChange={e => setNewFeature({...newFeature, description: e.target.value})} 
                                            />
                                            <button"""
code = re.sub(old_add_flag, new_add_flag, code)

old_add_post = r"JSON\.stringify\(\{ keyName: newFeature\.keyName, keyValue: 'false', isSecret: false \}\)"
new_add_post = "JSON.stringify({ keyName: newFeature.keyName, keyValue: 'false', isSecret: false, description: newFeature.description })"
code = re.sub(old_add_post, new_add_post, code)

old_reset = r"setNewFeature\(\{ keyName: 'feature_', keyValue: '', isSecret: false \}\);"
new_reset = "setNewFeature({ keyName: 'feature_', keyValue: '', isSecret: false, description: '' });"
code = re.sub(old_reset, new_reset, code)

with open('AdminApp.tsx', 'w') as f:
    f.write(code)

print("AdminApp.tsx patched")
