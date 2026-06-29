import re

with open('AdminPromptSandbox.tsx', 'r') as f:
    code = f.read()

state_injection = """
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
"""

code = code.replace("    const [heroDesc, setHeroDesc]", state_injection)

# Replace Hero block
hero_search = """{/* Hero */}
                                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm relative">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">HERO</p>
                                        {heroBase64 ? (
                                            <div className="flex items-center gap-2">
                                                <img src={`data:image/jpeg;base64,${heroBase64}`} className="w-6 h-6 object-cover rounded" />
                                                <button onClick={() => setHeroBase64('')} className="text-[10px] text-red-500 hover:underline">Remove</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => heroFileInputRef.current?.click()} className="text-[10px] flex items-center gap-1 text-slate-500 hover:text-blue-500 transition-colors">
                                                <UploadCloud size={12} /> Upload Face
                                            </button>
                                        )}
                                        <input type="file" accept="image/*" className="hidden" ref={heroFileInputRef} onChange={e => handleImageUpload(e, setHeroBase64)} />
                                    </div>
                                    <input placeholder="Description" value={heroDesc} onChange={e => setHeroDesc(e.target.value)} className="w-full border-b border-slate-200 px-2 py-1.5 text-slate-800 text-xs mb-2 focus:border-blue-500 outline-none bg-transparent" />
                                    <input placeholder="Visuals" value={heroVis} onChange={e => setHeroVis(e.target.value)} className="w-full px-2 py-1.5 text-slate-800 text-xs focus:border-blue-500 outline-none border-b border-slate-200 bg-transparent" />
                                </div>"""

hero_replace = """{/* Hero */}
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
                                        <input type="file" accept="image/*" className="hidden" ref={heroFileInputRef} onChange={e => handleImageUpload(e, setHeroBase64)} />
                                    </div>
                                    <input placeholder="Description" value={heroDesc} onChange={e => setHeroDesc(e.target.value)} className="w-full border-b border-slate-200 px-2 py-1.5 text-slate-800 text-xs mb-2 focus:border-blue-500 outline-none bg-transparent" />
                                    <input placeholder="Visuals" value={heroVis} onChange={e => setHeroVis(e.target.value)} className="w-full px-2 py-1.5 text-slate-800 text-xs focus:border-blue-500 outline-none border-b border-slate-200 bg-transparent" />
                                </div>"""

code = code.replace(hero_search, hero_replace)

# Repeat for Friend
friend_search = """{/* Friend */}
                                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm relative">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">FRIEND</p>
                                        {friendBase64 ? (
                                            <div className="flex items-center gap-2">
                                                <img src={`data:image/jpeg;base64,${friendBase64}`} className="w-6 h-6 object-cover rounded" />
                                                <button onClick={() => setFriendBase64('')} className="text-[10px] text-red-500 hover:underline">Remove</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => friendFileInputRef.current?.click()} className="text-[10px] flex items-center gap-1 text-slate-500 hover:text-emerald-500 transition-colors">
                                                <UploadCloud size={12} /> Upload Face
                                            </button>
                                        )}
                                        <input type="file" accept="image/*" className="hidden" ref={friendFileInputRef} onChange={e => handleImageUpload(e, setFriendBase64)} />
                                    </div>
                                    <input placeholder="Description" value={friendDesc} onChange={e => setFriendDesc(e.target.value)} className="w-full border-b border-slate-200 px-2 py-1.5 text-slate-800 text-xs mb-2 focus:border-emerald-500 outline-none bg-transparent" />
                                    <input placeholder="Visuals" value={friendVis} onChange={e => setFriendVis(e.target.value)} className="w-full px-2 py-1.5 text-slate-800 text-xs focus:border-emerald-500 outline-none border-b border-slate-200 bg-transparent" />
                                </div>"""
                                
friend_replace = """{/* Friend */}
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
                                        <input type="file" accept="image/*" className="hidden" ref={friendFileInputRef} onChange={e => handleImageUpload(e, setFriendBase64)} />
                                    </div>
                                    <input placeholder="Description" value={friendDesc} onChange={e => setFriendDesc(e.target.value)} className="w-full border-b border-slate-200 px-2 py-1.5 text-slate-800 text-xs mb-2 focus:border-emerald-500 outline-none bg-transparent" />
                                    <input placeholder="Visuals" value={friendVis} onChange={e => setFriendVis(e.target.value)} className="w-full px-2 py-1.5 text-slate-800 text-xs focus:border-emerald-500 outline-none border-b border-slate-200 bg-transparent" />
                                </div>"""
code = code.replace(friend_search, friend_replace)


# Repeat for Villain
villain_search = """{/* Villain */}
                                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm relative">
                                    <div className="flex justify-between items-center mb-2">
                                        <p className="text-[10px] font-bold text-red-600 uppercase tracking-wider">VILLAIN</p>
                                        {villainBase64 ? (
                                            <div className="flex items-center gap-2">
                                                <img src={`data:image/jpeg;base64,${villainBase64}`} className="w-6 h-6 object-cover rounded" />
                                                <button onClick={() => setVillainBase64('')} className="text-[10px] text-red-500 hover:underline">Remove</button>
                                            </div>
                                        ) : (
                                            <button onClick={() => villainFileInputRef.current?.click()} className="text-[10px] flex items-center gap-1 text-slate-500 hover:text-red-500 transition-colors">
                                                <UploadCloud size={12} /> Upload Face
                                            </button>
                                        )}
                                        <input type="file" accept="image/*" className="hidden" ref={villainFileInputRef} onChange={e => handleImageUpload(e, setVillainBase64)} />
                                    </div>
                                    <input placeholder="Description" value={villainDesc} onChange={e => setVillainDesc(e.target.value)} className="w-full border-b border-slate-200 px-2 py-1.5 text-slate-800 text-xs mb-2 focus:border-red-500 outline-none bg-transparent" />
                                    <input placeholder="Visuals" value={villainVis} onChange={e => setVillainVis(e.target.value)} className="w-full px-2 py-1.5 text-slate-800 text-xs focus:border-red-500 outline-none border-b border-slate-200 bg-transparent" />
                                </div>"""
                                
villain_replace = """{/* Villain */}
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
                                        <input type="file" accept="image/*" className="hidden" ref={villainFileInputRef} onChange={e => handleImageUpload(e, setVillainBase64)} />
                                    </div>
                                    <input placeholder="Description" value={villainDesc} onChange={e => setVillainDesc(e.target.value)} className="w-full border-b border-slate-200 px-2 py-1.5 text-slate-800 text-xs mb-2 focus:border-red-500 outline-none bg-transparent" />
                                    <input placeholder="Visuals" value={villainVis} onChange={e => setVillainVis(e.target.value)} className="w-full px-2 py-1.5 text-slate-800 text-xs focus:border-red-500 outline-none border-b border-slate-200 bg-transparent" />
                                </div>"""
code = code.replace(villain_search, villain_replace)


with open('AdminPromptSandbox.tsx', 'w') as f:
    f.write(code)

print("Patched AdminPromptSandbox.tsx successfully.")
