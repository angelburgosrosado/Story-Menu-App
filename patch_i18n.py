import re

targets = [
    'ar', 'bg', 'bn', 'cs', 'da', 'de', 'el', 'es', 'fi', 'fr', 
    'he', 'hi', 'hr', 'hu', 'id', 'it', 'ja', 'ko', 'ms', 'nl', 
    'no', 'pl', 'pt', 'ro', 'ru', 'sk', 'sv', 'ta', 'th', 'tl', 
    'tr', 'uk', 'vi', 'zh-CN', 'zh-TW'
]

auto_vars = ["auto_" + lang.replace('-', '_') for lang in targets]
auto_vars.insert(0, "auto_en")

import_stmt = "import { " + ", ".join(auto_vars) + " } from './autoLocalesAll';\n"

resources_obj = "const resources: any = {\n  en,\n  es,\n  ja,\n"
for lang in targets:
    if lang not in ['es', 'ja']:
        # initialize empty translation block for languages that don't have hardcoded strings
        resources_obj += f"  '{lang}': {{ translation: {{}} }},\n"
resources_obj += "};\n"

merge_code = """
const mergeTranslations = (target: any, source: any) => {
  for (const ns of Object.keys(source)) {
    if (!target[ns]) target[ns] = {};
    Object.assign(target[ns], source[ns]);
  }
};

mergeTranslations(resources.en.translation, auto_en);
"""

for lang in targets:
    var_name = "auto_" + lang.replace('-', '_')
    merge_code += f"mergeTranslations(resources['{lang}'].translation, {var_name});\n"

init_code = """
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", // Default language, overridden by App.tsx URL logic
    fallbackLng: "en",
    interpolation: {
      escapeValue: false // React already escapes values
    }
  });

export default i18n;
"""

with open('i18n.ts', 'r') as f:
    content = f.read()

# Replace everything from `import { auto_en` downwards
content = re.sub(r"import \{ auto_en.*", "", content, flags=re.DOTALL)

with open('i18n.ts', 'w') as f:
    f.write(content)
    f.write(import_stmt + "\n")
    f.write(resources_obj + "\n")
    f.write(merge_code + "\n")
    f.write(init_code + "\n")

print("Patched i18n.ts")
