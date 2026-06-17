import os
import re
import json

def extract_translations():
    locales = {'en': {}, 'es': {}, 'ja': {}}
    files = ['Home.tsx', 'Setup.tsx', 'Account.tsx', 'CheckoutModal.tsx', 'Book.tsx']
    
    for filepath in files:
        with open(filepath, 'r') as f:
            content = f.read()
            
        # Match t('namespace.key', 'Default text')
        # We need to handle single quotes with backslash escapes carefully
        matches = re.findall(r"t\('([^']+)',\s*'((?:\\'|[^'])*)'\)", content)
        
        for key, value in matches:
            parts = key.split('.')
            if len(parts) >= 2:
                ns = parts[0]
                k = '.'.join(parts[1:])
                value = value.replace("\\'", "'")
                
                for lang in locales:
                    if ns not in locales[lang]:
                        locales[lang][ns] = {}
                    
                    if lang == 'en':
                        locales[lang][ns][k] = value
                    elif lang == 'es':
                        # Simple mock translation
                        locales[lang][ns][k] = f"[ES] {value}"
                    elif lang == 'ja':
                        locales[lang][ns][k] = f"[JA] {value}"

    for lang in locales:
        os.makedirs(f'src/locales/{lang}', exist_ok=True)
        # Using flat JSON or nested JSON based on what i18n uses
        # Wait, the app uses `translation` namespace or separated namespaces?
        # Let's check i18n.ts
        pass

extract_translations()
