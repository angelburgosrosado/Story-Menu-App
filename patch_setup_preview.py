import re

with open('Setup.tsx', 'r') as f:
    setup_content = f.read()

# 1. Add state variable
state_orig = """    const [isVaultGenerating, setIsVaultGenerating] = useState(false);
    const [vaultStatusMsg, setVaultStatusMsg] = useState('');"""

state_new = """    const [isVaultGenerating, setIsVaultGenerating] = useState(false);
    const [vaultStatusMsg, setVaultStatusMsg] = useState('');
    const [vaultGeneratedImage, setVaultGeneratedImage] = useState<string | null>(null);"""

setup_content = setup_content.replace(state_orig, state_new)

# 2. Modify handleVaultGenerate & Add handleSaveToVault
generate_orig = """    const handleVaultGenerate = async () => {

        if (!vaultCharName.trim() || !vaultCharDesc.trim()) {
             setVaultStatusMsg("Name and Description are required.");
             return;
        }
        setIsVaultGenerating(true);
        setVaultStatusMsg("Summoning artist portal... Handcrafting dynamic cartoon portrait.");
        try {
            const endpoint = vaultReferenceImage ? '/api/leonardo/persona' : '/api/gemini/persona';
            const payload: any = {
                desc: vaultCharDesc,
                selectedGenre: vaultCharStyle,
                userEmail: props.activeCreator.email,
                age: vaultAge,
                gender: vaultGender,
                ethnicity: vaultEthnicity
            };
            if (vaultReferenceImage) {
                payload.referenceImage = vaultReferenceImage;
            }
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-gemini-key': geminiKey },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.base64 || data.imageUrl) {
                setVaultStatusMsg("Avatar summoned successfully! Saving to Vault...");
                const isFirebaseUser = props.activeCreator.id && props.activeCreator.id !== '00000000-0000-0000-0000-000000000000' && !props.activeCreator.id.includes('local-creator') && !props.activeCreator.id.includes('offline');
                
                const newChar = {
                    id: 'char_' + Date.now(),
                    name: vaultCharName,
                    description: vaultCharDesc,
                    imageUrl: data.imageUrl ? data.imageUrl : (data.base64.startsWith('data:') ? data.base64 : `data:image/jpeg;base64,${data.base64}`),
                    role: 'Vaulted',
                    powers: 'Unknown'
                };

                if (isFirebaseUser) {
                    await saveCharacterToFirestore(props.activeCreator.id, {
                        ...newChar,
                        userId: props.activeCreator.id,
                        createdAt: Date.now()
                    });
                } else {
                    const list = [...savedCharacters, newChar];
                    localStorage.setItem(`characters_${props.activeCreator.id}`, JSON.stringify(list));
                }
                
                // Refresh characters
                window.dispatchEvent(new Event('refresh-character-vault'));
                setVaultStatusMsg(`Character ${vaultCharName} saved to the Vault successfully!`);
                setVaultCharName('');
                setVaultCharDesc('');
                setVaultReferenceImage(null);
                setVaultAge('');
                setVaultGender('');
                setVaultEthnicity('');
            } else {
                setVaultStatusMsg("Art generation returned blank pixels. Please try again.");
            }
        } catch (e: any) {
            console.error("Vault generation failed:", e);
            setVaultStatusMsg("Ethereal art nexus connection lost: " + e.message);
        } finally {
            setIsVaultGenerating(false);
        }
    };"""

generate_new = """    const handleVaultGenerate = async () => {
        if (!vaultCharName.trim() || !vaultCharDesc.trim()) {
             setVaultStatusMsg("Name and Description are required.");
             return;
        }
        setIsVaultGenerating(true);
        setVaultGeneratedImage(null);
        setVaultStatusMsg("Summoning artist portal... Handcrafting dynamic cartoon portrait.");
        try {
            const endpoint = vaultReferenceImage ? '/api/leonardo/persona' : '/api/gemini/persona';
            const payload: any = {
                desc: vaultCharDesc,
                selectedGenre: vaultCharStyle,
                userEmail: props.activeCreator.email,
                age: vaultAge,
                gender: vaultGender,
                ethnicity: vaultEthnicity
            };
            if (vaultReferenceImage) {
                payload.referenceImage = vaultReferenceImage;
            }
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-gemini-key': geminiKey },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.base64 || data.imageUrl) {
                setVaultStatusMsg("Avatar generated successfully! Previewing...");
                setVaultGeneratedImage(data.imageUrl ? data.imageUrl : (data.base64.startsWith('data:') ? data.base64 : `data:image/jpeg;base64,${data.base64}`));
            } else {
                setVaultStatusMsg("Art generation returned blank pixels. Please try again.");
            }
        } catch (e: any) {
            console.error("Vault generation failed:", e);
            setVaultStatusMsg("Ethereal art nexus connection lost: " + e.message);
        } finally {
            setIsVaultGenerating(false);
        }
    };

    const handleSaveToVault = async () => {
        if (!vaultGeneratedImage) return;
        
        setVaultStatusMsg("Saving to Vault...");
        const isFirebaseUser = props.activeCreator.id && props.activeCreator.id !== '00000000-0000-0000-0000-000000000000' && !props.activeCreator.id.includes('local-creator') && !props.activeCreator.id.includes('offline');
        
        const newChar = {
            id: 'char_' + Date.now(),
            name: vaultCharName,
            description: vaultCharDesc,
            imageUrl: vaultGeneratedImage,
            role: 'Vaulted',
            powers: 'Unknown'
        };

        if (isFirebaseUser) {
            await saveCharacterToFirestore(props.activeCreator.id, {
                ...newChar,
                userId: props.activeCreator.id,
                createdAt: Date.now()
            });
        } else {
            const list = [...savedCharacters, newChar];
            localStorage.setItem(`characters_${props.activeCreator.id}`, JSON.stringify(list));
        }
        
        // Refresh characters
        window.dispatchEvent(new Event('refresh-character-vault'));
        setVaultStatusMsg(`Character ${vaultCharName} saved to the Vault successfully!`);
        
        // Reset state
        setVaultCharName('');
        setVaultCharDesc('');
        setVaultReferenceImage(null);
        setVaultAge('');
        setVaultGender('');
        setVaultEthnicity('');
        setVaultGeneratedImage(null);
    };"""

setup_content = setup_content.replace(generate_orig, generate_new)

# 3. Update the UI
ui_orig_regex = r"                      <div className=\"grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mt-6\">\n                           \{\/\* GENERATOR SIDE \*\/\}.*?(?=                                </div>\n                           </div>\n                      </div>\n                 </div>\n            </div>\n        \)\})"

ui_new = """                      <div className="flex flex-col gap-12 mt-6">
                           {/* GENERATOR AND PREVIEW SIDE */}
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                                {/* GENERATOR FORM */}
                                <div className="bg-slate-950 border-4 border-black p-6 rounded-[2rem] shadow-xl flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-mono text-yellow-300 font-bold mb-6 uppercase text-sm border-b-2 border-slate-800 pb-2 flex items-center gap-2">
                                            <span className="text-xl">🛠️</span> Character Forge
                                        </h3>
                                        <div className="space-y-5 font-mono text-xs">
                                            <div>
                                                <div className="flex justify-between items-center mb-2">
                                                    <label className="block text-slate-400 font-bold">1. Character Identity</label>
                                                    <button type="button" onClick={handleSurpriseMeVault} className="text-[10px] bg-purple-900/50 hover:bg-purple-800 text-purple-200 px-3 py-1.5 rounded-full border border-purple-700 transition-colors">🎲 Surprise Me</button>
                                                </div>
                                                <input value={vaultCharName} onChange={e => setVaultCharName(e.target.value)} type="text" className="w-full bg-slate-900 border-2 border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500" placeholder="e.g. Zara Nexus" />
                                            </div>
                                            
                                            <div>
                                                <label className="block text-slate-400 mb-2 font-bold">2. Demographic Profile</label>
                                                <div className="grid grid-cols-3 gap-3">
                                                    <select value={vaultAge} onChange={(e) => setVaultAge(e.target.value)} className="w-full bg-slate-900 border-2 border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500">
                                                        <option value="">Age</option>
                                                        <option value="Child">Child</option>
                                                        <option value="Teenager">Teenager</option>
                                                        <option value="Young Adult">Young Adult</option>
                                                        <option value="Middle-Aged">Middle-Aged</option>
                                                        <option value="Elderly">Elderly</option>
                                                    </select>
                                                    <select value={vaultGender} onChange={(e) => setVaultGender(e.target.value)} className="w-full bg-slate-900 border-2 border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500">
                                                        <option value="">Gender</option>
                                                        <option value="Male">Male</option>
                                                        <option value="Female">Female</option>
                                                        <option value="Non-Binary">Non-Binary</option>
                                                        <option value="Androgynous">Androgynous</option>
                                                    </select>
                                                    <select value={vaultEthnicity} onChange={(e) => setVaultEthnicity(e.target.value)} className="w-full bg-slate-900 border-2 border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500">
                                                        <option value="">Ethnicity</option>
                                                        <option value="Asian">Asian</option>
                                                        <option value="Black">Black</option>
                                                        <option value="Hispanic/Latino">Hispanic/Latino</option>
                                                        <option value="Middle Eastern">Middle Eastern</option>
                                                        <option value="White">White</option>
                                                        <option value="Mixed Race">Mixed Race</option>
                                                        <option value="Indigenous">Indigenous</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-slate-400 mb-2 font-bold">3. Core Traits & Concept</label>
                                                <textarea value={vaultCharDesc} onChange={e => setVaultCharDesc(e.target.value)} rows={3} className="w-full bg-slate-900 border-2 border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500" placeholder="A futuristic hacker with neon blue hair and a cybernetic eye..." />
                                            </div>
                                            
                                            <div>
                                                <label className="block text-slate-400 mb-2 font-bold">4. Art Style</label>
                                                <select value={vaultCharStyle} onChange={e => setVaultCharStyle(e.target.value)} className="w-full bg-slate-900 border-2 border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-purple-500">
                                                    {ART_STYLES.map(style => (
                                                        <option key={style.id} value={style.id}>{style.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            
                                            <div>
                                                <label className="block text-slate-400 mb-2 font-bold">5. Digital Avatar Photo (Optional)</label>
                                                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="w-full bg-slate-900 border-2 border-slate-800 rounded-xl p-2 text-white focus:outline-none focus:border-purple-500 text-[10px]" />
                                                {vaultReferenceImage && <p className="text-[10px] text-green-400 mt-1">✓ Image selected for Leonardo processing</p>}
                                            </div>
                                            
                                            {vaultStatusMsg && (
                                                <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl text-cyan-400 text-[10px] text-center">
                                                    {vaultStatusMsg}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <button disabled={isVaultGenerating} className="w-full mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-4 px-4 rounded-xl shadow-lg transition-all uppercase tracking-wider disabled:opacity-50" onClick={handleVaultGenerate}>
                                        {isVaultGenerating ? "Generating..." : "✨ Generate Profile"}
                                    </button>
                                </div>

                                {/* PREVIEW SIDE */}
                                <div className="bg-slate-900 border-4 border-slate-800 p-6 rounded-[2rem] shadow-inner flex flex-col">
                                    <h3 className="font-mono text-cyan-400 font-bold mb-6 uppercase text-sm border-b-2 border-slate-800 pb-2 flex items-center gap-2">
                                        <span className="text-xl">👁️</span> Live Preview
                                    </h3>
                                    
                                    <div className="flex-1 flex flex-col items-center justify-center relative aspect-[3/4] rounded-2xl overflow-hidden border-2 border-slate-800 bg-black">
                                        {vaultGeneratedImage ? (
                                            <img src={vaultGeneratedImage} alt="Generated Avatar" className="w-full h-full object-cover" />
                                        ) : isVaultGenerating ? (
                                            <div className="text-center text-indigo-500">
                                                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                                                <p className="font-bold animate-pulse font-mono text-xs">Summoning Leonardo.ai...</p>
                                            </div>
                                        ) : vaultReferenceImage ? (
                                            <img src={`data:image/jpeg;base64,${vaultReferenceImage}`} alt="Uploaded Preview" className="w-full h-full object-cover opacity-30 grayscale blur-sm" />
                                        ) : (
                                            <div className="text-center px-6 text-slate-600 font-mono text-xs">
                                                <div className="text-4xl mb-4 opacity-50">👤</div>
                                                <p>Your generated avatar will appear here.</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="mt-6">
                                        <button 
                                            disabled={!vaultGeneratedImage || isVaultGenerating} 
                                            onClick={handleSaveToVault}
                                            className={`w-full py-4 rounded-xl font-bold transition-all uppercase tracking-wider ${!vaultGeneratedImage || isVaultGenerating ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'}`}
                                        >
                                            💾 Save to Vault
                                        </button>
                                    </div>
                                </div>
                           </div>

                           {/* VAULT GALLERY SECTION */}
                           <div className="bg-slate-950 border-4 border-black p-8 rounded-[2rem] shadow-xl">
                                <h3 className="font-mono text-emerald-400 font-bold mb-6 uppercase text-sm border-b-2 border-slate-800 pb-2 flex items-center gap-2">
                                    <span className="text-xl">💎</span> Your Saved Characters ({savedCharacters.length})
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-6 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                     {savedCharacters.length === 0 ? (
                                         <div className="col-span-full p-12 border-4 border-dashed border-slate-800 rounded-2xl bg-slate-950/20 text-center text-slate-500 font-mono">
                                             <p className="text-sm font-bold">Your Vault is empty.</p>
                                         </div>
                                     ) : (
                                         savedCharacters.map(char => (
                                              <div key={char.id} className="group relative bg-slate-900 border-2 border-slate-800 p-2 rounded-xl hover:border-emerald-500 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all cursor-pointer">
                                                   <div className="aspect-[3/4] w-full bg-black rounded-lg overflow-hidden mb-3 relative">
                                                        <img src={char.imageUrl || 'https://via.placeholder.com/150'} alt={char.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                   </div>
                                                   <span className="font-mono font-bold text-xs text-white truncate block text-center mb-1">{char.name}</span>
                                                   {char.role === 'Vaulted' && (
                                                       <span className="font-mono text-[9px] text-emerald-400 block text-center uppercase tracking-widest">Vaulted</span>
                                                   )}
                                              </div>
                                         ))
                                     )}"""

import re
setup_content = re.sub(ui_orig_regex, ui_new, setup_content, flags=re.DOTALL)

with open('Setup.tsx', 'w') as f:
    f.write(setup_content)

print("Setup.tsx UI patched")
