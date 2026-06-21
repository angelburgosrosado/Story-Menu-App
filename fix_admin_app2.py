import re

with open('AdminApp.tsx', 'r') as f:
    content = f.read()

content = content.replace("getUserTokenBalance", "checkUserBalance")
content = content.replace("import('./storageFirestore')", "import('./check_balance')")
content = re.sub(r'isOpen={isOpen}', '', content)
content = re.sub(r'onClose={onClose}', '', content)
content = re.sub(r'isOpen\s*\?\s*', '', content)
content = re.sub(r'isOpen={.*?}', '', content)
content = re.sub(r'onClose={.*?}', '', content)

with open('AdminApp.tsx', 'w') as f:
    f.write(content)

