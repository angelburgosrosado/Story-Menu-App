import re
import json
import time
import os
from deep_translator import GoogleTranslator

# Map of UI languages we need to translate to (short prefixes)
targets = [
    'ar', 'bg', 'bn', 'cs', 'da', 'de', 'el', 'es', 'fi', 'fr', 
    'he', 'hi', 'hr', 'hu', 'id', 'it', 'ja', 'ko', 'ms', 'nl', 
    'no', 'pl', 'pt', 'ro', 'ru', 'sk', 'sv', 'ta', 'th', 'tl', 
    'tr', 'uk', 'vi', 'zh-CN', 'zh-TW'
]

def build_all_locales():
    files = ['Home.tsx', 'Setup.tsx', 'Account.tsx', 'CheckoutModal.tsx', 'Book.tsx']
    
    # Extract keys
    keys_to_translate = []
    en_dict = {}
    for filepath in files:
        with open(filepath, 'r') as f:
            content = f.read()
        matches = re.findall(r"t\('([a-z]+)\.(auto[0-9]+)',\s*'((?:\\'|[^'])*)'\)", content)
        for ns, key, val in matches:
            val = val.replace("\\'", "'")
            if ns not in en_dict:
                en_dict[ns] = {}
            en_dict[ns][key] = val
            keys_to_translate.append((ns, key, val))
            
    print(f"Total phrases to translate: {len(keys_to_translate)}")
    print(f"Total languages: {len(targets)}")
    
    # Load progress if exists
    progress_file = "translation_progress.json"
    if os.path.exists(progress_file):
        with open(progress_file, 'r') as f:
            results = json.load(f)
    else:
        results = {lang: {} for lang in targets}
        # Initialize namespaces
        for lang in targets:
            for ns in en_dict.keys():
                results[lang][ns] = {}

    total_ops = len(keys_to_translate) * len(targets)
    ops_done = 0
    
    for i, (ns, key, val) in enumerate(keys_to_translate):
        for lang in targets:
            # Skip if already translated
            if key in results[lang].get(ns, {}):
                ops_done += 1
                continue
                
            try:
                # deep-translator handles short codes mostly well. 'he' works, 'uk' works.
                translator = GoogleTranslator(source='en', target=lang)
                translated_val = translator.translate(val)
                results[lang][ns][key] = translated_val
                
                time.sleep(0.1) # Be gentle to the API
                ops_done += 1
                
                if ops_done % 25 == 0:
                    print(f"Progress: {ops_done}/{total_ops} ...", flush=True)
                    with open(progress_file, 'w') as f:
                        json.dump(results, f)
            except Exception as e:
                print(f"Error translating to {lang}: {e}", flush=True)
                results[lang][ns][key] = f"[{lang.upper()}] {val}"
                time.sleep(1.0) # sleep longer on error

    # Write final output
    with open('autoLocalesAll.ts', 'w') as f:
        f.write("// Auto-generated translations for all 36 languages\n")
        # Write EN
        f.write("export const auto_en = " + json.dumps(en_dict, indent=2, ensure_ascii=False) + ";\n\n")
        # Write targets
        for lang in targets:
            # normalize var name (e.g. zh-CN -> zh_CN)
            var_name = "auto_" + lang.replace('-', '_')
            f.write(f"export const {var_name} = " + json.dumps(results[lang], indent=2, ensure_ascii=False) + ";\n\n")
            
    print("Successfully generated autoLocalesAll.ts!", flush=True)

build_all_locales()
