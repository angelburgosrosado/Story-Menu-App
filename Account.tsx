/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { auth, signInWithGoogle, signOutUser } from './firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, User as FirebaseUser } from 'firebase/auth';
import { LogOut, LogIn, User, Mail, Lock, Shield, Sparkles, BookOpen, Trash2, X, PlusCircle, CheckCircle, Feather } from 'lucide-react';

interface AccountProps {
  currentUser: { 
    id: string; 
    email: string; 
    displayName?: string; 
    isOffline?: boolean;
    tier?: string;
    subscriptionId?: string;
    paymentMethod?: string;
  } | null;
  onUserChange: (user: any | null) => void;
  onClose?: () => void;
  onOpenCheckout?: (tier: 'Pro' | 'Enterprise') => void;
  onOpenAdmin?: () => void;
}

/** Read the active app skin from localStorage (mirrors Setup.tsx logic). */
const getActiveSkin = (): 'comic' | 'editorial' => {
  try {
    return (localStorage.getItem('story_menu_skin') as any) || 'comic';
  } catch {
    return 'comic';
  }
};

export const AuthScreen: React.FC<AccountProps> = ({ onUserChange, onClose }) => {
  const { t } = useTranslation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [skin, setSkin] = useState<'comic' | 'editorial'>(getActiveSkin);

  // Sync skin from localStorage reactively
  useEffect(() => {
    const syncSkin = () => setSkin(getActiveSkin());
    window.addEventListener('storage', syncSkin);
    // Also poll once in case skin changed in same tab via Setup toggle
    const interval = setInterval(syncSkin, 800);
    return () => {
      window.removeEventListener('storage', syncSkin);
      clearInterval(interval);
    };
  }, []);

  const isEditorial = skin === 'editorial';

  // Clear errors when toggling modes
  useEffect(() => {
    setError(null);
    setSuccessMsg(null);
  }, [isSignUp]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await signInWithGoogle();
      onUserChange({
        id: user.uid,
        email: user.email || 'creator@multiverse.com',
        displayName: user.displayName || (isEditorial ? 'Author' : 'Multiverse Creator')
      });
      if (onClose) onClose();
    } catch (err: any) {
      console.warn("Google SSO fallback bypass chosen:", err);
      setError(err.message || "Could not authenticate. Verify your firewall isn't dropping Firebase TCP packets.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all credentials.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        if (!displayName.trim()) {
          setError(isEditorial ? "Please enter your pen name." : "Please project a Creator Name.");
          setLoading(false);
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
        setSuccessMsg(isEditorial ? "Author profile created! Signing in…" : "Creative Portal unlocked! Logging in...");
        setTimeout(() => {
          onUserChange({
            id: userCredential.user.uid,
            email: userCredential.user.email || email,
            displayName: displayName
          });
          if (onClose) onClose();
        }, 1500);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        onUserChange({
          id: userCredential.user.uid,
          email: userCredential.user.email || email,
          displayName: userCredential.user.displayName || (isEditorial ? 'Author' : 'Multiverse Creator')
        });
        if (onClose) onClose();
      }
    } catch (err: any) {
      let code = err.code || "";
      if (code.includes("auth/email-already-in-use")) {
        setError(isEditorial ? "This email is already registered. Please sign in." : "This email key is already registered. Please login.");
      } else if (code.includes("auth/invalid-credential") || code.includes("auth/wrong-password")) {
        setError(isEditorial ? "Incorrect credentials. Please try again." : "Invalid credentials. Please recheck security keys.");
      } else {
        setError(err.message || 'Authentication sequence failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOfflineMode = () => {
    const offlineId = 'offline_creator_' + Math.random().toString(36).substring(2, 9);
    onUserChange({
      id: offlineId,
      email: 'local-artist@sandbox.mode',
      displayName: isEditorial ? 'Guest Author' : 'Offline Creator',
      isOffline: true
    });
    if (onClose) onClose();
  };

  // ── Style tokens ───────────────────────────────────────────────────────────
  const outerBox = isEditorial
    ? 'flex flex-col max-w-md w-full mx-auto bg-[#faf8f5] border border-stone-300 p-8 rounded-xl shadow-2xl text-stone-900 font-sans text-center relative z-50 animate-fadeIn'
    : 'flex flex-col max-w-md w-full mx-auto bg-neutral-900 border-4 border-yellow-400 p-8 rounded-none shadow-[10px_10px_0px_rgba(0,0,0,1)] text-white font-sans text-center relative z-50 animate-fadeIn';

  const iconBox = isEditorial
    ? 'inline-flex p-3 bg-stone-200 text-stone-700 border border-stone-300 rounded-xl mb-3 shadow-sm'
    : 'inline-flex p-3 bg-yellow-400 text-black border-2 border-black rotate-[-2deg] mb-3 shadow-[4px_4px_0px_#000]';

  const heading = isEditorial
    ? 'text-2xl font-bold tracking-tight text-stone-900 font-serif'
    : 'text-3xl font-black uppercase tracking-wider text-yellow-400 font-sans';

  const subheading = isEditorial
    ? 'text-sm text-stone-500 mt-2 font-sans leading-relaxed'
    : 'text-sm text-gray-300 mt-2 font-mono';

  const label = isEditorial
    ? 'block text-xs uppercase font-semibold tracking-widest text-stone-500 mb-1'
    : 'block text-xs uppercase font-bold tracking-wider text-gray-400 mb-1';

  const inputClass = isEditorial
    ? 'w-full bg-white border border-stone-300 focus:border-stone-600 focus:ring-1 focus:ring-stone-400 py-2 pl-10 pr-4 text-sm font-medium outline-none text-stone-900 rounded-lg transition-all'
    : 'w-full bg-black border-2 border-gray-600 focus:border-yellow-400 py-2 pl-10 pr-4 text-sm font-semibold outline-none text-white rounded-none';

  const submitBtn = isEditorial
    ? 'w-full bg-stone-800 hover:bg-stone-700 active:translate-y-0.5 text-white border border-stone-700 font-semibold text-sm py-2.5 px-4 rounded-lg cursor-pointer flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-50 shadow-sm'
    : 'w-full bg-yellow-400 hover:bg-yellow-300 active:translate-y-0.5 text-black border-2 border-black font-black uppercase text-sm py-2 px-4 shadow-[4px_4px_0px_#000] cursor-pointer flex items-center justify-center gap-2 duration-100 disabled:opacity-50';

  const googleBtn = isEditorial
    ? 'w-full bg-white hover:bg-stone-50 active:translate-y-0.5 text-stone-700 border border-stone-300 font-medium text-sm py-2.5 px-4 rounded-lg cursor-pointer flex items-center justify-center gap-2 mb-4 transition-all duration-150 disabled:opacity-50 shadow-sm'
    : 'w-full bg-black hover:bg-neutral-850 active:translate-y-0.5 text-white border-2 border-gray-500 hover:border-white font-bold text-sm py-2 px-4 cursor-pointer flex items-center justify-center gap-2 mb-4 duration-100 disabled:opacity-50';

  const toggleBtn = isEditorial
    ? 'text-stone-600 hover:text-stone-900 hover:underline cursor-pointer font-semibold mx-auto text-sm transition-colors'
    : 'text-yellow-400 hover:underline cursor-pointer font-semibold mx-auto';

  const dividerLabel = isEditorial
    ? 'bg-[#faf8f5] px-3 text-stone-400 font-sans text-xs'
    : 'bg-neutral-900 px-3 text-gray-400 font-mono font-bold';

  const offlineBtn = isEditorial
    ? 'w-full text-stone-500 hover:text-stone-800 text-xs mt-3 underline underline-offset-2 cursor-pointer transition-colors font-medium'
    : 'w-full text-gray-500 hover:text-gray-200 text-xs mt-3 font-mono underline cursor-pointer';

  const iconColor = isEditorial ? 'text-stone-400' : 'text-gray-500';

  return (
    <div className={outerBox}>
      {onClose && (
        <button 
          onClick={onClose} 
          className={`absolute top-2 right-2 p-2 transition-colors ${isEditorial ? 'text-stone-400 hover:text-stone-700' : 'text-gray-400 hover:text-white'}`}
          id="btn-auth-close"
        >
          <X size={20} />
        </button>
      )}

      <div className="mb-6">
        <div className={iconBox}>
          {isEditorial
            ? <Feather size={28} className="text-stone-600" />
            : <Sparkles size={28} className="animate-spin" style={{ animationDuration: '4s' }} />
          }
        </div>
        <h2 className={heading}>
          {isEditorial
            ? (isSignUp ? "Create Author Profile" : "Sign In to Journal")
            : (isSignUp ? "Create Creator Key" : "Access Studio")}
        </h2>
        <p className={subheading}>
          {isEditorial
            ? "Save your manuscripts, character profiles, and story blueprints to the cloud."
            : "Save your generated comics and custom character bibles to the cloud!"}
        </p>
      </div>

      {error && (
        <div className={`mb-4 text-xs py-2 px-3 text-left max-h-24 overflow-y-auto ${isEditorial ? 'bg-red-50 border border-red-300 text-red-700 rounded-lg' : 'bg-red-950 border-2 border-red-500 text-red-200 font-mono'}`}>
          {isEditorial ? '⚠ ' : '⚠️ '}{error}
        </div>
      )}

      {successMsg && (
        <div className={`mb-4 text-xs py-2 px-3 flex items-center gap-2 ${isEditorial ? 'bg-emerald-50 border border-emerald-300 text-emerald-700 rounded-lg' : 'bg-green-950 border-2 border-green-500 text-green-200 font-mono'}`}>
          <CheckCircle size={14} /> {successMsg}
        </div>
      )}

      <form onSubmit={handleEmailAuth} className="space-y-4 text-left">
        {isSignUp && (
          <div>
            <label className={label}>{isEditorial ? 'Pen Name' : 'Creator Name'}</label>
            <div className="relative">
              <User className={`absolute left-3 top-2.5 ${iconColor}`} size={16} />
              <input 
                id="input-displayname"
                type="text" 
                placeholder={isEditorial ? "J.K. Rowling" : "Stan Lee"} 
                value={displayName} 
                onChange={e => setDisplayName(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        )}

        <div>
          <label className={label}>{isEditorial ? 'Email Address' : 'Email Coordinates'}</label>
          <div className="relative">
            <Mail className={`absolute left-3 top-2.5 ${iconColor}`} size={16} />
            <input 
              id="input-auth-email"
              type="email" 
              placeholder={isEditorial ? "author@writersjournal.com" : "creator@infinite-comics.com"} 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={label}>{isEditorial ? 'Password' : 'Security Key (Password)'}</label>
          <div className="relative">
            <Lock className={`absolute left-3 top-2.5 ${iconColor}`} size={16} />
            <input 
              id="input-auth-password"
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <button
          id="btn-auth-submit"
          type="submit"
          disabled={loading}
          className={submitBtn}
        >
          <LogIn size={16} />
          {loading
            ? (isEditorial ? "Signing in…" : "Decrypting...")
            : isSignUp
              ? (isEditorial ? "Create Profile" : "Generate Creator Profile")
              : (isEditorial ? "Sign In" : "Login to Studio")}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className={`w-full border-t ${isEditorial ? 'border-stone-200' : 'border-gray-600'}`}></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className={dividerLabel}>{isEditorial ? 'Or continue with' : 'Multiverse SSO'}</span>
        </div>
      </div>

      <button
        id="btn-google-auth"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className={googleBtn}
      >
        <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31l3.41 2.64c2-1.84 3.44-4.54 3.44-7.96z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.41-2.64c-.95.63-2.16 1.01-3.87 1.01-2.97 0-5.48-2.01-6.38-4.7L2.1 16.7A10.99 10.99 0 0 0 12 23z"/>
          <path fill="#FBBC05" d="M5.62 14.01a6.57 6.57 0 0 1 0-4.02l-3.52-2.73A10.99 10.99 0 0 0 2.1 16.7l3.52-2.69z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.24 1 3.2 3.71 1.08 7.68l3.52 2.73c.9-2.69 3.41-4.7 6.38-4.7z"/>
        </svg>
        {isEditorial ? 'Continue with Google' : 'Sign in with Google'}
      </button>

      <div className="flex justify-between items-center text-xs mt-3">
        <button
          id="btn-toggle-auth-mode"
          onClick={() => setIsSignUp(!isSignUp)}
          className={toggleBtn}
        >
          {isEditorial
            ? (isSignUp ? "Already have an account? Sign in" : "New here? Create a profile")
            : (isSignUp ? "Already have a coordinate? Switch to Login" : "New Creator? Summon an Profile Account")}
        </button>
      </div>

      <button
        id="btn-offline-mode"
        onClick={handleOfflineMode}
        className={offlineBtn}
      >
        {isEditorial ? '✍️ Continue without signing in (local only)' : '⚡ Continue in Offline Sandbox Mode'}
      </button>
    </div>
  );
};

export const AccountPanel: React.FC<AccountProps & { onOpenAuth: () => void }> = ({ currentUser, onUserChange, onOpenAuth, onOpenCheckout, onOpenAdmin }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [skin, setSkin] = useState<'comic' | 'editorial'>(getActiveSkin);

  // Sync skin from localStorage reactively
  useEffect(() => {
    const syncSkin = () => setSkin(getActiveSkin());
    window.addEventListener('storage', syncSkin);
    const interval = setInterval(syncSkin, 800);
    return () => {
      window.removeEventListener('storage', syncSkin);
      clearInterval(interval);
    };
  }, []);

  const isEditorial = skin === 'editorial';

  const handleLogout = async () => {
    try {
      if (!currentUser?.isOffline) {
        await signOutUser();
      }
      onUserChange(null);
      setOpen(false);
    } catch (err) {
      console.error("Logout issue:", err);
    }
  };

  if (!currentUser) {
    return (
      <button
        id="btn-trigger-login"
        onClick={onOpenAuth}
        className={
          isEditorial
            ? "fixed top-4 right-4 bg-[#faf8f5] text-stone-800 border border-stone-300 py-2 px-4 shadow-md font-semibold text-sm flex items-center gap-2 hover:bg-stone-100 hover:border-stone-400 transition-all duration-150 z-50 cursor-pointer rounded-lg"
            : "fixed top-4 right-4 bg-yellow-400 text-black border-2 border-black py-2 px-4 shadow-[3px_3px_0px_#000] font-bold text-sm uppercase flex items-center gap-2 hover:bg-yellow-300 duration-100 z-50 cursor-pointer"
        }
      >
        {isEditorial ? <Feather size={15} /> : <User size={16} />}
        {isEditorial ? 'Sign In' : 'Summon Account'}
      </button>
    );
  }

  const hasSubscription = !!currentUser.tier;

  // ── Dropdown style tokens ──────────────────────────────────────────────────
  const triggerBtn = isEditorial
    ? 'bg-[#faf8f5] border border-stone-300 px-4 py-2 text-stone-800 font-sans text-xs flex items-center gap-2 hover:border-stone-500 hover:bg-stone-100 transition-all duration-150 cursor-pointer shadow-sm rounded-lg'
    : 'bg-neutral-900 border-2 border-yellow-400 px-4 py-2 text-white font-mono text-xs flex items-center gap-2 hover:border-white duration-100 cursor-pointer shadow-[3px_3px_0px_rgba(0,0,0,0.8)]';

  const dropdownBox = isEditorial
    ? 'absolute right-0 mt-2 w-72 bg-[#faf8f5] border border-stone-200 p-5 rounded-xl shadow-2xl text-stone-900 animate-fadeIn'
    : 'absolute right-0 mt-2 w-72 bg-neutral-900 border-4 border-yellow-400 p-5 rounded-none shadow-[6px_6px_0px_#000] text-white animate-fadeIn';

  const panelHeading = isEditorial
    ? 'text-sm font-bold text-stone-800 tracking-wider flex items-center justify-between font-serif'
    : 'text-sm font-black uppercase text-yellow-400 tracking-wider flex items-center justify-between';

  const proBadge = isEditorial
    ? 'text-[10px] bg-stone-800 text-stone-100 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider'
    : 'text-[10px] bg-yellow-400 text-black px-1.5 py-0.5 rounded-none font-bold';

  const metaRow = isEditorial
    ? 'flex justify-between text-xs font-sans'
    : 'flex justify-between font-mono text-[11px]';

  const metaKey = isEditorial ? 'text-stone-500 font-medium' : 'text-gray-400';

  const upgradeBtn = isEditorial
    ? 'w-full mb-3 bg-stone-800 hover:bg-stone-700 text-white font-semibold text-xs py-2 px-3 flex items-center justify-center gap-1.5 border border-stone-700 shadow-sm transition-all duration-150 cursor-pointer rounded-lg'
    : 'w-full mb-3 bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xs py-2 px-3 flex items-center justify-center gap-1.5 border-2 border-black shadow-[3px_3px_0px_#000] duration-100 cursor-pointer';

  const adminBtn = isEditorial
    ? 'w-full mb-3 bg-teal-700 hover:bg-teal-600 text-white font-semibold text-xs py-2 px-3 flex items-center justify-center gap-1.5 border border-teal-600 shadow-sm transition-all duration-150 cursor-pointer rounded-lg'
    : 'w-full mb-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs py-2 px-3 flex items-center justify-center gap-1.5 border-2 border-black shadow-[3px_3px_0px_#000] duration-100 cursor-pointer';

  const logoutBtn = isEditorial
    ? 'w-full bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs py-2 px-3 flex items-center justify-center gap-2 border border-red-200 transition-all duration-150 cursor-pointer rounded-lg'
    : 'w-full bg-red-650 hover:bg-red-600 text-white font-bold text-xs py-2 px-3 flex items-center justify-center gap-2 border-2 border-black shadow-[3px_3px_0px_#000] duration-100 cursor-pointer';

  const divider = isEditorial ? 'border-b border-stone-100 pb-3 mb-4' : 'border-b border-gray-700 pb-3 mb-4';

  const onlinePip = isEditorial
    ? 'w-2 h-2 rounded-full bg-emerald-500 inline-block'
    : 'w-2.5 h-2.5 rounded-full bg-green-400 inline-block animate-ping';

  const creatorLabel = isEditorial ? 'text-stone-500 text-xs font-medium' : 'text-gray-300 text-xs font-bold';
  const creatorName = isEditorial ? 'text-stone-800 font-semibold' : 'text-yellow-400 font-bold';

  return (
    <div className="fixed top-4 right-4 z-[250]">
      <button
        id="btn-creator-badge"
        onClick={() => setOpen(!open)}
        className={triggerBtn}
      >
        <span className={onlinePip}></span>
        <span className={creatorLabel}>{isEditorial ? 'Author:' : 'Creator:'}</span>
        <span className={creatorName}>{currentUser.displayName || currentUser.email.split('@')[0]}</span>
        {hasSubscription && (
          <span className={proBadge}>{t('account.auto1', 'PRO')}</span>
        )}
      </button>

      {open && (
        <div className={dropdownBox}>
          <div className={divider}>
            <h4 className={panelHeading}>
              <span>{isEditorial ? 'Author Profile' : 'CREATOR MATRIX'}</span>
              {hasSubscription && (
                <span className={proBadge}>{t('account.auto2', 'PRO ACCOUNT')}</span>
              )}
            </h4>
            <p className={`text-xs ${isEditorial ? 'text-stone-700 font-medium' : 'text-gray-300 font-bold'} truncate mt-1`}>
              {currentUser.displayName || (isEditorial ? 'Anonymous Author' : 'No Name')}
            </p>
            <p className={`text-[10px] ${isEditorial ? 'text-stone-500 font-sans' : 'text-gray-400 font-mono'} truncate mt-0.5`}>
              {currentUser.email}
            </p>
            {currentUser.isOffline && (
              <span className={`inline-block text-[9px] px-1.5 py-0.5 font-bold mt-2 ${isEditorial ? 'bg-amber-50 border border-amber-300 text-amber-700 rounded' : 'bg-yellow-950 border border-yellow-500 text-yellow-300 rounded-none font-mono'}`}>
                {isEditorial ? '✍️ LOCAL DRAFT MODE' : '⚠️ LOCAL SANDBOX ONLY'}
              </span>
            )}
          </div>

          <div className={`space-y-3 text-[11px] mb-4 ${isEditorial ? 'font-sans' : 'font-mono'}`}>
            <div className={metaRow}>
              <span className={metaKey}>{isEditorial ? 'Status:' : 'STATUS:'}</span>
              <span className={`font-bold ${isEditorial ? 'text-emerald-600' : 'text-green-400'}`}>
                {isEditorial ? 'Active' : 'ONLINE'}
              </span>
            </div>
            
            <div className={metaRow}>
              <span className={metaKey}>{isEditorial ? 'Membership:' : 'MEMBERSHIP CATEGORY:'}</span>
              <span className={`font-bold uppercase text-[10px] ${isEditorial ? 'text-stone-800' : 'text-white'}`}>
                {currentUser.tier ? currentUser.tier.split('(')[0].trim() : (isEditorial ? 'Free Tier' : 'À La Carte (Free)')}
              </span>
            </div>

            <div className={metaRow}>
              <span className={metaKey}>{isEditorial ? 'Page Credits:' : 'CREDITS REMAINING:'}</span>
              {hasSubscription ? (
                <span className={`font-bold ${isEditorial ? 'text-teal-700' : 'text-cyan-400'}`}>
                  {isEditorial ? '∞ Unlimited' : '⚡ UNLIMITED PAGES'}
                </span>
              ) : (
                <span className={`font-bold ${isEditorial ? 'text-stone-700' : 'text-yellow-400'}`}>
                  {isEditorial ? '30 / 30 pages' : '30 / 30 PAGES'}
                </span>
              )}
            </div>

            <div className={metaRow}>
              <span className={metaKey}>{isEditorial ? 'Storage:' : 'PERSISTENCE SITE:'}</span>
              <span className={`font-bold ${isEditorial ? 'text-stone-600' : 'text-blue-300'}`}>
                {currentUser.isOffline
                  ? (isEditorial ? 'Local only' : 'OFFLINE SECURE')
                  : (isEditorial ? 'Cloud Firestore' : 'CLOUD FIRESTORE')}
              </span>
            </div>
            
            {hasSubscription && (
              <div className={`flex justify-between border-t ${isEditorial ? 'border-stone-100' : 'border-gray-800'} pt-2 text-[10px]`}>
                <span className={metaKey}>{isEditorial ? 'Plan ID:' : 'PROVIDER KEY:'}</span>
                <span className={`font-bold truncate max-w-[120px] ${isEditorial ? 'text-stone-500' : 'text-slate-400'}`} title={currentUser.subscriptionId}>
                  {currentUser.subscriptionId}
                </span>
              </div>
            )}
          </div>

          {!hasSubscription && onOpenCheckout && (
            <button
              id="btn-creator-upgrade"
              type="button"
              onClick={() => {
                onOpenCheckout('Pro');
                setOpen(false);
              }}
              className={upgradeBtn}
            >
              {isEditorial
                ? <><Feather size={11} /> {t('account.auto3', 'Upgrade Membership')}</>
                : <><Sparkles size={11} className="animate-pulse" /> {t('account.auto4', 'UPGRADE MEMBERSHIP')}</>
              }
            </button>
          )}

          {onOpenAdmin && (
            <button
              id="btn-creator-admin-trigger"
              type="button"
              onClick={() => {
                onOpenAdmin();
                setOpen(false);
              }}
              className={adminBtn}
            >
              <Shield size={11} className={isEditorial ? '' : 'animate-pulse text-black'} />
              {isEditorial ? 'Admin Dashboard' : 'SAAS ADMIN CONTROL'}
            </button>
          )}

          <button
            id="btn-auth-logout"
            onClick={handleLogout}
            className={logoutBtn}
          >
            <LogOut size={12} />
            {isEditorial ? 'Sign Out' : 'POWER DOWN CONSOLE'}
          </button>
        </div>
      )}
    </div>
  );
};
