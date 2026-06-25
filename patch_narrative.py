import sys

with open('App.tsx', 'r') as f:
    app_content = f.read()

old_beat_payload = """                customPremise,
                creativeDirectives: `${creativeDirectives || ''} Artistic Style Keywords: ${STYLE_KEYWORDS[selectedGenre] || STYLE_KEYWORDS['Custom']}.`,
                richMode,"""

new_beat_payload = """                customPremise,
                creativeDirectives: (() => {
                    let enhancedCreativeDirectives = `${creativeDirectives || ''} Artistic Style Keywords: ${STYLE_KEYWORDS[selectedGenre] || STYLE_KEYWORDS['Custom']}.`;
                    let narrativeGuidance = "";
                    if (isFinalPage) {
                        narrativeGuidance = "This is the final page. Conclude the story with a satisfying resolution, a clear ending, or a poignant moment. Ensure all plot threads are tied up.";
                    } else if (pageNum % 3 === 0 && pageNum !== 1) {
                        narrativeGuidance = "This page should advance the main plot significantly, introduce a new challenge, or reveal a key piece of information. Build towards the climax.";
                    } else if (isDecisionPage) {
                        narrativeGuidance = "This page ends with a decision. Ensure the narrative naturally leads to a point where the main character must make a crucial choice. Set up the stakes for the upcoming decision.";
                    } else {
                        narrativeGuidance = "Continue the story naturally. Focus on character development, dialogue, and advancing the current scene.";
                    }
                    enhancedCreativeDirectives += ` NARRATIVE GUIDANCE for this beat: ${narrativeGuidance}`;
                    return enhancedCreativeDirectives;
                })(),
                richMode,"""

if old_beat_payload in app_content:
    app_content = app_content.replace(old_beat_payload, new_beat_payload)
else:
    print("Could not find old_beat_payload in App.tsx!")

with open('App.tsx', 'w') as f:
    f.write(app_content)
