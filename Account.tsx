/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { auth, signInWithGoogle, signOutUser } from './firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, User as FirebaseUser } from 'firebase/auth';
import { LogOut, LogIn, User, Mail, Lock, Sparkles, BookOpen, Trash2, X, PlusCircle, CheckCircle } from 'lucide-react';

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

export const AuthScreen: React.FC<AccountProps> = ({ onUserChange, onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

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
        displayName: user.displayName || 'Multiverse Creator'
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
          setError("Please project a Creator Name.");
          setLoading(false);
          return;
        }
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
        setSuccessMsg("Creative Portal unlocked! Logging in...");
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
          displayName: userCredential.user.displayName || 'Multiverse Creator'
        });
        if (onClose) onClose();
      }
    } catch (err: any) {
      let code = err.code || "";
      if (code.includes("auth/email-already-in-use")) {
        setError("This email key is already registered. Please login.");
      } else if (code.includes("auth/invalid-credential") || code.includes("auth/wrong-password")) {
        setError("Invalid credentials. Please recheck security keys.");
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
      displayName: 'Offline Creator',
      isOffline: true
    });
    if (onClose) onClose();
  };

  return (
    <div className="flex flex-col max-w-md w-full mx-auto bg-neutral-900 border-4 border-yellow-400 p-8 rounded-none shadow-[10px_10px_0px_rgba(0,0,0,1)] text-white font-sans text-center relative z-50 animate-fadeIn">
      {onClose && (
        <button 
          onClick={onClose} 
          className="absolute top-2 right-2 text-gray-400 hover:text-white p-2"
          id="btn-auth-close"
        >
          <X size={20} />
        </button>
      )}

      <div className="mb-6">
        <div className="inline-flex p-3 bg-yellow-400 text-black border-2 border-black rotate-[-2deg] mb-3 shadow-[4px_4px_0px_#000]">
          <Sparkles size={28} className="animate-spin" style={{ animationDuration: '4s' }} />
        </div>
        <h2 className="text-3xl font-black uppercase tracking-wider text-yellow-400 font-sans">
          {isSignUp ? "Create Creator Key" : "Access Studio"}
        </h2>
        <p className="text-sm text-gray-300 mt-2 font-mono">
          Save your generated comics and custom character bibles to the cloud!
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-red-950 border-2 border-red-500 text-red-200 text-xs py-2 px-3 font-mono text-left max-h-24 overflow-y-auto">
          ⚠️ {error}
        </div>
      )}

      {successMsg && (
        <div className="mb-4 bg-green-950 border-2 border-green-500 text-green-200 text-xs py-2 px-3 font-mono flex items-center gap-2">
          <CheckCircle size={14} /> {successMsg}
        </div>
      )}

      <form onSubmit={handleEmailAuth} className="space-y-4 text-left">
        {isSignUp && (
          <div>
            <label className="block text-xs uppercase font-bold tracking-wider text-gray-400 mb-1">Creator Name</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 text-gray-500" size={16} />
              <input 
                id="input-displayname"
                type="text" 
                placeholder="Stan Lee" 
                value={displayName} 
                onChange={e => setDisplayName(e.target.value)}
                className="w-full bg-black border-2 border-gray-600 focus:border-yellow-400 py-2 pl-10 pr-4 text-sm font-semibold outline-none text-white rounded-none"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs uppercase font-bold tracking-wider text-gray-400 mb-1">Email Coordinates</label>
          <div className="relative">
            <Mail className="absolute left-3 top-2.5 text-gray-500" size={16} />
            <input 
              id="input-auth-email"
              type="email" 
              placeholder="creator@infinite-comics.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-black border-2 border-gray-600 focus:border-yellow-400 py-2 pl-10 pr-4 text-sm font-semibold outline-none text-white rounded-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs uppercase font-bold tracking-wider text-gray-400 mb-1">Security Key (Password)</label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 text-gray-500" size={16} />
            <input 
              id="input-auth-password"
              type="password" 
              placeholder="••••••••" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-black border-2 border-gray-600 focus:border-yellow-400 py-2 pl-10 pr-4 text-sm font-semibold outline-none text-white rounded-none"
            />
          </div>
        </div>

        <button
          id="btn-auth-submit"
          type="submit"
          disabled={loading}
          className="w-full bg-yellow-400 hover:bg-yellow-300 active:translate-y-0.5 text-black border-2 border-black font-black uppercase text-sm py-2 px-4 shadow-[4px_4px_0px_#000] cursor-pointer flex items-center justify-center gap-2 duration-100 disabled:opacity-50"
        >
          <LogIn size={16} />
          {loading ? "Decrypting..." : isSignUp ? "Generate Creator Profile" : "Login to Studio"}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-gray-600"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-neutral-900 px-3 text-gray-400 font-mono font-bold">Multiverse SSO</span>
        </div>
      </div>

      <button
        id="btn-google-auth"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full bg-black hover:bg-neutral-850 active:translate-y-0.5 text-white border-2 border-gray-500 hover:border-white font-bold text-sm py-2 px-4 cursor-pointer flex items-center justify-center gap-2 mb-4 duration-100 disabled:opacity-50"
      >
        <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31l3.41 2.64c2-1.84 3.44-4.54 3.44-7.96z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.41-2.64c-.95.63-2.16 1.01-3.87 1.01-2.97 0-5.48-2.01-6.38-4.7L2.1 16.7A10.99 10.99 0 0 0 12 23z"/>
          <path fill="#FBBC05" d="M5.62 14.01a6.57 6.57 0 0 1 0-4.02l-3.52-2.73A10.99 10.99 0 0 0 2.1 16.7l3.52-2.69z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.24 1 3.2 3.71 1.08 7.68l3.52 2.73c.9-2.69 3.41-4.7 6.38-4.7z"/>
        </svg>
        Sign in with Google
      </button>

      <div className="flex justify-between items-center text-xs mt-3">
        <button
          id="btn-toggle-auth-mode"
          onClick={() => setIsSignUp(!isSignUp)}
          className="text-yellow-400 hover:underline cursor-pointer font-semibold mx-auto"
        >
          {isSignUp ? "Already have a coordinate? Switch to Login" : "New Creator? Summon an Profile Account"}
        </button>
      </div>
    </div>
  );
};

export const AccountPanel: React.FC<AccountProps & { onOpenAuth: () => void }> = ({ currentUser, onUserChange, onOpenAuth, onOpenCheckout, onOpenAdmin }) => {
  const [open, setOpen] = useState(false);

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
        className="fixed top-4 right-4 bg-yellow-400 text-black border-2 border-black py-2 px-4 shadow-[3px_3px_0px_#000] font-bold text-sm uppercase flex items-center gap-2 hover:bg-yellow-300 duration-100 z-50 cursor-pointer"
      >
        <User size={16} />
        Summon Account
      </button>
    );
  }

  const hasSubscription = !!currentUser.tier;

  return (
    <div className="fixed top-4 right-4 z-[250]">
      <button
        id="btn-creator-badge"
        onClick={() => setOpen(!open)}
        className="bg-neutral-900 border-2 border-yellow-400 px-4 py-2 text-white font-mono text-xs flex items-center gap-2 hover:border-white duration-100 cursor-pointer shadow-[3px_3px_0px_rgba(0,0,0,0.8)]"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block animate-ping"></span>
        <span className="text-gray-300">Creator:</span>
        <span className="text-yellow-400 font-bold">{currentUser.displayName || currentUser.email.split('@')[0]}</span>
        {hasSubscription && (
          <span className="bg-yellow-400 text-black text-[9px] px-1 font-sans font-black uppercase">PRO</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-neutral-900 border-4 border-yellow-400 p-5 rounded-none shadow-[6px_6px_0px_#000] text-white animate-fadeIn">
          <div className="border-b border-gray-700 pb-3 mb-4">
            <h4 className="text-sm font-black uppercase text-yellow-400 tracking-wider flex items-center justify-between">
              <span>CREATOR MATRIX</span>
              {hasSubscription && (
                <span className="text-[10px] bg-yellow-400 text-black px-1.5 py-0.5 rounded-none font-bold">PRO ACCOUNT</span>
              )}
            </h4>
            <p className="text-xs text-gray-300 font-bold truncate mt-1">
              {currentUser.displayName || 'No Name'}
            </p>
            <p className="text-[10px] text-gray-400 font-mono truncate mt-0.5">
              {currentUser.email}
            </p>
            {currentUser.isOffline && (
              <span className="inline-block bg-yellow-950 border border-yellow-500 text-yellow-300 text-[9px] px-1.5 py-0.5 rounded-none font-bold font-mono mt-2">
                ⚠️ LOCAL SANDBOX ONLY
              </span>
            )}
          </div>

          <div className="space-y-3 font-mono text-[11px] mb-4">
            <div className="flex justify-between">
              <span className="text-gray-400">STATUS:</span>
              <span className="text-green-400 font-bold">ONLINE</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">MEMBERSHIP CATEGORY:</span>
              <span className="text-white font-bold uppercase text-[10px]">
                {currentUser.tier ? currentUser.tier.split('(')[0].trim() : "À La Carte (Free)"}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">CREDITS REMAINING:</span>
              {hasSubscription ? (
                <span className="text-cyan-400 font-bold">⚡ UNLIMITED PAGES</span>
              ) : (
                <span className="text-yellow-400 font-bold">30 / 30 PAGES</span>
              )}
            </div>

            <div className="flex justify-between">
              <span className="text-gray-400">PERSISTENCE SITE:</span>
              <span className="text-blue-300 font-bold">{currentUser.isOffline ? 'OFFLINE SECURE' : 'CLOUD FIRESTORE'}</span>
            </div>
            
            {hasSubscription && (
              <div className="flex justify-between border-t border-gray-800 pt-2 text-[10px]">
                <span className="text-gray-500">PROVIDER KEY:</span>
                <span className="text-yellow-550/80 uppercase font-bold text-slate-400 truncate max-w-[120px]" title={currentUser.subscriptionId}>
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
              className="w-full mb-3 bg-yellow-400 hover:bg-yellow-300 text-black font-bold text-xs py-2 px-3 flex items-center justify-center gap-1.5 border-2 border-black shadow-[3px_3px_0px_#000] duration-100 cursor-pointer"
            >
              <Sparkles size={11} className="animate-pulse" />
              UPGRADE MEMBERSHIP
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
              className="w-full mb-3 bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs py-2 px-3 flex items-center justify-center gap-1.5 border-2 border-black shadow-[3px_3px_0px_#000] duration-100 cursor-pointer"
            >
              <Shield size={11} className="animate-pulse text-black" />
              SAAS ADMIN CONTROL
            </button>
          )}

          <button
            id="btn-auth-logout"
            onClick={handleLogout}
            className="w-full bg-red-650 hover:bg-red-600 text-white font-bold text-xs py-2 px-3 flex items-center justify-center gap-2 border-2 border-black shadow-[3px_3px_0px_#000] duration-100 cursor-pointer"
          >
            <LogOut size={12} />
            POWER DOWN CONSOLE
          </button>
        </div>
      )}
    </div>
  );
};
