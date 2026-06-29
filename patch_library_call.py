import re

with open('Setup.tsx', 'r') as f:
    content = f.read()

# Replace <WorkspaceLibrary ... /> with <WorkspaceLibrary />
# Since it might be multiline, we use a regex
content = re.sub(r'<WorkspaceLibrary\s+[^>]+>', '<WorkspaceLibrary />', content)

with open('Setup.tsx', 'w') as f:
    f.write(content)
print("Patched <WorkspaceLibrary /> in Setup.tsx")
