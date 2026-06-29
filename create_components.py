import re

with open('Setup.tsx', 'r') as f:
    content = f.read()

# Casting Block
start_casting = "{(isCyberpunk || activeTab === 'persona') && ("
end_casting = "{(isCyberpunk || activeTab === 'blueprint') && ("
idx_start = content.find(start_casting)
idx_end = content.find(end_casting, idx_start)

if idx_start != -1 and idx_end != -1:
    idx_end = content.rfind("\n", idx_start, idx_end)
    casting_block = content[idx_start:idx_end]
    
    with open('WorkspaceCasting.tsx', 'w') as f:
        f.write(f"""import React from 'react';
import {{ useTranslation }} from 'react-i18next';
import {{ VOICES, WARDROBE_PRESETS }} from './types';
import {{ motion, AnimatePresence }} from 'motion/react';
import {{ useWorkspace }} from './WorkspaceContext';

export const WorkspaceCasting = () => {{
    const ctx = useWorkspace();
    const {{ t }} = useTranslation();
    const props = ctx; // Quick alias for any `props.something` references

    // Destructure everything from ctx to match local variables in the block
    const {{
        isEditorial, isCyberpunk, selectedGlobalCharacters, setSelectedGlobalCharacters,
        globalCharacters, savedCharacters, sPrimaryBtn, sLabel, sInput, sSelect,
        isSavingChar, handleSaveCharacter, handleDeleteCharacter, handleToggleVaultCharacter,
        hero, setHero, friend, setFriend, villain, setVillain,
        heroIdentity, setHeroIdentity, friendIdentity, setFriendIdentity, villainIdentity, setVillainIdentity,
        heroCustom, setHeroCustom, friendCustom, setFriendCustom, villainCustom, setVillainCustom,
        heroCustomIdentity, setHeroCustomIdentity, friendCustomIdentity, setFriendCustomIdentity, villainCustomIdentity, setVillainCustomIdentity,
        heroImage, setHeroImage, friendImage, setFriendImage, villainImage, setVillainImage,
        isGeneratingHeroImage, isGeneratingFriendImage, isGeneratingVillainImage,
        handleGenerateCharacterImage, fileToBase64, isKidStory, dynamicCategories,
        activeTab, isWardrobeOpen, setIsWardrobeOpen, wardrobeTargetRole, setWardrobeTargetRole,
        wardrobeAlert, activePresets, handleApplyWardrobePreset,
        personaStudioRole, handlePersonaStudioSelectRole, personaStudioName, setPersonaStudioName,
        personaStudioStyle, setPersonaStudioStyle, personaStudioConcept, setPersonaStudioConcept,
        handlePersonaStudioBrainstorm, personaStudioSuggesting, personaStudioSuggestedName,
        personaStudioSuggestedBio, personaStudioSuggestedVisuals, personaStudioSuggestedPowers,
        personaStudioSuggestedNemesisDna, setPersonaStudioSuggestedNemesisDna, personaStudioPortrait,
        personaStudioGeneratingImg, personaStudioStatusMsg, handlePersonaStudioGeneratePortrait,
        handlePersonaStudioCastCharacter, handleAvatarUpload, handleSurpriseMeVault, handleVaultGenerate,
        handleSaveToVault, vaultCharName, setVaultCharName, vaultReferenceImage, setVaultReferenceImage,
        vaultCharDesc, setVaultCharDesc, vaultCharStyle, setVaultCharStyle, isVaultGenerating,
        vaultStatusMsg, vaultGeneratedImage, vaultAge, setVaultAge, vaultGender, setVaultGender,
        vaultEthnicity, setVaultEthnicity, onHeroUpload, onFriendUpload, onVillainUpload,
        onHeroHeadUpload, onHeroClothesUpload, onFriendHeadUpload, onFriendClothesUpload,
        onVillainHeadUpload, onVillainClothesUpload, onHeroHeadClear, onHeroClothesClear,
        onFriendHeadClear, onFriendClothesClear, onVillainHeadClear, onVillainClothesClear,
        isScanningHero, isScanningFriend, isScanningVillain, handleDropAsset
    }} = ctx;

    return (
        <>
            {casting_block}
        </>
    );
}};
""")
    
    # Replace in Setup
    new_content = content[:idx_start] + "{(isCyberpunk || activeTab === 'persona') && (\n            <WorkspaceCasting />\n        )}\n" + content[idx_end:]
    content = new_content
    print("WorkspaceCasting created")

# Director Block
start_director = "{(isCyberpunk || activeTab === 'blueprint') && ("
end_director = "{(!isCyberpunk && activeTab === 'library') && ("
idx_start = content.find(start_director)
idx_end = content.find(end_director, idx_start)

if idx_start != -1 and idx_end != -1:
    idx_end = content.rfind("\n", idx_start, idx_end)
    director_block = content[idx_start:idx_end]
    
    with open('WorkspaceDirector.tsx', 'w') as f:
        f.write(f"""import React from 'react';
import {{ useTranslation }} from 'react-i18next';
import {{ VOICES, LANGUAGES, GENRES, ART_STYLES }} from './types';
import {{ motion, AnimatePresence }} from 'motion/react';
import {{ useWorkspace }} from './WorkspaceContext';

export const WorkspaceDirector = () => {{
    const ctx = useWorkspace();
    const {{ t }} = useTranslation();
    const props = ctx; // Quick alias

    const {{
        isEditorial, isCyberpunk, sPrimaryBtn, sLabel, sInput, sSelect,
        activeTab, projectTitle, setProjectTitle, genre, setGenre, storyLength, setStoryLength,
        narrativePacing, setNarrativePacing, artStyle, setArtStyle, comicLanguage, setComicLanguage,
        targetAudience, setTargetAudience, audioVoice, setAudioVoice, handleAutoBlueprint,
        isAutoBlueprinting, chapters, handleChapterChange, handleAddChapter, handleRemoveChapter,
        selectedVoice, setSelectedVoice, selectedGenre, onGenreChange, selectedLanguage, onLanguageChange,
        selectedArtStyle, onArtStyleChange, customPremise, onPremiseChange, soundtrackEnabled, onSoundtrackChange,
        richMode, onRichModeChange, onVoiceChange, storyBlueprint, onStoryBlueprintChange,
        creativeDirectives, onCreativeDirectivesChange, heroVisuals, onHeroVisualsChange,
        friendVisuals, onFriendVisualsChange, villainVisuals, onVillainVisualsChange,
        villainDna, onVillainDnaChange, nemesisDNA, onNemesisDnaChange, soundPrompt, onSoundPromptChange,
        storyTone, onLaunch
    }} = ctx;

    return (
        <>
            {director_block}
        </>
    );
}};
""")
    
    # Replace in Setup
    new_content = content[:idx_start] + "{(isCyberpunk || activeTab === 'blueprint') && (\n            <WorkspaceDirector />\n        )}\n" + content[idx_end:]
    content = new_content
    print("WorkspaceDirector created")

# Replace imports in Setup
if "import { WorkspaceCasting" not in content:
    content = content.replace("import { WorkspaceLibrary } from './WorkspaceLibrary';", "import { WorkspaceLibrary } from './WorkspaceLibrary';\nimport { WorkspaceCasting } from './WorkspaceCasting';\nimport { WorkspaceDirector } from './WorkspaceDirector';")

with open('Setup.tsx', 'w') as f:
    f.write(content)

