import re

with open('director_block.txt', 'r') as f:
    content = f.read()

# Generate WorkspaceDirector component
# I will use a very large spread of variables, so we'll just extract all possible variables.
# Actually I'll use the same trick: dump it in a file, then try to compile, parse error, add missing.
# Let's just create the file first.
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
    'handleGenerateCharacterImage', 'fileToBase64', 'isKidStory', 'dynamicCategories', 'VOICES',
    'activeTab', 'projectTitle', 'setProjectTitle', 'genre', 'setGenre', 'storyLength', 'setStoryLength',
    'narrativePacing', 'setNarrativePacing', 'artStyle', 'setArtStyle', 'comicLanguage', 'setComicLanguage',
    'targetAudience', 'setTargetAudience', 'audioVoice', 'setAudioVoice', 'handleAutoBlueprint',
    'isAutoBlueprinting', 'LANGUAGES', 'GENRES', 'ART_STYLES', 'chapters', 'handleChapterChange',
    'handleAddChapter', 'handleRemoveChapter', 'selectedVoice', 'setSelectedVoice'
]

destructured = ",\n    ".join(props_list)

template = f"""import React from 'react';
import {{ useTranslation }} from 'react-i18next';
import {{ VOICES, LANGUAGES, GENRES, ART_STYLES }} from './types';
import {{ motion, AnimatePresence }} from 'motion/react';

export const WorkspaceDirector = ({{
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

with open('WorkspaceDirector.tsx', 'w') as f:
    f.write(template)

print("WorkspaceDirector.tsx generated")
