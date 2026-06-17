import re

targets = [
    'ar', 'bg', 'bn', 'cs', 'da', 'de', 'el', 'es', 'fi', 'fr', 
    'he', 'hi', 'hr', 'hu', 'id', 'it', 'ja', 'ko', 'ms', 'nl', 
    'no', 'pl', 'pt', 'ro', 'ru', 'sk', 'sv', 'ta', 'th', 'tl', 
    'tr', 'uk', 'vi', 'zh-CN', 'zh-TW'
]

auto_vars = ["auto_" + lang.replace('-', '_') for lang in targets]
auto_vars.insert(0, "auto_en")

core_vars = ["core_" + lang.replace('-', '_') for lang in targets]

import_auto = "import { " + ", ".join(auto_vars) + " } from './autoLocalesAll';\n"
import_core = "import { " + ", ".join(core_vars) + " } from './coreLocalesAll';\n"

resources_obj = "const resources: any = {\n  en,\n"
for lang in targets:
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
    var_auto = "auto_" + lang.replace('-', '_')
    var_core = "core_" + lang.replace('-', '_')
    merge_code += f"mergeTranslations(resources['{lang}'].translation, {var_core});\n"
    merge_code += f"mergeTranslations(resources['{lang}'].translation, {var_auto});\n"

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

# Strip out everything after the first dynamic import
content = re.sub(r"import \{ auto_en.*", "", content, flags=re.DOTALL)

with open('i18n.ts', 'w') as f:
    f.write(content)
    f.write(import_auto)
    f.write(import_core)
    f.write(resources_obj)
    f.write(merge_code)
    f.write(init_code)

print("Patched i18n.ts with both core and auto translations!")
