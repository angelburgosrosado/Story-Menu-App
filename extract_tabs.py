import re
import subprocess

# get original file
res = subprocess.run(["git", "show", "HEAD:AdminApp.tsx"], capture_output=True, text=True)
original_code = res.stdout

# The tabs we want start at {activeTab === 'administrators' and end before {activeTab === 'ai_sandbox'
match = re.search(r"(\s*\{activeTab === 'administrators'.*?)\s*\{activeTab === 'ai_sandbox'", original_code, re.DOTALL)
if match:
    missing_tabs = match.group(1)
    with open("missing_tabs.tsx", "w") as f:
        f.write(missing_tabs)
    print(f"Extracted {len(missing_tabs.splitlines())} lines.")
else:
    print("Could not extract tabs")
