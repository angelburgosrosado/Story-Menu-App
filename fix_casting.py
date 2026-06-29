import re

with open('WorkspaceCasting.tsx', 'r') as f:
    content = f.read()

# Add imports
if "motion" not in content:
    content = content.replace(
        "import { VOICES } from './types';", 
        "import { VOICES } from './types';\nimport { motion, AnimatePresence } from 'motion/react';"
    )

# Add missing props
missing_props = [
    'activeTab', 'isWardrobeOpen', 'setIsWardrobeOpen', 'wardrobeTargetRole', 'setWardrobeTargetRole',
    'wardrobeAlert', 'WARDROBE_PRESETS', 'activePresets', 'handleApplyWardrobePreset',
    'personaStudioRole', 'handlePersonaStudioSelectRole', 'personaStudioName', 'setPersonaStudioName',
    'personaStudioStyle', 'setPersonaStudioStyle', 'personaStudioConcept', 'setPersonaStudioConcept',
    'handlePersonaStudioBrainstorm', 'personaStudioSuggesting', 'personaStudioSuggestedName',
    'personaStudioSuggestedBio', 'personaStudioSuggestedVisuals', 'personaStudioSuggestedPowers',
    'personaStudioSuggestedNemesisDna', 'setPersonaStudioSuggestedNemesisDna', 'personaStudioPortrait',
    'personaStudioGeneratingImg', 'personaStudioStatusMsg', 'handlePersonaStudioGeneratePortrait',
    'handlePersonaStudioCastCharacter'
]

destructured = ",\n    ".join(missing_props)

content = content.replace("...props", f"{destructured},\n    ...props")

with open('WorkspaceCasting.tsx', 'w') as f:
    f.write(content)
print("Fixed WorkspaceCasting.tsx")
