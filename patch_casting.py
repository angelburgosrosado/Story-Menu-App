import re

with open('Setup.tsx', 'r') as f:
    content = f.read()

start_marker = "{(isCyberpunk || activeTab === 'persona') && ("
end_marker = "{(isCyberpunk || activeTab === 'blueprint') && ("

idx_start = content.find(start_marker)
idx_end = content.find(end_marker, idx_start)

if idx_start != -1 and idx_end != -1:
    idx_end = content.rfind("\n", idx_start, idx_end)
    
    # We will pass a giant object props spreading all the variables.
    # Since Setup.tsx has all state in scope, we can just pass them individually.
    # To save space, we just pass everything in one prop or spread them.
    # We will pass the exact props we requested.
    
    # To keep it simple, we'll just spread everything manually or use a trick.
    # Actually, spreading an object with all those keys works.
    
    replacement = """{(isCyberpunk || activeTab === 'persona') && (
            <WorkspaceCasting 
                isEditorial={isEditorial} isCyberpunk={isCyberpunk} selectedGlobalCharacters={selectedGlobalCharacters} setSelectedGlobalCharacters={setSelectedGlobalCharacters}
                globalCharacters={globalCharacters} savedCharacters={savedCharacters} sPrimaryBtn={sPrimaryBtn} sLabel={sLabel} sInput={sInput} sSelect={sSelect}
                isSavingChar={isSavingChar} handleSaveCharacter={handleSaveCharacter} handleDeleteCharacter={handleDeleteCharacter} handleToggleVaultCharacter={handleToggleVaultCharacter}
                hero={hero} setHero={setHero} friend={friend} setFriend={setFriend} villain={villain} setVillain={setVillain}
                heroIdentity={heroIdentity} setHeroIdentity={setHeroIdentity} friendIdentity={friendIdentity} setFriendIdentity={setFriendIdentity} villainIdentity={villainIdentity} setVillainIdentity={setVillainIdentity}
                heroCustom={heroCustom} setHeroCustom={setHeroCustom} friendCustom={friendCustom} setFriendCustom={setFriendCustom} villainCustom={villainCustom} setVillainCustom={setVillainCustom}
                heroCustomIdentity={heroCustomIdentity} setHeroCustomIdentity={setHeroCustomIdentity} friendCustomIdentity={friendCustomIdentity} setFriendCustomIdentity={setFriendCustomIdentity} villainCustomIdentity={villainCustomIdentity} setVillainCustomIdentity={setVillainCustomIdentity}
                heroImage={heroImage} setHeroImage={setHeroImage} friendImage={friendImage} setFriendImage={setFriendImage} villainImage={villainImage} setVillainImage={setVillainImage}
                isGeneratingHeroImage={isGeneratingHeroImage} isGeneratingFriendImage={isGeneratingFriendImage} isGeneratingVillainImage={isGeneratingVillainImage}
                handleGenerateCharacterImage={handleGenerateCharacterImage} fileToBase64={fileToBase64} isKidStory={isKidStory} dynamicCategories={dynamicCategories}
                activeTab={activeTab} isWardrobeOpen={isWardrobeOpen} setIsWardrobeOpen={setIsWardrobeOpen} wardrobeTargetRole={wardrobeTargetRole} setWardrobeTargetRole={setWardrobeTargetRole}
                wardrobeAlert={wardrobeAlert} WARDROBE_PRESETS={WARDROBE_PRESETS} activePresets={activePresets} handleApplyWardrobePreset={handleApplyWardrobePreset}
                personaStudioRole={personaStudioRole} handlePersonaStudioSelectRole={handlePersonaStudioSelectRole} personaStudioName={personaStudioName} setPersonaStudioName={setPersonaStudioName}
                personaStudioStyle={personaStudioStyle} setPersonaStudioStyle={setPersonaStudioStyle} personaStudioConcept={personaStudioConcept} setPersonaStudioConcept={setPersonaStudioConcept}
                handlePersonaStudioBrainstorm={handlePersonaStudioBrainstorm} personaStudioSuggesting={personaStudioSuggesting} personaStudioSuggestedName={personaStudioSuggestedName}
                personaStudioSuggestedBio={personaStudioSuggestedBio} personaStudioSuggestedVisuals={personaStudioSuggestedVisuals} personaStudioSuggestedPowers={personaStudioSuggestedPowers}
                personaStudioSuggestedNemesisDna={personaStudioSuggestedNemesisDna} setPersonaStudioSuggestedNemesisDna={setPersonaStudioSuggestedNemesisDna} personaStudioPortrait={personaStudioPortrait}
                personaStudioGeneratingImg={personaStudioGeneratingImg} personaStudioStatusMsg={personaStudioStatusMsg} handlePersonaStudioGeneratePortrait={handlePersonaStudioGeneratePortrait}
                handlePersonaStudioCastCharacter={handlePersonaStudioCastCharacter}
            />
        )}
"""
    new_content = content[:idx_start] + replacement + content[idx_end:]
    
    if "import { WorkspaceCasting }" not in new_content:
        new_content = new_content.replace("import { WorkspaceLibrary } from './WorkspaceLibrary';", "import { WorkspaceLibrary } from './WorkspaceLibrary';\nimport { WorkspaceCasting } from './WorkspaceCasting';")
        
    with open('Setup.tsx', 'w') as f:
        f.write(new_content)
    print("Patched successfully")
else:
    print("Could not find markers")
