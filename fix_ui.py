import re

with open('AdminApp.tsx', 'r') as f:
    code = f.read()

# 1. Clean up the useState
code = code.replace(
    "const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'ai_config' | 'plans' | 'features' | 'analytics'>('dashboard');",
    "const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'ai_config' | 'plans' | 'features' | 'ai_costs' | 'integrations' | 'administrators' | 'diagnostics' | 'ai_sandbox'>('dashboard');"
)

# 2. Remove the top buttons I added to the features tab
old_tabs = r"<button onClick=\{\(\) => setActiveTab\('features'\)\} className=\{`px-4 py-2 font-bold transition-all \$\{activeTab === 'features' \? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-slate-200'\}`\}>\s*UI Feature Flags\s*</button>\s*<button onClick=\{\(\) => setActiveTab\('analytics'\)\} className=\{`px-4 py-2 font-bold transition-all flex items-center gap-2 \$\{activeTab === 'analytics' \? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400 hover:text-slate-200'\}`\}>\s*<span>\$</span> Cost Analytics\s*</button>"
code = re.sub(old_tabs, "", code)

# 3. Migrate the new analytics UI block to replace the old `ai_costs` tab
# First, extract my new UI block
my_ui_match = re.search(r"\{activeTab === 'analytics' && \(\n\s*<div className=\"space-y-6 animate-in fade-in duration-200\">.*?</div>\n\s*\)\}", code, re.DOTALL)
if my_ui_match:
    my_ui = my_ui_match.group(0).replace("activeTab === 'analytics'", "activeTab === 'ai_costs'")
    
    # Remove my old UI block from where it was injected
    code = code.replace(my_ui_match.group(0), "")
    
    # Now find the old `ai_costs` block and replace it
    old_ai_costs_match = re.search(r"\{activeTab === 'ai_costs' && \(.*?\}\n\s*\)\}", code[code.find("{activeTab === 'ai_costs'"):], re.DOTALL)
    if old_ai_costs_match:
        old_ai_costs = old_ai_costs_match.group(0)
        # Actually, let's just do a simpler replacement
        code = code.replace(old_ai_costs, my_ui)

with open('AdminApp.tsx', 'w') as f:
    f.write(code)

print("AdminApp.tsx fixed")
