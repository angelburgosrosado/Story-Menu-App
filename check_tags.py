import re

content = open('Home.tsx').read()
tags = []
for m in re.finditer(r'<(/)?([a-zA-Z0-9]+)([^>]*?)>', content):
    is_closing = bool(m.group(1))
    tag = m.group(2)
    attrs = m.group(3)
    
    if tag in ['img', 'br', 'hr', 'input']:
        continue
    if attrs.endswith('/'):
        continue
        
    if is_closing:
        if tags and tags[-1] == tag:
            tags.pop()
        else:
            print("Mismatched closing tag:", tag, "at match", m.group(0), "Expected:", tags[-1] if tags else "None")
    else:
        tags.append(tag)

if tags:
    print("Unclosed tags:", tags)
else:
    print("All tags matched!")
