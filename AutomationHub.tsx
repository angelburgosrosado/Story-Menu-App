/**
 * Screen Name: Integrations & Automation Hub
 * Purpose: Manage reading, creation, and sharing routines (especially for homeschool/classroom use).
 * Version: 1.1
 * Phase: Phase 13
 * Date: 2026-07-08
 * What changed in this revision: Refined terminology to be less robotic, focusing on "Routines", "When/What/Who", and warmer educational copy.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Zap, Users, BookOpen, PenTool, 
  X, ChevronRight, Clock, ArrowRight,
  Layout, Plus
} from 'lucide-react';

export interface AutomationHubProps {
  currentUser: {
    id: string;
    email: string;
    displayName?: string;
  };
  onClose: () => void;
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

type RoutineType = 'reading_plan' | 'creation_challenge' | 'lesson_assignment' | 'custom';

interface Routine {
  id: string;
  title: string;
  type: RoutineType;
  enabled: boolean;
  triggerStr: string;
  actionStr: string;
  audienceStr: string;
}

const MOCK_ROUTINES: Routine[] = [];

export const AutomationHub: React.FC<AutomationHubProps> = ({ currentUser, onClose }) => {
  const { t } = useTranslation();
  const [skin, setSkin] = useState<'comic' | 'writers-journal' | 'kid-story'>(getActiveSkin);
  const [routines, setRoutines] = useState<Routine[]>(MOCK_ROUTINES);
  
  // Builder Modal State
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [builderType, setBuilderType] = useState<RoutineType | null>(null);

  useEffect(() => {
    const syncSkin = () => setSkin(getActiveSkin());
    window.addEventListener('storage', syncSkin);
    return () => window.removeEventListener('storage', syncSkin);
  }, []);

  const isEditorial = skin === 'writers-journal';

  const bgClass = isEditorial ? 'bg-[#f5f3ef] text-stone-900' : 'bg-neutral-900 text-white';
  const headerClass = isEditorial ? 'bg-[#faf8f5] border-b border-stone-200 sticky top-0 z-10 shadow-sm' : 'bg-black border-b-2 border-gray-800 sticky top-0 z-10 shadow-[0_4px_0px_#000]';
  const btnPrimary = isEditorial
    ? 'px-6 py-2.5 bg-stone-800 hover:bg-stone-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer'
    : 'px-8 py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase flex items-center justify-center gap-2 shadow-[4px_4px_0px_#000] transition-all cursor-pointer';
  
  const templateCardClass = isEditorial
    ? 'bg-white p-6 rounded-xl border border-stone-200 shadow-sm hover:border-stone-400 hover:shadow-md transition-all cursor-pointer text-left flex flex-col h-full'
    : 'bg-black p-6 border-2 border-gray-800 hover:border-yellow-400 shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_#facc15] transition-all cursor-pointer text-left flex flex-col h-full';

  const handleStartTemplate = (type: RoutineType) => {
    setBuilderType(type);
    setIsBuilderOpen(true);
  };

  const handleSaveRoutine = () => {
    const newRoutine: Routine = {
      id: Math.random().toString(36).substring(7),
      title: builderType === 'reading_plan' ? 'Weekly Reading Quest' : 
             builderType === 'creation_challenge' ? 'Story Creator Challenge' : 
             builderType === 'lesson_assignment' ? 'Visual Lesson Delivery' : 'Custom Routine',
      type: builderType || 'custom',
      enabled: true,
      triggerStr: 'Every Monday at 8:00 AM',
      actionStr: builderType === 'reading_plan' ? 'Send a reading quest' : 
                 builderType === 'creation_challenge' ? 'Prompt a new story idea' : 'Share visual lesson',
      audienceStr: 'Family Group (3 learners)'
    };
    setRoutines([...routines, newRoutine]);
    setIsBuilderOpen(false);
  };

  const toggleRoutine = (id: string) => {
    setRoutines(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col ${bgClass} animate-fadeIn`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-6 py-4 ${headerClass}`}>
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 flex items-center justify-center ${isEditorial ? 'bg-indigo-100 text-indigo-700 rounded-xl' : 'bg-fuchsia-500 text-white shadow-[4px_4px_0px_#fff]'}`}>
            <Zap size={20} />
          </div>
          <div>
            <h1 className={isEditorial ? 'text-xl font-bold font-serif' : 'text-2xl font-black uppercase tracking-wider'}>Routines & Automations</h1>
            <p className={isEditorial ? 'text-sm text-stone-500' : 'text-xs text-gray-400 font-mono'}>Set up smart habits for reading and creating</p>
          </div>
        </div>
        <button onClick={onClose} className={`p-2 transition-colors cursor-pointer ${isEditorial ? 'hover:bg-stone-200 rounded-full' : 'hover:bg-gray-800 border-2 border-transparent hover:border-gray-600'}`}>
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 lg:p-10">
        <div className="max-w-5xl mx-auto space-y-12">
          
          {/* Active Routines */}
          {routines.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className={isEditorial ? 'text-2xl font-bold font-serif text-stone-800' : 'text-2xl font-black uppercase tracking-wider text-white'}>Active Routines</h2>
                <button onClick={() => handleStartTemplate('custom')} className={btnPrimary}>
                  <Plus size={18} /> New Routine
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {routines.map(routine => (
                  <div key={routine.id} className={`p-6 flex flex-col justify-between gap-4 ${isEditorial ? 'bg-white rounded-xl border border-stone-200 shadow-sm' : 'bg-neutral-800 border-2 border-gray-700 shadow-[4px_4px_0px_#000]'}`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className={isEditorial ? 'font-bold text-stone-800 text-lg' : 'font-bold text-white uppercase text-lg'}>{routine.title}</h3>
                        <div className={isEditorial ? 'text-sm text-stone-500 mt-1 flex items-center gap-1.5' : 'text-sm text-gray-400 font-mono mt-1 flex items-center gap-1.5'}><Users size={14} /> {routine.audienceStr}</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={routine.enabled} onChange={() => toggleRoutine(routine.id)} />
                        <div className={`w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${isEditorial ? 'peer-checked:bg-stone-800' : 'peer-checked:bg-fuchsia-500 rounded-none after:rounded-none'}`}></div>
                      </label>
                    </div>
                    <div className={`p-4 rounded-lg flex items-center justify-between ${isEditorial ? 'bg-stone-50 border border-stone-100 text-sm font-semibold' : 'bg-neutral-900 border border-gray-800 text-xs font-mono font-bold'}`}>
                      <div className="flex items-center gap-2"><Clock size={16} className="text-blue-500" /> {routine.triggerStr}</div>
                      <ArrowRight size={16} className={isEditorial ? "text-stone-300" : "text-gray-600"} />
                      <div className="flex items-center gap-2"><Zap size={16} className="text-yellow-500" /> {routine.actionStr}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Templates Section */}
          <section>
            <h2 className={isEditorial ? 'text-2xl font-bold font-serif text-stone-800 mb-3' : 'text-2xl font-black uppercase tracking-wider text-white mb-3'}>
              {routines.length === 0 ? "Let's Build a Routine" : "More Inspiration"}
            </h2>
            <p className={isEditorial ? 'text-stone-500 mb-8 max-w-2xl leading-relaxed' : 'text-gray-400 font-mono mb-8 max-w-2xl leading-relaxed'}>
              Choose a starter routine below to foster consistent reading habits, inspire creative writing, or seamlessly deliver visual lessons to your learners.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
              <button onClick={() => handleStartTemplate('reading_plan')} className={templateCardClass}>
                <div className={`w-12 h-12 flex items-center justify-center mb-5 ${isEditorial ? 'bg-blue-100 text-blue-700 rounded-xl' : 'bg-blue-500 text-black border-2 border-black'}`}>
                  <BookOpen size={24} />
                </div>
                <h3 className={isEditorial ? 'text-lg font-bold text-stone-800 mb-2' : 'text-lg font-black uppercase text-white mb-2'}>Weekly Reading Quest</h3>
                <p className={isEditorial ? 'text-sm text-stone-500 mb-6 leading-relaxed flex-grow' : 'text-xs text-gray-400 font-mono mb-6 leading-relaxed flex-grow'}>
                  Perfect for family reading time. Automatically send a selection of stories each week and celebrate when they are finished.
                </p>
                <div className={isEditorial ? 'text-sm font-semibold text-blue-700 flex items-center gap-1.5 mt-auto pt-2' : 'text-xs font-bold text-blue-400 uppercase flex items-center gap-1.5 mt-auto pt-2'}>
                  Set Up Routine <ChevronRight size={14} />
                </div>
              </button>
              
              <button onClick={() => handleStartTemplate('creation_challenge')} className={templateCardClass}>
                <div className={`w-12 h-12 flex items-center justify-center mb-5 ${isEditorial ? 'bg-fuchsia-100 text-fuchsia-700 rounded-xl' : 'bg-fuchsia-500 text-black border-2 border-black'}`}>
                  <PenTool size={24} />
                </div>
                <h3 className={isEditorial ? 'text-lg font-bold text-stone-800 mb-2' : 'text-lg font-black uppercase text-white mb-2'}>Story Creator Challenge</h3>
                <p className={isEditorial ? 'text-sm text-stone-500 mb-6 leading-relaxed flex-grow' : 'text-xs text-gray-400 font-mono mb-6 leading-relaxed flex-grow'}>
                  Overcome writer's block. Send a weekly prompt or a remix challenge to encourage continuous creation and imaginative storytelling.
                </p>
                <div className={isEditorial ? 'text-sm font-semibold text-fuchsia-700 flex items-center gap-1.5 mt-auto pt-2' : 'text-xs font-bold text-fuchsia-400 uppercase flex items-center gap-1.5 mt-auto pt-2'}>
                  Set Up Routine <ChevronRight size={14} />
                </div>
              </button>

              <button onClick={() => handleStartTemplate('lesson_assignment')} className={templateCardClass}>
                <div className={`w-12 h-12 flex items-center justify-center mb-5 ${isEditorial ? 'bg-emerald-100 text-emerald-700 rounded-xl' : 'bg-emerald-500 text-black border-2 border-black'}`}>
                  <Layout size={24} />
                </div>
                <h3 className={isEditorial ? 'text-lg font-bold text-stone-800 mb-2' : 'text-lg font-black uppercase text-white mb-2'}>Visual Lesson Delivery</h3>
                <p className={isEditorial ? 'text-sm text-stone-500 mb-6 leading-relaxed flex-grow' : 'text-xs text-gray-400 font-mono mb-6 leading-relaxed flex-grow'}>
                  Designed for educators. Schedule educational comics to be shared with your classroom, complete with due dates and reading checks.
                </p>
                <div className={isEditorial ? 'text-sm font-semibold text-emerald-700 flex items-center gap-1.5 mt-auto pt-2' : 'text-xs font-bold text-emerald-400 uppercase flex items-center gap-1.5 mt-auto pt-2'}>
                  Set Up Routine <ChevronRight size={14} />
                </div>
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Builder Modal Flow */}
      {isBuilderOpen && (
        <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto ${isEditorial ? 'bg-white rounded-2xl shadow-xl' : 'bg-neutral-900 border-2 border-gray-700 shadow-[8px_8px_0px_rgba(0,0,0,1)]'}`}>
            <div className={`px-6 py-5 border-b flex justify-between items-center ${isEditorial ? 'border-stone-200' : 'border-gray-800'}`}>
              <h2 className={isEditorial ? 'font-bold font-serif text-xl text-stone-800' : 'font-black uppercase text-xl text-white'}>
                Routine Setup
              </h2>
              <button onClick={() => setIsBuilderOpen(false)} className={isEditorial ? 'text-stone-400 hover:text-stone-800 transition-colors' : 'text-gray-500 hover:text-white transition-colors'}><X size={24} /></button>
            </div>

            <div className="p-6 md:p-8 space-y-8">
              {/* When */}
              <div>
                <h3 className={isEditorial ? 'font-bold text-stone-800 mb-3 flex items-center gap-2' : 'font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2'}>
                  <Clock size={18} className="text-blue-500" /> 1. When does this happen?
                </h3>
                <div className={`p-5 rounded-xl ${isEditorial ? 'bg-stone-50 border border-stone-200' : 'bg-black border border-gray-800'}`}>
                  <label className={isEditorial ? 'block text-sm font-semibold text-stone-600 mb-2' : 'block text-sm font-bold text-gray-400 uppercase mb-2'}>Time or Event</label>
                  <select className={isEditorial ? 'w-full bg-white border border-stone-300 focus:border-stone-500 rounded-lg p-3 outline-none cursor-pointer' : 'w-full bg-neutral-900 border-2 border-gray-700 focus:border-yellow-400 text-white p-3 outline-none cursor-pointer font-mono'}>
                    <option>Every Monday at 8:00 AM</option>
                    <option>Daily at 4:00 PM</option>
                    <option>When I publish a new story</option>
                    <option>When a learner finishes a book</option>
                  </select>
                </div>
              </div>

              {/* What */}
              <div>
                <h3 className={isEditorial ? 'font-bold text-stone-800 mb-3 flex items-center gap-2' : 'font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2'}>
                  <Zap size={18} className="text-yellow-500" /> 2. What should happen?
                </h3>
                <div className={`p-5 rounded-xl ${isEditorial ? 'bg-stone-50 border border-stone-200' : 'bg-black border border-gray-800'}`}>
                  <label className={isEditorial ? 'block text-sm font-semibold text-stone-600 mb-2' : 'block text-sm font-bold text-gray-400 uppercase mb-2'}>Action to take</label>
                  <select className={isEditorial ? 'w-full bg-white border border-stone-300 focus:border-stone-500 rounded-lg p-3 outline-none cursor-pointer' : 'w-full bg-neutral-900 border-2 border-gray-700 focus:border-yellow-400 text-white p-3 outline-none cursor-pointer font-mono'}>
                    {builderType === 'reading_plan' && <option>Send a reading quest with 2 books</option>}
                    {builderType === 'creation_challenge' && <option>Send a prompt: "Write about a magical forest"</option>}
                    {builderType === 'lesson_assignment' && <option>Share my latest visual lesson</option>}
                    <option>Send a custom motivational message...</option>
                  </select>
                </div>
              </div>

              {/* Who */}
              <div>
                <h3 className={isEditorial ? 'font-bold text-stone-800 mb-3 flex items-center gap-2' : 'font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2'}>
                  <Users size={18} className="text-fuchsia-500" /> 3. Who is this for?
                </h3>
                <div className={`p-5 rounded-xl ${isEditorial ? 'bg-stone-50 border border-stone-200' : 'bg-black border border-gray-800'}`}>
                  <label className={isEditorial ? 'block text-sm font-semibold text-stone-600 mb-2' : 'block text-sm font-bold text-gray-400 uppercase mb-2'}>Target Readers or Creators</label>
                  <select className={isEditorial ? 'w-full bg-white border border-stone-300 focus:border-stone-500 rounded-lg p-3 outline-none cursor-pointer' : 'w-full bg-neutral-900 border-2 border-gray-700 focus:border-yellow-400 text-white p-3 outline-none cursor-pointer font-mono'}>
                    <option>My Family Group</option>
                    <option>My Classroom</option>
                    <option>Just Me (Personal Goal)</option>
                    <option>All My Followers</option>
                  </select>
                </div>
              </div>
            </div>

            <div className={`px-6 py-5 border-t flex justify-end gap-4 ${isEditorial ? 'border-stone-200 bg-[#faf8f5]' : 'border-gray-800 bg-black'}`}>
              <button onClick={() => setIsBuilderOpen(false)} className={isEditorial ? 'px-6 py-2.5 font-semibold text-stone-600 hover:text-stone-900' : 'px-6 py-2.5 font-bold text-gray-400 uppercase hover:text-white'}>
                Cancel
              </button>
              <button onClick={handleSaveRoutine} className={btnPrimary}>
                Activate Routine
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
