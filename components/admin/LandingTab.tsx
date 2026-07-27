import React from 'react';

interface LandingTabProps {
    landingConfig: any;
    fetchData: () => void;
}

export const LandingTab: React.FC<LandingTabProps> = ({ landingConfig, fetchData }) => {
    return (
        <div className="bg-slate-950 border border-slate-700 p-4">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-sm text-green-400">Dynamic Landing Page Configuration</h3>
                <button 
                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-1.5 rounded text-xs font-bold transition-colors shadow-lg" 
                    onClick={async () => {
                        const payload = {
                            heroBadge: (document.getElementById('lp_hero_badge') as HTMLInputElement).value,
                            heroTitle: (document.getElementById('lp_hero_title') as HTMLInputElement).value,
                            heroTitleHighlight: (document.getElementById('lp_hero_highlight') as HTMLInputElement).value,
                            heroSubtitle: (document.getElementById('lp_hero_sub') as HTMLTextAreaElement).value,
                            pathComicTitle: (document.getElementById('lp_path_comic_title') as HTMLInputElement).value,
                            pathComicDesc: (document.getElementById('lp_path_comic_desc') as HTMLTextAreaElement).value,
                            pathComicBtn: (document.getElementById('lp_path_comic_btn') as HTMLInputElement).value,
                            pathKidTitle: (document.getElementById('lp_path_kid_title') as HTMLInputElement).value,
                            pathKidDesc: (document.getElementById('lp_path_kid_desc') as HTMLTextAreaElement).value,
                            pathKidBtn: (document.getElementById('lp_path_kid_btn') as HTMLInputElement).value,
                            pathWriterTitle: (document.getElementById('lp_path_writer_title') as HTMLInputElement).value,
                            pathWriterDesc: (document.getElementById('lp_path_writer_desc') as HTMLTextAreaElement).value,
                            pathWriterBtn: (document.getElementById('lp_path_writer_btn') as HTMLInputElement).value,
                        };
                        await fetch('/api/admin/landing', { 
                            method: 'POST', 
                            headers: {'Content-Type': 'application/json'}, 
                            body: JSON.stringify(payload) 
                        });
                        fetchData();
                        alert("Landing Page Updated!");
                    }}
                >
                    Save Changes
                </button>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
                {/* Hero Section */}
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
                    <h4 className="font-bold text-white mb-2 flex items-center gap-2"><span className="text-xl">🦸</span> Hero Section</h4>
                    <div className="space-y-3">
                        <div>
                            <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Badge Text (e.g., The Ultimate AI Publishing Platform)</label>
                            <input id="lp_hero_badge" defaultValue={landingConfig?.heroBadge || ''} placeholder="Leave empty for default" className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded text-xs text-white" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Main Title (e.g., Create the Stories You've...)</label>
                                <input id="lp_hero_title" defaultValue={landingConfig?.heroTitle || ''} placeholder="Leave empty for default" className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded text-xs text-white" />
                            </div>
                            <div>
                                <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Title Highlight (e.g., Always Imagined)</label>
                                <input id="lp_hero_highlight" defaultValue={landingConfig?.heroTitleHighlight || ''} placeholder="Leave empty for default" className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded text-xs text-white" />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Subtitle Description</label>
                            <textarea id="lp_hero_sub" defaultValue={landingConfig?.heroSubtitle || ''} rows={3} placeholder="Leave empty for default" className="w-full bg-slate-950 border border-slate-700 p-2.5 rounded text-xs text-white" />
                        </div>
                    </div>
                </div>
                
                <div className="p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-xl text-xs text-yellow-500 italic">
                    Note: Additional sections like Features, Capabilities, and Visual Styles can be managed via the database directly or extended here in future updates. Currently, managing the Hero and Paths sections natively overrides the hardcoded text immediately.
                </div>
                
                {/* Paths Section */}
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
                    <h4 className="font-bold text-white mb-2 flex items-center gap-2"><span className="text-xl">🛤️</span> The 3 Paths</h4>
                    <div className="space-y-4">
                        <div className="p-3 border border-slate-700 rounded bg-slate-950">
                            <h5 className="text-xs font-bold text-indigo-400 mb-2">Comic Studio</h5>
                            <input id="lp_path_comic_title" defaultValue={landingConfig?.pathComicTitle || ''} placeholder="Title" className="w-full bg-slate-900 border border-slate-700 p-2 mb-2 rounded text-xs text-white" />
                            <textarea id="lp_path_comic_desc" defaultValue={landingConfig?.pathComicDesc || ''} rows={2} placeholder="Description" className="w-full bg-slate-900 border border-slate-700 p-2 mb-2 rounded text-xs text-white" />
                            <input id="lp_path_comic_btn" defaultValue={landingConfig?.pathComicBtn || ''} placeholder="Button Label" className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-xs text-white" />
                        </div>
                        <div className="p-3 border border-slate-700 rounded bg-slate-950">
                            <h5 className="text-xs font-bold text-emerald-400 mb-2">Kid Storymaker</h5>
                            <input id="lp_path_kid_title" defaultValue={landingConfig?.pathKidTitle || ''} placeholder="Title" className="w-full bg-slate-900 border border-slate-700 p-2 mb-2 rounded text-xs text-white" />
                            <textarea id="lp_path_kid_desc" defaultValue={landingConfig?.pathKidDesc || ''} rows={2} placeholder="Description" className="w-full bg-slate-900 border border-slate-700 p-2 mb-2 rounded text-xs text-white" />
                            <input id="lp_path_kid_btn" defaultValue={landingConfig?.pathKidBtn || ''} placeholder="Button Label" className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-xs text-white" />
                        </div>
                        <div className="p-3 border border-slate-700 rounded bg-slate-950">
                            <h5 className="text-xs font-bold text-amber-400 mb-2">Writer's Journal</h5>
                            <input id="lp_path_writer_title" defaultValue={landingConfig?.pathWriterTitle || ''} placeholder="Title" className="w-full bg-slate-900 border border-slate-700 p-2 mb-2 rounded text-xs text-white" />
                            <textarea id="lp_path_writer_desc" defaultValue={landingConfig?.pathWriterDesc || ''} rows={2} placeholder="Description" className="w-full bg-slate-900 border border-slate-700 p-2 mb-2 rounded text-xs text-white" />
                            <input id="lp_path_writer_btn" defaultValue={landingConfig?.pathWriterBtn || ''} placeholder="Button Label" className="w-full bg-slate-900 border border-slate-700 p-2 rounded text-xs text-white" />
                        </div>
                    </div>
                </div>
                
                {/* Advanced Capabilities & Styles JSON Section */}
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
                    <h4 className="font-bold text-white mb-2 flex items-center gap-2"><span className="text-xl">⚙️</span> Advanced JSON Configuration</h4>
                    <p className="text-xs text-gray-400">Override the raw `capabilitiesBadge`, `capabilitiesTitle`, `capabilitiesDesc`, or the `stylePreviews` and `capabilities` objects by providing a valid JSON payload. This will be merged into the config.</p>
                    <textarea id="lp_advanced_json" rows={6} placeholder={`{\n  "capabilitiesBadge": "Custom Badge",\n  "stylePreviews": { "custom": { "title": "...", "desc": "...", "cover": "...", "badge": "..." } }\n}`} className="w-full bg-slate-950 font-mono text-xs text-white p-3 rounded border border-slate-700"></textarea>
                    <button className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded text-xs font-bold" onClick={async () => {
                        try {
                            const raw = (document.getElementById('lp_advanced_json') as HTMLTextAreaElement).value;
                            if (!raw.trim()) { alert("Please enter valid JSON"); return; }
                            const parsed = JSON.parse(raw);
                            await fetch('/api/admin/landing', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(parsed) });
                            fetchData();
                            alert("Advanced Configuration Saved!");
                            (document.getElementById('lp_advanced_json') as HTMLTextAreaElement).value = '';
                        } catch (e: any) {
                            alert("Invalid JSON: " + e.message);
                        }
                    }}>Save JSON Config</button>
                </div>
            </div>
        </div>
    );
};
