import re

with open('casting_block.txt', 'r') as f:
    content = f.read()

# I need to wrap it into WorkspaceCasting component.
# I'll create a generic wrapper that takes `props` and destructures the needed variables.
# But there are many variables. The easiest way without manually listing all 100 state variables
# is to let TypeScript tell us what's missing, or we can just pass ALL Setup.tsx props and state
# in a giant object, and destructure it dynamically, or we use `eval` (no, bad).

# Let's just create the component and we will figure out the props later. We can pass a `store` or `ctx` prop containing everything,
# but React needs explicit destructuring or `props.something`.
# Actually, we can use `with(props)` in JS but that's strictly forbidden in strict mode.

# I'll do a simple regex to find all undefined variables later, or I'll just look at the first few lines of WorkspaceCasting.tsx.
# Instead of doing that, I'll extract all identifiers that might be state from Setup.tsx.
# Since the goal is modularity without breaking things, I'll do the same as WorkspaceLibrary.

props_list = [
    'isEditorial', 'isCyberpunk', 'selectedGlobalCharacters', 'setSelectedGlobalCharacters',
    'globalCharacters', 'savedCharacters', 't', 'sPrimaryBtn', 'sLabel', 'sInput', 'sSelect',
    'isSavingChar', 'handleSaveCharacter', 'handleDeleteCharacter', 'handleToggleVaultCharacter',
    'hero', 'setHero', 'friend', 'setFriend', 'villain', 'setVillain',
    'heroIdentity', 'setHeroIdentity', 'friendIdentity', 'setFriendIdentity', 'villainIdentity', 'setVillainIdentity',
    'heroCustom', 'setHeroCustom', 'friendCustom', 'setFriendCustom', 'villainCustom', 'setVillainCustom',
    'heroCustomIdentity', 'setHeroCustomIdentity', 'friendCustomIdentity', 'setFriendCustomIdentity', 'villainCustomIdentity', 'setVillainCustomIdentity',
    'heroImage', 'setHeroImage', 'friendImage', 'setFriendImage', 'villainImage', 'setVillainImage',
    'isGeneratingHeroImage', 'isGeneratingFriendImage', 'isGeneratingVillainImage',
    'handleGenerateCharacterImage', 'fileToBase64', 'isKidStory', 'dynamicCategories', 'VOICES'
]

# We will construct a destructured props line
destructured = ",\n    ".join(props_list)

template = f"""import React from 'react';
import {{ useTranslation }} from 'react-i18next';
import {{ VOICES }} from './types';

export const WorkspaceCasting = ({{
    {destructured},
    ...props
}}: any) => {{
    const {{ t }} = useTranslation();

    return (
        <>
            {content}
        </>
    );
}};
"""

with open('WorkspaceCasting.tsx', 'w') as f:
    f.write(template)

print("WorkspaceCasting.tsx generated")
