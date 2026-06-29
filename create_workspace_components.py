import os

components = {
    'WorkspaceSidebar.tsx': """
import React from 'react';
import { BookOpen, Users, Wand2, LayoutDashboard, Database } from 'lucide-react';

export const WorkspaceSidebar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) => {
    const tabs = [
        { id: 'library', label: 'Studio Library', icon: LayoutDashboard },
        { id: 'casting', label: 'Casting Room', icon: Users },
        { id: 'director', label: 'Director Chair', icon: Wand2 },
        { id: 'blueprint', label: 'Story Blueprint', icon: BookOpen }
    ];

    return (
        <div className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 p-6 flex flex-col h-full overflow-y-auto">
            <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-2"><Database size={20} className="text-blue-500"/> Cloud Workspace</h2>
            <nav className="flex flex-col gap-2">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                            activeTab === tab.id 
                                ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/20' 
                                : 'hover:bg-slate-800 hover:text-slate-100 font-medium'
                        }`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </nav>
        </div>
    );
};
""",
    'WorkspaceLibrary.tsx': """
import React from 'react';
export const WorkspaceLibrary = (props: any) => {
    return (
        <div className="p-8">
            <h2 className="text-3xl font-bold mb-6 text-slate-800">Studio Library</h2>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <p className="text-slate-500">Cloud Projects and Drafts.</p>
            </div>
        </div>
    );
};
""",
    'WorkspaceCasting.tsx': """
import React from 'react';
export const WorkspaceCasting = (props: any) => {
    return (
        <div className="p-8">
            <h2 className="text-3xl font-bold mb-6 text-slate-800">Casting Room</h2>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <p className="text-slate-500">Character Vault and Hero/Villain selection.</p>
            </div>
        </div>
    );
};
""",
    'WorkspaceDirector.tsx': """
import React from 'react';
export const WorkspaceDirector = (props: any) => {
    return (
        <div className="p-8">
            <h2 className="text-3xl font-bold mb-6 text-slate-800">Director's Chair</h2>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <p className="text-slate-500">Genre, Tone, Art Style, and Visual Directives.</p>
            </div>
        </div>
    );
};
"""
}

for name, code in components.items():
    with open(name, "w") as f:
        f.write(code)

print("Created Workspace Component scaffolding in root directory.")
