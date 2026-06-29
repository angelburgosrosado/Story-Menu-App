import React from 'react';
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
{(isCyberpunk || activeTab === 'persona') && (
             <div className="relative z-10 bg-slate-900 border-4 border-black p-6 rounded-xl shadow-[8px_8px_0px_rgba(0,0,0,1)] text-white text-left select-none animate-fadeIn">
                  {/* MULTIVERSE WARDROBE DRAWER COMPONENT */}
                  <AnimatePresence>
                       {isWardrobeOpen && (
                            <>
                                 {/* Dark Frosted Backdrop */}
                                 <motion.div
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                      onClick={() => setIsWardrobeOpen(false)}
                                      className="absolute inset-0 bg-black/75 backdrop-blur-sm z-[140] rounded-xl flex items-center justify-center p-4 cursor-pointer"
                                 />

                                 {/* Drawer Sliding Body */}
                                 <motion.div
                                      initial={{ x: '100%', opacity: 0.5 }}
                                      animate={{ x: 0, opacity: 1 }}
                                      exit={{ x: '100%', opacity: 0.5 }}
                                      transition={{ type: 'spring', damping: 26, stiffness: 190 }}
                                      className="absolute top-0 right-0 h-full w-full sm:w-[460px] bg-slate-950 border-l-4 border-black z-[150] shadow-[-10px_0px_0px_rgba(0,0,0,0.8)] rounded-r-lg p-6 flex flex-col font-mono select-none overflow-y-auto cursor-default"
                                 >
                                      {/* Drawer Header */}
                                      <div className="flex items-start justify-between border-b-4 border-black pb-3.5 mb-5 font-mono">
                                           <div>
                                                <div className="flex items-center gap-2">
                                                     <span className="text-2xl">🛍️</span>
                                                     <span className="text-lg font-black uppercase text-yellow-300 tracking-wider animate-pulse" style={{ textShadow: '1px 1px 0px black' }}>
                                                          WARDROBE CABINET
                                                     </span>
                                                </div>
                                                <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest mt-1 block font-bold">
                                                     SAGA DESIGN UNIFORM PRESETS
                                                </span>
                                           </div>
                                           <button
                                                type="button"
                                                onClick={() => setIsWardrobeOpen(false)}
                                                className="w-8 h-8 rounded border-2 border-black bg-gray-900 text-red-400 hover:bg-gray-900 text-red-400 text-white font-bold flex items-center justify-center shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] active:translate-y-px transition-all text-xs"
                                           >
                                                ✕
                                           </button>
                                      </div>

                                      {/* Target Character Tabs */}
                                      <div className="mb-4 font-mono">
                                           <label className="block text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-2 font-mono">
                                                Select Active Character Target
                                           </label>
                                           <div className="grid grid-cols-3 gap-1.5 bg-slate-900/80 p-1 border-2 border-black rounded">
                                                {(['Hero', 'Co-Star', 'Villain'] as const).map((role) => {
                                                     const isActive = wardrobeTargetRole === role;
                                                     let label = '🦸 HERO';
                                                     if (role === 'Co-Star') label = '👥 CO-STAR';
                                                     if (role === 'Villain') label = '🦹 NEMESIS';
                                                     
                                                     return (
                                                          <button
                                                               key={role}
                                                               type="button"
                                                               onClick={() => setWardrobeTargetRole(role)}
                                                               className={`py-1.5 text-center font-bold text-[10px] uppercase rounded transition-all ${
                                                                    isActive
                                                                         ? role === 'Hero'
                                                                              ? 'bg-blue-600 border border-black text-white shadow-[1px_1px_0px_black]'
                                                                              : role === 'Co-Star'
                                                                                   ? 'bg-gray-900 text-purple-400 border border-black text-white shadow-[1px_1px_0px_black]'
                                                                                   : 'bg-gray-900 text-red-400 border border-black text-white shadow-[1px_1px_0px_black]'
                                                                         : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                                               }`}
                                                          >
                                                               {label}
                                                          </button>
                                                     );
                                                })}
                                           </div>
                                      </div>

                                      {/* Alert Notification inside Drawer */}
                                      {wardrobeAlert && (
                                           <div className="bg-gray-900 text-yellow-400 border-2 border-black text-black font-extrabold text-[10px] p-2 rounded mb-4 animate-bounce text-center uppercase tracking-wide font-mono">
                                                ⚡ {wardrobeAlert}
                                           </div>
                                      )}

                                      {/* Presets Selection Column */}
                                      <div className="flex-1 space-y-4 font-mono">
                                           <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold font-mono block mb-1">
                                                Choose Predefined Sg-Aesthetic
                                           </span>
                                           
                                           {(['Tactical', 'Gala', 'Casual'] as const).map((presetKey) => {
                                                const pData = WARDROBE_PRESETS[wardrobeTargetRole][presetKey];
                                                const isActive = activePresets[wardrobeTargetRole] === presetKey;
                                                
                                                return (
                                                     <div
                                                          key={presetKey}
                                                          onClick={() => handleApplyWardrobePreset(wardrobeTargetRole, presetKey)}
                                                          className={`group relative p-3.5 border-2 border-black rounded-lg text-left transition-all cursor-pointer shadow-[3px_3px_0px_rgba(0,0,0,1)] hover:translate-x-px hover:translate-y-px hover:shadow-[1.5px_1.5px_0px_rgba(0,0,0,1)] ${
                                                               isActive 
                                                                    ? 'bg-slate-900 border-yellow-400 ring-2 ring-yellow-400/20' 
                                                                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                                                          }`}
                                                     >
                                                          {/* Active Tag */}
                                                          {isActive && (
                                                               <span className="absolute top-2 right-2 bg-gray-900 text-yellow-400 text-black text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow-[1px_1px_0px_black]">
                                                                    ACTIVE WEAR
                                                               </span>
                                                          )}

                                                          <div className="flex items-center gap-2 mb-1.5">
                                                               <span className="text-xl">{pData.emoji}</span>
                                                               <span className="text-xs font-extrabold uppercase text-white tracking-wide group-hover:text-yellow-300 transition-colors">
                                                                    {pData.name} ({presetKey})
                                                               </span>
                                                          </div>
                                                          
                                                          <div className="space-y-1.5 font-sans">
                                                               <div>
                                                                    <span className="text-[9px] font-bold text-slate-400 block tracking-wide">{t('setup.auto23', 'GARMENT & HAIR DESCRIPTION')}</span>
                                                                    <p className="text-[11px] text-slate-200 leading-relaxed italic pr-4 bg-slate-950/30 p-1.5 rounded">
                                                                         "{pData.desc}"
                                                                    </p>
                                                               </div>
                                                               <div>
                                                                    <span className="text-[9px] font-bold text-slate-400 block tracking-wide">{t('setup.auto24', 'RENDERING ART STYLE DIRECTIVE')}</span>
                                                                    <p className="text-[10px] text-yellow-300 mt-0.5 font-semibold font-sans">
                                                                         ⚔️ {pData.styleLock}
                                                                    </p>
                                                               </div>
                                                          </div>
                                                     </div>
                                                );
                                           })}
                                      </div>

                                      {/* Drawer Footer controls */}
                                      <div className="mt-6 border-t-2 border-slate-800 pt-4 text-center font-mono">
                                           <span className="text-[9.5px] text-slate-400 font-mono uppercase tracking-tight block">
                                                Updates dynamic rendering directives instantly.
                                           </span>
                                           <button
                                                type="button"
                                                onClick={() => setIsWardrobeOpen(false)}
                                                className="w-full mt-2.5 bg-gray-900 text-yellow-400 hover:bg-gray-900 text-yellow-400 text-black font-extrabold text-xs py-2 uppercase border-2 border-black shadow-[2px_2px_0px_black] active:translate-y-px transition-all font-mono"
                                           >
                                                🔐 LOCK SARTORIAL MATRIX
                                           </button>
                                      </div>
                                 </motion.div>
                            </>
                       )}
                  </AnimatePresence>
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b-4 border-black pb-4 mb-6 gap-4">
                       <div>
                            <span className="block font-mono text-purple-400 font-extrabold text-2xl md:text-3xl uppercase tracking-wider mb-1" style={{ textShadow: '2px 2px 0px black' }}>
                                 🎭 THE MULTIVERSE AI PERSONA TUNING STUDIO
                            </span>
                            <p className="text-xs text-slate-400 font-mono max-w-2xl leading-relaxed">
                                 Assists you in developing, designing, and brainstorming rich characters. Specify a name, a role type, and select a visual direction. Let the AI brainstorm complete custom coordinates (including hair, garment design, and superpowers), generate detailed character graphic art sheets, and cast them straight into the active comic saga series!
                            </p>
                       </div>
                       <button
                            type="button"
                            onClick={() => {
                                 setWardrobeTargetRole(personaStudioRole);
                                 setIsWardrobeOpen(true);
                            }}
                            className="self-start md:self-center flex items-center gap-1.5 bg-gray-900 text-purple-400 hover:bg-gray-900 text-purple-400 text-white font-mono font-black text-xs uppercase px-4 py-3 rounded border border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.2)] active:translate-y-px active:shadow-[1px_1px_0px_rgba(0,0,0,1)] tracking-wide transition-all"
                       >
                            🛍️ CHOOSE WARDROBE
                       </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                      {/* Left Panel: Creator Workspace */}
                      <div className="lg:col-span-7 flex flex-col gap-4 bg-slate-800 border-4 border-black p-5 rounded-lg shadow-[4px_4px_0px_#000]">
                           <div>
                                <label className="block text-xs font-mono text-yellow-300 uppercase tracking-wider mb-2">{t('setup.auto25', '1. Select Character Role')}</label>
                                <div className="grid grid-cols-3 gap-3">
                                     <button
                                          type="button"
                                          onClick={() => handlePersonaStudioSelectRole('Hero')}
                                          className={`py-2 text-center font-mono font-bold text-xs uppercase rounded border-2 transition-all ${
                                               personaStudioRole === 'Hero'
                                                    ? 'bg-blue-600 border-black text-white shadow-[2px_2px_0px_black]'
                                                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                                          }`}
                                     >
                                          🦸 HERO
                                     </button>
                                     <button
                                          type="button"
                                          onClick={() => handlePersonaStudioSelectRole('Co-Star')}
                                          className={`py-2 text-center font-mono font-bold text-xs uppercase rounded border-2 transition-all ${
                                               personaStudioRole === 'Co-Star'
                                                    ? 'bg-gray-900 text-purple-400 border-black text-white shadow-[2px_2px_0px_black]'
                                                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                                          }`}
                                     >
                                          👥 CO-STAR
                                     </button>
                                     <button
                                          type="button"
                                          onClick={() => handlePersonaStudioSelectRole('Villain')}
                                          className={`py-2 text-center font-mono font-bold text-xs uppercase rounded border-2 transition-all ${
                                               personaStudioRole === 'Villain'
                                                    ? 'bg-gray-900 text-red-400 border-black text-white shadow-[2px_2px_0px_black]'
                                                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                                          }`}
                                     >
                                          🦹 NEMESIS
                                     </button>
                                </div>
                           </div>

                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                     <label className="block text-xs font-mono text-gray-300 uppercase mb-1 font-semibold">{t('setup.auto26', 'Character Name Input')}</label>
                                     <input
                                          type="text"
                                          value={personaStudioName}
                                          onChange={(e) => setPersonaStudioName(e.target.value)}
                                          placeholder="e.g. Captain Volt, Chrono..."
                                          className="w-full bg-gray-950/50 border border-cyan-800 text-white text-xs p-2 rounded focus:outline-none focus:border-purple-500 font-sans"
                                     />
                                </div>
                                <div>
                                     <div className="flex justify-between items-center mb-1">
                                          <label className="block text-xs font-mono text-gray-350 uppercase font-semibold">{t('setup.auto27', 'Creative Art Style')}</label>
                                          {props.selectedGenre !== personaStudioStyle && (
                                               <button
                                                    type="button"
                                                    onClick={() => setPersonaStudioStyle(props.selectedGenre)}
                                                    className="text-[8.5px] bg-purple-950/60 hover:bg-purple-900 text-purple-300 border border-purple-500/30 rounded px-1.5 py-0.5 font-mono tracking-wide transition-all uppercase font-bold"
                                                    title={`Sync with selected story: ${props.selectedGenre}`}
                                               >
                                                    🔗 Sync to {props.selectedGenre || "Selected Story"}
                                               </button>
                                          )}
                                     </div>
                                     <select
                                          value={personaStudioStyle}
                                          onChange={(e) => setPersonaStudioStyle(e.target.value)}
                                          className="w-full bg-gray-950/50 border border-cyan-800 text-white text-xs p-2.5 rounded focus:outline-none focus:border-purple-500 font-sans font-semibold"
                                     >
                                          {dynamicCategories.filter(c => c.category_type === 'Genre').map((cat) => (
                                                <option key={cat.name} value={cat.name}>{cat.emoji || "🎨"} {cat.name}</option>
                                           ))}
                                     </select>
                                </div>
                           </div>

                           <div>
                                <label className="block text-xs font-mono text-gray-300 uppercase mb-1 font-semibold">{t('setup.auto28', 'Persona Concept Hint / Keywords')}</label>
                                <textarea
                                     rows={2}
                                     value={personaStudioConcept}
                                     onChange={(e) => setPersonaStudioConcept(e.target.value)}
                                     placeholder="e.g. cyberpunk hacktivist with electro-kinesis, hot-headed ninja, mysterious shadow commander"
                                     className="w-full bg-gray-950/50 border border-cyan-800 text-white text-xs p-2 rounded focus:outline-none focus:border-purple-500 font-sans font-semibold"
                                />
                                {/* Custom Style Description Templates */}
                                <div className="mt-2 text-[10px] text-gray-400">
                                     <span className="font-mono text-[9px] uppercase font-bold text-purple-400 mr-1.5 block mb-1">{t('setup.auto29', '💡 Custom Style Presets (Click to insert):')}</span>
                                     <div className="flex flex-wrap gap-1">
                                          {(() => {
                                               const templatesMap: Record<string, string[]> = {
                                                    'Anime Story': [
                                                         "Spiky blue hair, fierce eyes, cosmic energy aura",
                                                         "Academy school uniform, spellbook, gentle silver gaze"
                                                    ],
                                                    'Historical Archeology Tales': [
                                                         "Tomb explorer, leather bomber vest, dust-smudged cheeks",
                                                         "Decipherer, gold brass spectacles, ancient stone tablet"
                                                    ],
                                                    'Superhero Action': [
                                                         "High-tech carbon armored nanosuit with glowing lines",
                                                         "Midnight stealth cowl, long flowing heavy cape"
                                                    ],
                                                    'Dark Sci-Fi': [
                                                         "Cybernetic plates, glowing visor, chrome left arm",
                                                         "Tactical spacer suit, oxygen tube mask, stellar badges"
                                                    ],
                                                    'Classic Horror': [
                                                         "Camp guide holding a flickering lantern, muddy knees",
                                                         "Gothic attire, pale porcelain skin, hollow dark expression"
                                                    ]
                                               };
                                               const rawPresets = templatesMap[personaStudioStyle] || [
                                                    "Rugged futuristic jacket, carbon plating, glowing eyes",
                                                    "Tailored leather high-collar coat, fingerless gloves"
                                               ];
                                               return rawPresets.map((txt, index) => (
                                                    <button
                                                         key={index}
                                                         type="button"
                                                         onClick={() => setPersonaStudioConcept(txt)}
                                                         className="text-[9px] bg-slate-950 hover:bg-slate-800 text-gray-300 font-sans tracking-wide px-2 py-0.5 rounded border border-purple-900 hover:border-purple-400 transition-colors truncate max-w-[200px]"
                                                    >
                                                         + {txt}
                                                    </button>
                                               ));
                                          })()}
                                     </div>
                                </div>
                           </div>

                           <button
                                type="button"
                                onClick={handlePersonaStudioBrainstorm}
                                disabled={personaStudioSuggesting}
                                className="w-full bg-gray-900 text-yellow-400 hover:bg-gray-900 text-yellow-400 text-black font-semibold font-mono uppercase text-xs py-3.5 px-4 rounded border border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.2)] active:translate-y-px active:shadow-[1px_1px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2"
                           >
                                {personaStudioSuggesting ? (
                                     <>
                                          <svg className="animate-spin h-4 w-4 text-black" viewBox="0 0 24 24" fill="none">
                                               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                          </svg>
                                          TRANSCENDING REALITY PLANES...
                                     </>
                                ) : (
                                     "🔮 BRAINSTORM FULL PERSONA PROFILE WITH AI"
                                )}
                           </button>

                           {/* Output of AI Suggestion */}
                           {(personaStudioSuggestedName || personaStudioSuggestedBio || personaStudioSuggestedVisuals) && (
                                <div className="mt-2 p-4 bg-slate-950 border-2 border-dashed border-purple-500/50 rounded-lg animate-fadeIn text-left">
                                     <div className="flex justify-between border-b border-slate-700 pb-1.5 mb-2">
                                          <span className="font-mono text-xs uppercase text-purple-300 font-bold">{t('setup.auto30', '✨ Designed Persona Profile Specs')}</span>
                                          <span className="bg-purple-900 text-purple-200 text-[9px] px-1.5 py-0.2 rounded font-mono uppercase font-bold">{t('setup.auto31', 'GEMINI GENERATED')}</span>
                                     </div>
                                     <div className="space-y-2.5 text-xs text-gray-300">
                                          <div>
                                               <strong className="text-white font-semibold">{t('setup.auto32', 'Brainstormed Name:')}</strong>
                                               <p className="bg-slate-900/40 p-1.5 rounded mt-0.5 text-yellow-300 font-mono uppercase text-[12px]">{personaStudioSuggestedName}</p>
                                          </div>
                                          <div>
                                               <strong className="text-white font-semibold flex items-center">{t('setup.auto33', 'Story Backstory / Bio:')}</strong>
                                               <p className="bg-slate-900/40 p-1.5 rounded mt-0.5 leading-relaxed font-sans">{personaStudioSuggestedBio}</p>
                                          </div>
                                          <div>
                                               <strong className="text-white font-semibold">{t('setup.auto34', 'Dressing & Hairstyle Prompt Descriptors:')}</strong>
                                               <p className="bg-slate-900/40 p-1.5 rounded mt-0.5 italic font-sans">{personaStudioSuggestedVisuals}</p>
                                          </div>
                                          {personaStudioRole === 'Villain' && (
                                               <div>
                                                    <strong className="text-white font-semibold text-red-400">{t('setup.auto35', 'Nemesis DNA & Core Powers Source:')}</strong>
                                                    <p className="bg-slate-900/40 p-1.5 rounded mt-0.5 font-sans font-semibold text-red-300">{personaStudioSuggestedPowers}</p>
                                               </div>
                                          )}
                                     </div>
                                </div>
                           )}

                            {/* Nemesis Identity Schema Coordination Matrix */}
                            {personaStudioRole === 'Villain' && (
                                 <div className="mt-4 p-4 bg-slate-950 border-4 border-black border-red-500/30 rounded-lg text-left shadow-[4px_4px_0px_rgba(0,0,0,1)] animate-fadeIn">
                                      <div className="flex flex-col border-b border-red-500/25 pb-2.5 mb-4 font-mono">
                                           <span className="font-mono text-sm uppercase text-red-400 font-extrabold flex items-center gap-1.5 select-none tracking-wide" style={{ textShadow: '1px 1px 0px black' }}>
                                                💀 Nemesis Cosmic Identity Schema Editor
                                           </span>
                                           <span className="text-[10px] text-gray-400 font-mono tracking-wider">
                                                Fine-tune multi-layer coordinates before committing to catalog & series memory
                                           </span>
                                      </div>

                                      <div className="space-y-4 text-xs font-sans">
                                           {/* Biometric Backbone */}
                                           <div className="flex flex-col gap-1.5 text-left font-sans">
                                                <label className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                                     <span>{t('setup.auto36', '🧬 1. Biometric Backbone (Faces, Eyes, Likeness Core)')}</span>
                                                </label>
                                                <textarea
                                                     rows={2}
                                                     value={
                                                          personaStudioSuggestedNemesisDna?.persistence_layer?.biometric_backbone ?? 
                                                          props.nemesisDNA?.persistence_layer?.biometric_backbone ?? 
                                                          ''
                                                     }
                                                     onChange={(e) => {
                                                          const base = personaStudioSuggestedNemesisDna || props.nemesisDNA;
                                                          const updated = {
                                                               ...base,
                                                               persistence_layer: {
                                                                    ...base.persistence_layer,
                                                                    biometric_backbone: e.target.value
                                                               }
                                                          };
                                                          setPersonaStudioSuggestedNemesisDna(updated);
                                                     }}
                                                     placeholder="Physical appearance elements (e.g. razor sharp facial features, deep-set jade green eyes, long silk black hair)..."
                                                     className="w-full bg-slate-900 border border-slate-700/80 text-white text-[11px] p-2 rounded focus:outline-none focus:border-red-500 leading-relaxed font-sans font-semibold"
                                                />
                                           </div>

                                           {/* Structural Constants */}
                                           <div className="flex flex-col gap-1.5 text-left font-sans">
                                                <label className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                                     <span>{t('setup.auto37', '🔩 2. Structural Constants (Identity Marks & Accessories)')}</span>
                                                </label>
                                                <textarea
                                                     rows={2}
                                                     value={
                                                          personaStudioSuggestedNemesisDna?.persistence_layer?.structural_constants ?? 
                                                          props.nemesisDNA?.persistence_layer?.structural_constants ?? 
                                                          ''
                                                     }
                                                     onChange={(e) => {
                                                          const base = personaStudioSuggestedNemesisDna || props.nemesisDNA;
                                                          const updated = {
                                                               ...base,
                                                               persistence_layer: {
                                                                    ...base.persistence_layer,
                                                                    structural_constants: e.target.value
                                                               }
                                                          };
                                                          setPersonaStudioSuggestedNemesisDna(updated);
                                                     }}
                                                     placeholder="Identity marks that never change (e.g., discrete dual silver piercings on her left brow, cybernetic skull implant)..."
                                                     className="w-full bg-slate-900 border border-slate-700/80 text-white text-[11px] p-2 rounded focus:outline-none focus:border-red-500 leading-relaxed font-sans font-semibold"
                                                />
                                           </div>

                                           {/* Chromatic Anchor */}
                                           <div className="flex flex-col gap-1.5 text-left font-sans">
                                                <label className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                                     <span>{t('setup.auto38', '🎨 3. Chromatic Anchor (Visual Atmosphere, Palettes, Rim-light)')}</span>
                                                </label>
                                                <textarea
                                                     rows={2}
                                                     value={
                                                          personaStudioSuggestedNemesisDna?.persistence_layer?.chromatic_anchor ?? 
                                                          props.nemesisDNA?.persistence_layer?.chromatic_anchor ?? 
                                                          ''
                                                     }
                                                     onChange={(e) => {
                                                          const base = personaStudioSuggestedNemesisDna || props.nemesisDNA;
                                                          const updated = {
                                                               ...base,
                                                               persistence_layer: {
                                                                    ...base.persistence_layer,
                                                                    chromatic_anchor: e.target.value
                                                               }
                                                          };
                                                          setPersonaStudioSuggestedNemesisDna(updated);
                                                     }}
                                                     placeholder="Atmospheric tone & lighting (e.g. heavy shadow depth contrast, radiant purple halo backlighting, cold noir tints)..."
                                                     className="w-full bg-slate-900 border border-slate-700/80 text-white text-[11px] p-2 rounded focus:outline-none focus:border-red-500 leading-relaxed font-sans font-semibold"
                                                />
                                           </div>

                                           {/* Adaptive Layer */}
                                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left font-sans">
                                                <div className="flex flex-col gap-1.5">
                                                     <label className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-wider">
                                                          🧥 4. Sartorial Style
                                                     </label>
                                                     <input
                                                          type="text"
                                                          value={
                                                               personaStudioSuggestedNemesisDna?.adaptive_layer?.sartorial_style ?? 
                                                               props.nemesisDNA?.adaptive_layer?.sartorial_style ?? 
                                                               ''
                                                          }
                                                          onChange={(e) => {
                                                               const base = personaStudioSuggestedNemesisDna || props.nemesisDNA;
                                                               const updated = {
                                                                    ...base,
                                                                    adaptive_layer: {
                                                                         ...base.adaptive_layer,
                                                                         sartorial_style: e.target.value
                                                                    }
                                                               };
                                                               setPersonaStudioSuggestedNemesisDna(updated);
                                                          }}
                                                          placeholder="e.g. Avant-garde tactical assassin"
                                                          className="w-full bg-slate-900 border border-slate-700/80 text-white text-[11px] p-2 rounded focus:outline-none focus:border-red-500 font-sans font-semibold"
                                                     />
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                     <label className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-wider">
                                                          👗 5. Active Wardrobe
                                                     </label>
                                                     <input
                                                          type="text"
                                                          value={
                                                               personaStudioSuggestedNemesisDna?.adaptive_layer?.active_wardrobe ?? 
                                                               props.nemesisDNA?.adaptive_layer?.active_wardrobe ?? 
                                                               ''
                                                          }
                                                          onChange={(e) => {
                                                               const base = personaStudioSuggestedNemesisDna || props.nemesisDNA;
                                                               const updated = {
                                                                    ...base,
                                                                    adaptive_layer: {
                                                                         ...base.adaptive_layer,
                                                                         active_wardrobe: e.target.value
                                                                    }
                                                               };
                                                               setPersonaStudioSuggestedNemesisDna(updated);
                                                          }}
                                                          placeholder="e.g. Tailored matte kevlar suit with silk red sash"
                                                          className="w-full bg-slate-900 border border-slate-700/80 text-white text-[11px] p-2 rounded focus:outline-none focus:border-red-500 font-sans font-semibold"
                                                     />
                                                </div>
                                           </div>

                                           {/* Rendering Directives split */}
                                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left font-sans">
                                                <div className="flex flex-col gap-1.5">
                                                     <label className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-wider">
                                                          🔒 6. Art Style Lock
                                                     </label>
                                                     <input
                                                          type="text"
                                                          value={
                                                               personaStudioSuggestedNemesisDna?.rendering_directives?.art_style_lock ?? 
                                                               props.nemesisDNA?.rendering_directives?.art_style_lock ?? 
                                                               ''
                                                          }
                                                          onChange={(e) => {
                                                               const base = personaStudioSuggestedNemesisDna || props.nemesisDNA;
                                                               const updated = {
                                                                    ...base,
                                                                    rendering_directives: {
                                                                         ...base.rendering_directives,
                                                                         art_style_lock: e.target.value
                                                                    }
                                                               };
                                                               setPersonaStudioSuggestedNemesisDna(updated);
                                                          }}
                                                          placeholder="e.g. Deep comic noir, heavy outline vectors"
                                                          className="w-full bg-slate-900 border border-slate-700/80 text-white text-[11px] p-2 rounded focus:outline-none focus:border-red-500 font-sans font-semibold"
                                                     />
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                     <label className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-wider">
                                                          ⚖️ 7. Continuity Weight
                                                     </label>
                                                     <div className="flex border border-slate-700 rounded overflow-hidden">
                                                          {['LOW', 'MEDIUM', 'HIGH'].map((w) => {
                                                               const activeDna = personaStudioSuggestedNemesisDna || props.nemesisDNA;
                                                               const isCurrent = activeDna?.rendering_directives?.continuity_weight === w;
                                                               return (
                                                                    <button
                                                                         key={w}
                                                                         type="button"
                                                                         onClick={() => {
                                                                              const base = personaStudioSuggestedNemesisDna || props.nemesisDNA;
                                                                              const updated = {
                                                                                   ...base,
                                                                                   rendering_directives: {
                                                                                        ...base.rendering_directives,
                                                                                        continuity_weight: w as any
                                                                                   }
                                                                              };
                                                                              setPersonaStudioSuggestedNemesisDna(updated);
                                                                         }}
                                                                         className={`flex-1 text-[10px] py-1.5 text-center font-mono font-bold transition-colors ${
                                                                              isCurrent 
                                                                                   ? 'bg-red-650 text-white font-black shadow-[inset_0px_2px_4px_rgba(0,0,0,0.6)]' 
                                                                                   : 'bg-slate-900 text-slate-400 hover:text-white font-normal'
                                                                         }`}
                                                                    >
                                                                         {w}
                                                                    </button>
                                                               );
                                                          })}
                                                     </div>
                                                </div>
                                           </div>
                                      </div>
                                 </div>
                            )}

                      </div>

                      {/* Right Panel: Portrait and Casting Panel */}
                      <div className="lg:col-span-5 flex flex-col gap-4 bg-slate-800 border-4 border-black p-5 rounded-lg shadow-[4px_4px_0px_#000] text-center min-h-[450px] justify-between font-mono font-bold">
                           <div>
                                <label className="block text-xs font-mono text-yellow-300 uppercase tracking-wider mb-2 text-left">{t('setup.auto39', '2. Character Avatar Portrait')}</label>
                                <div className="relative aspect-square w-full max-w-[280px] mx-auto bg-slate-950 border-4 border-black rounded-lg overflow-hidden group shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                                     {personaStudioPortrait ? (
                                          <img
                                               src={personaStudioPortrait.startsWith('data:') ? personaStudioPortrait : `data:image/jpeg;base64,${personaStudioPortrait}`}
                                               alt="Summoned Avatar"
                                               className="w-full h-full object-cover select-none"
                                               referrerPolicy="no-referrer"
                                          />
                                     ) : (
                                          <div className="w-full h-full flex flex-col items-center justify-center p-4">
                                               <span className="text-5xl mb-2 select-none">🎭</span>
                                               <span className="font-mono text-sm text-purple-300 uppercase font-extrabold pb-1">{t('setup.auto40', 'AWAITING SUMMONS')}</span>
                                               <span className="text-[10px] text-gray-400 uppercase font-mono tracking-widest mt-1">{t('setup.auto41', 'SAGA PORTRAIT PORTAL')}</span>
                                          </div>
                                     )}

                                     {personaStudioGeneratingImg && (
                                          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-4">
                                               <div className="w-12 h-12 border-4 border-t-purple-500 border-r-purple-500 border-b-transparent border-l-transparent rounded-full animate-spin mb-3" />
                                               <span className="font-mono text-xs uppercase text-purple-400 tracking-wider">{t('setup.auto42', 'SUMMONING VISUAL CORES')}</span>
                                               <span className="text-[9px] font-mono text-gray-400 uppercase mt-1 animate-pulse">{t('setup.auto43', 'GENERATING COMIC PORTRAIT...')}</span>
                                          </div>
                                     )}
                                </div>

                                <p className="text-[10.5px] mt-3 font-mono text-yellow-405/90 leading-tight">
                                     {personaStudioStatusMsg || "Define character specs & run brainstorm to prepare artistic portrait generation."}
                                 </p>
                           </div>

                           <div className="flex flex-col gap-2">
                                <button
                                     type="button"
                                     onClick={handlePersonaStudioGeneratePortrait}
                                     disabled={personaStudioGeneratingImg || (!personaStudioSuggestedVisuals && !personaStudioConcept)}
                                     className="w-full bg-gray-900 text-cyan-400 hover:bg-cyan-300 disabled:opacity-40 disabled:pointer-events-none text-black font-semibold font-mono uppercase text-xs py-3 px-4 rounded border border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.2)] active:translate-y-px transition-all"
                                >
                                     🎨 CONJURE AI CARTOON PORTRAIT MAP
                                </button>
                                <button
                                     type="button"
                                     onClick={handlePersonaStudioCastCharacter}
                                     disabled={!personaStudioPortrait}
                                     className="w-full bg-red-656 hover:bg-gray-900 text-red-400 disabled:opacity-40 disabled:pointer-events-none text-white font-mono uppercase text-sm font-bold py-3.5 px-4 rounded border border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.2)] active:translate-y-px transition-all"
                                >
                                     🔥 COMMIT PERSONA & CAST AS {personaStudioRole.toUpperCase()}
                                </button>
                           </div>
                      </div>
                  </div>
             </div>
        )}

        </>
    );
};
