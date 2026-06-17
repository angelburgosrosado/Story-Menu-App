import json
import time
import os
from deep_translator import GoogleTranslator

targets = [
    'ar', 'bg', 'bn', 'cs', 'da', 'de', 'el', 'es', 'fi', 'fr', 
    'he', 'hi', 'hr', 'hu', 'id', 'it', 'ja', 'ko', 'ms', 'nl', 
    'no', 'pl', 'pt', 'ro', 'ru', 'sk', 'sv', 'ta', 'th', 'tl', 
    'tr', 'uk', 'vi', 'zh-CN', 'zh-TW'
]

with open('en_base.json', 'r') as f:
    en_dict = json.load(f)

# Flatten to translate efficiently
def flatten_dict(d, parent_key='', sep='.'):
    items = []
    for k, v in d.items():
        new_key = f"{parent_key}{sep}{k}" if parent_key else k
        if isinstance(v, dict):
            items.extend(flatten_dict(v, new_key, sep=sep).items())
        else:
            items.append((new_key, v))
    return dict(items)

def unflatten_dict(d, sep='.'):
    result = {}
    for k, v in d.items():
        parts = k.split(sep)
        d_ptr = result
        for part in parts[:-1]:
            if part not in d_ptr:
                d_ptr[part] = {}
            d_ptr = d_ptr[part]
        d_ptr[parts[-1]] = v
    return result

flat_en = flatten_dict(en_dict)
keys_to_translate = list(flat_en.keys())
total_phrases = len(keys_to_translate)
print(f"Total core phrases to translate per language: {total_phrases}")

progress_file = "core_translation_progress.json"
if os.path.exists(progress_file):
    with open(progress_file, 'r') as f:
        results = json.load(f)
else:
    results = {lang: {} for lang in targets}

ops_done = 0
total_ops = total_phrases * len(targets)

for lang in targets:
    for key in keys_to_translate:
        val = flat_en[key]
        if key in results[lang]:
            ops_done += 1
            continue
            
        try:
            translator = GoogleTranslator(source='en', target=lang)
            translated_val = translator.translate(val)
            results[lang][key] = translated_val
            time.sleep(0.1)
            ops_done += 1
            if ops_done % 20 == 0:
                print(f"Progress: {ops_done}/{total_ops} ...", flush=True)
                with open(progress_file, 'w') as f:
                    json.dump(results, f)
        except Exception as e:
            print(f"Error translating to {lang}: {e}")
            results[lang][key] = val # fallback to english
            time.sleep(1.0)

with open(progress_file, 'w') as f:
    json.dump(results, f)

# Re-unflatten and write to a new TS file
with open('coreLocalesAll.ts', 'w') as f:
    f.write("// Auto-generated core translations for all 36 languages\n\n")
    for lang in targets:
        unflattened = unflatten_dict(results[lang])
        var_name = "core_" + lang.replace('-', '_')
        f.write(f"export const {var_name} = " + json.dumps(unflattened, indent=2, ensure_ascii=False) + ";\n\n")

print("Generated coreLocalesAll.ts")
