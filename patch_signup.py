with open('SignupPage.tsx', 'r') as f:
    content = f.read()

if "useTranslation" not in content:
    content = content.replace("import React, { useState } from 'react';", "import React, { useState } from 'react';\nimport { useTranslation } from 'react-i18next';")

target_state = "const [name, setName] = useState('');"
if target_state in content and "const { t } = useTranslation();" not in content:
    content = content.replace(target_state, "const { t } = useTranslation();\n  const [name, setName] = useState('');")

with open('SignupPage.tsx', 'w') as f:
    f.write(content)

print("SignupPage patched.")
