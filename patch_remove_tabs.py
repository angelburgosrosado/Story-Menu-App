with open('Setup.tsx', 'r') as f:
    content = f.read()

start_marker = "{/* TAB NAVIGATION: Generator vs Library */}"
next_marker = "{activeTab === 'generate' && ("

idx_start = content.find(start_marker)
idx_end = content.find(next_marker)

if idx_start != -1 and idx_end != -1:
    content = content[:idx_start] + "{/* TAB NAVIGATION: Handled by Sidebar */}\n                " + content[idx_end:]
    with open('Setup.tsx', 'w') as f:
        f.write(content)
    print("Old tabs removed.")
else:
    print("Could not find markers.")
