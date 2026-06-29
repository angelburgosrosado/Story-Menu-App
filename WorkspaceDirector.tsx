import React from 'react';
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
{(isCyberpunk || activeTab === 'blueprint') && (
             <div className="relative z-10 bg-slate-900 border-4 border-black p-6 rounded-xl shadow-[8px_8px_0px_rgba(0,0,0,1)] text-white text-left select-none animate-fadeIn">
                  {/* HEADER BANNER */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-4 border-black pb-4 mb-6">
                       <div>
                            <div className="flex items-center gap-2 mb-1">
                                 <span className="text-3xl">🔮</span>
                                 <span className="font-mono text-xl lg:text-2xl font-black uppercase text-cyan-300 tracking-wider" style={{ textShadow: '2px 2px 0px black' }}>
                                      Story Blueprint Manager
                                 </span>
                            </div>
                            <p className="text-xs text-slate-400 font-mono max-w-xl">
                                 Draft or AI-generate detailed chapter-level goals and guidelines. This full layout is sent to the Gemini generator to maintain robust narrative cohesion.
                            </p>
                       </div>
                       
                       <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
                            <button
                                 type="button"
                                 onClick={handleGenerateStoryBlueprint}
                                 disabled={generatingBlueprint}
                                 className="bg-gray-900 text-cyan-400 hover:bg-gray-900 text-cyan-400 text-black font-semibold font-mono uppercase text-xs px-3.5 py-2.5 rounded border border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.2)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 active:translate-y-px transition-all flex items-center gap-1.5"
                            >
                                 {generatingBlueprint ? (
                                      <>
                                           <div className="w-3.5 h-3.5 border-2 border-slate-955 border-t-transparent rounded-full animate-spin" />
                                           Saga Thinking...
                                      </>
                                 ) : (
                                      <>{t('setup.auto44', '✨ AI Brainstorm Saga Path')}</>
                                 )}
                            </button>
                            <button
                                 type="button"
                                 onClick={handleInitializeDefaultBlueprint}
                                 className="bg-gray-900 text-purple-400 hover:bg-gray-900 text-purple-400 text-white font-semibold font-mono uppercase text-xs px-3.5 py-2.5 rounded border border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.2)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 active:translate-y-px transition-all flex items-center gap-1.5"
                            >
                                 📋 Load Default Template
                            </button>
                            <button
                                 type="button"
                                 onClick={() => props.onStoryBlueprintChange([])}
                                 className="bg-slate-950 hover:bg-slate-900 text-red-450 border-2 border-black font-semibold font-mono uppercase text-xs px-3 py-2 rounded shadow-[2px_2px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                            >
                                 ❌ Clear Blueprint
                            </button>
                       </div>
                  </div>

                  {/* ACTIVE SAGA CONTEXT FEED */}
                  <div className="bg-slate-950/80 p-3 rounded-lg border-2 border-black mb-6 flex flex-wrap gap-x-6 gap-y-2 text-xs font-mono">
                       <div>
                            <span className="text-cyan-400 font-bold uppercase">{t('setup.auto45', 'Active Genre:')}</span> {props.selectedGenre || "Custom"}
                       </div>
                       {props.customPremise && (
                            <div className="max-w-md truncate">
                                 <span className="text-cyan-400 font-bold uppercase">{t('setup.auto46', 'Premise:')}</span> {props.customPremise}
                            </div>
                       )}
                       <div>
                            <span className="text-cyan-400 font-bold uppercase">{t('setup.auto47', 'Language:')}</span> {props.selectedLanguage || "English"}
                       </div>
                  </div>

                  {/* MAIN CHAPTER CARD LIST / GRID */}
                  {!props.storyBlueprint || props.storyBlueprint.length === 0 ? (
                       <div className="text-center py-16 px-4 bg-slate-950/40 rounded-xl border-4 border-dashed border-slate-800">
                            <span className="text-5xl block mb-3">🔮</span>
                            <h3 className="font-mono text-base font-extrabold text-yellow-500 uppercase mb-2">{t('setup.auto48', 'Saga Blueprint Blank')}</h3>
                            <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed mb-4">
                                 Your blueprint configuration is currently empty. Click above to auto-generate a custom plot-line tailored to your active genre and characters, or load a default template structure to write goals manually!
                            </p>
                            <div className="flex justify-center gap-3">
                                 <button
                                      type="button"
                                      onClick={handleGenerateStoryBlueprint}
                                      disabled={generatingBlueprint}
                                      className="bg-gray-900 text-cyan-400 hover:bg-gray-900 text-cyan-400 px-4 py-2 text-black font-semibold font-mono uppercase text-xs rounded border border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                                 >
                                      {generatingBlueprint ? "⚡ Brainstorming Saga..." : "✨ Generate AI Saga Path"}
                                 </button>
                                 <button
                                      type="button"
                                      onClick={handleInitializeDefaultBlueprint}
                                      className="bg-purple-700 hover:bg-gray-900 text-purple-400 px-4 py-2 text-white font-semibold font-mono uppercase text-xs rounded border border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]"
                                 >
                                      📋 Load Default Structure
                                 </button>
                            </div>
                       </div>
                  ) : (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[580px] overflow-y-auto pr-2 custom-scrollbar">
                            {Array.from({ length: 10 }).map((_, idx) => {
                                 const pageNum = idx + 1;
                                 const node = props.storyBlueprint.find((b: any) => b.chapterNum === pageNum) || {
                                      chapterNum: pageNum,
                                      title: `Chapter Beat ${pageNum}`,
                                      goal: ""
                                 };

                                 // Unique visual identifier theme per Chapter slot
                                 let themeClasses = "border-slate-800 focus-within:border-cyan-500";
                                 let tagColor = "bg-slate-950 text-slate-300";
                                 let emoji = "📖";

                                 if (pageNum === 1) {
                                      themeClasses = "border-emerald-950 bg-emerald-950/10 focus-within:border-emerald-500";
                                      tagColor = "bg-emerald-950 text-emerald-400 border-emerald-800/40";
                                      emoji = "🎬";
                                 } else if (pageNum === 3) {
                                      themeClasses = "border-amber-950 bg-amber-950/10 focus-within:border-amber-500";
                                      tagColor = "bg-amber-950 text-amber-400 border-amber-800/40";
                                      emoji = "⚖️";
                                 } else if (pageNum === 9) {
                                      themeClasses = "border-red-950 bg-red-955/10 focus-within:border-red-500";
                                      tagColor = "bg-red-950 text-red-200 border-red-800/40";
                                      emoji = "⚔️";
                                 } else if (pageNum === 10) {
                                      themeClasses = "border-purple-950 bg-purple-950/10 focus-within:border-purple-500";
                                      tagColor = "bg-purple-950 text-purple-300 border-purple-800/40";
                                      emoji = "🏁";
                                 }

                                 return (
                                      <div 
                                           key={pageNum}
                                           className={`p-4 rounded-xl border-2 transition-all bg-slate-950/60 flex flex-col gap-3 shadow-[inset_0px_2px_8px_rgba(255,255,255,0.02)] ${themeClasses}`}
                                      >
                                           {/* Slot Header */}
                                           <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                     <span className={`text-[10px] font-mono uppercase font-black px-2.5 py-1 rounded border ${tagColor}`}>
                                                          {emoji} Page {pageNum} Beat
                                                     </span>
                                                     {pageNum === 1 && (
                                                          <span className="text-[8.5px] font-mono font-semibold text-emerald-400 animate-pulse">{t('setup.auto49', 'INCITING')}</span>
                                                     )}
                                                     {pageNum === 3 && (
                                                          <span className="text-[8.5px] font-mono font-semibold text-amber-400 animate-pulse">{t('setup.auto50', 'DECISION POINT')}</span>
                                                     )}
                                                     {pageNum === 9 && (
                                                          <span className="text-[8.5px] font-mono font-semibold text-red-405 animate-pulse">{t('setup.auto51', 'CLIMAX CONFLICT')}</span>
                                                     )}
                                                     {pageNum === 10 && (
                                                          <span className="text-[8.5px] font-mono font-semibold text-purple-400 animate-pulse">{t('setup.auto52', 'FINALE RESOLVE')}</span>
                                                     )}
                                                </div>
                                                
                                                <button
                                                     type="button"
                                                     onClick={() => handleGeneratePageGoal(pageNum)}
                                                     disabled={generatingPageGoal !== null}
                                                     className="text-[9.5px] bg-cyan-955 hover:bg-cyan-900 border border-cyan-800/60 hover:border-cyan-500 text-cyan-305 px-2 py-0.5 rounded font-mono transition-all disabled:opacity-40"
                                                     title="AI Suggest / Dream details for this specific chapter goal."
                                                >
                                                     {generatingPageGoal === pageNum ? "🧠 Thinking..." : "✨ AI Suggest"}
                                                </button>
                                           </div>

                                           {/* Title Input field */}
                                           <div className="flex flex-col gap-1 text-left">
                                                <label className="text-[9px] uppercase font-mono tracking-widest text-gray-500 font-bold block">{t('setup.auto53', 'Beat Title')}</label>
                                                <input 
                                                     type="text"
                                                     value={node.title || ""}
                                                     onChange={(e) => {
                                                          const val = e.target.value;
                                                          const updated = props.storyBlueprint ? [...props.storyBlueprint] : [];
                                                          const targetIndex = updated.findIndex((b: any) => b.chapterNum === pageNum);
                                                          if (targetIndex !== -1) {
                                                               updated[targetIndex] = { ...updated[targetIndex], title: val };
                                                          } else {
                                                               updated.push({ chapterNum: pageNum, title: val, goal: "" });
                                                          }
                                                          props.onStoryBlueprintChange(updated);
                                                     }}
                                                     placeholder="Provide an intriguing Scene focus name..."
                                                     className="w-full bg-slate-950 border-2 border-black rounded text-xs p-1.5 focus:outline-none focus:border-cyan-500 text-slate-100"
                                                />
                                           </div>

                                           {/* Goal Textarea */}
                                           <div className="flex flex-col gap-1 text-left">
                                                <label className="text-[9px] uppercase font-mono tracking-widest text-gray-500 font-bold block">{t('setup.auto54', 'Focal Goal & Narrative Guidelines')}</label>
                                                <textarea 
                                                     rows={2}
                                                     value={node.goal || ""}
                                                     onChange={(e) => {
                                                          const val = e.target.value;
                                                          const updated = props.storyBlueprint ? [...props.storyBlueprint] : [];
                                                          const targetIndex = updated.findIndex((b: any) => b.chapterNum === pageNum);
                                                          if (targetIndex !== -1) {
                                                               updated[targetIndex] = { ...updated[targetIndex], goal: val };
                                                          } else {
                                                               updated.push({ chapterNum: pageNum, title: `Beat ${pageNum}`, goal: val });
                                                          }
                                                          props.onStoryBlueprintChange(updated);
                                                     }}
                                                     placeholder="Flesh out specific guidelines, obstacles, or plot milestones for this beat..."
                                                     className="w-full bg-slate-950 border-2 border-black rounded text-xs p-2 h-16 resize-none focus:outline-none focus:border-cyan-500 text-slate-100 font-sans shadow-inner leading-relaxed"
                                                />
                                           </div>
                                      </div>
                                 );
                            })}
                       </div>
                  )}
             </div>
        )}


        </>
    );
};
