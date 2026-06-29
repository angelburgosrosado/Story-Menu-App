with open('Setup.tsx', 'r') as f:
    content = f.read()

with open('context_value.txt', 'r') as f:
    context_value = f.read()

# The main return starts like this:
# return (
#     <div className="flex h-screen bg-[#111] overflow-hidden text-white font-sans text-sm relative">

# We need to replace it with:
#     const workspaceContextValue = { ... }
#     return (
#         <WorkspaceContext.Provider value={workspaceContextValue}>
#             <div ...>
#                 ...
#         </WorkspaceContext.Provider>
#     );

# 1. Add the context value before `return (`
idx_return = content.rfind("    return (\n")
if idx_return == -1:
    idx_return = content.rfind("    return (")

if idx_return != -1:
    new_content = content[:idx_return] + context_value + "    return (\n        <WorkspaceContext.Provider value={workspaceContextValue}>\n" + content[idx_return + 13:-2] + "\n        </WorkspaceContext.Provider>\n    );\n};\n"
    
    # Also add import at the top
    if "import { WorkspaceContext" not in new_content:
        new_content = new_content.replace("import React,", "import { WorkspaceContext } from './WorkspaceContext';\nimport React,")
        
    with open('Setup.tsx', 'w') as f:
        f.write(new_content)
    print("Patched Setup.tsx with Context Provider")
else:
    print("Could not find return statement")
