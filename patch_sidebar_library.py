import re

with open('Setup.tsx', 'r') as f:
    content = f.read()

# Replace Tab Bar with WorkspaceSidebar
# Tab bar starts around line 1520 with `{/* Tab Bar */}` or similar.
# In Setup.tsx, the layout is:
# <div className="flex h-screen bg-[#111] overflow-hidden text-white font-sans text-sm relative">
#     {/* Top Navigation */}
#     <div className="absolute top-0 left-0 right-0 h-16 border-b-4 border-black ...
#     {/* Main Content Area */}
#     <div className="absolute top-16 left-0 right-0 bottom-0 flex flex-col">
#         {/* Tab Bar */}
#         <div className="flex bg-slate-900 border-b-4 border-black overflow-x-auto overflow-y-hidden ...
#             <button onClick={() => setActiveTab('generate')} ...>
#                 <span className="text-xl">🎬</span>
#                 <span className="font-mono uppercase font-bold tracking-wider">Director</span>
#             </button>
#         </div>

# We will replace `<div className="absolute top-16 left-0 right-0 bottom-0 flex flex-col">` with `flex flex-row`
# and replace the Tab Bar with `<WorkspaceSidebar activeTab={activeTab} setActiveTab={setActiveTab} />`
content = content.replace(
    '<div className="absolute top-16 left-0 right-0 bottom-0 flex flex-col">',
    '<div className="absolute top-16 left-0 right-0 bottom-0 flex flex-row">'
)

tab_bar_start = content.find('{/* Tab Bar */}')
if tab_bar_start != -1:
    tab_bar_end = content.find('            <div className="flex-1 overflow-y-auto relative bg-slate-800 p-2 lg:p-6 pb-24">', tab_bar_start)
    if tab_bar_end != -1:
        replacement = """{/* Sidebar */}
            <WorkspaceSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
"""
        content = content[:tab_bar_start] + replacement + content[tab_bar_end:]

# Replace Library block with `<WorkspaceLibrary />`
lib_start = content.find("{(!isCyberpunk && activeTab === 'library') && (")
lib_end = content.find("        {(activeTab === 'vault') && (")
if lib_start != -1 and lib_end != -1:
    content = content[:lib_start] + "{(!isCyberpunk && activeTab === 'library') && (\n            <WorkspaceLibrary />\n        )}\n\n" + content[lib_end:]

if "import { WorkspaceSidebar }" not in content:
    content = content.replace("import React,", "import { WorkspaceSidebar } from './WorkspaceSidebar';\nimport { WorkspaceLibrary } from './WorkspaceLibrary';\nimport React,")

with open('Setup.tsx', 'w') as f:
    f.write(content)
print("Patched Sidebar and Library")
