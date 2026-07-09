/*
  Screen Name: Usage Dashboard
  Purpose: Let users manage their credits, view billing history, and understand their usage.
  Version: v1.0
  Phase: Phase 11
  Date: 2026-07-08
  What changed in this revision: Initial creation.
*/

import React from 'react';
import { ArrowLeft, Battery, CreditCard, Receipt, Sparkles } from 'lucide-react';

interface UsageDashboardProps {
  creditsAvailable: number;
  currentPlan: 'Free plan' | 'Pro creator';
  onBack: () => void;
  onViewPlans: () => void;
}

export const UsageDashboard: React.FC<UsageDashboardProps> = ({ creditsAvailable, currentPlan, onBack, onViewPlans }) => {
  const isPro = currentPlan === 'Pro creator';
  const totalCredits = isPro ? 1000 : 100;
  const usagePercent = Math.min(100, Math.max(0, ((totalCredits - creditsAvailable) / totalCredits) * 100));

  return (
    <div className="min-h-screen bg-[#0c0e14] text-slate-200 flex flex-col font-sans overflow-y-auto">
      
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#0c0e14]/90 backdrop-blur border-b border-slate-800 p-4 sm:p-6 flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-black text-white">Billing & Usage</h1>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-8 max-w-4xl w-full mx-auto space-y-6">
        
        {/* Plan Overview */}
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${isPro ? 'bg-indigo-600 text-white shadow-indigo-600/20' : 'bg-slate-800 text-slate-400'}`}>
              <Sparkles size={24} />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Current plan</div>
              <h2 className="text-2xl font-bold text-white">{currentPlan}</h2>
            </div>
          </div>
          <div>
            {!isPro && (
              <button 
                onClick={onViewPlans}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-colors shadow-lg shadow-indigo-600/20"
              >
                Upgrade to Pro
              </button>
            )}
            {isPro && (
              <button className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-colors">
                Manage Subscription
              </button>
            )}
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Credit Usage */}
          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Battery size={20} className="text-emerald-400" />
                Credits available
              </h3>
            </div>
            
            <div className="mb-6">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-black text-white">{creditsAvailable}</span>
                <span className="text-sm text-slate-500">/ {totalCredits}</span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${usagePercent > 90 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                  style={{ width: `${100 - usagePercent}%` }} 
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Story Generation</span>
                <span>~1 credit</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Premium Voice (1 min)</span>
                <span>~2 credits</span>
              </div>
            </div>
          </section>

          {/* Billing & Payment */}
          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-6">
              <CreditCard size={20} className="text-slate-400" />
              Payment Method
            </h3>
            
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-slate-800 border-dashed rounded-2xl bg-slate-950/50">
              <Receipt size={24} className="text-slate-600 mb-3" />
              <p className="text-sm text-slate-400 mb-4">No payment methods on file.</p>
              <button 
                onClick={onViewPlans}
                className="text-indigo-400 font-bold text-sm hover:text-indigo-300 transition-colors"
              >
                Add payment method
              </button>
            </div>
          </section>

        </div>

      </main>
    </div>
  );
};
