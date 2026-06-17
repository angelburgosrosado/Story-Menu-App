import json
import time
from deep_translator import GoogleTranslator

targets = [
    'ar', 'bg', 'bn', 'cs', 'da', 'de', 'el', 'es', 'fi', 'fr', 
    'he', 'hi', 'hr', 'hu', 'id', 'it', 'ja', 'ko', 'ms', 'nl', 
    'no', 'pl', 'pt', 'ro', 'ru', 'sk', 'sv', 'ta', 'th', 'tl', 
    'tr', 'uk', 'vi', 'zh-CN', 'zh-TW'
]

sandbox5_en = {
    "descStart2": "The ",
    "descEnd2": " allows you to prototype universe layouts and story nodes. Input a custom premise or pick a preset below, then synthesize your design."
}

results = { 'en': sandbox5_en }

for lang in targets:
    results[lang] = {}
    print(f"Translating for {lang}...")
    for key, val in sandbox5_en.items():
        try:
            results[lang][key] = GoogleTranslator(source='en', target=lang).translate(val)
        except Exception as e:
            print(f"Failed {lang} {key}: {e}")
            results[lang][key] = val
    time.sleep(0.1)

with open('sandbox5Locales.ts', 'w') as f:
    f.write("// Auto-generated sandbox translations 5\n")
    for lang in ['en'] + targets:
        var_name = "sandbox5_" + lang.replace('-', '_')
        f.write(f"export const {var_name} = " + json.dumps({"sandbox5": results[lang]}, indent=2, ensure_ascii=False) + ";\n\n")

print("Generated sandbox5Locales.ts")
