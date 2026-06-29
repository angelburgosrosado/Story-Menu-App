with open('Setup.tsx', 'r') as f:
    content = f.read()

if "import { WorkspaceLibrary }" not in content:
    # Just put it after react imports
    content = content.replace("import React", "import { WorkspaceLibrary } from './WorkspaceLibrary';\nimport React", 1)
    
    with open('Setup.tsx', 'w') as f:
        f.write(content)
    print("Fixed import")
