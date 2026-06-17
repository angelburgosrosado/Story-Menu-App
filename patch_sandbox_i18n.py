import re

targets = [
    'ar', 'bg', 'bn', 'cs', 'da', 'de', 'el', 'es', 'fi', 'fr', 
    'he', 'hi', 'hr', 'hu', 'id', 'it', 'ja', 'ko', 'ms', 'nl', 
    'no', 'pl', 'pt', 'ro', 'ru', 'sk', 'sv', 'ta', 'th', 'tl', 
    'tr', 'uk', 'vi', 'zh-CN', 'zh-TW'
]

sandbox_vars = ["sandbox_" + lang.replace('-', '_') for lang in targets]
sandbox_vars.insert(0, "sandbox_en")

import_sandbox = "import { " + ", ".join(sandbox_vars) + " } from './sandboxLocales';\n"

with open('i18n.ts', 'r') as f:
    content = f.read()

# Add the import below the other imports
content = content.replace("from './coreLocalesAll';", "from './coreLocalesAll';\n" + import_sandbox)

# Add the mergeTranslations calls
merge_calls = "mergeTranslations(resources.en.translation, sandbox_en);\n"
for lang in targets:
    var_sandbox = "sandbox_" + lang.replace('-', '_')
    merge_calls += f"mergeTranslations(resources['{lang}'].translation, {var_sandbox});\n"

content = content.replace("mergeTranslations(resources.en.translation, auto_en);", merge_calls + "mergeTranslations(resources.en.translation, auto_en);")

with open('i18n.ts', 'w') as f:
    f.write(content)

print("Patched i18n.ts with sandbox translations!")
