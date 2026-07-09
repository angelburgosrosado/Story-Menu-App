/**
 * Screen Name: Workspace Collaboration Hub
 * Purpose: A shared workspace hub to manage team members, roles, reviews, and project activity.
 * Version: 1.1
 * Phase: Phase 15
 * Date: 2026-07-08
 * What changed in this revision: Refined wording to remove corporate jargon. Replaced "Shared Workflow" with "Story Progress", "Project Activity" with "Recent Updates", and "Assigned to" with "Working on it". Warmed up the activity stream copy to feel more encouraging and family-friendly.
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Shield, CheckCircle, Clock, 
  MessageSquare, PenTool, Layout, FileText, Share2, 
  ChevronRight, Bookmark, ThumbsUp
} from 'lucide-react';

export interface WorkspaceCollaborationProps {
  projectTitle: string;
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

type Collaborator = {
  id: string;
  name: string;
  role: 'Owner' | 'Parent / Teacher Reviewer' | 'Student / Learner Contributor' | 'Contributor' | 'Viewer';
  avatarColor: string;
};

type ActivityEvent = {
  id: string;
  user: string;
  action: string;
  time: string;
  icon: React.ReactNode;
};

type Task = {
  id: string;
  title: string;
  status: 'Needs Review' | 'Working on it' | 'Finished' | 'Ready to start';
  assignee: string;
};

// Mock data
const MOCK_COLLABORATORS: Collaborator[] = [
  { id: '1', name: 'You', role: 'Owner', avatarColor: 'bg-indigo-500' },
  // Remove these to see the empty state, or add to see active state. We'll simulate 1 user initially to show empty states.
];

export const WorkspaceCollaboration: React.FC<WorkspaceCollaborationProps> = ({ projectTitle }) => {
  const [skin, setSkin] = useState<'comic' | 'writers-journal' | 'kid-story'>(getActiveSkin);
  const [collaborators, setCollaborators] = useState<Collaborator[]>(MOCK_COLLABORATORS);

  useEffect(() => {
    const syncSkin = () => setSkin(getActiveSkin());
    window.addEventListener('storage', syncSkin);
    return () => window.removeEventListener('storage', syncSkin);
  }, []);

  const isEditorial = skin === 'writers-journal';

  const addCollaborator = (role: Collaborator['role']) => {
    setCollaborators([...collaborators, {
      id: Date.now().toString(),
      name: role.includes('Reviewer') ? 'Mr. Thompson' : 'Leo',
      role,
      avatarColor: role.includes('Reviewer') ? 'bg-orange-500' : 'bg-emerald-500'
    }]);
  };

  const tasks: Task[] = collaborators.length > 1 ? [
    { id: 't1', title: 'Write the next part of Scene 2', status: 'Working on it', assignee: 'Leo' },
    { id: 't2', title: 'Check the story outline', status: 'Needs Review', assignee: 'Mr. Thompson' },
    { id: 't3', title: 'Translate the first page', status: 'Finished', assignee: 'Mr. Thompson' },
  ] : [];

  const activity: ActivityEvent[] = collaborators.length > 1 ? [
    { id: 'a1', user: 'Leo', action: 'added some great ideas to Page 3', time: '2 hours ago', icon: <PenTool size={14} /> },
    { id: 'a2', user: 'Mr. Thompson', action: 'gave a thumbs up to the Narration', time: 'Yesterday', icon: <ThumbsUp size={14} /> },
    { id: 'a3', user: 'Leo', action: 'joined the story team!', time: '2 days ago', icon: <Users size={14} /> },
  ] : [
    { id: 'a0', user: 'You', action: 'started a new adventure', time: 'Just now', icon: <FileText size={14} /> },
  ];

  const cardClass = isEditorial
    ? 'bg-white p-6 rounded-2xl border border-stone-200 shadow-sm'
    : 'bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-[4px_4px_0px_#000]';

  const btnPrimary = isEditorial
    ? 'px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer'
    : 'px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-bold uppercase tracking-wider flex items-center justify-center gap-2 rounded-xl transition-all cursor-pointer';

  const btnSecondary = isEditorial
    ? 'px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer'
    : 'px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase tracking-wider flex items-center justify-center gap-2 rounded-xl transition-all cursor-pointer';

  return (
    <div className="space-y-8 animate-fadeIn text-left">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold font-mono uppercase tracking-wider">
          <Users size={13} />
          <span>Team & Sharing</span>
        </div>
        <h2 className={`text-3xl ${isEditorial ? 'font-bold font-serif text-stone-900' : 'font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400'} leading-tight`}>
          Story Team
        </h2>
        <p className={`text-sm ${isEditorial ? 'text-stone-500' : 'text-slate-400'} leading-relaxed max-w-xl`}>
          Build this story together with family, friends, or classmates. You can invite helpers to review your work or write the next chapter.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area (Left 2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Collaborators List */}
          <div className={cardClass}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg ${isEditorial ? 'font-bold text-stone-900' : 'font-bold text-white uppercase tracking-wider'}`}>Team Members</h3>
              <button className={btnPrimary} onClick={() => addCollaborator('Student / Learner Contributor')}>
                <UserPlus size={16} /> Invite Helper
              </button>
            </div>
            
            <div className="space-y-3">
              {collaborators.map(c => (
                <div key={c.id} className={`flex items-center justify-between p-3 rounded-xl ${isEditorial ? 'bg-stone-50 border border-stone-100' : 'bg-slate-800/50 border border-slate-700'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${c.avatarColor}`}>
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <p className={`font-bold ${isEditorial ? 'text-stone-900' : 'text-white'}`}>{c.name}</p>
                      <div className="flex items-center gap-1">
                        {c.role === 'Owner' && <Shield size={12} className={isEditorial ? 'text-indigo-600' : 'text-indigo-400'} />}
                        <span className={`text-xs ${isEditorial ? 'text-stone-500' : 'text-slate-400'}`}>{c.role}</span>
                      </div>
                    </div>
                  </div>
                  {c.role !== 'Owner' && (
                    <button className={`text-xs font-semibold ${isEditorial ? 'text-stone-400 hover:text-stone-700' : 'text-slate-500 hover:text-slate-300'}`}>
                      Change Role
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Empty State / Guided Prompts */}
            {collaborators.length === 1 && (
              <div className={`mt-6 p-5 rounded-xl border-2 border-dashed ${isEditorial ? 'border-indigo-200 bg-indigo-50/50' : 'border-slate-700 bg-slate-800/20'} text-center`}>
                <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3 ${isEditorial ? 'bg-indigo-100 text-indigo-600' : 'bg-indigo-500/20 text-indigo-400'}`}>
                  <Share2 size={24} />
                </div>
                <h4 className={`font-bold mb-2 ${isEditorial ? 'text-stone-900' : 'text-white'}`}>Making this story by yourself?</h4>
                <p className={`text-sm mb-4 max-w-md mx-auto ${isEditorial ? 'text-stone-600' : 'text-slate-400'}`}>
                  Story.Menu is more fun together! Invite family members or classmates to help you write, draw, and review.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <button onClick={() => addCollaborator('Parent / Teacher Reviewer')} className={btnSecondary}>
                    Invite a Parent Reviewer
                  </button>
                  <button onClick={() => addCollaborator('Student / Learner Contributor')} className={btnSecondary}>
                    Add a Sibling or Classmate
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Shared Tasks / Workflow */}
          {collaborators.length > 1 && (
            <div className={cardClass}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg ${isEditorial ? 'font-bold text-stone-900' : 'font-bold text-white uppercase tracking-wider'}`}>Story Progress</h3>
                <span className={`text-xs font-bold px-2 py-1 rounded-md ${isEditorial ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/20 text-emerald-400'}`}>
                  {tasks.filter(t => t.status === 'Finished').length} / {tasks.length} Done
                </span>
              </div>
              <div className="space-y-3">
                {tasks.map(task => (
                  <div key={task.id} className={`flex items-center justify-between p-3 rounded-xl border ${isEditorial ? 'bg-white border-stone-200' : 'bg-slate-800 border-slate-700'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        task.status === 'Finished' ? (isEditorial ? 'bg-emerald-100 text-emerald-600' : 'bg-emerald-500/20 text-emerald-400') :
                        task.status === 'Needs Review' ? (isEditorial ? 'bg-orange-100 text-orange-600' : 'bg-orange-500/20 text-orange-400') :
                        (isEditorial ? 'bg-blue-100 text-blue-600' : 'bg-blue-500/20 text-blue-400')
                      }`}>
                        {task.status === 'Finished' ? <CheckCircle size={16} /> :
                         task.status === 'Needs Review' ? <Clock size={16} /> :
                         <Layout size={16} />}
                      </div>
                      <div>
                        <p className={`font-bold text-sm ${isEditorial ? 'text-stone-900' : 'text-white'}`}>{task.title}</p>
                        <p className={`text-xs ${isEditorial ? 'text-stone-500' : 'text-slate-400'}`}>Waiting on: {task.assignee}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                        task.status === 'Finished' ? (isEditorial ? 'bg-emerald-100 text-emerald-700' : 'text-emerald-400') :
                        task.status === 'Needs Review' ? (isEditorial ? 'bg-orange-100 text-orange-700' : 'text-orange-400') :
                        (isEditorial ? 'bg-stone-100 text-stone-600' : 'text-slate-300')
                    }`}>
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Sidebar (Right Column) */}
        <div className="space-y-6">
          
          {/* Project Activity Stream */}
          <div className={`${cardClass} min-h-[300px]`}>
            <h3 className={`text-lg mb-4 ${isEditorial ? 'font-bold text-stone-900' : 'font-bold text-white uppercase tracking-wider'}`}>Recent Updates</h3>
            <div className="space-y-4">
              {activity.map((act, index) => (
                <div key={act.id} className="relative flex gap-3">
                  {/* Vertical line connector */}
                  {index !== activity.length - 1 && (
                    <div className={`absolute left-4 top-8 bottom-[-16px] w-[2px] ${isEditorial ? 'bg-stone-100' : 'bg-slate-700'}`} />
                  )}
                  <div className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center z-10 ${isEditorial ? 'bg-stone-100 text-stone-600' : 'bg-slate-800 text-slate-300'}`}>
                    {act.icon}
                  </div>
                  <div className="pt-1 pb-2">
                    <p className={`text-sm ${isEditorial ? 'text-stone-800' : 'text-slate-300'}`}>
                      <span className="font-bold">{act.user}</span> {act.action}
                    </p>
                    <p className={`text-xs ${isEditorial ? 'text-stone-400' : 'text-slate-500'}`}>{act.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Guidance Box */}
          <div className={`p-5 rounded-2xl border ${isEditorial ? 'bg-[#faf8f5] border-stone-200' : 'bg-slate-800/30 border-slate-700'}`}>
            <h4 className={`font-bold text-sm mb-2 flex items-center gap-2 ${isEditorial ? 'text-stone-900' : 'text-white'}`}>
              <Bookmark size={16} className={isEditorial ? 'text-indigo-600' : 'text-indigo-400'}/> Tips for Teamwork
            </h4>
            <ul className={`text-sm space-y-2 ${isEditorial ? 'text-stone-600' : 'text-slate-400'}`}>
              <li>• Ask a <strong className={isEditorial ? 'text-stone-900' : 'text-slate-200'}>Parent Reviewer</strong> to approve your story before you publish.</li>
              <li>• Give friends a <strong className={isEditorial ? 'text-stone-900' : 'text-slate-200'}>Learner Contributor</strong> role to safely write together.</li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
};
