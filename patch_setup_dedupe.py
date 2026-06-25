with open('Setup.tsx', 'r') as f:
    content = f.read()

dup = """    const handleSurpriseMeVault = () => {
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
"""

content = content.replace(dup, "", 1)

with open('Setup.tsx', 'w') as f:
    f.write(content)
