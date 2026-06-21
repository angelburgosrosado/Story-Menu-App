import re

# Fix AdminApp.tsx
with open('AdminApp.tsx', 'r') as f:
    content = f.read()

content = re.sub(r'isOpen\s*\?\s*', '', content)
content = re.sub(r'<div className="bg-slate-900 border border-slate-700/50 p-6 rounded text-center">.*?</div>', '', content, flags=re.DOTALL)
content = content.replace('onClick={onClose}', 'onClick={() => window.location.href = "/"}')

with open('AdminApp.tsx', 'w') as f:
    f.write(content)

# Fix server.ts import
with open('server.ts', 'r') as f:
    content = f.read()
content = content.replace("import admin from 'firebase-admin';", "import * as admin from 'firebase-admin';")

with open('server.ts', 'w') as f:
    f.write(content)

