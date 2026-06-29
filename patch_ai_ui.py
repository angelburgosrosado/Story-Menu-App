import re

with open('AdminApp.tsx', 'r') as f:
    code = f.read()

# Add AlignLeft to lucide imports if missing
if 'AlignLeft' not in code:
    code = re.sub(r"import \{ (.*?) \} from 'lucide-react';", r"import { \1, AlignLeft } from 'lucide-react';", code)

old_ui = r"\{\/\* AI Configuration \*\/\}.*?\{\/\* AI Costs \*\/\}"

new_ui = """{/* AI Configuration */}
                    {activeTab === 'ai_config' && (
                        <div className="p-8 bg-slate-50">
                            <div className="mb-8">
                                <h3 className="font-bold text-lg text-slate-800 mb-1">AI Engine Parameters</h3>
                                <p className="text-sm text-slate-500">Configure core model behavior and prompt engineering defaults to dynamically tune the app's generative outputs.</p>
                            </div>
                            
                            <div className="space-y-8 max-w-4xl">
                                
                                {/* Models & Creativity */}
                                <div>
                                    <h4 className="font-bold text-sm uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2"><Cpu size={14}/> Models & Creativity</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                            <div className="flex justify-between items-start mb-2">
                                                <label className="block text-sm font-bold text-slate-800">Default Text Model</label>
                                                <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-2 py-1 rounded">ai_model_default_text</span>
                                            </div>
                                            <p className="text-xs text-slate-500 mb-4">Overrides the hard-coded default model for all text generation routes. Does not affect image or TTS endpoints.</p>
                                            <select 
                                                className="w-full border border-slate-300 rounded-xl p-3 text-sm font-mono text-slate-700 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all"
                                                defaultValue={settings.find((s:any) => s.keyName === 'ai_model_default_text')?.keyValue || 'gemini-3.5-flash'}
                                                onChange={(e) => handleUpdateSetting('ai_model_default_text', e.target.value)}
                                            >
                                                <option value="gemini-3.5-flash">Gemini 3.5 Flash (Fast/Cheap)</option>
                                                <option value="gemini-3.5-pro">Gemini 3.5 Pro (Smart/Expensive)</option>
                                                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                                                <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                                            </select>
                                        </div>

                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                            <div className="flex justify-between items-start mb-2">
                                                <label className="block text-sm font-bold text-slate-800">Model Temperature</label>
                                                <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-2 py-1 rounded">ai_model_temperature</span>
                                            </div>
                                            <p className="text-xs text-slate-500 mb-4">Controls randomness (0.0 to 1.0). Lower = predictable/robotic. Higher = highly creative/chaotic.</p>
                                            <input 
                                                type="number" step="0.1" min="0" max="1"
                                                className="w-full border border-slate-300 rounded-xl p-3 text-sm font-mono text-slate-700 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all"
                                                defaultValue={settings.find((s:any) => s.keyName === 'ai_model_temperature')?.keyValue || '0.7'}
                                                onBlur={(e) => handleUpdateSetting('ai_model_temperature', e.target.value)}
                                            />
                                        </div>

                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                            <div className="flex justify-between items-start mb-2">
                                                <label className="block text-sm font-bold text-slate-800">Top-P Sampling</label>
                                                <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-2 py-1 rounded">ai_model_top_p</span>
                                            </div>
                                            <p className="text-xs text-slate-500 mb-4">Nucleus sampling (0.0 to 1.0). Limits the AI to a subset of most likely next words. 0.9 is standard.</p>
                                            <input 
                                                type="number" step="0.05" min="0" max="1"
                                                className="w-full border border-slate-300 rounded-xl p-3 text-sm font-mono text-slate-700 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all"
                                                defaultValue={settings.find((s:any) => s.keyName === 'ai_model_top_p')?.keyValue || '0.9'}
                                                onBlur={(e) => handleUpdateSetting('ai_model_top_p', e.target.value)}
                                            />
                                        </div>

                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                            <div className="flex justify-between items-start mb-2">
                                                <label className="block text-sm font-bold text-slate-800">Top-K Sampling</label>
                                                <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-2 py-1 rounded">ai_model_top_k</span>
                                            </div>
                                            <p className="text-xs text-slate-500 mb-4">Limits vocabulary choices. Lower numbers force common words. Higher allows rare words. (e.g. 40)</p>
                                            <input 
                                                type="number" step="1" min="1" max="100"
                                                className="w-full border border-slate-300 rounded-xl p-3 text-sm font-mono text-slate-700 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all"
                                                defaultValue={settings.find((s:any) => s.keyName === 'ai_model_top_k')?.keyValue || '40'}
                                                onBlur={(e) => handleUpdateSetting('ai_model_top_k', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* System Prompts */}
                                <div>
                                    <h4 className="font-bold text-sm uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2"><AlignLeft size={14}/> System Directives</h4>
                                    <div className="space-y-4">
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                            <div className="flex justify-between items-start mb-2">
                                                <label className="block text-sm font-bold text-slate-800">Comic Panel Director Prompt</label>
                                                <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-2 py-1 rounded">ai_system_prompt_comic</span>
                                            </div>
                                            <p className="text-xs text-slate-500 mb-4">Master instructions for the comic generator. Governs pacing, JSON structuring, and cinematic framing for images.</p>
                                            <textarea 
                                                className="w-full border border-slate-300 rounded-xl p-4 text-sm font-mono text-slate-700 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all resize-y h-32"
                                                defaultValue={settings.find((s:any) => s.keyName === 'ai_system_prompt_comic')?.keyValue || ''}
                                                onBlur={(e) => handleUpdateSetting('ai_system_prompt_comic', e.target.value)}
                                                placeholder="e.g. Ensure all scenes are highly cinematic..."
                                            />
                                        </div>

                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                            <div className="flex justify-between items-start mb-2">
                                                <label className="block text-sm font-bold text-slate-800">Writers Journal Persona Prompt</label>
                                                <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-2 py-1 rounded">ai_system_prompt_journal</span>
                                            </div>
                                            <p className="text-xs text-slate-500 mb-4">Sets the personality and voice of the AI when users generate ideas or character backgrounds.</p>
                                            <textarea 
                                                className="w-full border border-slate-300 rounded-xl p-4 text-sm font-mono text-slate-700 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none transition-all resize-y h-32"
                                                defaultValue={settings.find((s:any) => s.keyName === 'ai_system_prompt_journal')?.keyValue || ''}
                                                onBlur={(e) => handleUpdateSetting('ai_system_prompt_journal', e.target.value)}
                                                placeholder="e.g. You are an eccentric, highly analytical creative writing coach..."
                                            />
                                        </div>

                                        <div className="bg-red-50 p-6 rounded-2xl shadow-sm border border-red-200">
                                            <div className="flex justify-between items-start mb-2">
                                                <label className="block text-sm font-bold text-red-800">Global Moderation Rules</label>
                                                <span className="text-[10px] text-red-400 font-mono bg-red-100 px-2 py-1 rounded">moderation_rules</span>
                                            </div>
                                            <p className="text-xs text-red-600 mb-4">Strict negative constraints appended to all generative tasks to ensure safety and compliance.</p>
                                            <textarea 
                                                className="w-full border border-red-300 rounded-xl p-4 text-sm font-mono text-red-900 bg-white focus:border-red-500 outline-none transition-all resize-y h-24"
                                                defaultValue={settings.find((s:any) => s.keyName === 'moderation_rules')?.keyValue || ''}
                                                onBlur={(e) => handleUpdateSetting('moderation_rules', e.target.value)}
                                                placeholder="e.g. Never generate explicit content, political bias, etc..."
                                            />
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    )}

                    {/* AI Costs */}"""

code = re.sub(old_ui, new_ui, code, flags=re.DOTALL)

with open('AdminApp.tsx', 'w') as f:
    f.write(code)

print("GUI patched")
