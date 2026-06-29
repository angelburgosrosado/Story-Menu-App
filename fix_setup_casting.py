import re

with open('Setup.tsx', 'r') as f:
    content = f.read()

# Replace the bad props
bad_props = [
    "selectedGlobalCharacters={selectedGlobalCharacters}",
    "setSelectedGlobalCharacters={setSelectedGlobalCharacters}",
    "heroIdentity={heroIdentity}",
    "setHeroIdentity={setHeroIdentity}",
    "friendIdentity={friendIdentity}",
    "setFriendIdentity={setFriendIdentity}",
    "villainIdentity={villainIdentity}",
    "setVillainIdentity={setVillainIdentity}",
    "heroCustomIdentity={heroCustomIdentity}",
    "setHeroCustomIdentity={setHeroCustomIdentity}",
    "friendCustomIdentity={friendCustomIdentity}",
    "setFriendCustomIdentity={setFriendCustomIdentity}",
    "villainCustomIdentity={villainCustomIdentity}",
    "setVillainCustomIdentity={setVillainCustomIdentity}",
    "heroImage={heroImage}",
    "setHeroImage={setHeroImage}",
    "friendImage={friendImage}",
    "setFriendImage={setFriendImage}",
    "villainImage={villainImage}",
    "setVillainImage={setVillainImage}",
    "isGeneratingHeroImage={isGeneratingHeroImage}",
    "isGeneratingFriendImage={isGeneratingFriendImage}",
    "isGeneratingVillainImage={isGeneratingVillainImage}",
    "handleGenerateCharacterImage={handleGenerateCharacterImage}",
    "isSavingChar={isSavingChar}",
    "handleSaveCharacter={handleSaveCharacter}",
    "handleDeleteCharacter={handleDeleteCharacter}",
    "handleToggleVaultCharacter={handleToggleVaultCharacter}"
]

for p in bad_props:
    content = content.replace(p, "")

with open('Setup.tsx', 'w') as f:
    f.write(content)
print("Cleaned Setup.tsx props")
