import heic2any from 'heic2any';
import React, { useState, useRef, useMemo } from 'react';
import { Loader2, Play, Image as ImageIcon, CheckCircle, Wand2, UploadCloud, Images, Code2, LayoutTemplate } from 'lucide-react';
import { Beat } from './types';
import { GENRES, STYLE_KEYWORDS, ART_STYLES } from './types';

interface Character {
    name: string;
    desc: string;
    base64?: string;
}

export const AdminPromptSandbox: React.FC = () => {
    const [loadingBeat, setLoadingBeat] = useState(false);
    const [loadingImage, setLoadingImage] = useState(false);
    const [loadingSequence, setLoadingSequence] = useState(false);
    const [loadingAI, setLoadingAI] = useState<string | null>(null);
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);
    
    const [beatResult, setBeatResult] = useState<Beat | null>(null);
    const [imageResult, setImageResult] = useState<string>('');
    const [sequenceResults, setSequenceResults] = useState<string[]>([]);
    const [analysisResult, setAnalysisResult] = useState<string>('');
    const [error, setError] = useState('');
    const [expandedImage, setExpandedImage] = useState<string | null>(null);

    // Sandbox Inputs
    const [selectedGenre, setSelectedGenre] = useState(GENRES[0]);
    const [selectedLanguage, setSelectedLanguage] = useState('en');
    const [creativeDirectives, setCreativeDirectives] = useState('');
    const [narrativeGuidance, setNarrativeGuidance] = useState('A cyberpunk encounter in a neon alley');
    
    // Character details

    const [globalCharacters, setGlobalCharacters] = useState<any[]>([]);
    
    React.useEffect(() => {
        const fetchGlobalChars = async () => {
            const authEmail = localStorage.getItem('admin_email');
            if (!authEmail) return;
            try {
                const res = await fetch('/api/admin/characters/global', {
                    headers: { 'x-admin-email': authEmail }
                });
                if (res.ok) {
                    const data = await res.json();
                    setGlobalCharacters(data);
                }
            } catch (err) {
                console.error("Failed to fetch global chars", err);
            }
        };
        fetchGlobalChars();
    }, []);

    const mintCharacter = async (role: string, desc: string, visuals: string, base64: string) => {
        const authEmail = localStorage.getItem('admin_email');
        if (!authEmail) return;
        const name = prompt(`Enter a name for this ${role}:`);
        if (!name) return;
        
        try {
            await fetch('/api/admin/characters/global', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-admin-email': authEmail },
                body: JSON.stringify({
                    character_name: name,
                    role_type: role,
                    description: desc,
                    generation_prompt: visuals,
                    reference_images: base64 ? [base64] : [],
                    image_url: base64 ? (base64.startsWith('http') ? base64 : `data:image/jpeg;base64,${base64}`) : ''
                })
            });
            alert(`${name} minted successfully!`);
            const res = await fetch('/api/admin/characters/global', { headers: { 'x-admin-email': authEmail } });
            if (res.ok) setGlobalCharacters(await res.json());
        } catch (err) {
            console.error("Failed to mint", err);
            alert('Failed to mint character');
        }
    };
    
    const applyGlobalCharacter = (charId: string, setDesc: any, setVis: any, setBase64: any) => {
        if (!charId) {
            setDesc(''); setVis(''); setBase64(''); return;
        }
        const char = globalCharacters.find(c => c.id === charId);
        if (char) {
            setDesc(char.description || '');
            setVis(char.generation_prompt || '');
            if (char.reference_images && char.reference_images.length > 0) {
                const b64 = char.reference_images[0];
                setBase64(b64.split(',')[1] || b64);
            } else if (char.image_url) {
                setBase64(char.image_url.split(',')[1] || char.image_url);
            }
        }
    };

    const [heroDesc, setHeroDesc]
 = useState('A stoic cyborg detective with a trenchcoat');
    const [heroVis, setHeroVis] = useState('Glowing red eye, chrome arm');
    const [friendDesc, setFriendDesc] = useState('A fast-talking hacker sidekick');
    const [friendVis, setFriendVis] = useState('Neon pink hair, AR goggles');
    const [villainDesc, setVillainDesc] = useState('A ruthless corporate enforcer');
    const [villainVis, setVillainVis] = useState('Black suit, mirrored mask');

    // Advanced Controls
    const [provider, setProvider] = useState<'gemini' | 'leonardo'>('gemini');
    const [artStyleOverride, setArtStyleOverride] = useState<string>('Auto');
    const [showRawPrompt, setShowRawPrompt] = useState(false);
    const [showLayout, setShowLayout] = useState(false);

    // Uploaded Images
    const [heroBase64, setHeroBase64] = useState<string>('');
    const [friendBase64, setFriendBase64] = useState<string>('');
    const [villainBase64, setVillainBase64] = useState<string>('');
    
    const heroFileInputRef = useRef<HTMLInputElement>(null);
    const friendFileInputRef = useRef<HTMLInputElement>(null);
    const villainFileInputRef = useRef<HTMLInputElement>(null);

    const compiledPrompt = useMemo(() => {
        let styleKeywords = STYLE_KEYWORDS[selectedGenre] || STYLE_KEYWORDS['Custom'] || 'clean illustration, modern aesthetic';
        if (artStyleOverride !== 'Auto') {
            const override = ART_STYLES.find(s => s.id === artStyleOverride);
            if (override) styleKeywords = override.promptTemplate;
        }

        let imageStylePrompt = `Art Style: ${styleKeywords}. `;
        let characterConsistencyPrompt = "";
        if (heroDesc || heroVis) characterConsistencyPrompt += `Hero: ${heroDesc}. Visuals: ${heroVis}. `;
        if (friendDesc || friendVis) characterConsistencyPrompt += `Friend: ${friendDesc}. Visuals: ${friendVis}. `;
        if (villainDesc || villainVis) characterConsistencyPrompt += `Villain: ${villainDesc}. Visuals: ${villainVis}. `;
        
        let narrativeImagePrompt = `Scene: ${beatResult?.scene || 'A mysterious setting.'} `;
        if (beatResult?.dialogue) narrativeImagePrompt += `Dialogue: "${beatResult.dialogue}". `;
        if (beatResult?.caption) narrativeImagePrompt += `Caption: "${beatResult.caption}". `;
        
        return `Generate an image for a comic panel. ${imageStylePrompt}${characterConsistencyPrompt}${narrativeImagePrompt}Genre: ${selectedGenre}. Language: ${selectedLanguage}.`;
    }, [selectedGenre, artStyleOverride, heroDesc, heroVis, friendDesc, friendVis, villainDesc, villainVis, beatResult, selectedLanguage]);


    const handleAIAssist = async (field: 'narrative_guidance' | 'creative_directives') => {
        setLoadingAI(field);
        setError('');
        try {
            const geminiKey = localStorage.getItem('GEMINI_API_KEY') || '';
            const currentValue = field === 'narrative_guidance' ? narrativeGuidance : creativeDirectives;
            
            const response = await fetch('/api/gemini/suggest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-gemini-key': geminiKey },
                body: JSON.stringify({
                    fieldName: field === 'narrative_guidance' ? 'Narrative Guidance' : 'Creative Directives',
                    currentValue,
                    genre: selectedGenre,
                    userEmail: localStorage.getItem('admin_email') || 'unknown'
                })
            });

            if (!response.ok) throw new Error(`Server failed: ${response.status}`);
            const data = await response.json();
            
            if (field === 'narrative_guidance') {
                setNarrativeGuidance(data.suggestion);
            } else {
                setCreativeDirectives(data.suggestion);
            }
        } catch (err: any) {
            setError(err.message || 'Failed to get AI suggestion');
        } finally {
            setLoadingAI(null);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (b64: string) => void) => {
        let file = e.target.files?.[0];
        if (!file) return;
        
        if (file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
            try {
                const converted = await heic2any({ blob: file, toType: 'image/jpeg' });
                file = (Array.isArray(converted) ? converted[0] : converted) as File;
            } catch (err) {
                console.error("HEIC conversion error", err);
            }
        }
        
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            const base64 = result.split(',')[1];
            setter(base64);
        };
        reader.readAsDataURL(file);
    };

    const handleAnalyzeImage = async () => {
        if (!heroBase64 && !friendBase64 && !villainBase64 && !imageResult && sequenceResults.length === 0) {
            setError("Please upload a character image or generate one first to analyze.");
            return;
        }
        setLoadingAnalysis(true);
        setError('');
        try {
            const geminiKey = localStorage.getItem('GEMINI_API_KEY') || '';
            let base64ToAnalyze = heroBase64 || friendBase64 || villainBase64;
            if (!base64ToAnalyze && imageResult) {
                base64ToAnalyze = imageResult.split(',')[1];
            } else if (!base64ToAnalyze && sequenceResults.length > 0) {
                base64ToAnalyze = sequenceResults[0].split(',')[1];
            }

            const response = await fetch('/api/gemini/analyze-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-gemini-key': geminiKey },
                body: JSON.stringify({
                    userEmail: localStorage.getItem('admin_email') || 'unknown',
                    imageBase64: base64ToAnalyze,
                    prompt: `Analyze this image in the context of a ${selectedGenre} comic. Does it match the following narrative guidance: "${narrativeGuidance}"? Please describe its contents, style, and whether it aligns.`
                })
            });

            if (!response.ok) throw new Error(`Analysis server failed: ${response.status}`);
            const data = await response.json();
            setAnalysisResult(data.analysis);
        } catch (err: any) {
            setError(err.message || 'Failed to analyze image');
        } finally {
            setLoadingAnalysis(false);
        }
    };

    const handleGenerateBeat = async () => {
        setLoadingBeat(true);
        setError('');
        try {
            const geminiKey = localStorage.getItem('GEMINI_API_KEY') || '';
            const heroRef: Character = { name: 'Hero', desc: heroDesc, base64: heroBase64 || undefined };
            const friendRef: Character = { name: 'Friend', desc: friendDesc, base64: friendBase64 || undefined };
            const villainRef: Character = { name: 'Villain', desc: villainDesc, base64: villainBase64 || undefined };

            const response = await fetch('/api/gemini/beat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-gemini-key': geminiKey },
                body: JSON.stringify({
                    userEmail: localStorage.getItem('admin_email') || 'unknown',
                    history: [], 
                    selectedGenre,
                    selectedLanguage,
                    creativeDirectives,
                    narrativeGuidance,
                    heroRef,
                    friendRef,
                    villainRef,
                    provider: 'gemini'
                })
            });

            if (!response.ok) throw new Error(`Server failed: ${response.status}`);
            
            const data = await response.json();
            let parsed = data;
            if (data.text) {
                const rawText = data.text.replace(/```json/g, '').replace(/```/g, '');
                parsed = JSON.parse(rawText);
            }
            setBeatResult(parsed);
        } catch (err: any) {
            setError(err.message || 'Failed to generate beat');
        } finally {
            setLoadingBeat(false);
        }
    };

    const _generateSingleImage = async (customPromptModifier: string = '') => {
        const geminiKey = localStorage.getItem('GEMINI_API_KEY') || '';
        const heroRef: Character = { name: 'Hero', desc: heroDesc, base64: heroBase64 || undefined };
        const friendRef: Character = { name: 'Friend', desc: friendDesc, base64: friendBase64 || undefined };
        const villainRef: Character = { name: 'Villain', desc: villainDesc, base64: villainBase64 || undefined };
        const styleEra = selectedGenre === 'Custom' ? "Modern American" : selectedGenre;
        
        let styleKeywords = STYLE_KEYWORDS[selectedGenre] || STYLE_KEYWORDS['Custom'] || 'clean illustration, modern aesthetic';
        if (artStyleOverride !== 'Auto') {
            const override = ART_STYLES.find(s => s.id === artStyleOverride);
            if (override) styleKeywords = override.promptTemplate;
        }

        const finalImagePrompt = customPromptModifier ? `${compiledPrompt} ${customPromptModifier}` : compiledPrompt;

        const response = await fetch('/api/gemini/image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-gemini-key': geminiKey },
            body: JSON.stringify({
                userEmail: localStorage.getItem('admin_email') || 'unknown',
                beat: beatResult,
                type: 'main',
                styleEra,
                styleKeywords,
                heroVisuals: heroVis,
                friendVisuals: friendVis,
                villainVisuals: villainVis,
                selectedGenre,
                selectedLanguage,
                heroRef,
                friendRef,
                villainRef,
                provider: provider,
                finalImagePrompt
            })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(`Image server failed: ${err.error || response.status}`);
        }
        const data = await response.json();
        return data.imageUrl;
    };

    const handleGenerateImage = async () => {
        if (!beatResult) return;
        setLoadingImage(true);
        setSequenceResults([]); // clear sequences if any
        setError('');
        try {
            const url = await _generateSingleImage();
            setImageResult(url);
        } catch (err: any) {
            setError(err.message || 'Failed to generate image');
        } finally {
            setLoadingImage(false);
        }
    };

    const handleGenerateSequence = async () => {
        if (!beatResult) return;
        setLoadingSequence(true);
        setImageResult(''); // clear single if any
        setSequenceResults([]);
        setError('');
        try {
            const angles = [
                "[MANDATORY: CLOSE-UP PORTRAIT OF HERO]",
                "[MANDATORY: WIDE ACTION SHOT OF HERO]",
                "[MANDATORY: OVER THE SHOULDER SHOT OF HERO]"
            ];
            
            const results = [];
            for (const angle of angles) {
                try {
                    const url = await _generateSingleImage(angle);
                    results.push(url);
                } catch (e: any) {
                    console.error("Failed sequence panel:", e);
                    // Push a placeholder error image
                    results.push("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNmOGU3ZTciIC8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjZWY0NDQ0IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+RmFpbGVkPC90ZXh0Pjwvc3ZnPg==");
                }
                setSequenceResults([...results]); // Update progressively
                // Add delay to prevent rate limits
                await new Promise(r => setTimeout(r, 4000));
            }
        } catch (err: any) {
            setError(err.message || 'Failed to generate sequence');
        } finally {
            setLoadingSequence(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300 p-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Play className="text-blue-600" size={20} />
                        Advanced Prompt Sandbox
                    </h2>
                    
                    {/* Multi-Model Toggle */}
                    <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200 shadow-inner">
                        <button 
                            onClick={() => setProvider('gemini')}
                            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${provider === 'gemini' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Gemini 2.5
                        </button>
                        <button 
                            onClick={() => setProvider('leonardo')}
                            className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${provider === 'leonardo' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Leonardo.ai
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></div>
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Inputs */}
                    <div className="space-y-8">
                        <div className="space-y-5 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Global Settings</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Genre</label>
                                    <select 
                                        value={selectedGenre} 
                                        onChange={e => setSelectedGenre(e.target.value)}
                                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none shadow-sm transition-all"
                                    >
                                        {GENRES.map(g => (
                                            <option key={g} value={g}>{g}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Language</label>
                                    <input 
                                        type="text" 
                                        value={selectedLanguage} 
                                        onChange={e => setSelectedLanguage(e.target.value)}
                                        className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none shadow-sm transition-all"
                                    />
                                </div>
                            </div>

                            {/* Art Style Override */}
                            <div>
                                <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Art Style Override</label>
                                <select 
                                    value={artStyleOverride} 
                                    onChange={e => setArtStyleOverride(e.target.value)}
                                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm font-medium focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none shadow-sm transition-all"
                                >
                                    <option value="Auto">Auto (From Genre)</option>
                                    {ART_STYLES.map(style => (
                                        <option key={style.id} value={style.id}>{style.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Narrative Guidance</label>
                                    <button 
                                        onClick={() => handleAIAssist('narrative_guidance')}
                                        disabled={loadingAI === 'narrative_guidance'}
                                        className="text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                                    >
                                        {loadingAI === 'narrative_guidance' ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                                        AI Assist
                                    </button>
                                </div>
                                <textarea 
                                    value={narrativeGuidance} 
                                    onChange={e => setNarrativeGuidance(e.target.value)}
                                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm h-20 focus:border-blue-500 outline-none shadow-sm resize-y"
                                />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Creative Directives</label>
                                    <button 
                                        onClick={() => handleAIAssist('creative_directives')}
                                        disabled={loadingAI === 'creative_directives'}
                                        className="text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors"
                                    >
                                        {loadingAI === 'creative_directives' ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                                        AI Assist
                                    </button>
                                </div>
                                <textarea 
                                    value={creativeDirectives} 
                                    onChange={e => setCreativeDirectives(e.target.value)}
                                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 text-sm h-16 focus:border-purple-500 outline-none shadow-sm resize-y"
                                />
                            </div>
                        </div>

                        <div className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Characters & Faces</h3>
                            <div className="space-y-3">
                                {/* Hero */}
                                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm relative">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">HERO</p>
                                        <select onChange={(e) => applyGlobalCharacter(e.target.value, setHeroDesc, setHeroVis, setHeroBase64)} className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1 py-0.5 outline-none">
                                            <option value="">Load Global...</option>
                                            {globalCharacters.filter(c => c.role_type === 'Hero').map(c => (
                                                <option key={c.id} value={c.id}>{c.character_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex justify-between items-center mb-2">
                                        <button onClick={() => mintCharacter('Hero', heroDesc, heroVis, heroBase64)} className="text-[10px] text-blue-600 hover:underline">Mint to Global</button>
                                        {heroBase64 ? (
                                            <div className="flex items-center gap-2">
                                                <img src={heroBase64.startsWith('http') ? heroBase64 : `data:image/jpeg;base64,${heroBase64}`} className="w-6 h-6 object-cover rounded" />
                                                <button onClick={() => setHeroBase64('')} className="text-[10px] text-red-500 hover:underline">Remove</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => heroFileInputRef.current?.click()} className="text-[10px] flex items-center gap-1 text-slate-500 hover:text-blue-500 transition-colors">
                                                <UploadCloud size={12} /> Upload Face
                                            </button>
                                        )}
                                        <input type="file" accept="image/*,.heic,.heif" className="hidden" ref={heroFileInputRef} onChange={e => handleImageUpload(e, setHeroBase64)} />
                                    </div>
                                    <input placeholder="Description" value={heroDesc} onChange={e => setHeroDesc(e.target.value)} className="w-full border-b border-slate-200 px-2 py-1.5 text-slate-800 text-xs mb-2 focus:border-blue-500 outline-none bg-transparent" />
                                    <input placeholder="Visuals" value={heroVis} onChange={e => setHeroVis(e.target.value)} className="w-full px-2 py-1.5 text-slate-800 text-xs focus:border-blue-500 outline-none border-b border-slate-200 bg-transparent" />
                                </div>
                                
                                {/* Friend */}
                                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm relative">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">FRIEND</p>
                                        <select onChange={(e) => applyGlobalCharacter(e.target.value, setFriendDesc, setFriendVis, setFriendBase64)} className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1 py-0.5 outline-none">
                                            <option value="">Load Global...</option>
                                            {globalCharacters.filter(c => c.role_type === 'Co-Star' || c.role_type === 'Friend').map(c => (
                                                <option key={c.id} value={c.id}>{c.character_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex justify-between items-center mb-2">
                                        <button onClick={() => mintCharacter('Co-Star', friendDesc, friendVis, friendBase64)} className="text-[10px] text-emerald-600 hover:underline">Mint to Global</button>
                                        {friendBase64 ? (
                                            <div className="flex items-center gap-2">
                                                <img src={friendBase64.startsWith('http') ? friendBase64 : `data:image/jpeg;base64,${friendBase64}`} className="w-6 h-6 object-cover rounded" />
                                                <button onClick={() => setFriendBase64('')} className="text-[10px] text-red-500 hover:underline">Remove</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => friendFileInputRef.current?.click()} className="text-[10px] flex items-center gap-1 text-slate-500 hover:text-emerald-500 transition-colors">
                                                <UploadCloud size={12} /> Upload Face
                                            </button>
                                        )}
                                        <input type="file" accept="image/*,.heic,.heif" className="hidden" ref={friendFileInputRef} onChange={e => handleImageUpload(e, setFriendBase64)} />
                                    </div>
                                    <input placeholder="Description" value={friendDesc} onChange={e => setFriendDesc(e.target.value)} className="w-full border-b border-slate-200 px-2 py-1.5 text-slate-800 text-xs mb-2 focus:border-emerald-500 outline-none bg-transparent" />
                                    <input placeholder="Visuals" value={friendVis} onChange={e => setFriendVis(e.target.value)} className="w-full px-2 py-1.5 text-slate-800 text-xs focus:border-emerald-500 outline-none border-b border-slate-200 bg-transparent" />
                                </div>
                                
                                {/* Villain */}
                                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm relative">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">VILLAIN</p>
                                        <select onChange={(e) => applyGlobalCharacter(e.target.value, setVillainDesc, setVillainVis, setVillainBase64)} className="text-[10px] bg-slate-50 border border-slate-200 rounded px-1 py-0.5 outline-none">
                                            <option value="">Load Global...</option>
                                            {globalCharacters.filter(c => c.role_type === 'Villain').map(c => (
                                                <option key={c.id} value={c.id}>{c.character_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex justify-between items-center mb-2">
                                        <button onClick={() => mintCharacter('Villain', villainDesc, villainVis, villainBase64)} className="text-[10px] text-red-600 hover:underline">Mint to Global</button>
                                        {villainBase64 ? (
                                            <div className="flex items-center gap-2">
                                                <img src={villainBase64.startsWith('http') ? villainBase64 : `data:image/jpeg;base64,${villainBase64}`} className="w-6 h-6 object-cover rounded" />
                                                <button onClick={() => setVillainBase64('')} className="text-[10px] text-red-500 hover:underline">Remove</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => villainFileInputRef.current?.click()} className="text-[10px] flex items-center gap-1 text-slate-500 hover:text-red-500 transition-colors">
                                                <UploadCloud size={12} /> Upload Face
                                            </button>
                                        )}
                                        <input type="file" accept="image/*,.heic,.heif" className="hidden" ref={villainFileInputRef} onChange={e => handleImageUpload(e, setVillainBase64)} />
                                    </div>
                                    <input placeholder="Description" value={villainDesc} onChange={e => setVillainDesc(e.target.value)} className="w-full border-b border-slate-200 px-2 py-1.5 text-slate-800 text-xs mb-2 focus:border-red-500 outline-none bg-transparent" />
                                    <input placeholder="Visuals" value={villainVis} onChange={e => setVillainVis(e.target.value)} className="w-full px-2 py-1.5 text-slate-800 text-xs focus:border-red-500 outline-none border-b border-slate-200 bg-transparent" />
                                </div>
                            </div>
                        </div>

                        <button 
                            onClick={handleGenerateBeat}
                            disabled={loadingBeat}
                            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-md shadow-blue-500/20 transition-all flex justify-center items-center gap-2"
                        >
                            {loadingBeat ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />}
                            Step 1: Generate Narrative Beat
                        </button>
                    </div>

                    {/* Right Column: Output */}
                    <div className="space-y-6 flex flex-col">
                        <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col shadow-inner">
                            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wider">
                                <CheckCircle size={16} className={beatResult ? 'text-emerald-500' : 'text-slate-400'} />
                                Generated Narrative Beat
                            </h3>
                            {beatResult ? (
                                <div className="flex-1 overflow-auto bg-white rounded-xl p-4 border border-slate-200 font-mono text-xs text-slate-700 shadow-sm leading-relaxed">
                                    <pre className="whitespace-pre-wrap">{JSON.stringify(beatResult, null, 2)}</pre>
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-slate-400 text-sm italic bg-white rounded-xl border border-slate-200 border-dashed">
                                    Waiting for generation...
                                </div>
                            )}
                        </div>

                        {/* Real-Time Prompt Debugger */}
                        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-inner">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <Code2 size={14} /> Compiled Prompt Preview
                                </h3>
                                <button 
                                    onClick={() => setShowRawPrompt(!showRawPrompt)}
                                    className="text-[10px] text-blue-400 hover:text-blue-300 underline"
                                >
                                    {showRawPrompt ? "Hide" : "Expand"}
                                </button>
                            </div>
                            {showRawPrompt && (
                                <div className="mt-2 text-[10px] font-mono text-emerald-400 bg-black/50 p-3 rounded-lg overflow-auto max-h-32">
                                    {compiledPrompt}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <button 
                                onClick={handleGenerateImage}
                                disabled={loadingImage || loadingSequence || !beatResult}
                                className={`flex-1 py-3.5 rounded-xl font-bold shadow-md transition-all flex justify-center items-center gap-2 ${beatResult ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-purple-500/20' : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'}`}
                            >
                                {loadingImage ? <Loader2 size={18} className="animate-spin" /> : <ImageIcon size={18} />}
                                Step 2: Single Panel
                            </button>

                            <button 
                                onClick={handleGenerateSequence}
                                disabled={loadingImage || loadingSequence || !beatResult}
                                className={`flex-1 py-3.5 rounded-xl font-bold shadow-md transition-all flex justify-center items-center gap-2 ${beatResult ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-amber-500/20' : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'}`}
                            >
                                {loadingSequence ? <Loader2 size={18} className="animate-spin" /> : <Images size={18} />}
                                Step 2: Character Sequence (x3)
                            </button>
                        </div>

                        <div className="min-h-[250px] bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col shadow-inner relative">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wider">
                                    <CheckCircle size={16} className={(imageResult || sequenceResults.length) ? 'text-emerald-500' : 'text-slate-400'} />
                                    Generated Visuals
                                </h3>
                                {(imageResult || sequenceResults.length > 0) && (
                                    <button 
                                        onClick={() => setShowLayout(!showLayout)}
                                        className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md transition-colors ${showLayout ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                                    >
                                        <LayoutTemplate size={12} /> Layout Mockup
                                    </button>
                                )}
                            </div>

                            {sequenceResults.length > 0 ? (
                                <div className="grid grid-cols-3 gap-2 h-full">
                                    {sequenceResults.map((url, i) => (
                                        <div key={i} onClick={() => setExpandedImage(url)} className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-200 flex items-center justify-center relative hover:opacity-90 transition-opacity cursor-pointer">
                                            <img src={url} alt={`Sequence ${i}`} className="w-full h-full object-cover" />
                                            <div className="absolute top-1 left-1 bg-black/60 text-white text-[8px] px-1 rounded">Panel {i+1}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : imageResult ? (
                                <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-200 flex items-center justify-center relative">
                                    <div onClick={() => setExpandedImage(imageResult)} className="w-full h-full flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer">
                                        <img src={imageResult} alt="Generated visual" className="max-w-full max-h-full object-contain" />
                                    </div>
                                    
                                    {showLayout && beatResult && (
                                        <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
                                            {beatResult.dialogue && (
                                                <div className="self-start max-w-[80%] bg-white rounded-[20px] rounded-bl-sm border-2 border-slate-800 p-3 shadow-md text-sm font-bold text-slate-800 relative">
                                                    {beatResult.dialogue}
                                                </div>
                                            )}
                                            {beatResult.caption && (
                                                <div className="self-center w-full bg-yellow-100 border-2 border-slate-800 p-2 shadow-md text-xs font-medium text-slate-800 text-center">
                                                    {beatResult.caption}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-slate-400 text-sm italic bg-white rounded-xl border border-slate-200 border-dashed">
                                    No images generated yet.
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={handleAnalyzeImage}
                            disabled={loadingAnalysis || (!imageResult && sequenceResults.length === 0 && !heroBase64 && !friendBase64 && !villainBase64)}
                            className={`w-full py-3.5 rounded-xl font-bold shadow-md transition-all flex justify-center items-center gap-2 ${(!imageResult && sequenceResults.length === 0 && !heroBase64 && !friendBase64 && !villainBase64) ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none' : 'bg-slate-800 hover:bg-slate-700 text-white shadow-slate-900/20'}`}
                        >
                            {loadingAnalysis ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18} />}
                            Step 3: Analyze Image Details
                        </button>

                        <div className="flex-1 min-h-[120px] bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col shadow-inner">
                            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2 uppercase tracking-wider">
                                <CheckCircle size={16} className={analysisResult ? 'text-emerald-500' : 'text-slate-400'} />
                                Image Detection Analysis
                            </h3>
                            {analysisResult ? (
                                <div className="flex-1 overflow-auto bg-white rounded-xl p-4 border border-slate-200 text-xs text-slate-700 shadow-sm leading-relaxed">
                                    <p className="whitespace-pre-wrap">{analysisResult}</p>
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-slate-400 text-sm italic bg-white rounded-xl border border-slate-200 border-dashed">
                                    Run analysis to evaluate the image context.
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>

            {/* Fullscreen Image Modal */}
            {expandedImage && (
                <div 
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-zoom-out"
                    onClick={() => setExpandedImage(null)}
                >
                    <div className="relative max-w-[95vw] max-h-[95vh] rounded-2xl overflow-hidden shadow-2xl bg-black flex items-center justify-center">
                        <img 
                            src={expandedImage} 
                            alt="Expanded panel" 
                            className="max-w-full max-h-[95vh] object-contain cursor-default"
                            onClick={(e) => e.stopPropagation()} 
                        />
                        <button 
                            onClick={() => setExpandedImage(null)}
                            className="absolute top-4 right-4 bg-black/50 hover:bg-black text-white p-2 rounded-full backdrop-blur-md transition-colors font-bold text-sm"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
