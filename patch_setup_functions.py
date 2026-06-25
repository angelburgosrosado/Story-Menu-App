import sys

with open('Setup.tsx', 'r') as f:
    content = f.read()

# Add handleSaveToVault if it's missing
if "const handleSaveToVault" not in content:
    idx = content.find("const handleVaultGenerate")
    if idx == -1:
        print("ERROR: handleVaultGenerate not found")
        sys.exit(1)
        
    save_fn = """    const handleSaveToVault = async () => {
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
    };

"""
    content = content[:idx] + save_fn + content[idx:]
    print("Added handleSaveToVault")
    
# Check handleVaultGenerate
if "setVaultGeneratedImage" not in content[content.find("const handleVaultGenerate"):content.find("handleGeminiKeyChange")]:
    print("WARNING: handleVaultGenerate is old, let's fix it!")
    
    # Let's replace the body of handleVaultGenerate
    start_idx = content.find("const handleVaultGenerate = async () => {")
    end_idx = content.find("    const handleGeminiKeyChange = (val: string) => {", start_idx)
    
    # Find the closing brace of handleVaultGenerate
    last_brace_idx = content.rfind("};", start_idx, end_idx) + 2
    
    new_generate = """const handleVaultGenerate = async () => {
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
"""
    content = content[:start_idx] + new_generate + content[last_brace_idx:]
    print("Fixed handleVaultGenerate")

with open('Setup.tsx', 'w') as f:
    f.write(content)

print("Setup.tsx functions patched")
