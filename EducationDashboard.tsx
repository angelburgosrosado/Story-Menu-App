/**
 * Screen Name: Homeschool & Classroom Dashboard
 * Purpose: A dedicated dashboard for educational scenarios (parents, teachers, and learners) to manage reading, creation, assignments, and family collections.
 * Version: 1.0
 * Phase: Phase 14
 * Date: 2026-07-08
 * What changed in this revision: Initial creation.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BookOpen, Users, PenTool, Layout, Clock, X, ChevronRight, CheckCircle, Flame, Star, Bookmark, PlayCircle, Plus
} from 'lucide-react';

export interface EducationDashboardProps {
  currentUser: {
    id: string;
    email: string;
    displayName?: string;
  };
  onClose: () => void;
  onOpenAutomation?: () => void;
}

const getActiveSkin = (): 'comic' | 'writers-journal' | 'kid-story' => {
  try {
    const saved = localStorage.getItem('story_menu_skin');
    if (saved === 'comic') return 'comic';
    if (saved === 'kid-story') return 'kid-story';
    if (saved === 'writers-journal') return 'writers-journal';
    return 'comic';
  } catch {
    return 'comic';
  }
};

type ViewMode = 'adult' | 'learner';

export const EducationDashboard: React.FC<EducationDashboardProps> = ({ currentUser, onClose, onOpenAutomation }) => {
  const { t } = useTranslation();
  const [skin, setSkin] = useState<'comic' | 'writers-journal' | 'kid-story'>(getActiveSkin);
  const [viewMode, setViewMode] = useState<ViewMode>('adult');

  useEffect(() => {
    const syncSkin = () => setSkin(getActiveSkin());
    window.addEventListener('storage', syncSkin);
    return () => window.removeEventListener('storage', syncSkin);
  }, []);

  const isEditorial = skin === 'writers-journal';

  const bgClass = isEditorial ? 'bg-[#f5f3ef] text-stone-900' : 'bg-neutral-900 text-white';
  const headerClass = isEditorial ? 'bg-[#faf8f5] border-b border-stone-200 sticky top-0 z-10 shadow-sm' : 'bg-black border-b-2 border-gray-800 sticky top-0 z-10 shadow-[0_4px_0px_#000]';
  
  const tabActive = isEditorial 
    ? 'border-b-2 border-stone-800 text-stone-900 font-bold' 
    : 'border-b-4 border-yellow-400 text-white font-black uppercase';
  const tabInactive = isEditorial
    ? 'border-b-2 border-transparent text-stone-500 hover:text-stone-700 font-semibold transition-colors cursor-pointer'
    : 'border-b-4 border-transparent text-gray-500 hover:text-gray-300 font-bold uppercase transition-colors cursor-pointer';

  const cardClass = isEditorial
    ? 'bg-white p-6 rounded-2xl border border-stone-200 shadow-sm'
    : 'bg-neutral-800 p-6 border-2 border-gray-700 shadow-[6px_6px_0px_rgba(0,0,0,1)]';

  const btnPrimary = isEditorial
    ? 'w-full sm:w-auto px-5 py-3 sm:py-2.5 bg-stone-800 hover:bg-stone-700 text-white rounded-xl sm:rounded-lg font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer'
    : 'w-full sm:w-auto px-6 py-4 sm:py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase flex items-center justify-center gap-2 rounded-xl sm:rounded-none shadow-[4px_4px_0px_#000] transition-all cursor-pointer';
  
  const btnSecondary = isEditorial
    ? 'w-full sm:w-auto px-4 py-3 sm:py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl sm:rounded-lg font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer'
    : 'w-full sm:w-auto px-5 py-3 sm:py-2 bg-neutral-900 border-2 border-gray-600 hover:border-gray-400 text-white font-bold uppercase flex items-center justify-center gap-2 rounded-xl sm:rounded-none shadow-[3px_3px_0px_#000] transition-all cursor-pointer';

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col ${bgClass} animate-fadeIn`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 ${headerClass}`}>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center ${isEditorial ? 'bg-indigo-100 text-indigo-700 rounded-xl' : 'bg-fuchsia-500 text-white shadow-[2px_2px_0px_#fff] sm:shadow-[4px_4px_0px_#fff]'}`}>
            <BookOpen size={18} className="sm:w-5 sm:h-5" />
          </div>
          <div>
            <h1 className={isEditorial ? 'text-lg sm:text-xl font-bold font-serif' : 'text-xl sm:text-2xl font-black uppercase tracking-wider'}>Homeschool & Classroom</h1>
            <p className={isEditorial ? 'text-xs sm:text-sm text-stone-500' : 'text-[10px] sm:text-xs text-gray-400 font-mono hidden sm:block'}>Learn, read, and create together</p>
          </div>
        </div>
        <button onClick={onClose} className={`p-2 transition-colors cursor-pointer ${isEditorial ? 'hover:bg-stone-200 rounded-full' : 'hover:bg-gray-800 border-2 border-transparent hover:border-gray-600'}`}>
          <X size={24} />
        </button>
      </div>

      <div className={`px-4 sm:px-6 lg:px-10 flex items-center gap-6 sm:gap-8 overflow-x-auto custom-scrollbar ${isEditorial ? 'bg-[#faf8f5] border-b border-stone-200' : 'bg-black border-b border-gray-800 pt-2'}`}>
        <button onClick={() => setViewMode('adult')} className={`pb-3 pt-4 whitespace-nowrap ${viewMode === 'adult' ? tabActive : tabInactive}`}>Parent / Teacher View</button>
        <button onClick={() => setViewMode('learner')} className={`pb-3 pt-4 whitespace-nowrap ${viewMode === 'learner' ? tabActive : tabInactive}`}>Learner View</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {viewMode === 'adult' && (
            <>
              {/* Parent/Teacher Mode - Welcome & High Level Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`${cardClass} col-span-2 md:col-span-2 flex flex-col justify-center bg-gradient-to-br ${isEditorial ? 'from-indigo-50 to-white' : 'from-fuchsia-900/40 to-neutral-800'}`}>
                  <h2 className={isEditorial ? 'text-2xl font-bold font-serif text-stone-800 mb-2' : 'text-2xl font-black uppercase text-white mb-2'}>Welcome back!</h2>
                  <p className={isEditorial ? 'text-stone-600' : 'text-gray-300 font-mono text-sm'}>Your family has completed 4 reading sessions this week. The next recommended activity is a Science Explainer Comic.</p>
                </div>
                <div className={`${cardClass} flex flex-col justify-center items-center text-center`}>
                  <div className={`w-12 h-12 flex items-center justify-center rounded-full mb-2 ${isEditorial ? 'bg-orange-100 text-orange-600' : 'bg-orange-500/20 text-orange-400'}`}>
                    <Flame size={24} />
                  </div>
                  <h3 className={isEditorial ? 'text-3xl font-bold text-stone-800' : 'text-3xl font-black text-white'}>3 Days</h3>
                  <p className={isEditorial ? 'text-sm text-stone-500 font-semibold' : 'text-xs text-gray-400 uppercase font-bold'}>Reading Streak</p>
                </div>
                <div className={`${cardClass} flex flex-col justify-center items-center text-center`}>
                  <div className={`w-12 h-12 flex items-center justify-center rounded-full mb-2 ${isEditorial ? 'bg-blue-100 text-blue-600' : 'bg-blue-500/20 text-blue-400'}`}>
                    <Star size={24} />
                  </div>
                  <h3 className={isEditorial ? 'text-3xl font-bold text-stone-800' : 'text-3xl font-black text-white'}>12</h3>
                  <p className={isEditorial ? 'text-sm text-stone-500 font-semibold' : 'text-xs text-gray-400 uppercase font-bold'}>Stories Read</p>
                </div>
              </div>

              {/* Assignment & Tasks Management */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className={isEditorial ? 'text-xl font-bold font-serif text-stone-800' : 'text-xl font-black uppercase text-white'}>Current Assignments</h3>
                    <button className={isEditorial ? 'text-indigo-600 font-semibold text-sm flex items-center gap-1 hover:text-indigo-800' : 'text-fuchsia-400 font-bold uppercase text-xs flex items-center gap-1 hover:text-white transition-colors'}>View All <ChevronRight size={14}/></button>
                  </div>
                  <div className={`${cardClass} space-y-4`}>
                    <div className="flex items-start justify-between pb-4 border-b border-stone-200 dark:border-gray-700">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${isEditorial ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-900 text-emerald-300'}`}>Visual Lesson</span>
                          <span className={isEditorial ? 'text-sm text-stone-500' : 'text-xs font-mono text-gray-400'}>Due Tomorrow</span>
                        </div>
                        <h4 className={isEditorial ? 'font-bold text-stone-800' : 'font-bold text-white'}>The Solar System Explainer</h4>
                        <p className={isEditorial ? 'text-sm text-stone-600' : 'text-xs font-mono text-gray-400'}>Assigned to: Family Group (3/3 completed)</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                        <CheckCircle size={16} />
                      </div>
                    </div>

                    {/* Empty State Mock for Second Assignment */}
                    <div className={`p-4 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center ${isEditorial ? 'border-stone-300 bg-stone-50' : 'border-gray-700 bg-neutral-900/50'}`}>
                      <Layout size={24} className={isEditorial ? 'text-stone-400 mb-2' : 'text-gray-600 mb-2'} />
                      <p className={isEditorial ? 'text-sm font-semibold text-stone-600 mb-1' : 'text-xs font-bold uppercase text-gray-400 mb-1'}>No active pending assignments</p>
                      <button className={isEditorial ? 'text-indigo-600 font-semibold text-sm hover:underline' : 'text-yellow-400 font-bold uppercase text-xs hover:underline'}>Assign a visual lesson</button>
                    </div>
                  </div>
                </div>

                {/* Family Anthology / Classroom Showcase */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className={isEditorial ? 'text-xl font-bold font-serif text-stone-800' : 'text-xl font-black uppercase text-white'}>Family Anthology</h3>
                    <button className={isEditorial ? 'text-indigo-600 font-semibold text-sm flex items-center gap-1 hover:text-indigo-800' : 'text-fuchsia-400 font-bold uppercase text-xs flex items-center gap-1 hover:text-white transition-colors'}>Collection <ChevronRight size={14}/></button>
                  </div>
                  <div className={`${cardClass} min-h-[220px] flex flex-col items-center justify-center text-center`}>
                    <div className={`w-16 h-16 flex items-center justify-center rounded-2xl mb-4 ${isEditorial ? 'bg-purple-100 text-purple-600' : 'bg-purple-500/20 text-purple-400'}`}>
                      <Bookmark size={32} />
                    </div>
                    <h4 className={isEditorial ? 'font-bold text-stone-800 text-lg mb-2' : 'font-bold text-white uppercase text-lg mb-2'}>Build a Shared Collection</h4>
                    <p className={isEditorial ? 'text-stone-500 text-sm max-w-sm mb-4' : 'text-gray-400 font-mono text-xs max-w-sm mb-4'}>Save completed stories, class challenges, and favorite bedtime readings to your private family anthology.</p>
                    <button className={btnSecondary}>
                      <Plus size={16} /> Add to Anthology
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Link to Automations Phase 13 */}
              <div className={`mt-8 p-6 rounded-2xl flex items-center justify-between border ${isEditorial ? 'bg-indigo-50 border-indigo-100' : 'bg-fuchsia-900/20 border-fuchsia-900/50'}`}>
                <div>
                  <h3 className={isEditorial ? 'font-bold text-stone-800 text-lg flex items-center gap-2' : 'font-bold text-white uppercase text-lg flex items-center gap-2'}><Clock size={20} className={isEditorial ? 'text-indigo-600' : 'text-fuchsia-400'}/> Automated Routines</h3>
                  <p className={isEditorial ? 'text-stone-600 text-sm mt-1' : 'text-gray-300 font-mono text-xs mt-1'}>Set up weekly reading goals or story creation challenges.</p>
                </div>
                {onOpenAutomation && (
                  <button onClick={onOpenAutomation} className={btnPrimary}>Configure Routines <ChevronRight size={16}/></button>
                )}
              </div>
            </>
          )}

          {viewMode === 'learner' && (
            <>
              {/* Learner View - Motivation & Reading Today */}
              <div className="space-y-4">
                <h3 className={isEditorial ? 'text-2xl font-bold font-serif text-stone-800' : 'text-2xl font-black uppercase text-white'}>Reading Today</h3>
                <div className={cardClass}>
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="w-full md:w-48 h-48 bg-gray-200 dark:bg-gray-800 rounded-xl overflow-hidden relative flex-shrink-0">
                      {/* Placeholder for Cover Art */}
                      <img src="/api/placeholder/400/400" alt="Book Cover" className="w-full h-full object-cover opacity-80" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4">
                        <div className="flex items-center gap-2 text-white font-semibold text-sm">
                          <PlayCircle size={16} /> Read-Aloud Ready
                        </div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-3 ${isEditorial ? 'bg-blue-100 text-blue-700' : 'bg-blue-900/50 text-blue-400 uppercase'}`}>Weekly Reading Goal</div>
                      <h4 className={isEditorial ? 'text-2xl font-bold text-stone-800 mb-2' : 'text-2xl font-black uppercase text-white mb-2'}>The Robot Who Dreamt of Stars</h4>
                      <p className={isEditorial ? 'text-stone-600 mb-4' : 'text-gray-300 font-mono text-sm mb-4'}>A bilingual bedtime story about reaching for your dreams, complete with interactive audio.</p>
                      
                      <div className="flex items-center gap-4">
                        <button className={btnPrimary}><BookOpen size={18}/> Start Reading</button>
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isEditorial ? 'bg-orange-100 text-orange-600' : 'bg-orange-500/20 text-orange-400'}`}>
                            <Flame size={16} />
                          </div>
                          <span className={isEditorial ? 'text-sm font-semibold text-stone-600' : 'text-xs font-bold text-gray-400 uppercase'}>Keeps 3-day streak alive!</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Creation Motivation Panel */}
                <div className="space-y-4">
                  <h3 className={isEditorial ? 'text-xl font-bold font-serif text-stone-800' : 'text-xl font-black uppercase text-white'}>Story Challenge</h3>
                  <div className={`${cardClass} bg-gradient-to-br ${isEditorial ? 'from-fuchsia-50 to-white' : 'from-fuchsia-900/20 to-neutral-800'}`}>
                    <div className={`w-12 h-12 flex items-center justify-center rounded-full mb-4 ${isEditorial ? 'bg-fuchsia-100 text-fuchsia-600' : 'bg-fuchsia-500/20 text-fuchsia-400'}`}>
                      <PenTool size={24} />
                    </div>
                    <h4 className={isEditorial ? 'text-lg font-bold text-stone-800 mb-2' : 'text-lg font-black uppercase text-white mb-2'}>Write a new chapter!</h4>
                    <p className={isEditorial ? 'text-stone-600 text-sm mb-6' : 'text-gray-400 font-mono text-xs mb-6'}>Your story "The Great Sandbox Mystery" is waiting for its thrilling conclusion.</p>
                    <button className={btnSecondary}>Continue your story</button>
                  </div>
                </div>

                {/* Learner Progress */}
                <div className="space-y-4">
                  <h3 className={isEditorial ? 'text-xl font-bold font-serif text-stone-800' : 'text-xl font-black uppercase text-white'}>My Progress</h3>
                  <div className={cardClass}>
                    <div className="space-y-6">
                      
                      <div>
                        <div className="flex justify-between items-end mb-2">
                          <span className={isEditorial ? 'font-bold text-stone-800 text-sm' : 'font-bold text-white uppercase text-xs'}>Bilingual Stories Completed</span>
                          <span className={isEditorial ? 'font-semibold text-stone-500 text-sm' : 'font-bold text-gray-400 text-xs'}>4 / 5</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-3">
                          <div className="bg-emerald-500 h-3 rounded-full" style={{ width: '80%' }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between items-end mb-2">
                          <span className={isEditorial ? 'font-bold text-stone-800 text-sm' : 'font-bold text-white uppercase text-xs'}>Lesson Comics Finished</span>
                          <span className={isEditorial ? 'font-semibold text-stone-500 text-sm' : 'font-bold text-gray-400 text-xs'}>2 / 3</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-3">
                          <div className="bg-blue-500 h-3 rounded-full" style={{ width: '66%' }}></div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};
