import React from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from './types';

// Utility for file to base64 if it's not exported from Setup.tsx
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

export const WorkspaceLibrary = ({
    isEditorial,
    isCyberpunk,
    savedProjects,
    handleDeleteProject,
    manualComicTitle,
    setManualComicTitle,
    manualComicGenre,
    setManualComicGenre,
    manualComicLanguage,
    setManualComicLanguage,
    dynamicCategories,
    manualComicCover,
    setManualComicCover,
    isPublishingManual,
    handleManualPublish,
    savedDrafts,
    isSavingDraft,
    handleSaveDraft,
    handleDeleteDraft,
    onLoadProject,
    onLoadDraft,
    sPrimaryBtn,
    sLabel,
    sInput,
    sSelect,
}: any) => {
    const { t } = useTranslation();

    return (
        <div className={isEditorial 
             ? "relative z-10 bg-[#fdfdfc] border border-stone-200 p-6 rounded-xl shadow-sm text-stone-900 text-left select-none font-sans"
             : "relative z-10 bg-slate-900 border-4 border-black p-6 rounded-xl shadow-[8px_8px_0px_rgba(0,0,0,1)] text-white text-left select-none"}>
             <span className={isEditorial
                 ? "block font-sans text-[#3c3730] font-black text-2xl uppercase tracking-wider mb-2"
                 : "block font-mono text-yellow-300 font-extrabold text-2.5xl uppercase tracking-wider mb-2"}
                 style={isEditorial ? {} : { textShadow: '2px 2px 0px black' }}>
                 {isEditorial ? "📚 THE NARRATIVE ARCHIVE" : "📚 THE MULTIVERSE STUDIO LIBRARY"}
             </span>
             <p className={isEditorial
                 ? "text-xs text-stone-500 font-sans mb-6 max-w-2xl leading-relaxed"
                 : "text-xs text-slate-400 font-mono mb-6 max-w-2xl leading-relaxed"}>
                 {isEditorial 
                      ? "Welcome to your central narrative archive! Below are your saved publications and manuscript chapters. Open any creation to load it instantly into the reading binder. You can also manually register a manuscript layout to compile it under your active author profile."
                      : "Welcome to your central comic storage vault! Below are your saved dynamic publications and chapters. Open any creation to load it instantly into the immersive 3D book binder reader. You can also self-publish a custom graphic layout to compile it under your active creator identity profile."}
             </p>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* LEFT SECTION: Comic Library List (8 cols) */}
                <div className="lg:col-span-8 flex flex-col gap-4">
                     <span className={isEditorial
                           ? "text-xs font-sans text-stone-605 tracking-wider uppercase border-b border-stone-200 pb-1.5 font-bold block"
                           : "text-xs font-mono text-slate-300 tracking-wider uppercase border-b-2 border-dashed border-slate-700 pb-1.5 font-bold block"}>
                          {isEditorial ? `📚 Saved Manuscripts Catalog (${savedProjects.length})` : `📚 Active Publications Archive (${savedProjects.length})`}
                     </span>

                     {savedProjects.length === 0 ? (
                          <div className={isEditorial
                               ? "p-12 border border-dashed border-stone-300 rounded bg-stone-50 text-center text-stone-400 font-sans my-4"
                               : "p-12 border-4 border-dashed border-slate-800 rounded bg-slate-950/40 text-center text-slate-500 font-mono my-4"}>
                               <p className="text-sm font-bold">{isEditorial ? "No manuscript entries found in your author catalog." : "No publications detected in your creator catalog."}</p>
                               <p className={isEditorial ? "text-[11px] mt-1.5 text-stone-500" : "text-[11px] mt-1.5 text-yellow-500"}>
                                    {isEditorial ? "Initiate an adventure, draft chapters, or self-publish on the right to populate your inventory!" : "Initiate an adventure, create comic stories, or self-publish on the right to populate your inventory!"}
                               </p>
                          </div>
                     ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                               {savedProjects.map((project: any) => {
                                    // Try to find cover image from comic_faces if present
                                    let coverUrl = 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=400&auto=format&fit=crop';
                                    let pageCount = 0;
                                    if (project.comic_faces) {
                                         try {
                                              const parsed = JSON.parse(project.comic_faces);
                                              if (Array.isArray(parsed)) {
                                                   pageCount = parsed.length;
                                                   const cv = parsed.find(f => f.type === 'cover' || f.pageIndex === 0);
                                                   if (cv && cv.imageUrl) {
                                                        coverUrl = cv.imageUrl;
                                                   } else if (parsed[0] && parsed[0].imageUrl) {
                                                        coverUrl = parsed[0].imageUrl;
                                                   }
                                              }
                                         } catch (e) {}
                                    }

                                    return (
                                         <div 
                                              key={project.id}
                                              className={isEditorial
                                                   ? "group flex gap-3.5 bg-white border border-stone-200 p-3.5 rounded-lg hover:border-stone-400 hover:shadow-sm transition-all cursor-pointer relative text-left"
                                                   : "group flex gap-3.5 bg-slate-950 border-4 border-black p-3.5 rounded-lg hover:border-yellow-400 hover:shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-all cursor-pointer relative text-left"}
                                              onClick={() => onLoadProject(project)}
                                         >
                                              {/* Cover thumbnail */}
                                              <div className={isEditorial
                                                   ? "w-16 h-24 bg-stone-50 border border-stone-200 rounded overflow-hidden flex-shrink-0 relative"
                                                   : "w-16 h-24 bg-slate-900 border-2 border-slate-700 rounded overflow-hidden flex-shrink-0 relative"}>
                                                   <img 
                                                        src={coverUrl.startsWith('data:') ? coverUrl : coverUrl}
                                                        alt="Cover" 
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        referrerPolicy="no-referrer"
                                                   />
                                                   <div className={isEditorial
                                                        ? "absolute top-1 left-1 bg-stone-800 text-[8px] font-sans text-stone-50 px-1 py-0.5 rounded"
                                                        : "absolute top-1 left-1 bg-black/80 text-[8px] font-mono text-white px-1 py-0.2 rounded border border-slate-600/50"}>
                                                        {typeof project.language === 'string' ? project.language : 'en-US'}
                                                   </div>
                                              </div>

                                              {/* Narrative details */}
                                              <div className="flex-1 flex flex-col justify-between min-w-0">
                                                   <div>
                                                        <span className={isEditorial
                                                             ? "block font-sans font-bold text-sm tracking-wide text-stone-900 group-hover:text-stone-700 truncate transition-colors"
                                                             : "block font-mono font-bold text-sm tracking-wide text-white group-hover:text-yellow-300 truncate transition-colors"}>
                                                             {typeof project.title === 'string' ? project.title : 'Untitled Project'}
                                                        </span>
                                                        <span className={isEditorial
                                                             ? "inline-block mt-1 bg-stone-100 border border-stone-200 rounded text-[9px] font-sans text-stone-600 px-1.5 py-0.5 uppercase tracking-wider font-bold"
                                                             : "inline-block mt-1 bg-blue-600/40 border border-blue-500 rounded text-[9px] font-mono text-cyan-300 px-1.5 py-0.5 uppercase tracking-wider font-bold"}>
                                                             {typeof project.genre === 'string' ? project.genre : 'Unknown Genre'}
                                                        </span>
                                                   </div>
                                                   
                                                   <div className={isEditorial
                                                        ? "flex items-center justify-between text-[10px] font-sans mt-3 text-stone-500"
                                                        : "flex items-center justify-between text-[10px] font-mono mt-3 text-slate-400"}>
                                                        <span>{isEditorial ? "🖋️" : "📖"} {pageCount} {pageCount === 1 ? (isEditorial ? 'Chapter' : 'Page') : (isEditorial ? 'Chapters' : 'Pages')}</span>
                                                        <button
                                                             type="button"
                                                             onClick={(e) => handleDeleteProject(project.id, e)}
                                                             className={isEditorial
                                                                  ? "text-red-700 hover:text-red-800 px-1.5 py-0.5 bg-red-50 rounded border border-red-200 font-bold hover:bg-red-100 transition-colors"
                                                                  : "text-red-400 hover:text-red-500 px-1.5 py-0.5 bg-red-950/20 rounded border border-red-900/40 font-bold hover:bg-red-900/30 transition-colors"}
                                                             title={isEditorial ? "Discard Publication" : "Shred Publication"}
                                                        >
                                                             {isEditorial ? "DISCARD" : "SHRED"}
                                                        </button>
                                                   </div>
                                              </div>
                                         </div>
                                    );
                               })}
                          </div>
                     )}
                </div>

                {/* RIGHT SECTION: Manual Publish Form (4 cols) */}
                 <div className={isEditorial
                      ? "lg:col-span-4 bg-[#fdfdfc] border border-stone-200 p-4 rounded-lg relative text-left shadow-sm"
                      : "lg:col-span-4 bg-slate-950 border-4 border-black p-4 rounded-lg relative text-left"}>
                      <span className={isEditorial
                           ? "block font-sans text-stone-800 font-extrabold text-sm uppercase tracking-wider mb-2"
                           : "block font-mono text-orange-400 font-extrabold text-sm uppercase tracking-wider mb-2"}>
                           {isEditorial ? "✍️ MANUSCRIPT REGISTRY" : "🚀 SELF-PUBLISH COMIC"}
                      </span>
                      <p className={isEditorial
                           ? "text-[10.5px] text-stone-550 font-sans mb-4 leading-normal"
                           : "text-[10.5px] text-slate-400 font-mono mb-4 leading-normal"}>
                           {isEditorial 
                                ? "Already drafted or designed a manuscript layout? Register it here to catalog your literary accomplishments."
                                : "Already generated or sketched a comic layout? Publish it under your profile to host your visual achievements permanently."}
                      </p>

                      <form onSubmit={handleManualPublish} className="flex flex-col gap-3">
                           <div className="text-left">
                                <label className={isEditorial ? sLabel : "block text-slate-400 font-mono text-[9px] uppercase mb-1"}>
                                     {isEditorial ? "Manuscript Title" : "Comic Book Title"}
                                </label>
                                <input 
                                     type="text"
                                     required
                                     placeholder={isEditorial ? "e.g. Chronicles of Eldoria: Vol I" : "e.g. Captain Nebula: Deep Space"}
                                     value={manualComicTitle}
                                     onChange={(e) => setManualComicTitle(e.target.value)}
                                     className={isEditorial ? sInput : "w-full bg-gray-950/50 border border-cyan-800 p-1.5 px-2.5 rounded font-mono text-xs text-yellow-305 focus:outline-none focus:border-orange-500"}
                                />
                           </div>

                           <div className="grid grid-cols-2 gap-2 text-left">
                                <div>
                                     <label className={isEditorial ? sLabel : "block text-slate-400 font-mono text-[9px] uppercase mb-1"}>{t('setup.auto55', 'Genre')}</label>
                                     <select
                                          value={manualComicGenre}
                                          onChange={(e) => setManualComicGenre(e.target.value)}
                                          className={isEditorial ? sSelect : "w-full bg-gray-950/50 border border-cyan-800 p-1 px-1.5 rounded font-mono text-[10px] text-white focus:outline-none"}
                                     >
                                          {dynamicCategories.filter((c:any) => c.category_type === 'Genre').map((cat:any) => (
                                               <option key={cat.name} value={cat.name}>{cat.name}</option>
                                          ))}
                                     </select>
                                </div>
                                <div>
                                     <label className={isEditorial ? sLabel : "block text-slate-400 font-mono text-[9px] uppercase mb-1"}>{t('setup.auto56', 'Language')}</label>
                                     <select
                                          value={manualComicLanguage}
                                          onChange={(e) => setManualComicLanguage(e.target.value)}
                                          className={isEditorial ? sSelect : "w-full bg-gray-950/50 border border-cyan-800 p-1 px-1.5 rounded font-mono text-[10px] text-white focus:outline-none"}
                                     >
                                          {LANGUAGES.map((l) => (
                                               <option key={l.code} value={l.code}>{l.name}</option>
                                          ))}
                                     </select>
                                </div>
                            </div>

                           <div className="text-left">
                                <label className={isEditorial ? sLabel : "block text-slate-400 font-mono text-[9px] uppercase mb-1"}>{t('setup.auto57', 'Cover Graphic/Image Upload')}</label>
                                <div className={isEditorial
                                     ? "relative border border-dashed border-stone-300 hover:border-stone-400 rounded bg-stone-50 p-3 flex flex-col items-center justify-center text-center cursor-pointer min-h-24"
                                     : "relative border-2 border-dashed border-slate-700 hover:border-orange-500 rounded bg-slate-900/60 p-3 flex flex-col items-center justify-center text-center cursor-pointer min-h-24"}>
                                     <input 
                                          type="file" 
                                          accept="image/*" 
                                          id="manual-cover-upload"
                                          className="hidden" 
                                          onChange={async (e) => {
                                               const file = e.target.files?.[0];
                                               if (file) {
                                                    const base64 = await fileToBase64(file);
                                                    setManualComicCover(base64);
                                               }
                                          }}
                                     />
                                     <label htmlFor="manual-cover-upload" className="absolute inset-0 cursor-pointer z-10" />

                                     {manualComicCover ? (
                                          <div className="flex items-center gap-2">
                                               <div className={isEditorial
                                                    ? "w-10 h-14 border border-stone-200 rounded overflow-hidden flex-shrink-0"
                                                    : "w-10 h-14 border border-slate-600 rounded overflow-hidden flex-shrink-0"}>
                                                    <img 
                                                         src={`data:image/jpeg;base64,${manualComicCover}`} 
                                                         alt="Cover" 
                                                         className="w-full h-full object-cover" 
                                                         referrerPolicy="no-referrer"
                                                    />
                                               </div>
                                               <span className={isEditorial ? "text-[10px] font-sans text-emerald-750 font-bold" : "text-[10px] font-mono text-green-400 line-clamp-1"}>{t('setup.auto58', '✓ File Loaded')}</span>
                                          </div>
                                     ) : (
                                          <>
                                               <span className={isEditorial ? "text-[10px] font-sans text-stone-400" : "text-[10px] font-mono text-slate-500"}>{t('setup.auto59', 'Click or drag cover file')}</span>
                                               <span className={isEditorial ? "text-[8px] font-sans text-stone-300 mt-1 uppercase" : "text-[8px] font-mono text-slate-600 mt-1 uppercase"}>{t('setup.auto60', 'JPEG, PNG Max 5MB')}</span>
                                          </>
                                     )}
                                </div>
                           </div>
                           <button 
                                type="submit"
                                disabled={isPublishingManual}
                                className={isEditorial
                                     ? sPrimaryBtn + " w-full mt-2"
                                     : "mt-2 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white border-2 border-black py-2 rounded font-mono text-xs uppercase font-extrabold tracking-widest active:translate-y-0.5 disabled:opacity-40 w-full"}
                           >
                                {isPublishingManual 
                                      ? (isEditorial ? 'REGISTERING...' : 'PUBLISHING...') 
                                      : (isEditorial ? '🖋️ REGISTER MANUSCRIPT' : '🔔 SELF-PUBLISH COMIC')}
                           </button>
                      </form>
                 </div>

            </div>

            {/* DRAFTS HORIZONTAL ARCHIVE SNAPSHOTS */}
            <div className={isEditorial ? "border-t border-stone-200 pt-6 mt-8" : "border-t-4 border-dashed border-slate-800 pt-6 mt-8"}>
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-1">
                      <div>
                           <span className={isEditorial
                                ? "block font-sans text-stone-800 font-extrabold text-sm uppercase tracking-wider"
                                : "block font-mono text-cyan-400 font-extrabold text-sm uppercase tracking-wider"}>
                                {isEditorial 
                                     ? `💾 UNFINISHED MANUSCRIPT DRAFTS (${savedDrafts.length})` 
                                     : `💾 UNFINISHED CREATIVE WORKSPACE DRAFTS (${savedDrafts.length})`}
                           </span>
                           <p className={isEditorial ? "text-[10px] text-stone-500 font-sans mt-0.5" : "text-[10px] text-slate-400 font-mono mt-0.5"}>
                                {isEditorial 
                                     ? "Restore serialized chapters, custom guides, and Gemini context objectives straight back to your workspace." 
                                     : "Restore serialized panels, custom guides, and Gemini context objectives straight back to your canvas."}
                           </p>
                      </div>
                      <button
                           type="button"
                           disabled={isSavingDraft}
                           onClick={handleSaveDraft}
                           className={isEditorial
                                ? sPrimaryBtn
                                : "bg-gray-900 text-cyan-400 hover:bg-gray-900 text-cyan-400 disabled:opacity-45 text-white border-2 border-black font-mono font-bold text-[10.5px] px-3 py-1.5 rounded shadow-[2px_2px_0px_#000] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto"}
                      >
                           {isSavingDraft 
                                ? (isEditorial ? "SAVING SNAPSHOT..." : "SNAPSHOT-SAVING...") 
                                : (isEditorial ? "+ CREATE SNAPSHOT" : "+ SNAPSHOT CURRENT WIP")}
                      </button>
                 </div>

                 {savedDrafts.length === 0 ? (
                      <div className={isEditorial
                           ? "p-8 border border-dashed border-stone-200 rounded bg-stone-50 text-center text-stone-400 font-sans"
                           : "p-8 border-4 border-dashed border-slate-800 rounded bg-slate-950/20 text-center text-slate-500 font-mono"}>
                           <p className="text-xs font-bold">{isEditorial ? "No active snapshots or draft outlines found." : "No active snapshots or WIP sketches found."}</p>
                           <p className="text-[10px] mt-1">
                                {isEditorial 
                                     ? "Save your story character profiles and outline progress to load them here dynamically." 
                                     : "Save your story character personas and comic progress to load them here dynamic and intact!"}
                           </p>
                      </div>
                 ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                           {savedDrafts.map((draft: any) => {
                                let draftPageCount = 0;
                                if (draft.comicFaces) {
                                     try {
                                          const parsed = typeof draft.comicFaces === 'string' ? JSON.parse(draft.comicFaces) : draft.comicFaces;
                                          if (Array.isArray(parsed)) draftPageCount = parsed.length;
                                     } catch (e) {}
                                }
                                return (
                                     <div 
                                          key={draft.id}
                                          className={isEditorial
                                               ? "group flex gap-3.5 bg-white border border-stone-200 p-3.5 rounded-lg hover:border-stone-400 transition-all cursor-pointer relative text-left"
                                               : "group flex gap-3.5 bg-slate-955/90 border-4 border-slate-800 p-3.5 rounded-lg hover:border-cyan-400 hover:shadow-[0_0_12px_rgba(6,182,212,0.15)] transition-all cursor-pointer relative text-left"}
                                          onClick={() => onLoadDraft?.(draft)}
                                     >
                                          {/* Mini draft layout identity */}
                                          <div className={isEditorial
                                               ? "w-12 h-16 bg-stone-50 border border-stone-200 rounded-md flex flex-col justify-center items-center text-center p-1 flex-shrink-0"
                                               : "w-12 h-16 bg-slate-900 border-2 border-slate-700 rounded-md flex flex-col justify-center items-center text-center p-1 flex-shrink-0"}>
                                               <span className="text-xl">💾</span>
                                               <span className={isEditorial ? "text-[8px] font-sans text-stone-500 tracking-wider font-bold" : "text-[8px] font-mono text-cyan-400 tracking-wider font-bold"}>
                                                    SNAPSHOT
                                               </span>
                                          </div>

                                          {/* Details */}
                                          <div className="flex-1 flex flex-col justify-between min-w-0">
                                               <div>
                                                    <span className={isEditorial
                                                         ? "block font-sans font-bold text-xs text-stone-900 group-hover:text-stone-700 truncate transition-colors"
                                                         : "block font-mono font-black text-xs text-white group-hover:text-cyan-400 truncate transition-colors"}>
                                                         {typeof draft.title === 'string' ? draft.title : 'Untitled'}
                                                    </span>
                                                    <span className={isEditorial
                                                         ? "inline-block mt-1 bg-stone-100 border border-stone-200 rounded text-[8px] font-sans text-stone-605 px-1.5 py-0.5 uppercase font-bold"
                                                         : "inline-block mt-1 bg-cyan-950 border border-cyan-800 rounded text-[8px] font-mono text-cyan-300 px-1.5 py-0.5 uppercase font-bold"}>
                                                         {typeof draft.genre === 'string' ? draft.genre : 'Classic Horror'}
                                                    </span>
                                               </div>

                                               <div className={isEditorial
                                                    ? "flex items-center justify-between text-[9px] font-sans mt-2 text-stone-500"
                                                    : "flex items-center justify-between text-[9px] font-mono mt-2 text-slate-400"}>
                                                    <span>{isEditorial ? "🖋️ Chapters:" : "🧬 Pages:"} {draftPageCount}</span>
                                                    <button
                                                         type="button"
                                                         onClick={(e) => handleDeleteDraft(draft.id, e)}
                                                         className={isEditorial
                                                              ? "text-red-750 hover:text-red-800 font-bold hover:bg-stone-105 px-1.5 py-0.5 rounded transition-all"
                                                              : "text-red-400 hover:text-red-500 font-bold hover:bg-slate-900/60 px-1.5 py-0.5 rounded transition-all"}
                                                    >
                                                         {isEditorial ? "DISCARD" : "SHRED"}
                                                    </button>
                                               </div>
                                          </div>
                                     </div>
                                );
                           })}
                      </div>
                 )}
            </div>
       </div>
    );
};
