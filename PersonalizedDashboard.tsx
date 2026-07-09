/*
  Screen Name: Personalized Dashboard
  Purpose: Smart landing view for authenticated users to resume work and discover tailored templates/stories.
  Version: v1.1
  Phase: Phase 11
  Date: 2026-07-08
  What changed in this revision: Added monetization and usage widget.
*/

import React, { useState } from 'react';
import { Play, Plus, History, Sparkles, BookOpen, Layers, BarChart3, Users, Heart, GraduationCap, Baby, Palette, Shield, Battery } from 'lucide-react';
import { MOCK_STORIES } from './PublicGallery';

interface PersonalizedDashboardProps {
  currentUser: { displayName?: string; email?: string } | any;
  onStartProject: () => void;
  onNavigateToGallery: () => void;
  onNavigateToStory: (storyId: string) => void;
  onNavigateToCreator: (creatorId: string) => void;
  onNavigateToAdmin?: () => void;
  creditsAvailable: number;
  userPlan: 'Free plan' | 'Pro creator';
  onNavigateToBilling: () => void;
}

type UserRole = 'Creator' | 'Teacher' | 'Parent' | 'Student' | 'Admin';

export const PersonalizedDashboard: React.FC<PersonalizedDashboardProps> = ({
  currentUser,
  onStartProject,
  onNavigateToGallery,
  onNavigateToStory,
  onNavigateToCreator,
  onNavigateToAdmin,
  creditsAvailable,
  userPlan,
  onNavigateToBilling
}) => {
  const userRole = (currentUser?.role as UserRole) || 'Creator';
  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Creator';

  // Mock Recent Projects
  const recentProjects = [
    { id: 'proj-1', title: 'The Quantum Heist', lastEdited: '2 hours ago', progress: 60, status: 'Draft' },
    { id: 'proj-2', title: 'Español Básico: Colores', lastEdited: '1 day ago', progress: 100, status: 'Ready to Publish' },
  ];

  // Role-based Shortcuts
  const getRoleShortcuts = () => {
    switch (userRole) {
      case 'Teacher':
        return [
          { label: 'Visual Lesson', icon: <BookOpen size={20} className="text-emerald-400" />, desc: 'Explain concepts with comics' },
          { label: 'Bilingual Reader', icon: <Layers size={20} className="text-blue-400" />, desc: 'Language learning stories' },
          { label: 'Classroom Activity', icon: <Users size={20} className="text-purple-400" />, desc: 'Interactive worksheets' }
        ];
      case 'Parent':
        return [
          { label: 'Bedtime Story', icon: <Sparkles size={20} className="text-indigo-400" />, desc: 'Calm, soothing adventures' },
          { label: 'Bilingual Book', icon: <Layers size={20} className="text-blue-400" />, desc: 'Read in two languages' },
          { label: 'Personalized Hero', icon: <Baby size={20} className="text-pink-400" />, desc: 'Starring your child' }
        ];
      case 'Student':
        return [
          { label: 'School Project', icon: <GraduationCap size={20} className="text-amber-400" />, desc: 'Visual presentations' },
          { label: 'Creative Writing', icon: <Palette size={20} className="text-rose-400" />, desc: 'Short story comics' },
          { label: 'Study Guide', icon: <BookOpen size={20} className="text-emerald-400" />, desc: 'Mnemonic visuals' }
        ];
      case 'Creator':
      default:
        return [
          { label: 'Graphic Novel', icon: <Palette size={20} className="text-rose-400" />, desc: 'Multi-chapter epic' },
          { label: 'Webcomic', icon: <Sparkles size={20} className="text-amber-400" />, desc: 'Short, punchy strips' },
          { label: 'World Builder', icon: <Layers size={20} className="text-indigo-400" />, desc: 'Character & lore bibles' }
        ];
    }
  };
  const getRoleTip = () => {
    switch (userRole) {
      case 'Teacher': return "Classroom activity templates save 40% of prep time. Try starting your next lesson with a visual template.";
      case 'Parent': return "Bilingual bedtime stories are trending! Translating your next story into Spanish might boost engagement.";
      case 'Student': return "Visual study guides are great for sharing with classmates. Add a cover page to make it stand out.";
      case 'Creator':
      default: return "Stories with character voices get 3x more saves. Try adding narration to your latest draft.";
    }
  };

  const shortcuts = getRoleShortcuts();
  const activeTip = getRoleTip();

  return (
    <div className="min-h-screen bg-[#0c0e14] text-slate-100 flex flex-col font-sans p-4 sm:p-8 overflow-y-auto w-full h-full">
      <div className="max-w-6xl mx-auto w-full space-y-10 sm:space-y-12">
        
        {/* Header & Role Selector */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">Welcome back, {displayName}.</h1>
            <p className="text-base sm:text-lg text-slate-400">Here's what's happening with your stories today.</p>
          </div>
          
          {userRole === 'Admin' && (
            <button
              onClick={onNavigateToAdmin}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-sm text-white transition-colors flex items-center gap-2 shadow-lg shadow-indigo-600/20"
            >
              <Shield size={16} />
              Admin Dashboard
            </button>
          )}
        </header>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Smart Continuation */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <History size={20} className="text-indigo-400" />
                  Pick up where you left off
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentProjects.map(proj => (
                  <div key={proj.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors cursor-pointer group flex flex-col h-full" onClick={onStartProject}>
                    <div className="flex justify-between items-start mb-6">
                      <div className="font-bold text-white truncate pr-4">{proj.title}</div>
                      <div className={`text-[10px] font-bold px-2 py-1 rounded bg-slate-800 border ${proj.status === 'Draft' ? 'text-slate-400 border-slate-700' : 'text-emerald-400 border-emerald-500/30'}`}>
                        {proj.status}
                      </div>
                    </div>
                    <div className="mb-6 mt-auto">
                      <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                        <span>Progress</span>
                        <span>{proj.progress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${proj.progress}%` }} />
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500">Edited {proj.lastEdited}</span>
                      <span className="text-indigo-400 font-bold group-hover:text-indigo-300 transition-colors">Continue creating</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Audience-Aware Shortcuts */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <Sparkles size={20} className="text-amber-400" />
                  Start something new
                </h2>
                <span className="text-xs font-bold text-slate-500">Tailored for {userRole}s</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {shortcuts.map(shortcut => (
                  <div key={shortcut.label} onClick={onStartProject} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-600 transition-colors cursor-pointer group flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-slate-950 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner border border-slate-800/50">
                      {shortcut.icon}
                    </div>
                    <div className="font-bold text-white mb-1">{shortcut.label}</div>
                    <div className="text-xs text-slate-400">{shortcut.desc}</div>
                  </div>
                ))}
              </div>
            </section>
            
            {/* Recommended Stories */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <Heart size={20} className="text-rose-400" />
                  Recommended for you
                </h2>
                <button onClick={onNavigateToGallery} className="text-sm font-bold text-slate-400 hover:text-white transition-colors">
                  View Gallery
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MOCK_STORIES.slice(0, 2).map(story => (
                  <div key={story.id} className="group bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-600 transition-colors flex flex-col cursor-pointer" onClick={() => onNavigateToStory(story.id)}>
                    <div className="relative aspect-[21/9] overflow-hidden bg-slate-800">
                      <img src={story.coverUrl} alt={story.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                      <div className="absolute bottom-3 left-3 text-white font-bold text-sm line-clamp-1">{story.title}</div>
                    </div>
                    <div className="p-4 flex items-center justify-between bg-slate-900">
                      <div className="text-xs text-slate-400">Because you saved similar stories</div>
                      <button onClick={(e) => { e.stopPropagation(); onNavigateToStory(story.id); }} className="text-indigo-400 hover:text-white transition-colors">
                        <Play size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            
            {/* New Project CTA */}
            <button onClick={onStartProject} className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors shadow-lg shadow-indigo-900/50 flex items-center justify-center gap-2 text-lg">
              <Plus size={20} />
              New Project
            </button>

            {/* Creator Insights */}
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <BarChart3 size={18} className="text-indigo-400" />
                Story Performance
              </h2>
              
              <div className="space-y-6">
                <div>
                  <div className="text-3xl font-black text-white mb-1">2,410</div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Readers</div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80">
                    <div className="text-emerald-400 font-bold mb-1 flex items-center gap-1"><Heart size={14} /> +45</div>
                    <div className="text-xs text-slate-400">Saves this week</div>
                  </div>
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80">
                    <div className="text-blue-400 font-bold mb-1 flex items-center gap-1"><Users size={14} /> +12</div>
                    <div className="text-xs text-slate-400">New followers</div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800/80">
                  <div className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5"><Sparkles size={14} className="text-amber-400" /> Insight</div>
                  <p className="text-xs text-slate-500 leading-relaxed">{activeTip}</p>
                </div>
              </div>
            </section>

            {/* Credit Status Widget */}
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 cursor-pointer hover:border-slate-700 transition-colors" onClick={onNavigateToBilling}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                  <Battery size={16} className="text-emerald-400" />
                  Credits
                </h2>
                <span className="text-xs font-bold text-indigo-400">Manage</span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-2xl font-black text-white">{creditsAvailable}</div>
                  <div className="text-xs text-slate-500">Available</div>
                </div>
                {userPlan === 'Free plan' && (
                  <div className="text-xs font-bold px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-md border border-indigo-500/20">
                    Upgrade
                  </div>
                )}
              </div>
            </section>

          </div>
        </div>

      </div>
    </div>
  );
};
