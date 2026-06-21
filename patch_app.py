import re

with open('App.tsx', 'r') as f:
    content = f.read()

content = content.replace("import { AdminDashboard } from './AdminDashboard';\n", "")
content = re.sub(r'\s*const \[isAdminOpen, setIsAdminOpen\] = useState\(false\);', '', content)
content = content.replace("onOpenAdmin={() => setIsAdminOpen(true)}", "onOpenAdmin={() => window.location.href = '/admin'}")
content = re.sub(r'\{isAdminOpen && \(\s*<AdminDashboard\s*isOpen=\{isAdminOpen\}\s*onClose=\{.*?\}\s*/>\s*\)\}', '', content, flags=re.DOTALL)

with open('App.tsx', 'w') as f:
    f.write(content)

with open('Account.tsx', 'r') as f:
    account = f.read()
account = account.replace("onClick={onOpenAdmin}", "onClick={() => window.location.href = '/admin'}")
with open('Account.tsx', 'w') as f:
    f.write(account)

