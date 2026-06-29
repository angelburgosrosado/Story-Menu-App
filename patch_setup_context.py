import re

with open('Setup.tsx', 'r') as f:
    lines = f.readlines()

with open('context_value.txt', 'r') as f:
    context_value = f.read()

# Inject context value right before line 1512 (which is index 1511)
idx_return = -1
for i, line in enumerate(lines):
    if line.strip() == "return (" and i > 1400:
        idx_return = i
        break

if idx_return != -1:
    lines.insert(idx_return, context_value)
    
    # Now find the last </div> before </> 
    # Actually, we can just replace the final `    );\n};\n` with `    </WorkspaceContext.Provider>\n    );\n};\n`
    for i in range(len(lines)-1, -1, -1):
        if lines[i].strip() == "};":
            # The line before it should be `    );`
            if lines[i-1].strip() == ");":
                # Find the `</>` before that
                for j in range(i-1, -1, -1):
                    if lines[j].strip() == "</>":
                        # We need to wrap the contents of the main fragment.
                        # Wait, Setup.tsx returns `<> ... </>`
                        # Let's just put <WorkspaceContext.Provider value={workspaceContextValue}> after `<>` and `</WorkspaceContext.Provider>` before `</>`
                        break
                break

    # Let's do string replacement for safety
    content = "".join(lines)
    
    # Replace `return (` followed by `<>` with `<WorkspaceContext.Provider>`
    content = content.replace("return (\n        <>\n", "return (\n        <WorkspaceContext.Provider value={workspaceContextValue}>\n        <>\n")
    content = content.replace("return (\n        <>", "return (\n        <WorkspaceContext.Provider value={workspaceContextValue}>\n        <>")
    
    content = content.replace("\n        </>\n    );", "\n        </>\n        </WorkspaceContext.Provider>\n    );")
    
    if "import { WorkspaceContext" not in content:
        content = content.replace("import React,", "import { WorkspaceContext } from './WorkspaceContext';\nimport React,")
        
    with open('Setup.tsx', 'w') as f:
        f.write(content)
    print("Patched Setup.tsx with Context Provider securely")
else:
    print("Could not find return statement")
