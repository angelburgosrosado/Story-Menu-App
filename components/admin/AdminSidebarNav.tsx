import React from 'react';
import { 
    Shield, Activity, Users, DollarSign, Layers, Globe, 
    AlertTriangle, CreditCard, Layout, Cpu, TrendingUp, Key, Terminal, X, Play 
} from 'lucide-react';
import { signOut } from 'firebase/auth';

interface AdminSidebarNavProps {
    activeTab: string;
    setActiveTab: (tab: any) => void;
    flagsCount: number;
    authEmail: string;
    auth: any;
}

export const AdminSidebarNav: React.FC<AdminSidebarNavProps> = ({
    activeTab,
    setActiveTab,
    flagsCount,
    authEmail,
    auth
}) => {
    const NavItem = ({
        tab,
        icon: Icon,
        label,
        alertCount = 0,
    }: {
        tab: string;
        icon: any;
        label: string;
        alertCount?: number;
    }) => (
        <button
            onClick={() => setActiveTab(tab)}
            className={`w-full flex items-center gap-3 px-6 py-3.5 text-sm font-medium transition-all duration-200 border-l-4 ${
                activeTab === tab 
                    ? "border-blue-500 bg-slate-800/50 text-white" 
                    : "border-transparent text-slate-400 hover:bg-slate-800/30 hover:text-slate-200"
            }`}
        >
            <Icon
                size={18}
                className={activeTab === tab ? "text-blue-500" : "text-slate-500"}
            />
            {label}
            {alertCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                    {alertCount}
                </span>
            )}
        </button>
    );

    return (
        <div className="w-64 bg-slate-950 flex flex-col shadow-2xl z-20 transition-all border-r border-slate-800/50 h-screen sticky top-0">
            <div className="p-6 border-b border-slate-800/50">
                <h2 className="text-xl font-black text-white flex items-center gap-3 tracking-tight">
                    <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg shadow-lg shadow-blue-900/20">
                        <Shield size={20} className="text-white" />
                    </div>
                    Command Center
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto py-6 space-y-1">
                <div className="px-6 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                    Core Engine
                </div>
                <NavItem tab="dashboard" icon={Activity} label="Dashboard" />
                <NavItem tab="memberships" icon={Users} label="Memberships" />
                <NavItem tab="plans" icon={DollarSign} label="Subscription Plans" />
                <NavItem tab="categories" icon={Layers} label="Taxonomy" />
                <NavItem tab="languages" icon={Globe} label="Languages & Glossary" />
                <NavItem
                    tab="moderation"
                    icon={AlertTriangle}
                    label="Moderation Queue"
                    alertCount={flagsCount}
                />
                <NavItem
                    tab="global_characters"
                    icon={Users}
                    label="Global Characters"
                />
                <NavItem tab="logs" icon={Activity} label="Webhook & Errors" />

                <div className="px-6 mt-8 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                    System Configurations
                </div>
                <NavItem tab="integrations" icon={CreditCard} label="Payment APIs" />
                <NavItem tab="features" icon={Layout} label="GUI Toggles" />
                <NavItem tab="ai_config" icon={Cpu} label="AI Settings" />
                <NavItem tab="ai_costs" icon={TrendingUp} label="AI Cost Analytics" />
                <NavItem tab="administrators" icon={Key} label="Administrators" />

                <div className="px-6 mt-8 mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                    Developer & Testing
                </div>
                <NavItem tab="diagnostics" icon={Terminal} label="System Diagnostics" />
                <NavItem tab="rate_limits" icon={Activity} label="Rate Limits" />
                <NavItem tab="ai_sandbox" icon={Play} label="Prompt Sandbox" />
            </div>

            <div className="p-5 border-t border-slate-800/50 bg-slate-900/50">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                        <span className="text-slate-300 font-bold text-xs">
                            {authEmail.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <div className="text-xs font-bold text-slate-300 truncate">
                            {authEmail}
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase">
                            Super Admin
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-2">
                    <button
                        onClick={() => (window.location.href = "/")}
                        className="w-full bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 hover:text-indigo-300 py-2 rounded-lg text-xs font-bold border border-indigo-500/30 transition-all flex items-center justify-center gap-2"
                    >
                        <Globe size={14} /> LIVE APP / DASHBOARD
                    </button>
                    <button
                        onClick={() => signOut(auth)}
                        className="w-full bg-slate-800 hover:bg-red-500/10 text-slate-300 hover:text-red-400 py-2 rounded-lg text-xs font-bold border border-slate-700 hover:border-red-500/30 transition-all flex items-center justify-center gap-2"
                    >
                        <X size={14} /> TERMINATE SESSION
                    </button>
                </div>
            </div>
        </div>
    );
};
