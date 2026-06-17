import re
import json
import time
import sys
from deep_translator import GoogleTranslator

def build_auto_locales():
    files = ['Home.tsx', 'Setup.tsx', 'Account.tsx', 'CheckoutModal.tsx', 'Book.tsx']
    
    en_dict = {}
    es_dict = {}
    ja_dict = {}

    translator_es = GoogleTranslator(source='en', target='es')
    translator_ja = GoogleTranslator(source='en', target='ja')
    
    # Extract all first
    keys_to_translate = []
    
    for filepath in files:
        with open(filepath, 'r') as f:
            content = f.read()
            
        matches = re.findall(r"t\('([a-z]+)\.(auto[0-9]+)',\s*'((?:\\'|[^'])*)'\)", content)

        for ns, key, val in matches:
            val = val.replace("\\'", "'")
            
            if ns not in en_dict:
                en_dict[ns] = {}
                es_dict[ns] = {}
                ja_dict[ns] = {}
                
            en_dict[ns][key] = val
            keys_to_translate.append((ns, key, val))
            
    print(f"Total phrases to translate: {len(keys_to_translate)}", flush=True)
    
    for i, (ns, key, val) in enumerate(keys_to_translate):
        try:
            time.sleep(0.05)
            es_val = translator_es.translate(val)
            es_dict[ns][key] = es_val
            
            time.sleep(0.05)
            ja_val = translator_ja.translate(val)
            ja_dict[ns][key] = ja_val
            
            if i % 10 == 0:
                print(f"Progress: {i}/{len(keys_to_translate)} Translated: {val[:20]}", flush=True)
        except Exception as e:
            print(f"Error translating {val}: {e}", flush=True)
            es_dict[ns][key] = f"[ES] {val}"
            ja_dict[ns][key] = f"[JA] {val}"

    with open('autoLocales.ts', 'w') as f:
        f.write("export const auto_en = " + json.dumps(en_dict, indent=2, ensure_ascii=False) + ";\n")
        f.write("export const auto_es = " + json.dumps(es_dict, indent=2, ensure_ascii=False) + ";\n")
        f.write("export const auto_ja = " + json.dumps(ja_dict, indent=2, ensure_ascii=False) + ";\n")

    print("Successfully generated autoLocales.ts", flush=True)

build_auto_locales()
