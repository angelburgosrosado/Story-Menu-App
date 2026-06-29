with open('WorkspaceLibrary.tsx', 'r') as f:
    content = f.read()

# Replace props with context
new_content = content.replace(
    "export const WorkspaceLibrary = (props: any) => {",
    "import { useWorkspace } from './WorkspaceContext';\n\nexport const WorkspaceLibrary = () => {\n    const props = useWorkspace();"
)

with open('WorkspaceLibrary.tsx', 'w') as f:
    f.write(new_content)
print("Patched WorkspaceLibrary.tsx to use Context")
