import re

with open('Home.tsx', 'r') as f:
    home_content = f.read()

# Remove the avatar state variables and functions
home_content = re.sub(
    r'    // Avatar Creator State.*?(?=    const handleLaunchStudio)',
    r'',
    home_content,
    flags=re.DOTALL
)

# Remove the avatar UI block
home_content = re.sub(
    r'                \{/\* INTERACTIVE AVATAR CREATOR \*/\}.*?(?=                \{/\* The 3 Paths \(Feature Cards\) \*/\})',
    r'',
    home_content,
    flags=re.DOTALL
)

with open('Home.tsx', 'w') as f:
    f.write(home_content)

print("Home.tsx patched")
