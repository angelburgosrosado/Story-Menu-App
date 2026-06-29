with open('Setup.tsx', 'r') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if "{/* TAB NAVIGATION: Generator vs Library */}" in line:
        start_idx = i
        break

if start_idx != -1:
    for i in range(start_idx, len(lines)):
        if "{(isCyberpunk || activeTab === 'generate') && (" in lines[i]:
            end_idx = i
            break

if start_idx != -1 and end_idx != -1:
    new_lines = lines[:start_idx] + [
        "                {/* Workspace Navigation */}\n",
        "                {!isCyberpunk && <WorkspaceNavigation />}\n",
        "\n"
    ] + lines[end_idx:]
    
    content = "".join(new_lines)
    if "import { WorkspaceNavigation }" not in content:
        content = content.replace("import { WorkspaceCasting }", "import { WorkspaceNavigation } from './WorkspaceNavigation';\nimport { WorkspaceCasting }")
        
    with open('Setup.tsx', 'w') as f:
        f.write(content)
    print("Replaced Tab Navigation with WorkspaceNavigation")
else:
    print("Could not find tab navigation block")
