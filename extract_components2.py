with open('Setup.tsx', 'r') as f:
    lines = f.readlines()

persona_start = -1
for i, line in enumerate(lines):
    if "activeTab === 'persona'" in line:
        persona_start = i
        break

blueprint_start = -1
for i in range(persona_start+1, len(lines)):
    if "activeTab === 'blueprint'" in line:
        blueprint_start = i
        break

vault_start = -1
for i in range(blueprint_start+1, len(lines)):
    if "activeTab === 'vault'" in line:
        vault_start = i
        break

print(f"Persona: {persona_start}, Blueprint: {blueprint_start}, Vault: {vault_start}")
