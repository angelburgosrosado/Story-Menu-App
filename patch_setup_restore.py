import sys

with open('Setup.tsx', 'r') as f:
    content = f.read()

# 1. Add missing state variables
state_orig = """    const [vaultCharName, setVaultCharName] = useState('');
    const [vaultCharDesc, setVaultCharDesc] = useState('');
    const [vaultCharStyle, setVaultCharStyle] = useState('neon_cyberpunk');
    const [vaultReferenceImage, setVaultReferenceImage] = useState<string | null>(null);
    const [isVaultGenerating, setIsVaultGenerating] = useState(false);
    const [vaultStatusMsg, setVaultStatusMsg] = useState('');
    const [vaultGeneratedImage, setVaultGeneratedImage] = useState<string | null>(null);"""

state_new = """    const [vaultCharName, setVaultCharName] = useState('');
    const [vaultCharDesc, setVaultCharDesc] = useState('');
    const [vaultCharStyle, setVaultCharStyle] = useState('neon_cyberpunk');
    const [vaultReferenceImage, setVaultReferenceImage] = useState<string | null>(null);
    const [isVaultGenerating, setIsVaultGenerating] = useState(false);
    const [vaultStatusMsg, setVaultStatusMsg] = useState('');
    const [vaultGeneratedImage, setVaultGeneratedImage] = useState<string | null>(null);
    
    // New demographic state
    const [vaultAge, setVaultAge] = useState('');
    const [vaultGender, setVaultGender] = useState('');
    const [vaultEthnicity, setVaultEthnicity] = useState('');"""

content = content.replace(state_orig, state_new)

# 2. Add handleSurpriseMeVault before handleVaultGenerate
generate_orig = """    const handleVaultGenerate = async () => {"""

generate_new = """    const handleSurpriseMeVault = () => {
        const names = ["Zane Flux", "Nova Shift", "Kaelen Volt", "Lyra Trace"];
        const descs = ["A rogue AI hunter with neon tattoos.", "A cybernetic mechanic with a plasma wrench.", "A stealth operative with holographic camo."];
        const ages = ["Teenager", "Young Adult", "Middle-Aged"];
        const genders = ["Male", "Female", "Androgynous"];
        const ethnicities = ["Asian", "Black", "White", "Mixed Race"];
        setVaultCharName(names[Math.floor(Math.random() * names.length)]);
        setVaultCharDesc(descs[Math.floor(Math.random() * descs.length)]);
        setVaultAge(ages[Math.floor(Math.random() * ages.length)]);
        setVaultGender(genders[Math.floor(Math.random() * genders.length)]);
        setVaultEthnicity(ethnicities[Math.floor(Math.random() * ethnicities.length)]);
    };

    const handleVaultGenerate = async () => {"""

content = content.replace(generate_orig, generate_new)

with open('Setup.tsx', 'w') as f:
    f.write(content)

print("Setup.tsx restored missing demographics logic")
