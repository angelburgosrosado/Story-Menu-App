/*
  Screen Name: Premium Gate
  Purpose: A wrapper component that visually locks premium features and prompts an upgrade.
  Version: v1.0
  Phase: Phase 11
  Date: 2026-07-08
  What changed in this revision: Initial creation.
*/

import React from 'react';
import { Lock, Sparkles } from 'lucide-react';

interface PremiumGateProps {
  isPremium: boolean;
  featureName: string;
  children: React.ReactNode;
  onUpgrade: () => void;
  inline?: boolean;
}

export const PremiumGate: React.FC<PremiumGateProps> = ({ isPremium, featureName, children, onUpgrade, inline = false }) => {
  if (isPremium) {
    return <>{children}</>;
  }

  if (inline) {
    return (
      <button 
        onClick={onUpgrade}
        className="w-full relative overflow-hidden group p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-left transition-colors hover:border-amber-500/50"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="flex flex-col relative z-10">
          <span className="text-sm font-bold text-white mb-1">{featureName}</span>
          <span className="text-xs text-slate-400">Upgrade for access</span>
        </div>
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 relative z-10">
          <Lock size={14} />
        </div>
      </button>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden group">
      <div className="filter blur-[2px] opacity-40 pointer-events-none transition-all group-hover:blur-[4px]">
        {children}
      </div>
      
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-500 mb-4 shadow-xl">
          <Lock size={20} />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">{featureName}</h3>
        <p className="text-sm text-slate-400 max-w-xs mx-auto mb-6">
          This is a premium feature. Upgrade your plan to unlock more creative possibilities.
        </p>
        <button 
          onClick={onUpgrade}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/20 transition-colors flex items-center gap-2"
        >
          <Sparkles size={16} />
          View Plans
        </button>
      </div>
    </div>
  );
};
