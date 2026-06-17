with open('Home.tsx', 'r') as f:
    content = f.read()

# Home.tsx translations
replacements = {
    "desc: \"Cell-shaded hand-painted watercolor backgrounds, deep cinematic dramatic gradients, classic vintage overlay.\"": "desc: t('sandbox6.styleDesc1', \"Cell-shaded hand-painted watercolor backgrounds, deep cinematic dramatic gradients, classic vintage overlay.\")",
    "name: \"Sci-Fi Cyberpunk\"": "name: t('sandbox6.genre1', \"Sci-Fi Cyberpunk\")",
    "name: \"Magic Fantasy\"": "name: t('sandbox6.genre2', \"Magic Fantasy\")",
    "Every multiverse genre carries its own generative aesthetic and structural pacing. Mix and match to discover new sub-genres.": "{t('sandbox6.genreDesc', 'Every multiverse genre carries its own generative aesthetic and structural pacing. Mix and match to discover new sub-genres.')}",
    "Spatial SFX Board": "{t('sandbox6.sfxTitle', 'Spatial SFX Board')}",
    "Audition the generative sounds directly from the synthesis engine directly.": "{t('sandbox6.sfxDesc', 'Audition the generative sounds directly from the synthesis engine directly.')}",
    "Ensure your system audio is enabled to hear procedural sounds.": "{t('sandbox6.audioWarn', 'Ensure your system audio is enabled to hear procedural sounds.')}",
    "Ready to claim your corner of the continuum?": "{t('sandbox6.readyTitle', 'Ready to claim your corner of the continuum?')}",
    ">Launch local sandbox<": ">{t('sandbox6.launchBtn', 'Launch local sandbox')}<",
    "{t('sandbox5.descStart2', 'The ')}<strong>{t('home.auto9', 'Prompt Sandbox')}</strong>{t('sandbox5.descEnd2', ' allows you to prototype universe layouts and story nodes. Input a custom premise or pick a preset below, then synthesize your design.')}": "{t('sandbox6.sandboxDesc1', 'The ')}<strong>{t('home.auto9', 'Prompt Sandbox')}</strong>{t('sandbox6.sandboxDesc3', ' allows you to prototype universe layouts and story nodes. Input a custom premise or pick a preset below, then synthesize your design.')}"
}

for k, v in replacements.items():
    content = content.replace(k, v)

with open('Home.tsx', 'w') as f:
    f.write(content)


with open('StyleSelector.tsx', 'r') as f:
    style_content = f.read()

style_replacements = {
    "Synthesizes a mockup story block demonstrating": "{t('sandbox6.mockupStart', 'Synthesizes a mockup story block demonstrating')}",
    "matching the prompt.": "{t('sandbox6.mockupEnd', 'matching the prompt.')}"
}

for k, v in style_replacements.items():
    style_content = style_content.replace(k, v)

with open('StyleSelector.tsx', 'w') as f:
    f.write(style_content)

print("Patched texts!")
