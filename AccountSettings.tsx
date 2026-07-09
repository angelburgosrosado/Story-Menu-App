/*
Screen Name: Account Settings
Purpose: Account settings, preferences, and operational controls layer for Story.Menu
Version: 1.0
Phase: Phase 12
Date: 2026-07-08
What changed in this revision: Initial creation.
*/

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  User, Settings, Globe, Bell, Shield, Link as LinkIcon, AlertTriangle,
  Camera, Save, CreditCard, HardDrive, LogOut, X, ChevronRight, Check
} from 'lucide-react';
import { signOutUser } from './firebase';

export interface AccountSettingsProps {
  currentUser: {
    id: string;
    email: string;
    displayName?: string;
    isOffline?: boolean;
    tier?: string;
  };
  onClose: () => void;
  onLogout: () => void;
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

type SettingsTab = 'profile' | 'workspace' | 'publishing' | 'notifications' | 'privacy' | 'integrations' | 'account';

export const AccountSettings: React.FC<AccountSettingsProps> = ({ currentUser, onClose, onLogout, onOpenAutomation }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [skin, setSkin] = useState<'comic' | 'writers-journal' | 'kid-story'>(getActiveSkin);
  const [isSaving, setIsSaving] = useState(false);
  const [showSavedToast, setShowSavedToast] = useState(false);

  useEffect(() => {
    const syncSkin = () => setSkin(getActiveSkin());
    window.addEventListener('storage', syncSkin);
    return () => window.removeEventListener('storage', syncSkin);
  }, []);

  const isEditorial = skin === 'writers-journal';

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setShowSavedToast(true);
      setTimeout(() => setShowSavedToast(false), 3000);
    }, 800);
  };

  const handleSignOut = async () => {
    try {
      if (!currentUser.isOffline) {
        await signOutUser();
      }
      onLogout();
    } catch (err) {
      console.error(err);
    }
  };

  const tabs: { id: SettingsTab; label: string; icon: any }[] = [
    { id: 'profile', label: 'Creator Profile', icon: User },
    { id: 'workspace', label: 'Story Settings', icon: Settings },
    { id: 'publishing', label: 'Publishing Settings', icon: Globe },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Family & Privacy Settings', icon: Shield },
    { id: 'integrations', label: 'Classroom & Family Routines', icon: LinkIcon },
    { id: 'account', label: 'Account Settings', icon: AlertTriangle },
  ];

  // Styling Tokens
  const bgClass = isEditorial ? 'bg-[#f5f3ef] text-stone-900' : 'bg-neutral-900 text-white';
  const headerClass = isEditorial ? 'bg-[#faf8f5] border-b border-stone-200 sticky top-0 z-10' : 'bg-black border-b-2 border-gray-800 sticky top-0 z-10';
  const sidebarClass = isEditorial ? 'bg-[#faf8f5] border-r border-stone-200' : 'bg-neutral-950 border-r-2 border-gray-800';
  const tabBtnBase = isEditorial 
    ? 'w-full text-left px-4 py-3 text-sm font-semibold transition-colors rounded-lg mb-1 flex items-center gap-3'
    : 'w-full text-left px-4 py-3 text-sm font-bold uppercase transition-colors mb-1 flex items-center gap-3 border-l-4';
  const tabBtnActive = isEditorial
    ? 'bg-stone-200 text-stone-900'
    : 'bg-yellow-400/10 text-yellow-400 border-yellow-400';
  const tabBtnInactive = isEditorial
    ? 'text-stone-500 hover:bg-stone-100 hover:text-stone-800'
    : 'text-gray-400 hover:bg-gray-900 border-transparent hover:border-gray-600';
  
  const contentBg = isEditorial ? 'bg-white rounded-2xl shadow-sm border border-stone-200 p-8 lg:p-10' : 'bg-black border-2 border-gray-800 shadow-[8px_8px_0px_#000] p-8 lg:p-10';
  const headingClass = isEditorial ? 'text-2xl font-bold font-serif mb-8 text-stone-800' : 'text-3xl font-black uppercase tracking-wider mb-8 text-yellow-400';
  
  const labelClass = isEditorial ? 'block text-sm font-semibold text-stone-600 mb-2' : 'block text-sm font-bold text-gray-400 uppercase mb-2';
  const inputClass = isEditorial 
    ? 'w-full bg-[#faf8f5] border border-stone-300 focus:border-stone-500 focus:ring-1 focus:ring-stone-400 rounded-lg px-4 py-2 text-stone-800 transition-all outline-none'
    : 'w-full bg-neutral-900 border-2 border-gray-700 focus:border-yellow-400 px-4 py-2 text-white font-mono transition-all outline-none';
  const selectClass = isEditorial 
    ? 'w-full bg-[#faf8f5] border border-stone-300 focus:border-stone-500 focus:ring-1 focus:ring-stone-400 rounded-lg px-4 py-2 text-stone-800 transition-all outline-none cursor-pointer'
    : 'w-full bg-neutral-900 border-2 border-gray-700 focus:border-yellow-400 px-4 py-2 text-white font-mono transition-all outline-none cursor-pointer';
  
  const sectionClass = isEditorial ? 'mb-10 pb-10 border-b border-stone-100 last:border-0 last:pb-0' : 'mb-10 pb-10 border-b-2 border-gray-800 last:border-0 last:pb-0';
  const sectionTitle = isEditorial ? 'text-lg font-bold text-stone-800 mb-4' : 'text-xl font-bold text-white uppercase tracking-wider mb-4';
  
  const saveBtn = isEditorial
    ? 'px-6 py-2.5 bg-stone-800 hover:bg-stone-700 text-white rounded-lg font-semibold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer'
    : 'px-8 py-3 bg-yellow-400 hover:bg-yellow-300 text-black font-black uppercase flex items-center gap-2 shadow-[4px_4px_0px_#000] transition-all disabled:opacity-50 cursor-pointer';

  const ToggleSwitch = ({ label, desc, defaultChecked = false }: { label: string, desc: string, defaultChecked?: boolean }) => (
    <div className={`flex items-start justify-between py-4 ${isEditorial ? 'border-b border-stone-50 last:border-0' : 'border-b border-gray-900/50 last:border-0'}`}>
      <div className="pr-8">
        <div className={isEditorial ? 'font-semibold text-stone-800' : 'font-bold text-white'}>{label}</div>
        <div className={isEditorial ? 'text-sm text-stone-500 mt-1 leading-relaxed' : 'text-sm text-gray-400 font-mono mt-1 leading-relaxed'}>{desc}</div>
      </div>
      <label className="relative inline-flex items-center cursor-pointer mt-1 flex-shrink-0">
        <input type="checkbox" className="sr-only peer" defaultChecked={defaultChecked} />
        <div className={`w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${isEditorial ? 'peer-checked:bg-stone-800' : 'peer-checked:bg-yellow-400 rounded-none after:rounded-none'}`}></div>
      </label>
    </div>
  );

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col ${bgClass}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-6 py-4 ${headerClass}`}>
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 flex items-center justify-center ${isEditorial ? 'bg-stone-200 rounded-xl' : 'bg-yellow-400 text-black shadow-[4px_4px_0px_#fff]'}`}>
            <Settings size={20} />
          </div>
          <div>
            <h1 className={isEditorial ? 'text-xl font-bold font-serif' : 'text-2xl font-black uppercase tracking-wider'}>Account Settings</h1>
            <p className={isEditorial ? 'text-sm text-stone-500' : 'text-xs text-gray-400 font-mono'}>Manage your profile and platform preferences</p>
          </div>
        </div>
        <button onClick={onClose} className={`p-2 transition-colors ${isEditorial ? 'hover:bg-stone-200 rounded-full' : 'hover:bg-gray-800 border-2 border-transparent hover:border-gray-600'}`}>
          <X size={24} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className={`w-64 flex-shrink-0 overflow-y-auto p-4 ${sidebarClass}`}>
          <nav>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${tabBtnBase} ${activeTab === tab.id ? tabBtnActive : tabBtnInactive}`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 bg-transparent">
          <div className="max-w-4xl mx-auto">
            
            {showSavedToast && (
              <div className={`mb-6 p-4 flex items-center gap-3 animate-fadeIn ${isEditorial ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg' : 'bg-green-950 text-green-300 border-2 border-green-500 shadow-[4px_4px_0px_#000]'}`}>
                <Check size={20} />
                <span className={isEditorial ? 'font-semibold' : 'font-bold uppercase tracking-wider'}>Changes saved successfully</span>
              </div>
            )}

            <div className={contentBg}>
              
              {/* PROFILE TAB */}
              {activeTab === 'profile' && (
                <div className="animate-fadeIn">
                  <h2 className={headingClass}>Creator Profile</h2>
                  
                  <div className={sectionClass}>
                    <div className="flex items-center gap-6 mb-6">
                      <div className={`w-24 h-24 flex items-center justify-center flex-shrink-0 relative group cursor-pointer ${isEditorial ? 'bg-stone-100 rounded-full border-2 border-stone-300' : 'bg-neutral-800 border-4 border-gray-600'}`}>
                        <User size={40} className={isEditorial ? 'text-stone-300' : 'text-gray-500'} />
                        <div className={`absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity ${isEditorial ? 'rounded-full' : ''}`}>
                          <Camera size={24} className="text-white" />
                        </div>
                      </div>
                      <div>
                        <div className={sectionTitle}>Profile Picture</div>
                        <p className={isEditorial ? 'text-sm text-stone-500' : 'text-sm text-gray-400 font-mono'}>Upload a photo to help the community recognize you.</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className={labelClass}>Display Name</label>
                        <input type="text" className={inputClass} defaultValue={currentUser.displayName || ''} placeholder="Your public name" />
                      </div>
                      <div>
                        <label className={labelClass}>Username / Handle</label>
                        <input type="text" className={inputClass} placeholder="@creatorname" />
                      </div>
                    </div>
                  </div>

                  <div className={sectionClass}>
                    <label className={labelClass}>Bio</label>
                    <textarea className={`${inputClass} min-h-[100px] resize-y`} placeholder="Tell the community a bit about yourself..."></textarea>
                  </div>

                  <div className={sectionClass}>
                    <label className={labelClass}>Audience Focus</label>
                    <select className={selectClass}>
                      <option>General Audience</option>
                      <option>Children / Educational</option>
                      <option>Young Adult</option>
                      <option>Professional / Technical</option>
                    </select>
                  </div>

                  <div className={sectionClass}>
                    <label className={labelClass}>Language</label>
                    <select className={selectClass} defaultValue="en">
                      <option value="en">English (US)</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="ja">日本語</option>
                    </select>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button onClick={handleSave} disabled={isSaving} className={saveBtn}>
                      <Save size={18} /> {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}

              {/* WORKSPACE PREFERENCES TAB */}
              {activeTab === 'workspace' && (
                <div className="animate-fadeIn">
                  <h2 className={headingClass}>Story Settings</h2>
                  
                  <div className={sectionClass}>
                    <h3 className={sectionTitle}>Default Story Settings</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      <div>
                        <label className={labelClass}>Default Format</label>
                        <select className={selectClass}>
                          <option>Comic Book</option>
                          <option>Writer's Journal</option>
                          <option>Children's Story</option>
                          <option>Visual Novel</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Language Format</label>
                        <select className={selectClass}>
                          <option>Single Language</option>
                          <option>Bilingual Dual-Panel</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className={sectionClass}>
                    <h3 className={sectionTitle}>Behavioral Preferences</h3>
                    <ToggleSwitch label="Continue where I left off" desc="Automatically load the last active project when entering the studio." defaultChecked={true} />
                    <ToggleSwitch label="Enable Audio Studio by Default" desc="Turn on narration and sound effect tools automatically for new stories." defaultChecked={false} />
                    <ToggleSwitch label="Use Immersive Reader" desc="Always open the full-screen reader view when previewing a story." defaultChecked={true} />
                  </div>

                  <div className="flex justify-end pt-4">
                    <button onClick={handleSave} disabled={isSaving} className={saveBtn}>
                      <Save size={18} /> {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}

              {/* PUBLISHING DEFAULTS TAB */}
              {activeTab === 'publishing' && (
                <div className="animate-fadeIn">
                  <h2 className={headingClass}>Publishing Settings</h2>
                  
                  <div className={sectionClass}>
                    <h3 className={sectionTitle}>Community Visibility</h3>
                    <ToggleSwitch label="Public by default" desc="New stories will be visible in the community gallery upon publishing." defaultChecked={true} />
                    <ToggleSwitch label="Enable Comments" desc="Allow readers to comment on your published stories." defaultChecked={true} />
                    <ToggleSwitch label="Enable Ratings" desc="Allow readers to leave a 1-5 star rating on your stories." defaultChecked={true} />
                    <ToggleSwitch label="Allow Remixing" desc="Permit other creators to fork and remix your published stories." defaultChecked={false} />
                  </div>

                  <div className={sectionClass}>
                    <h3 className={sectionTitle}>Export Preferences</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      <div>
                        <label className={labelClass}>Default Export Format</label>
                        <select className={selectClass}>
                          <option>PDF (Print Ready)</option>
                          <option>Web Reader Link</option>
                          <option>E-Pub</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelClass}>Translation Display</label>
                        <select className={selectClass}>
                          <option>Side-by-side</option>
                          <option>Translation in appendix</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button onClick={handleSave} disabled={isSaving} className={saveBtn}>
                      <Save size={18} /> {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}

              {/* NOTIFICATION SETTINGS TAB */}
              {activeTab === 'notifications' && (
                <div className="animate-fadeIn">
                  <h2 className={headingClass}>Notifications</h2>
                  
                  <div className={sectionClass}>
                    <h3 className={sectionTitle}>Email Notifications</h3>
                    <ToggleSwitch label="Product Updates" desc="News, feature releases, and platform updates." defaultChecked={true} />
                    <ToggleSwitch label="Recommendation Digests" desc="Weekly summaries of trending stories in your favorite genres." defaultChecked={false} />
                    <ToggleSwitch label="Account Alerts" desc="Security and billing notifications (Required)." defaultChecked={true} />
                  </div>

                  <div className={sectionClass}>
                    <h3 className={sectionTitle}>Community Activity (In-App)</h3>
                    <ToggleSwitch label="Comments & Replies" desc="When someone comments on your story or replies to you." defaultChecked={true} />
                    <ToggleSwitch label="Ratings & Reviews" desc="When your story receives a new rating or review." defaultChecked={true} />
                    <ToggleSwitch label="New Followers" desc="When a creator subscribes to your updates." defaultChecked={true} />
                    <ToggleSwitch label="Remix Alerts" desc="When someone publishes a remix of your story." defaultChecked={true} />
                  </div>

                  <div className="flex justify-end pt-4">
                    <button onClick={handleSave} disabled={isSaving} className={saveBtn}>
                      <Save size={18} /> {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}

              {/* PRIVACY & VISIBILITY TAB */}
              {activeTab === 'privacy' && (
                <div className="animate-fadeIn">
                  <h2 className={headingClass}>Family & Privacy Settings</h2>
                  
                  <div className={sectionClass}>
                    <h3 className={sectionTitle}>Profile Privacy</h3>
                    <ToggleSwitch label="Public Profile" desc="Allow your profile to be discoverable in the creator directory." defaultChecked={true} />
                    <ToggleSwitch label="Show Activity" desc="Display your recent reading and commenting activity on your profile." defaultChecked={false} />
                    <ToggleSwitch label="Show Saved Content" desc="Make your curated library lists visible to followers." defaultChecked={false} />
                  </div>

                  <div className={sectionClass}>
                    <h3 className={sectionTitle}>Audience Filters</h3>
                    <div className="mt-4">
                      <label className={labelClass}>Content Display Level</label>
                      <select className={selectClass}>
                        <option>Show all content (Default)</option>
                        <option>Filter mature themes</option>
                        <option>Kid-friendly only (Strict Mode)</option>
                      </select>
                      <p className={isEditorial ? 'text-xs text-stone-500 mt-2' : 'text-xs text-gray-400 font-mono mt-2'}>
                        This setting controls what appears in your gallery feed and recommendations.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button onClick={handleSave} disabled={isSaving} className={saveBtn}>
                      <Save size={18} /> {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              )}

              {/* INTEGRATIONS TAB */}
              {activeTab === 'integrations' && (
                <div className="animate-fadeIn">
                  <h2 className={headingClass}>Classroom & Family Routines</h2>
                  <p className={isEditorial ? 'text-stone-600 mb-8 leading-relaxed' : 'text-gray-300 font-mono mb-8 leading-relaxed'}>
                    Connect third-party services and schedule automated routines to motivate reading, creating, and sharing.
                  </p>
                  
                  <div className={sectionClass}>
                    <div className={`p-8 rounded-xl border ${isEditorial ? 'border-stone-200 bg-stone-50' : 'border-gray-800 bg-black'}`}>
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <h3 className={isEditorial ? 'text-lg font-bold text-stone-800' : 'text-lg font-bold text-white uppercase'}>Smart Routines & Automations</h3>
                          <p className={isEditorial ? 'text-sm text-stone-500 mt-1' : 'text-xs font-mono text-gray-400 mt-1'}>Enable automated assignments, motivational prompts, and scheduled collections.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer mt-1 flex-shrink-0">
                          <input type="checkbox" className="sr-only peer" defaultChecked={true} />
                          <div className={`w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${isEditorial ? 'peer-checked:bg-stone-800' : 'peer-checked:bg-fuchsia-500 rounded-none after:rounded-none'}`}></div>
                        </label>
                      </div>

                      <div className="pt-6 border-t border-stone-200 dark:border-gray-800 border-opacity-50 flex items-center justify-between">
                        <div>
                          <div className={isEditorial ? 'font-semibold text-stone-800' : 'font-bold text-white'}>Configured Routines</div>
                          <div className={isEditorial ? 'text-sm text-stone-500 mt-1' : 'text-xs font-mono text-gray-400 mt-1'}>0 active automations</div>
                        </div>
                        {onOpenAutomation && (
                          <button 
                            onClick={onOpenAutomation}
                            className={isEditorial 
                              ? 'px-4 py-2 bg-stone-800 hover:bg-stone-700 text-white rounded-lg font-semibold flex items-center gap-2 shadow-sm transition-all cursor-pointer'
                              : 'px-4 py-2 bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-bold uppercase flex items-center gap-2 shadow-[3px_3px_0px_#000] transition-all cursor-pointer'
                            }
                          >
                            Open Routines Hub <ChevronRight size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={sectionClass}>
                    <h3 className={sectionTitle}>External Connectors (Coming Soon)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className={`p-4 rounded-xl border ${isEditorial ? 'border-stone-200 bg-white opacity-60' : 'border-gray-800 bg-neutral-900 opacity-60'}`}>
                        <div className="flex items-center gap-3 mb-2">
                          <LinkIcon size={20} className={isEditorial ? 'text-stone-400' : 'text-gray-500'} />
                          <span className={isEditorial ? 'font-bold text-stone-800' : 'font-bold text-white'}>Classroom Platforms</span>
                        </div>
                        <p className={isEditorial ? 'text-xs text-stone-500' : 'text-xs text-gray-400 font-mono'}>Google Classroom, Canvas, Clever.</p>
                      </div>
                      <div className={`p-4 rounded-xl border ${isEditorial ? 'border-stone-200 bg-white opacity-60' : 'border-gray-800 bg-neutral-900 opacity-60'}`}>
                        <div className="flex items-center gap-3 mb-2">
                          <LinkIcon size={20} className={isEditorial ? 'text-stone-400' : 'text-gray-500'} />
                          <span className={isEditorial ? 'font-bold text-stone-800' : 'font-bold text-white'}>Publishing</span>
                        </div>
                        <p className={isEditorial ? 'text-xs text-stone-500' : 'text-xs text-gray-400 font-mono'}>Direct export to external e-readers and portfolios.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ACCOUNT CONTROL TAB */}
              {activeTab === 'account' && (
                <div className="animate-fadeIn">
                  <h2 className={headingClass}>Account Settings</h2>
                  
                  <div className={sectionClass}>
                    <h3 className={sectionTitle}>Subscription & Usage</h3>
                    <div className={`p-4 rounded-xl flex items-center justify-between ${isEditorial ? 'bg-stone-100 border border-stone-200' : 'bg-neutral-900 border border-gray-700'}`}>
                      <div>
                        <div className={isEditorial ? 'font-bold text-stone-800' : 'font-bold text-white uppercase tracking-wider'}>
                          Current Plan: {currentUser.tier || 'Free Creator'}
                        </div>
                        <div className={isEditorial ? 'text-sm text-stone-500 mt-1' : 'text-xs font-mono text-gray-400 mt-1'}>
                          {currentUser.isOffline ? 'Offline Sandbox Mode' : 'Cloud Sync Active'}
                        </div>
                      </div>
                      <div className={`p-3 rounded-full ${isEditorial ? 'bg-stone-200 text-stone-600' : 'bg-gray-800 text-yellow-400'}`}>
                        <CreditCard size={24} />
                      </div>
                    </div>
                  </div>

                  <div className={sectionClass}>
                    <h3 className={sectionTitle}>Storage</h3>
                    <div className={`p-4 rounded-xl flex items-center justify-between ${isEditorial ? 'bg-stone-100 border border-stone-200' : 'bg-neutral-900 border border-gray-700'}`}>
                      <div>
                        <div className={isEditorial ? 'font-bold text-stone-800' : 'font-bold text-white uppercase tracking-wider'}>
                          Secure cloud storage for your projects and published stories
                        </div>
                        <div className={isEditorial ? 'text-sm text-stone-500 mt-1' : 'text-xs font-mono text-gray-400 mt-1'}>
                          Using 1.2GB of 5GB
                        </div>
                      </div>
                      <div className={`p-3 rounded-full ${isEditorial ? 'bg-stone-200 text-stone-600' : 'bg-gray-800 text-blue-400'}`}>
                        <HardDrive size={24} />
                      </div>
                    </div>
                  </div>

                  <div className={sectionClass}>
                    <h3 className={isEditorial ? 'text-lg font-bold text-red-600 mb-6' : 'text-xl font-bold text-red-500 uppercase tracking-wider mb-6'}>Account Management</h3>
                    
                    <div className="space-y-4">
                      <button onClick={handleSignOut} className={`w-full py-3 px-4 flex items-center justify-between transition-colors ${isEditorial ? 'bg-white border border-stone-300 hover:bg-stone-100 text-stone-800 rounded-lg font-semibold shadow-sm' : 'bg-neutral-900 border border-gray-700 hover:border-gray-500 text-white font-bold uppercase'}`}>
                        <span className="flex items-center gap-3"><LogOut size={18} /> Sign Out</span>
                        <ChevronRight size={18} />
                      </button>
                      
                      <div className={`w-full py-5 px-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 ${isEditorial ? 'bg-red-50 border border-red-200 rounded-lg' : 'bg-red-950/30 border border-red-900'}`}>
                        <div>
                          <div className={isEditorial ? 'font-semibold text-red-800' : 'font-bold text-red-400 uppercase'}>Delete Account</div>
                          <div className={isEditorial ? 'text-sm text-red-600/90 mt-1 leading-relaxed' : 'text-xs font-mono text-red-500/90 mt-1 leading-relaxed'}>Permanently remove your profile, stories, and data. This action is irreversible.</div>
                        </div>
                        <button className={`flex-shrink-0 px-6 py-2.5 ${isEditorial ? 'bg-white text-red-700 border border-red-300 hover:bg-red-50 rounded-lg font-semibold transition-colors shadow-sm' : 'bg-black text-red-500 border border-red-800 hover:bg-red-950 font-bold uppercase transition-colors shadow-[4px_4px_0px_rgba(220,38,38,0.5)]'}`}>
                          Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                  
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
