import re

with open('AdminApp.tsx', 'r') as f:
    code = f.read()

# Let's see what's actually there right now for ai_costs
print("CURRENT:")
match = re.search(r"\{activeTab === 'ai_costs' && \(.*", code)
if match:
    print(match.group(0)[:200])

