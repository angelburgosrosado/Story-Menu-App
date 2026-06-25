import re

with open('Setup.tsx', 'r') as f:
    setup_content = f.read()

# 1. Add state variables
state_vars_orig = """    const [vaultCharStyle, setVaultCharStyle] = useState('Comic Book');
    const [isVaultGenerating, setIsVaultGenerating] = useState(false);
    const [vaultStatusMsg, setVaultStatusMsg] = useState('');"""

state_vars_new = """    const [vaultCharStyle, setVaultCharStyle] = useState('Comic Book');
    const [vaultAge, setVaultAge] = useState('');
    const [vaultGender, setVaultGender] = useState('');
    const [vaultEthnicity, setVaultEthnicity] = useState('');
    const [isVaultGenerating, setIsVaultGenerating] = useState(false);
    const [vaultStatusMsg, setVaultStatusMsg] = useState('');
    
    const handleSurpriseMeVault = () => {
        const ages = ['Child', 'Teenager', 'Young Adult', 'Middle-Aged', 'Elderly'];
        const genders = ['Male', 'Female', 'Non-Binary', 'Androgynous'];
        const ethnicities = ['Asian', 'Black', 'Hispanic/Latino', 'Middle Eastern', 'White', 'Mixed Race', 'Indigenous'];
        const styles = ART_STYLES.map(s => s.id);
        
        setVaultAge(ages[Math.floor(Math.random() * ages.length)]);
        setVaultGender(genders[Math.floor(Math.random() * genders.length)]);
        setVaultEthnicity(ethnicities[Math.floor(Math.random() * ethnicities.length)]);
        setVaultCharStyle(styles[Math.floor(Math.random() * styles.length)]);
        setVaultCharDesc('A heroic adventurer ready for a comic book journey.');
        setVaultCharName('Hero_' + Math.floor(Math.random() * 1000));
    };"""

setup_content = setup_content.replace(state_vars_orig, state_vars_new)

# 2. Add payload modifications
payload_orig = """            const payload: any = {
                desc: vaultCharDesc,
                selectedGenre: vaultCharStyle,
                userEmail: props.activeCreator.email
            };"""

payload_new = """            const payload: any = {
                desc: vaultCharDesc,
                selectedGenre: vaultCharStyle,
                userEmail: props.activeCreator.email,
                age: vaultAge,
                gender: vaultGender,
                ethnicity: vaultEthnicity
            };"""

setup_content = setup_content.replace(payload_orig, payload_new)

# 3. Modify the UI
ui_orig = """                                    <div>
                                        <label className="block text-slate-400 mb-1 font-bold">Character Name</label>
                                        <input value={vaultCharName} onChange={e => setVaultCharName(e.target.value)} type="text" className="w-full bg-slate-900 border-2 border-black rounded p-2 text-white focus:outline-none focus:border-purple-500" placeholder="e.g. Zara Nexus" />
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 mb-1 font-bold">Description / Core Traits</label>
                                        <textarea value={vaultCharDesc} onChange={e => setVaultCharDesc(e.target.value)} rows={4} className="w-full bg-slate-900 border-2 border-black rounded p-2 text-white focus:outline-none focus:border-purple-500" placeholder="A futuristic hacker with neon blue hair and a cybernetic eye..." />
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 mb-1 font-bold">Art Style</label>
                                        <select value={vaultCharStyle} onChange={e => setVaultCharStyle(e.target.value)} className="w-full bg-slate-900 border-2 border-black rounded p-2 text-white focus:outline-none focus:border-purple-500">
                                             <option value="Comic Book">Comic Book</option>
                                             <option value="Anime">Anime / Manga</option>
                                             <option value="Cyberpunk">Cyberpunk 3D</option>
                                        </select>
                                    </div>"""

ui_new = """                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="block text-slate-400 font-bold">Character Name</label>
                                            <button type="button" onClick={handleSurpriseMeVault} className="text-[10px] bg-purple-900/50 hover:bg-purple-800 text-purple-200 px-2 py-1 rounded border border-purple-700">🎲 Surprise Me</button>
                                        </div>
                                        <input value={vaultCharName} onChange={e => setVaultCharName(e.target.value)} type="text" className="w-full bg-slate-900 border-2 border-black rounded p-2 text-white focus:outline-none focus:border-purple-500" placeholder="e.g. Zara Nexus" />
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="block text-slate-400 mb-1 font-bold">Age</label>
                                            <select value={vaultAge} onChange={(e) => setVaultAge(e.target.value)} className="w-full bg-slate-900 border-2 border-black rounded p-2 text-white focus:outline-none focus:border-purple-500">
                                                <option value="">Any</option>
                                                <option value="Child">Child</option>
                                                <option value="Teenager">Teenager</option>
                                                <option value="Young Adult">Young Adult</option>
                                                <option value="Middle-Aged">Middle-Aged</option>
                                                <option value="Elderly">Elderly</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-slate-400 mb-1 font-bold">Gender</label>
                                            <select value={vaultGender} onChange={(e) => setVaultGender(e.target.value)} className="w-full bg-slate-900 border-2 border-black rounded p-2 text-white focus:outline-none focus:border-purple-500">
                                                <option value="">Any</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Non-Binary">Non-Binary</option>
                                                <option value="Androgynous">Androgynous</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-slate-400 mb-1 font-bold">Ethnicity</label>
                                            <select value={vaultEthnicity} onChange={(e) => setVaultEthnicity(e.target.value)} className="w-full bg-slate-900 border-2 border-black rounded p-2 text-white focus:outline-none focus:border-purple-500">
                                                <option value="">Any</option>
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
                                        <label className="block text-slate-400 mb-1 font-bold">Description / Core Traits</label>
                                        <textarea value={vaultCharDesc} onChange={e => setVaultCharDesc(e.target.value)} rows={3} className="w-full bg-slate-900 border-2 border-black rounded p-2 text-white focus:outline-none focus:border-purple-500" placeholder="A futuristic hacker with neon blue hair and a cybernetic eye..." />
                                    </div>
                                    <div>
                                        <label className="block text-slate-400 mb-1 font-bold">Art Style</label>
                                        <select value={vaultCharStyle} onChange={e => setVaultCharStyle(e.target.value)} className="w-full bg-slate-900 border-2 border-black rounded p-2 text-white focus:outline-none focus:border-purple-500">
                                            {ART_STYLES.map(style => (
                                                <option key={style.id} value={style.id}>{style.name}</option>
                                            ))}
                                        </select>
                                    </div>"""

setup_content = setup_content.replace(ui_orig, ui_new)

# Clear variables on success
clear_orig = """                setVaultCharName('');
                setVaultCharDesc('');
                setVaultReferenceImage(null);"""

clear_new = """                setVaultCharName('');
                setVaultCharDesc('');
                setVaultReferenceImage(null);
                setVaultAge('');
                setVaultGender('');
                setVaultEthnicity('');"""

setup_content = setup_content.replace(clear_orig, clear_new)

with open('Setup.tsx', 'w') as f:
    f.write(setup_content)

print("Setup.tsx patched")
