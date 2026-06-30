import re

with open("Setup.tsx", "r") as f:
    content = f.read()

# Make the vault always visible, and add empty state
vault_start = r'\{savedCharacters\.length > 0 && \(\s*(<div className=\{`mt-5 pt-4 border-t-2)'
vault_end = r'(</button>\s*</div>\s*</div>\s*</div>\s*\)\)\}\s*</div>\s*</div>\s*)\)\}'

# We need to replace `{savedCharacters.length > 0 && (` with just the div, and add an empty state inside
def replacer(match):
    return match.group(1)

content = re.sub(vault_start, replacer, content)

# Now we need to handle the end of that block.
# Actually, since regex is tricky for balanced parentheses, I'll just find and replace by string literal.

