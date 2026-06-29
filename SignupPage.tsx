import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, User, Mail, Lock, Sparkles } from 'lucide-react';
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

interface SignupPageProps {
  onBack: () => void;
  onSuccess: () => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({ onBack, onSuccess }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Create user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile
      await updateProfile(userCredential.user, { displayName: name });
      
      // Store in Firestore for future connections
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: email,
        displayName: name,
        createdAt: new Date().toISOString(),
        tier: 'Free',
        tokenBalance: 50
      }, { merge: true });

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'An error occurred during signup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex flex-col md:flex-row font-sans text-white relative overflow-hidden">
      {/* Background ambient orbs */}
      <div className="ambient-orb cyan w-[600px] h-[600px] top-10 left-[-100px] animate-pulse-glow z-0"></div>
      <div className="ambient-orb fuchsia w-[800px] h-[800px] bottom-[-200px] right-[-200px] animate-pulse-glow z-0" style={{ animationDelay: '2s' }}></div>

      {/* Left Side - Visual/Branding */}
      <div className="hidden md:flex md:w-1/2 p-12 flex-col justify-between relative z-10 bg-slate-900/40 backdrop-blur-sm border-r border-white/10">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 mb-2">
            Story.Menu
          </h1>
          <p className="text-gray-400">{t('signup.auto1', 'The Ultimate Generative Comic Studio')}</p>
        </div>
        
        <div className="space-y-6 max-w-md">
          <h2 className="text-4xl font-extrabold leading-tight" dangerouslySetInnerHTML={{ __html: t('signup.headline', 'Your Imagination, <br/>Unleashed by AI.') }}>
          </h2>
          <p className="text-lg text-gray-400 font-light leading-relaxed">
            {t('signup.subhead', 'Join the community of creators turning everyday ideas into structured, beautiful, shareable comic stories in seconds.')}
          </p>
          
          <div className="flex items-center gap-4 pt-6">
            <div className="flex -space-x-4">
              <img className="w-10 h-10 rounded-full border-2 border-slate-900" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80" alt="Avatar 1" />
              <img className="w-10 h-10 rounded-full border-2 border-slate-900" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=100&q=80" alt="Avatar 2" />
              <img className="w-10 h-10 rounded-full border-2 border-slate-900" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80" alt="Avatar 3" />
            </div>
            <div className="text-sm">
              <span className="text-amber-400">★★★★★</span>
              <p className="text-gray-400">{t('signup.auto2', 'Trusted by over 300,000 creators')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 relative z-10">
        <button 
          onClick={onBack}
          className="absolute top-8 left-8 md:top-12 md:left-12 flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} /> {t('signup.backHome', 'Back to Home')}
        </button>

        <div className="w-full max-w-md space-y-8">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold mb-2 text-white">{t('signup.auto3', 'Create your account')}</h2>
            <p className="text-gray-400">{t('signup.auto4', 'Start crafting your first story today.')}</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300 ml-1">{t('signup.auto5', 'Full Name')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User size={18} className="text-gray-500" />
                </div>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Alex Mercer"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300 ml-1">{t('signup.auto6', 'Email Address')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={18} className="text-gray-500" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="alex@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300 ml-1">{t('signup.auto7', 'Password')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-500" />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg">
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-4 rounded-xl font-bold text-lg bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-400 text-white shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex h-5 w-5 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
              ) : (
                <>
                  <Sparkles size={20} />
                  {t('signup.submitBtn', 'Sign Up Free')}
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-6">
            <p className="text-gray-400 text-sm">
              {t('signup.haveAccount', 'Already have an account?')} {' '}
              <button onClick={() => window.dispatchEvent(new Event('trigger-auth-dialog'))} className="text-purple-400 font-semibold hover:text-purple-300 transition-colors">
                {t('signup.logIn', 'Log In')}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
