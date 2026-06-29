import React from 'react';
import { BookOpen, Users, Wand2, LayoutDashboard, Database, Settings } from 'lucide-react';
import { useWorkspace } from './WorkspaceContext';

export const WorkspaceSidebar = () => {
    const { 
        activeTab, setActiveTab, 
        isCyberpunk, 
        savedCharacters, 
        savedDrafts, 
        t 
    } = useWorkspace();

    const tabs = [
        { id: 'library', label: t('setup.dashboard.navLibrary', 'Studio Library'), icon: LayoutDashboard },
        { id: 'casting', label: t('setup.dashboard.navCasting', 'Casting Room'), icon: Users },
        { id: 'director', label: t('setup.dashboard.navDirector', 'Director Chair'), icon: Wand2 },
        { id: 'blueprint', label: t('setup.dashboard.navBlueprint', 'Story Blueprint'), icon: BookOpen }
    ];

    return (
        <div className="w-64 bg-slate-950 border-r border-slate-800 text-slate-300 p-4 flex flex-col h-full overflow-y-auto shrink-0 shadow-2xl relative z-50">
            <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-2 font-mono">
                <Database size={20} className="text-blue-500"/> Cloud Workspace
            </h2>
            
            <nav className="flex flex-col gap-2 flex-1">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative ${
                            activeTab === tab.id 
                                ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/20' 
                                : 'hover:bg-slate-800 hover:text-slate-100 font-medium'
                        }`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                        
                        {/* Badges */}
                        {tab.id === 'casting' && savedCharacters.length > 0 && (
                            <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm">BETA</span>
                        )}
                        {tab.id === 'blueprint' && (
                             <span className="absolute top-1 right-1 bg-yellow-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded-sm">NEW</span>
                        )}
                        {tab.id === 'library' && savedDrafts.length > 0 && (
                             <span className="ml-auto bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full">{savedDrafts.length}</span>
                        )}
                    </button>
                ))}
                
                {/* Always-visible Generate Button for Desktop */}
                <button
                    onClick={() => setActiveTab('generate')}
                    className={`mt-4 flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative font-bold ${
                        activeTab === 'generate' || isCyberpunk
                            ? 'bg-amber-500 text-black shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                            : 'bg-slate-800 text-yellow-500 hover:bg-slate-700 hover:text-yellow-400 border border-yellow-500/30'
                    }`}
                >
                    <Wand2 size={18} />
                    {t('setup.dashboard.navGenerate', 'Create Art')}
                </button>
            </nav>
            
            <div className="mt-8 border-t border-slate-800 pt-4">
                <button 
                    onClick={() => document.getElementById('admin-btn')?.click()} 
                    className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all w-full hover:bg-slate-800 hover:text-slate-100 font-medium text-slate-400"
                >
                    <Settings size={18} />
                    Admin Config
                </button>
            </div>
        </div>
    );
};
