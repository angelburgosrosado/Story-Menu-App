import sys

# Update App.tsx
with open('App.tsx', 'r') as f:
    app_content = f.read()

# Update generateBeat
old_body_beat = """                customPremise,
                creativeDirectives,
                richMode,"""

new_body_beat = """                customPremise,
                creativeDirectives: `${creativeDirectives || ''} Artistic Style Keywords: ${STYLE_KEYWORDS[selectedGenre] || STYLE_KEYWORDS['Custom']}.`,
                richMode,"""

app_content = app_content.replace(old_body_beat, new_body_beat)

# Update generateImage
old_body_image = """                type,
                styleEra,
                heroVisuals,"""

new_body_image = """                type,
                styleEra,
                styleKeywords: STYLE_KEYWORDS[selectedGenre] || STYLE_KEYWORDS['Custom'],
                heroVisuals,"""

app_content = app_content.replace(old_body_image, new_body_image)

with open('App.tsx', 'w') as f:
    f.write(app_content)

# Update server.ts
with open('server.ts', 'r') as f:
    server_content = f.read()

old_server_destructure = """            styleEra,
            heroVisuals,"""

new_server_destructure = """            styleEra,
            styleKeywords,
            heroVisuals,"""

server_content = server_content.replace(old_server_destructure, new_server_destructure)

old_server_promptText = """        let promptText = `STYLE: ${artStyle || styleEra || selectedGenre} art style. `;\n"""

new_server_promptText = """        let promptText = `STYLE: ${artStyle || styleEra || selectedGenre} art style. VISUAL AESTHETICS: ${styleKeywords || ''}. `;\n"""

server_content = server_content.replace(old_server_promptText, new_server_promptText)

with open('server.ts', 'w') as f:
    f.write(server_content)
