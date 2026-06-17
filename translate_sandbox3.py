import json
import time
from deep_translator import GoogleTranslator

targets = [
    'ar', 'bg', 'bn', 'cs', 'da', 'de', 'el', 'es', 'fi', 'fr', 
    'he', 'hi', 'hr', 'hu', 'id', 'it', 'ja', 'ko', 'ms', 'nl', 
    'no', 'pl', 'pt', 'ro', 'ru', 'sk', 'sv', 'ta', 'th', 'tl', 
    'tr', 'uk', 'vi', 'zh-CN', 'zh-TW'
]

sandbox3_en = {
    "btnAssembling": "Assembling Panels...",
    "btnGenerate": "Generate Preview Card",
    "mockDefaultTitle": "Procedural Universe Draft",
    "mockDefaultCaption": "The system synthesized a new narrative vector for the requested coordinates.",
    "mockDefaultChar": "Prototypal Agent",
    "mockDefaultSound": "Cinematic Ambient - Track #04",
    "mockCyberTitle": "Neon Rain Chronicles",
    "mockCyberCaption": "The hologram flickered. The coordinates pointed straight into the deep Sector 9 slums.",
    "mockCyberChar": "Detective Kaelen",
    "mockCyberSound": "Synthwave Beats - 110 BPM",
    "mockMarsTitle": "The Red Threshold",
    "mockMarsCaption": "Amidst the dust storms of Mars, the monolith stood undisturbed for a million years.",
    "mockMarsChar": "Commander Sarah Vance",
    "mockMarsSound": "Dark Ambient Cosmos - Track #09",
    "mockWizTitle": "Arcane Mishaps",
    "mockWizCaption": "'Oops!'—the sparks ignited the ancient parchment before he could recite the counter-spell.",
    "mockWizChar": "Leo the Novice",
    "mockWizSound": "Whimsical Forest Chords - Track #01"
}

results = { 'en': sandbox3_en }

for lang in targets:
    results[lang] = {}
    print(f"Translating for {lang}...")
    for key, val in sandbox3_en.items():
        try:
            results[lang][key] = GoogleTranslator(source='en', target=lang).translate(val)
        except Exception as e:
            print(f"Failed {lang} {key}: {e}")
            results[lang][key] = val
    time.sleep(0.1)

with open('sandbox3Locales.ts', 'w') as f:
    f.write("// Auto-generated sandbox translations 3\n")
    for lang in ['en'] + targets:
        var_name = "sandbox3_" + lang.replace('-', '_')
        f.write(f"export const {var_name} = " + json.dumps({"sandbox3": results[lang]}, indent=2, ensure_ascii=False) + ";\n\n")

print("Generated sandbox3Locales.ts")
