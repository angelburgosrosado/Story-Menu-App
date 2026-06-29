import re

with open('Setup.tsx', 'r') as f:
    lines = f.readlines()

start_setup = -1
end_setup = -1
for i, line in enumerate(lines):
    if "export const Setup:" in line:
        start_setup = i
    if start_setup != -1 and line.strip() == "return (":
        end_setup = i
        break

state_lines = lines[start_setup+1:end_setup]

variables = []

# Find all useState
for line in state_lines:
    match = re.search(r'const\s+\[([\w\s,]+)\]\s*=\s*useState', line)
    if match:
        vars = match.group(1).split(',')
        for v in vars:
            v = v.strip()
            if v:
                variables.append(v)

# Find all standard handlers: const handleSomething = ...
for line in state_lines:
    match = re.search(r'const\s+(handle[A-Z]\w+)\s*=', line)
    if match:
        variables.append(match.group(1))

# Find specific extra variables
extra = [
    'fileToBase64', 'appSkin', 'setAppSkin', 
]
for e in extra:
    if e not in variables:
        variables.append(e)

# Remove duplicates
variables = list(set(variables))

# Sort
variables.sort()

# Build the object string
obj_str = "    const workspaceContextValue = {\n        ...props,\n        " + ",\n        ".join(variables) + "\n    };\n"

print(obj_str)
with open('context_value.txt', 'w') as f:
    f.write(obj_str)

