/*
  Screen Name: Pricing Plans
  Purpose: Displays subscription and usage options for users to upgrade.
  Version: v1.0
  Phase: Phase 11
  Date: 2026-07-08
  What changed in this revision: Initial creation.
*/

import React from 'react';
import { Check, Sparkles, X } from 'lucide-react';

interface PricingPlansProps {
  currentPlan: 'Free plan' | 'Pro creator';
  onClose: () => void;
  onUpgrade: (plan: 'Pro creator') => void;
  onBuyCredits: () => void;
}

export const PricingPlans: React.FC<PricingPlansProps> = ({ currentPlan, onClose, onUpgrade, onBuyCredits }) => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0c0e14] overflow-y-auto">
      <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 flex flex-col">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-12 shrink-0">
          <div className="w-10 h-10" /> {/* Spacer */}
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-black text-white mb-2">Choose your plan</h1>
            <p className="text-sm text-slate-400">Flexible plans for every kind of storyteller.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white transition-colors bg-slate-900 rounded-xl border border-slate-800">
            <X size={20} />
          </button>
        </header>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full mb-12">
          
          {/* Free Plan */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col relative overflow-hidden">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-white mb-1">Free plan</h2>
              <p className="text-sm text-slate-400">Everything you need to get started.</p>
            </div>
            
            <div className="mb-8">
              <span className="text-4xl font-black text-white">$0</span>
              <span className="text-slate-500">/ forever</span>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {[
                'Custom persona builder for recurring characters', 
                'Long-form story and series support', 
                'Story revision tools (rewrite, expand, and refine drafts)'
              ].map((benefit, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 shrink-0 mt-0.5">
                    <Check size={12} />
                  </div>
                  <span className="text-sm text-slate-300">{benefit}</span>
                </li>
              ))}
            </ul>

            <button disabled className="w-full py-3 rounded-xl bg-slate-800 text-slate-500 font-bold text-sm cursor-not-allowed">
              {currentPlan === 'Free plan' ? 'Current plan' : 'Included'}
            </button>
          </div>

          {/* Pro Creator Plan */}
          <div className="bg-indigo-950 border-2 border-indigo-500 rounded-3xl p-8 flex flex-col relative overflow-hidden shadow-2xl shadow-indigo-900/20">
            <div className="absolute top-0 right-8 px-3 py-1 bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-b-lg">
              Recommended
            </div>
            
            <div className="mb-8">
              <h2 className="text-xl font-bold text-indigo-100 mb-1 flex items-center gap-2">
                Pro creator <Sparkles size={16} className="text-indigo-400" />
              </h2>
              <p className="text-sm text-indigo-300">For educators and serious creators.</p>
            </div>
            
            <div className="mb-8">
              <span className="text-4xl font-black text-white">$12</span>
              <span className="text-indigo-300">/ month</span>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {[
                'High-quality visual engine for crisp pages', 
                'Premium illustration styles for different readers', 
                'Premium narrator voices and audio presets', 
                'Custom persona builder for recurring characters',
                'Long-form story and series support',
                'Story revision tools (rewrite, expand, and refine drafts)',
                'Custom story universes and themes',
                'Premium exports for print and digital publishing'
              ].map((benefit, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                    <Check size={12} />
                  </div>
                  <span className="text-sm text-indigo-100">{benefit}</span>
                </li>
              ))}
            </ul>

            {currentPlan === 'Pro creator' ? (
              <button disabled className="w-full py-3 rounded-xl bg-indigo-500/20 text-indigo-300 font-bold text-sm border border-indigo-500/30">
                Current plan
              </button>
            ) : (
              <button 
                onClick={() => onUpgrade('Pro creator')}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-colors shadow-lg shadow-indigo-600/20"
              >
                Upgrade to Pro
              </button>
            )}
          </div>

        </div>

        {/* Credit Top-up */}
        <div className="max-w-xl mx-auto w-full text-center">
          <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800">
            <h3 className="text-base font-bold text-white mb-2">Just need a little extra?</h3>
            <p className="text-sm text-slate-400 mb-4">Buy credits as you go, no subscription required. Credits never expire.</p>
            <button 
              onClick={onBuyCredits}
              className="px-6 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold transition-colors"
            >
              Buy 500 Credits for $5
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
