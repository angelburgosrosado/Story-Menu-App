import re

targets = [
    'ar', 'bg', 'bn', 'cs', 'da', 'de', 'el', 'es', 'fi', 'fr', 
    'he', 'hi', 'hr', 'hu', 'id', 'it', 'ja', 'ko', 'ms', 'nl', 
    'no', 'pl', 'pt', 'ro', 'ru', 'sk', 'sv', 'ta', 'th', 'tl', 
    'tr', 'uk', 'vi', 'zh-CN', 'zh-TW'
]

sandbox2_vars = ["sandbox2_" + lang.replace('-', '_') for lang in targets]
sandbox2_vars.insert(0, "sandbox2_en")

import_sandbox2 = "import { " + ", ".join(sandbox2_vars) + " } from './sandbox2Locales';\n"

with open('i18n.ts', 'r') as f:
    content = f.read()

# Add the import below the other imports
content = content.replace("from './sandboxLocales';", "from './sandboxLocales';\n" + import_sandbox2)

# Add the mergeTranslations calls
merge_calls = "mergeTranslations(resources.en.translation, sandbox2_en);\n"
for lang in targets:
    var_sandbox2 = "sandbox2_" + lang.replace('-', '_')
    merge_calls += f"mergeTranslations(resources['{lang}'].translation, {var_sandbox2});\n"

content = content.replace("mergeTranslations(resources.en.translation, auto_en);", merge_calls + "mergeTranslations(resources.en.translation, auto_en);")

with open('i18n.ts', 'w') as f:
    f.write(content)

print("Patched i18n.ts with sandbox2 translations!")
