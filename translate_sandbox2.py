import json
import time
from deep_translator import GoogleTranslator

targets = [
    'ar', 'bg', 'bn', 'cs', 'da', 'de', 'el', 'es', 'fi', 'fr', 
    'he', 'hi', 'hr', 'hu', 'id', 'it', 'ja', 'ko', 'ms', 'nl', 
    'no', 'pl', 'pt', 'ro', 'ru', 'sk', 'sv', 'ta', 'th', 'tl', 
    'tr', 'uk', 'vi', 'zh-CN', 'zh-TW'
]

sandbox2_en = {
    "descStart": "Synthesizes a mockup story block demonstrating ",
    "descEnd": " matching the prompt."
}

results = { 'en': sandbox2_en }

for lang in targets:
    results[lang] = {}
    print(f"Translating for {lang}...")
    for key, val in sandbox2_en.items():
        try:
            results[lang][key] = GoogleTranslator(source='en', target=lang).translate(val)
        except Exception as e:
            print(f"Failed {lang} {key}: {e}")
            results[lang][key] = val
    time.sleep(0.1)

# We need to merge this with the existing sandboxLocales.ts by essentially re-creating it or just outputting sandbox2Locales.ts and merging it.
with open('sandbox2Locales.ts', 'w') as f:
    f.write("// Auto-generated sandbox translations 2\n")
    for lang in ['en'] + targets:
        var_name = "sandbox2_" + lang.replace('-', '_')
        f.write(f"export const {var_name} = " + json.dumps({"sandbox": results[lang]}, indent=2, ensure_ascii=False) + ";\n\n")

print("Generated sandbox2Locales.ts")
