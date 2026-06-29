with open('Setup.tsx', 'r') as f:
    lines = f.readlines()

# The Persona block is from line 3242 to 3880 (index 3241 to 3880)
# Wait, let's verify line contents just in case the file shifted.
persona_start = -1
for i, line in enumerate(lines):
    if "isCyberpunk || activeTab === 'persona'" in line:
        persona_start = i
        break

blueprint_start = -1
for i in range(persona_start+1, len(lines)):
    if "isCyberpunk || activeTab === 'blueprint'" in line:
        blueprint_start = i
        break

vault_start = -1
for i in range(blueprint_start+1, len(lines)):
    if "activeTab === 'vault'" in line:
        vault_start = i
        break

if persona_start != -1 and blueprint_start != -1 and vault_start != -1:
    persona_lines = lines[persona_start:blueprint_start]
    blueprint_lines = lines[blueprint_start:vault_start]
    
    # We create WorkspaceCasting.tsx
    with open('WorkspaceCasting.tsx', 'w') as f:
        f.write("""import React from 'react';
import { useTranslation } from 'react-i18next';
import { VOICES, WARDROBE_PRESETS } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { useWorkspace } from './WorkspaceContext';

export const WorkspaceCasting = () => {
    const ctx = useWorkspace();
    const { t } = useTranslation();
    const props = ctx; // Quick alias

    const {
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
    } = ctx;

    return (
        <>
""" + "".join(persona_lines) + """
        </>
    );
};
""")

    # We create WorkspaceDirector.tsx
    with open('WorkspaceDirector.tsx', 'w') as f:
        f.write("""import React from 'react';
import { useTranslation } from 'react-i18next';
import { VOICES, LANGUAGES, GENRES, ART_STYLES } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { useWorkspace } from './WorkspaceContext';

export const WorkspaceDirector = () => {
    const ctx = useWorkspace();
    const { t } = useTranslation();
    const props = ctx; // Quick alias

    const {
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
        storyTone, onLaunch, generatingPageGoal, handleGeneratePageGoal, generatingBlueprint, handleGenerateStoryBlueprint, handleInitializeDefaultBlueprint
    } = ctx;

    return (
        <>
""" + "".join(blueprint_lines) + """
        </>
    );
};
""")
    
    # Replace in Setup.tsx
    new_lines = lines[:persona_start] + [
        "{(isCyberpunk || activeTab === 'persona') && (\n",
        "    <WorkspaceCasting />\n",
        ")}\n",
        "{(isCyberpunk || activeTab === 'blueprint') && (\n",
        "    <WorkspaceDirector />\n",
        ")}\n"
    ] + lines[vault_start:]
    
    content = "".join(new_lines)
    
    if "import { WorkspaceCasting }" not in content:
        content = content.replace("import { WorkspaceLibrary } from './WorkspaceLibrary';", "import { WorkspaceLibrary } from './WorkspaceLibrary';\nimport { WorkspaceCasting } from './WorkspaceCasting';\nimport { WorkspaceDirector } from './WorkspaceDirector';")
        
    with open('Setup.tsx', 'w') as f:
        f.write(content)
        
    print("Successfully extracted Casting and Director blocks!")
else:
    print("Could not find blocks")
