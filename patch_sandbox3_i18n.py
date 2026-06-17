import re

targets = [
    'ar', 'bg', 'bn', 'cs', 'da', 'de', 'el', 'es', 'fi', 'fr', 
    'he', 'hi', 'hr', 'hu', 'id', 'it', 'ja', 'ko', 'ms', 'nl', 
    'no', 'pl', 'pt', 'ro', 'ru', 'sk', 'sv', 'ta', 'th', 'tl', 
    'tr', 'uk', 'vi', 'zh-CN', 'zh-TW'
]

sandbox3_vars = ["sandbox3_" + lang.replace('-', '_') for lang in targets]
sandbox3_vars.insert(0, "sandbox3_en")

import_sandbox3 = "import { " + ", ".join(sandbox3_vars) + " } from './sandbox3Locales';\n"

with open('i18n.ts', 'r') as f:
    content = f.read()

# Add the import below the other imports
content = content.replace("from './sandbox2Locales';", "from './sandbox2Locales';\n" + import_sandbox3)

# Add the mergeTranslations calls
merge_calls = "mergeTranslations(resources.en.translation, sandbox3_en);\n"
for lang in targets:
    var_sandbox3 = "sandbox3_" + lang.replace('-', '_')
    merge_calls += f"mergeTranslations(resources['{lang}'].translation, {var_sandbox3});\n"

content = content.replace("mergeTranslations(resources.en.translation, auto_en);", merge_calls + "mergeTranslations(resources.en.translation, auto_en);")

with open('i18n.ts', 'w') as f:
    f.write(content)

print("Patched i18n.ts with sandbox3 translations!")
