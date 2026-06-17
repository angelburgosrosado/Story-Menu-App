import re

targets = [
    'ar', 'bg', 'bn', 'cs', 'da', 'de', 'el', 'es', 'fi', 'fr', 
    'he', 'hi', 'hr', 'hu', 'id', 'it', 'ja', 'ko', 'ms', 'nl', 
    'no', 'pl', 'pt', 'ro', 'ru', 'sk', 'sv', 'ta', 'th', 'tl', 
    'tr', 'uk', 'vi', 'zh-CN', 'zh-TW'
]

sandbox5_vars = ["sandbox5_" + lang.replace('-', '_') for lang in targets]
sandbox5_vars.insert(0, "sandbox5_en")

import_sandbox5 = "import { " + ", ".join(sandbox5_vars) + " } from './sandbox5Locales';\n"

with open('i18n.ts', 'r') as f:
    content = f.read()

# Add the import below the other imports
content = content.replace("from './sandbox4Locales';", "from './sandbox4Locales';\n" + import_sandbox5)

# Add the mergeTranslations calls
merge_calls = "mergeTranslations(resources.en.translation, sandbox5_en);\n"
for lang in targets:
    var_sandbox5 = "sandbox5_" + lang.replace('-', '_')
    merge_calls += f"mergeTranslations(resources['{lang}'].translation, {var_sandbox5});\n"

content = content.replace("mergeTranslations(resources.en.translation, auto_en);", merge_calls + "mergeTranslations(resources.en.translation, auto_en);")

with open('i18n.ts', 'w') as f:
    f.write(content)

print("Patched i18n.ts with sandbox5 translations!")
