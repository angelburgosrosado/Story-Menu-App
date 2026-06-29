import re

with open('Setup.tsx', 'r') as f:
    content = f.read()

# Replace the modal fixed layout with a flex-row sidebar layout
# Old:
#         <div className="fixed inset-0 z-[200] overflow-y-auto bg-black/90 backdrop-blur-md transition-all duration-500 ease-in-out"
#              style={{
#                  animation: props.isTransitioning ? 'knockout-exit 1s forwards cubic-bezier(.6,-0.28,.74,.05)' : 'none',
#                  pointerEvents: props.isTransitioning ? 'none' : 'auto'
#              }}>
#           
#           <div className="min-h-full flex items-center justify-center p-4 pb-36 md:p-8">
#             <div className={sOuterContainer}>

new_layout = """        <div className="fixed inset-0 z-[200] bg-black/90 flex flex-row overflow-hidden transition-all duration-500 ease-in-out"
             style={{
                 animation: props.isTransitioning ? 'knockout-exit 1s forwards cubic-bezier(.6,-0.28,.74,.05)' : 'none',
                 pointerEvents: props.isTransitioning ? 'none' : 'auto'
             }}>
          
          {/* New Vertical Sidebar */}
          {!isCyberpunk && <WorkspaceSidebar />}

          {/* Main Content Area */}
          <div className="flex-1 min-h-full overflow-y-auto p-4 pb-36 md:p-8 relative">
            <div className={sOuterContainer}>"""

content = re.sub(
    r'<div className="fixed inset-0 z-\[200\] overflow-y-auto bg-black/90[^>]*>.*?<div className="min-h-full flex items-center justify-center p-4 pb-36 md:p-8">\s*<div className=\{sOuterContainer\}>',
    new_layout,
    content,
    flags=re.DOTALL
)

# Remove the old WorkspaceNavigation
content = content.replace("                {/* Workspace Navigation */}\n                {!isCyberpunk && <WorkspaceNavigation />}\n", "")
content = content.replace("import { WorkspaceNavigation } from './WorkspaceNavigation';\n", "")

# Add WorkspaceSidebar import
if "import { WorkspaceSidebar }" not in content:
    content = content.replace("import { WorkspaceCasting }", "import { WorkspaceSidebar } from './WorkspaceSidebar';\nimport { WorkspaceCasting }")

with open('Setup.tsx', 'w') as f:
    f.write(content)

print("Setup.tsx layout updated successfully.")
