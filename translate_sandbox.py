import json
import time
from deep_translator import GoogleTranslator

targets = [
    'ar', 'bg', 'bn', 'cs', 'da', 'de', 'el', 'es', 'fi', 'fr', 
    'he', 'hi', 'hr', 'hu', 'id', 'it', 'ja', 'ko', 'ms', 'nl', 
    'no', 'pl', 'pt', 'ro', 'ru', 'sk', 'sv', 'ta', 'th', 'tl', 
    'tr', 'uk', 'vi', 'zh-CN', 'zh-TW'
]

sandbox_en = {
    "placeholder": "A cybernetic samurai defending a neon city gate...",
    "prompt1": "A neon cyberpunk detective looking at a glowing holographic map on a rainy street.",
    "prompt2": "An astronaut discovering an ancient mystical stone temple on Mars.",
    "prompt3": "A cute wizard apprentice accidentally setting their spellbook on fire.",
    "label1": "🌆 Cyberpunk",
    "label2": "🪐 Mars Monolith",
    "label3": "✨ Wizard apprentice"
}

results = { 'en': sandbox_en }

for lang in targets:
    results[lang] = {}
    print(f"Translating for {lang}...")
    for key, val in sandbox_en.items():
        try:
            results[lang][key] = GoogleTranslator(source='en', target=lang).translate(val)
        except Exception as e:
            print(f"Failed {lang} {key}: {e}")
            results[lang][key] = val
    time.sleep(0.1)

with open('sandboxLocales.ts', 'w') as f:
    f.write("// Auto-generated sandbox translations\n")
    for lang in ['en'] + targets:
        var_name = "sandbox_" + lang.replace('-', '_')
        f.write(f"export const {var_name} = " + json.dumps({"sandbox": results[lang]}, indent=2, ensure_ascii=False) + ";\n\n")

print("Generated sandboxLocales.ts")
