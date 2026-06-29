import re

with open('Setup.tsx', 'r') as f:
    content = f.read()

# 1. Add import for WorkspaceSidebar at the top
if "WorkspaceSidebar" not in content:
    content = content.replace("import { useTranslation } from 'react-i18next';", "import { useTranslation } from 'react-i18next';\nimport { WorkspaceSidebar } from './WorkspaceSidebar';")

# 2. Find the outer layout container and inject a flex container.
# Currently it looks like:
# <div className="min-h-full flex items-center justify-center p-4 pb-36 md:p-8">
#   <div className={sOuterContainer}>

target_div = '<div className="min-h-full flex items-center justify-center p-4 pb-36 md:p-8">'
replacement_div = """
<div className="min-h-full flex flex-col md:flex-row p-0 md:p-0 h-screen w-screen overflow-hidden bg-slate-900">
    <WorkspaceSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
    <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
        <div className={sOuterContainer}>
"""

if target_div in content:
    content = content.replace(target_div, replacement_div)
    # Also need to add closing divs somewhere, but let's see where the block ends.

# 3. Remove the old tab navigation block.
tab_start = "{/* TAB NAVIGATION: Generator vs Library */}"
# We want to remove from tab_start down to the end of that div.
# We will use regex to find the block.
import re
# Find the index of tab_start
idx = content.find(tab_start)
if idx != -1:
    # Find the closing tag of the <div className={isEditorial ? "mb-6...
    # It's followed by `{!isCyberpunk && (` which has `)}` at the end of the block.
    # Let's just find the next `{/*` which is probably the next section.
    # We will do a safe string replacement for the known buttons.
    pass

with open('Setup.tsx', 'w') as f:
    f.write(content)

print("Setup.tsx modified.")
