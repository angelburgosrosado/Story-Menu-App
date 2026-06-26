import React, { useState, useRef, useMemo } from 'react';
import { Loader2, Play, Image as ImageIcon, CheckCircle, Wand2, UploadCloud, Images, Code2, LayoutTemplate } from 'lucide-react';
import { Beat, Character } from './types';
import { GENRES, STYLE_KEYWORDS, ART_STYLES } from './types';

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

    // Sandbox Inputs
    const [selectedGenre, setSelectedGenre] = useState(GENRES[0]);
    const [selectedLanguage, setSelectedLanguage] = useState('en');
    const [creativeDirectives, setCreativeDirectives] = useState('');
    const [narrativeGuidance, setNarrativeGuidance] = useState('A cyberpunk encounter in a neon alley');
    
    // Character details
    const [heroDesc, setHeroDesc] = useState('A stoic cyborg detective with a trenchcoat');
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

    // Uploaded Image
    const [uploadedImageBase64, setUploadedImageBase64] = useState<string>('');
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                    userEmail: 'admin-sandbox@example.com'
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

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            const base64 = result.split(',')[1];
            setUploadedImageBase64(base64);
        };
        reader.readAsDataURL(file);
    };

    const handleAnalyzeImage = async () => {
        if (!uploadedImageBase64 && !imageResult && sequenceResults.length === 0) {
            setError("Please upload an image or generate one first to analyze.");
            return;
        }
        setLoadingAnalysis(true);
        setError('');
        try {
            const geminiKey = localStorage.getItem('GEMINI_API_KEY') || '';
            let base64ToAnalyze = uploadedImageBase64;
            if (!base64ToAnalyze && imageResult) {
                base64ToAnalyze = imageResult.split(',')[1];
            } else if (!base64ToAnalyze && sequenceResults.length > 0) {
                base64ToAnalyze = sequenceResults[0].split(',')[1];
            }

            const response = await fetch('/api/gemini/analyze-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-gemini-key': geminiKey },
                body: JSON.stringify({
                    userEmail: 'admin-sandbox@example.com',
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
            const heroRef: Character = { name: 'Hero', desc: heroDesc };
            const friendRef: Character = { name: 'Friend', desc: friendDesc };
            const villainRef: Character = { name: 'Villain', desc: villainDesc };

            const response = await fetch('/api/gemini/beat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-gemini-key': geminiKey },
                body: JSON.stringify({
                    userEmail: 'admin-sandbox@example.com',
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
        const heroRef: Character = { name: 'Hero', desc: heroDesc, base64: uploadedImageBase64 || undefined };
        const friendRef: Character = { name: 'Friend', desc: friendDesc };
        const villainRef: Character = { name: 'Villain', desc: villainDesc };
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
                userEmail: 'admin-sandbox@example.com',
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
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">Characters</h3>
                            <div className="space-y-3">
                                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                                    <p className="text-[10px] font-bold text-blue-600 mb-2 uppercase tracking-wider">HERO</p>
                                    <input placeholder="Description" value={heroDesc} onChange={e => setHeroDesc(e.target.value)} className="w-full border-b border-slate-200 px-2 py-1.5 text-slate-800 text-xs mb-2 focus:border-blue-500 outline-none bg-transparent" />
                                    <input placeholder="Visuals" value={heroVis} onChange={e => setHeroVis(e.target.value)} className="w-full px-2 py-1.5 text-slate-800 text-xs focus:border-blue-500 outline-none border-b border-slate-200 bg-transparent" />
                                </div>
                                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                                    <p className="text-[10px] font-bold text-emerald-600 mb-2 uppercase tracking-wider">FRIEND</p>
                                    <input placeholder="Description" value={friendDesc} onChange={e => setFriendDesc(e.target.value)} className="w-full border-b border-slate-200 px-2 py-1.5 text-slate-800 text-xs mb-2 focus:border-emerald-500 outline-none bg-transparent" />
                                    <input placeholder="Visuals" value={friendVis} onChange={e => setFriendVis(e.target.value)} className="w-full px-2 py-1.5 text-slate-800 text-xs focus:border-emerald-500 outline-none border-b border-slate-200 bg-transparent" />
                                </div>
                                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                                    <p className="text-[10px] font-bold text-red-600 mb-2 uppercase tracking-wider">VILLAIN</p>
                                    <input placeholder="Description" value={villainDesc} onChange={e => setVillainDesc(e.target.value)} className="w-full border-b border-slate-200 px-2 py-1.5 text-slate-800 text-xs mb-2 focus:border-red-500 outline-none bg-transparent" />
                                    <input placeholder="Visuals" value={villainVis} onChange={e => setVillainVis(e.target.value)} className="w-full px-2 py-1.5 text-slate-800 text-xs focus:border-red-500 outline-none border-b border-slate-200 bg-transparent" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center">
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2 self-start w-full text-left">Reference Image Upload</h3>
                            <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                ref={fileInputRef} 
                                onChange={handleImageUpload} 
                            />
                            {uploadedImageBase64 ? (
                                <div className="w-full flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <img src={`data:image/jpeg;base64,${uploadedImageBase64}`} alt="Uploaded" className="w-12 h-12 object-cover rounded shadow-sm" />
                                        <span className="text-xs font-bold text-slate-700">Image Loaded</span>
                                    </div>
                                    <button onClick={() => setUploadedImageBase64('')} className="text-red-500 hover:text-red-700 text-xs font-bold">Remove</button>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full py-4 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:bg-slate-100 hover:border-blue-400 hover:text-blue-600 transition-colors cursor-pointer"
                                >
                                    <UploadCloud size={20} className="mb-2" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Upload Reference</span>
                                </button>
                            )}
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
                                        <div key={i} className="rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-200 flex items-center justify-center relative">
                                            <img src={url} alt={`Sequence ${i}`} className="w-full h-full object-cover" />
                                            <div className="absolute top-1 left-1 bg-black/60 text-white text-[8px] px-1 rounded">Panel {i+1}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : imageResult ? (
                                <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-200 flex items-center justify-center relative">
                                    <img src={imageResult} alt="Generated visual" className="max-w-full max-h-full object-contain" />
                                    
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
                            disabled={loadingAnalysis || (!imageResult && sequenceResults.length === 0 && !uploadedImageBase64)}
                            className={`w-full py-3.5 rounded-xl font-bold shadow-md transition-all flex justify-center items-center gap-2 ${(!imageResult && sequenceResults.length === 0 && !uploadedImageBase64) ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none' : 'bg-slate-800 hover:bg-slate-700 text-white shadow-slate-900/20'}`}
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
        </div>
    );
};
