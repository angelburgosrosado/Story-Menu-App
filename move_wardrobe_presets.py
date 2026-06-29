import re

with open('Setup.tsx', 'r') as f:
    content = f.read()

# Extract WARDROBE_PRESETS
start_idx = content.find("const WARDROBE_PRESETS = {")
if start_idx != -1:
    end_idx = content.find("    };", start_idx) + 6
    presets_block = content[start_idx:end_idx]
    
    # Remove it from Setup.tsx
    content = content[:start_idx] + content[end_idx:]
    
    with open('Setup.tsx', 'w') as f:
        f.write(content)
        
    # Append to types.ts
    with open('types.ts', 'a') as f:
        f.write("\nexport " + presets_block + "\n")
        
    print("Moved WARDROBE_PRESETS to types.ts")
