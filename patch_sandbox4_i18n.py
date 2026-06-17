import re

targets = [
    'ar', 'bg', 'bn', 'cs', 'da', 'de', 'el', 'es', 'fi', 'fr', 
    'he', 'hi', 'hr', 'hu', 'id', 'it', 'ja', 'ko', 'ms', 'nl', 
    'no', 'pl', 'pt', 'ro', 'ru', 'sk', 'sv', 'ta', 'th', 'tl', 
    'tr', 'uk', 'vi', 'zh-CN', 'zh-TW'
]

sandbox4_vars = ["sandbox4_" + lang.replace('-', '_') for lang in targets]
sandbox4_vars.insert(0, "sandbox4_en")

import_sandbox4 = "import { " + ", ".join(sandbox4_vars) + " } from './sandbox4Locales';\n"

with open('i18n.ts', 'r') as f:
    content = f.read()

# Add the import below the other imports
content = content.replace("from './sandbox3Locales';", "from './sandbox3Locales';\n" + import_sandbox4)

# Add the mergeTranslations calls
merge_calls = "mergeTranslations(resources.en.translation, sandbox4_en);\n"
for lang in targets:
    var_sandbox4 = "sandbox4_" + lang.replace('-', '_')
    merge_calls += f"mergeTranslations(resources['{lang}'].translation, {var_sandbox4});\n"

content = content.replace("mergeTranslations(resources.en.translation, auto_en);", merge_calls + "mergeTranslations(resources.en.translation, auto_en);")

with open('i18n.ts', 'w') as f:
    f.write(content)

print("Patched i18n.ts with sandbox4 translations!")
