import re
import json
import time
import os
from deep_translator import GoogleTranslator
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading

targets = [
    'ar', 'bg', 'bn', 'cs', 'da', 'de', 'el', 'es', 'fi', 'fr', 
    'he', 'hi', 'hr', 'hu', 'id', 'it', 'ja', 'ko', 'ms', 'nl', 
    'no', 'pl', 'pt', 'ro', 'ru', 'sk', 'sv', 'ta', 'th', 'tl', 
    'tr', 'uk', 'vi', 'zh-CN', 'zh-TW'
]

def process_lang(lang, keys_to_translate, results_lang):
    api_lang = 'iw' if lang == 'he' else lang
    translator = GoogleTranslator(source='en', target=api_lang)
    for (ns, key, val) in keys_to_translate:
        if key in results_lang.get(ns, {}):
            continue
        try:
            translated_val = translator.translate(val)
            results_lang[ns][key] = translated_val
        except Exception as e:
            # print(f"Error translating to {lang}: {str(e)[:50]}...", flush=True)
            results_lang[ns][key] = f"[{lang.upper()}] {val}"
    return lang

def build_all_locales():
    files = ['Home.tsx', 'Setup.tsx', 'Account.tsx', 'CheckoutModal.tsx', 'Book.tsx', 'SignupPage.tsx', 'MainLayout.tsx']
    
    keys_to_translate = []
    en_dict = {}
    for filepath in files:
        with open(filepath, 'r') as f:
            content = f.read()
        matches = re.findall(r"t\('([a-zA-Z0-9_]+)\.([a-zA-Z0-9_\.]+)',\s*'((?:\\'|[^'])*)'\)", content)
        for ns, key, val in matches:
            val = val.replace("\\'", "'")
            if ns not in en_dict:
                en_dict[ns] = {}
            en_dict[ns][key] = val
            keys_to_translate.append((ns, key, val))
            
    print(f"Total phrases to translate: {len(keys_to_translate)}", flush=True)
    print(f"Total languages: {len(targets)}", flush=True)
    
    progress_file = "translation_progress.json"
    if os.path.exists(progress_file):
        with open(progress_file, 'r') as f:
            results = json.load(f)
    else:
        results = {lang: {} for lang in targets}
        
    for lang in targets:
        for ns in en_dict.keys():
            if ns not in results.get(lang, {}):
                results.setdefault(lang, {})[ns] = {}

    print("Starting parallel translation...", flush=True)
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = []
        for lang in targets:
            futures.append(executor.submit(process_lang, lang, keys_to_translate, results[lang]))
            
        for future in as_completed(futures):
            lang = future.result()
            print(f"Finished language: {lang}", flush=True)
            with open(progress_file, 'w') as f:
                json.dump(results, f)

    with open('autoLocalesAll.ts', 'w') as f:
        f.write("// Auto-generated translations for all 36 languages\n")
        f.write("export const auto_en = " + json.dumps(en_dict, indent=2, ensure_ascii=False) + ";\n\n")
        for lang in targets:
            var_name = "auto_" + lang.replace('-', '_')
            f.write(f"export const {var_name} = " + json.dumps(results[lang], indent=2, ensure_ascii=False) + ";\n\n")
            
    print("Successfully generated autoLocalesAll.ts!", flush=True)

if __name__ == '__main__':
    build_all_locales()
