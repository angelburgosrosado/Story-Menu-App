import json
import time
from deep_translator import GoogleTranslator

targets = [
    'ar', 'bg', 'bn', 'cs', 'da', 'de', 'el', 'es', 'fi', 'fr', 
    'he', 'hi', 'hr', 'hu', 'id', 'it', 'ja', 'ko', 'ms', 'nl', 
    'no', 'pl', 'pt', 'ro', 'ru', 'sk', 'sv', 'ta', 'th', 'tl', 
    'tr', 'uk', 'vi', 'zh-CN', 'zh-TW'
]

sandbox4_en = {
    "descAnime": "Cell-shaded hand-painted watercolor backgrounds, deep cinematic dramatic gradients, classic vintage overlay.",
    "descCinematic": "Hyper-realistic gritty cinematic lighting, volumetric fog, Unreal Engine 5 render style, 8k resolution raytracing.",
    "descComic": "Flat vector illustrations, vibrant neon color palettes, minimalist geometric shapes, high-contrast poster art.",
    "genreDesc": "Every multiverse genre carries its own generative procedural theme. Change genres to watch the synthetic frequency arpeggios shift live in your browser's audio nodes.",
    "genreSciFi": "Sci-Fi Cyberpunk",
    "genreMagic": "Magic Fantasy",
    "genreSlice": "Slice of Life",
    "sfxTitle": "Spatial SFX Board",
    "sfxSubtitle": "Click any trigger block to command the sound synthesis engine directly.",
    "sfxWarning": "Ensure your system audio is enabled to hear procedural sounds.",
    "footerTitle": "Ready to claim your place in the multiverse?",
    "footerDesc": "Unlock the creative potential of multimodal artificial intelligence. Draft script blueprints, mold actors, and release immersive visual graphic books safely stored in Firestore today.",
    "btnConsole": "Access Creative Console",
    "btnSandbox": "Launch local sandbox"
}

results = { 'en': sandbox4_en }

for lang in targets:
    results[lang] = {}
    print(f"Translating for {lang}...")
    for key, val in sandbox4_en.items():
        try:
            results[lang][key] = GoogleTranslator(source='en', target=lang).translate(val)
        except Exception as e:
            print(f"Failed {lang} {key}: {e}")
            results[lang][key] = val
    time.sleep(0.1)

with open('sandbox4Locales.ts', 'w') as f:
    f.write("// Auto-generated sandbox translations 4\n")
    for lang in ['en'] + targets:
        var_name = "sandbox4_" + lang.replace('-', '_')
        f.write(f"export const {var_name} = " + json.dumps({"sandbox4": results[lang]}, indent=2, ensure_ascii=False) + ";\n\n")

print("Generated sandbox4Locales.ts")
